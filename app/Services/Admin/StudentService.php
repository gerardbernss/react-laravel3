<?php

namespace App\Services\Admin;

use App\Models\Student;
use App\Repositories\StudentRepository;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class StudentService
{
    private const FAMILY_BACKGROUND_KEYS = [
        'father_lname', 'father_fname', 'father_mname', 'father_living', 'father_contact_no', 'father_email', 'father_occupation',
        'mother_lname', 'mother_fname', 'mother_mname', 'mother_living', 'mother_contact_no', 'mother_email', 'mother_occupation',
        'guardian_lname', 'guardian_fname', 'guardian_mname', 'guardian_relationship', 'guardian_contact_no', 'guardian_email',
        'emergency_contact_name', 'emergency_relationship', 'emergency_mobile_phone', 'emergency_home_phone', 'emergency_email',
    ];

    private const PERSONAL_DATA_KEYS = [
        'last_name', 'first_name', 'middle_name', 'suffix', 'learner_reference_number', 'gender', 'citizenship', 'religion',
        'date_of_birth', 'place_of_birth', 'has_sibling', 'email', 'alt_email', 'mobile_number',
        'present_brgy', 'present_city', 'present_province', 'present_zip', 'present_street',
        'permanent_brgy', 'permanent_city', 'permanent_province', 'permanent_zip', 'permanent_street',
        'stopped_studying', 'accelerated', 'health_conditions',
    ];

    private const SPD_UPDATE_EXCLUDE_KEYS = [
        'current_year_level', 'current_school_year', 'current_semester', 'enrollment_status', 'siblings',
        'doctors_note_file', 'certificate_of_enrollment', 'birth_certificate', 'latest_report_card_front', 'latest_report_card_back',
    ];

    private const DOCUMENT_UPLOADS = [
        'certificate_of_enrollment' => ['label' => 'COE', 'key' => 'certificate_of_enrollment'],
        'birth_certificate' => ['label' => 'BIRTHCERTIFICATE', 'key' => 'birth_certificate'],
        'latest_report_card_front' => ['label' => 'REPORTCARD_FRONT', 'key' => 'latest_report_card_front'],
        'latest_report_card_back' => ['label' => 'REPORTCARD_BACK', 'key' => 'latest_report_card_back'],
    ];

    public function __construct(private StudentRepository $studentRepository)
    {
    }

    public function indexData(): array
    {
        $students = $this->studentRepository->allWithPersonalDataOrderedByCreated()->map(fn ($s) => $this->studentRow($s));

        return ['students' => $students];
    }

    public function store(array $data): Student
    {
        return DB::transaction(function () use ($data) {
            $personalData = $this->studentRepository->createPersonalData([
                ...collect($data)->only(self::PERSONAL_DATA_KEYS)->toArray(),
                'has_sibling' => $data['has_sibling'] ?? false,
            ]);

            $student = $this->studentRepository->createStudent([
                'student_personal_data_id' => $personalData->id,
                'student_id_number' => $data['student_id_number'] ?? null,
                'current_year_level' => $data['current_year_level'],
                'current_school_year' => $data['current_school_year'],
                'current_semester' => $data['current_semester'] ?? null,
                'enrollment_status' => $data['enrollment_status'] ?? 'Active',
                'enrollment_date' => now(),
            ]);

            $familyBackground = array_filter(array_intersect_key($data, array_flip(self::FAMILY_BACKGROUND_KEYS)));
            if (! empty($familyBackground)) {
                $this->studentRepository->createFamilyBackground([
                    'student_personal_data_id' => $personalData->id,
                    ...$familyBackground,
                ]);
            }

            foreach ($data['siblings'] ?? [] as $sibling) {
                $this->studentRepository->createSibling([
                    'student_personal_data_id' => $personalData->id,
                    ...$sibling,
                ]);
            }

            return $student;
        });
    }

    public function showData(Student $student): array
    {
        $this->studentRepository->loadShowRelations($student);
        $spd = $student->studentPersonalData ?? $student->personalData;

        return [
            'student' => $this->studentSummary($student),
            'personalData' => $spd?->toArray(),
            'familyBackground' => $spd?->familyBackground?->toArray(),
            'siblings' => $spd?->siblings?->toArray() ?? [],
            'documents' => $student->studentPersonalData?->documents?->toArray(),
            'educationalBackground' => $student->application?->educationalBackground?->toArray() ?? [],
            'enrollments' => $student->enrollments->map(fn ($e) => [
                'id' => $e->id,
                'school_year' => $e->school_year,
                'semester' => $e->semester,
                'year_level' => $e->year_level,
                'status' => $e->status,
            ]),
            'withdrawal' => $student->withdrawal ? [
                'withdrawal_type' => $student->withdrawal->withdrawal_type,
                'refund_amount' => (float) $student->withdrawal->refund_amount,
                'reason' => $student->withdrawal->reason,
                'processed_by' => $student->withdrawal->processedBy?->name,
                'created_at' => $student->withdrawal->created_at?->toDateTimeString(),
            ] : null,
        ];
    }

    public function editData(Student $student): array
    {
        $this->studentRepository->loadEditRelations($student);
        $spd = $student->studentPersonalData;

        return [
            'student' => [
                'id' => $student->id,
                'student_id_number' => $student->student_id_number,
                'enrollment_status' => $student->enrollment_status,
                'current_year_level' => $student->current_year_level,
                'current_school_year' => $student->current_school_year,
                'current_semester' => $student->current_semester,
            ],
            'personalData' => $spd?->toArray(),
            'familyBackground' => $spd?->familyBackground?->toArray(),
            'siblings' => $spd?->siblings?->toArray() ?? [],
            'documents' => $spd?->documents?->toArray(),
        ];
    }

    public function update(Student $student, array $data): array
    {
        $spd = $student->studentPersonalData;
        if (! $spd) {
            return ['error' => 'No student personal data found.'];
        }

        DB::transaction(function () use ($student, $spd, $data) {
            $this->studentRepository->updatePersonalData($spd, collect($data)->except(self::SPD_UPDATE_EXCLUDE_KEYS)->toArray());

            if (! empty($data['doctors_note_file']) && $data['doctors_note_file'] instanceof UploadedFile) {
                $this->storeDoctorsNote($spd, $data['doctors_note_file']);
            }

            $this->studentRepository->updateStudent($student, [
                'current_year_level' => $data['current_year_level'] ?? $student->current_year_level,
                'current_school_year' => $data['current_school_year'] ?? $student->current_school_year,
                'current_semester' => $data['current_semester'] ?? $student->current_semester,
                'enrollment_status' => $data['enrollment_status'] ?? $student->enrollment_status,
            ]);

            $this->studentRepository->deleteSiblingsFor($spd);
            foreach ($data['siblings'] ?? [] as $sibling) {
                $this->studentRepository->createSibling([
                    'student_personal_data_id' => $spd->id,
                    ...$sibling,
                ]);
            }

            $this->storeDocumentUploads($student, $spd, $data);
        });

        return [];
    }

    public function withdraw(Student $student, array $data): array
    {
        if ($student->enrollment_status === 'Withdrawn') {
            return ['error' => 'This student has already been withdrawn.'];
        }

        DB::transaction(function () use ($student, $data) {
            $assessment = $this->studentRepository->latestAssessmentFor($student->id);

            $this->studentRepository->updateStudent($student, ['enrollment_status' => 'Withdrawn']);

            $this->studentRepository->createWithdrawal([
                'student_id' => $student->id,
                'assessment_id' => $assessment?->id,
                'withdrawal_type' => $data['withdrawal_type'],
                'refund_amount' => $data['refund_amount'],
                'reason' => $data['reason'] ?? null,
                'processed_by' => Auth::id(),
            ]);

            if ($assessment) {
                $this->studentRepository->updateAssessment($assessment, ['status' => 'cancelled']);
            }
        });

        return [];
    }

    private function storeDoctorsNote($spd, UploadedFile $file): void
    {
        $path = $file->storeAs('documents/doctors_notes', "{$spd->id}_{$spd->last_name}_DOCTORS_NOTE." . $file->getClientOriginalExtension(), 'public');
        $this->studentRepository->updatePersonalData($spd, ['doctors_note_file' => $path]);
    }

    private function storeDocumentUploads(Student $student, $spd, array $data): void
    {
        $prefix = $student->student_id_number ?? $spd->id;
        $lastName = preg_replace('/[^A-Za-z0-9]/', '', strtoupper($spd->last_name));
        $firstName = preg_replace('/[^A-Za-z0-9]/', '', strtoupper($spd->first_name));

        $docUploads = [];
        foreach (self::DOCUMENT_UPLOADS as $field => $meta) {
            if (empty($data[$field]) || ! $data[$field] instanceof UploadedFile) {
                continue;
            }

            $file = $data[$field];
            $filename = "{$prefix}_{$lastName}_{$firstName}_{$meta['label']}." . $file->getClientOriginalExtension();
            $docUploads[$meta['key']] = $file->storeAs('documents', $filename, 'public');
        }

        if (! empty($docUploads)) {
            $this->studentRepository->updateOrCreateDocuments($spd->id, $docUploads);
        }
    }

    private function studentRow(Student $s): array
    {
        $spd = $s->studentPersonalData ?? $s->personalData;

        return [
            'id' => $s->id,
            'student_id_number' => $s->student_id_number,
            'enrollment_status' => $s->enrollment_status,
            'current_year_level' => $s->current_year_level,
            'current_school_year' => $s->current_school_year,
            'current_semester' => $s->current_semester,
            'source' => $s->applicant_personal_data_id ? 'applicant' : 'direct',
            'personal_data' => $spd ? [
                'first_name' => $spd->first_name,
                'last_name' => $spd->last_name,
                'middle_name' => $spd->middle_name,
                'suffix' => $spd->suffix ?? null,
                'email' => $spd->email,
                'gender' => $spd->gender,
            ] : null,
        ];
    }

    private function studentSummary(Student $student): array
    {
        return [
            'id' => $student->id,
            'student_id_number' => $student->student_id_number,
            'enrollment_status' => $student->enrollment_status,
            'current_year_level' => $student->current_year_level,
            'current_school_year' => $student->current_school_year,
            'current_semester' => $student->current_semester,
            'enrollment_date' => $student->enrollment_date,
            'source' => $student->applicant_personal_data_id ? 'applicant' : 'direct',
        ];
    }
}

<?php

namespace App\Services\Student;

use App\Mail\Admissions\StudentAdmissionsMail;
use App\Repositories\ApplicantRepository;
use App\Repositories\EnrollmentPeriodRepository;
use App\Repositories\StudentRepository;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class StudentIdService
{
    public function __construct(
        private readonly ApplicantRepository $applicantRepository,
        private readonly EnrollmentPeriodRepository $enrollmentPeriodRepository,
        private readonly StudentRepository $studentRepository,
    ) {
    }

    public function indexData(): array
    {
        $applications = $this->applicantRepository->enrolledForIdAssignment($this->enrollmentPeriodRepository->currentOrLatest());

        return $applications->map(fn ($application) => [
            'id' => $application->id,
            'application_number' => $application->application_number,
            'student_id_number' => $application->personalData?->student?->student_id_number ?? '',
            'application_date' => $application->application_date,
            'application_status' => $application->application_status,
            'strand' => $application->strand,
            'last_name' => $application->personalData->last_name ?? null,
            'first_name' => $application->personalData->first_name ?? null,
            'middle_name' => $application->personalData->middle_name ?? null,
            'gender' => $application->personalData->gender ?? null,
            'email' => $application->personalData->email ?? null,
        ])->all();
    }

    public function assignStudentId(array $data): array
    {
        try {
            $application = $this->applicantRepository->findWithPersonalDataStudent((int) $data['applicant_id']);
            $student = $application->personalData?->student;

            if ($student) {
                $this->studentRepository->updateStudent($student, [
                    'student_id_number' => $data['student_number'],
                    'applicant_id' => $student->applicant_id ?? $application->id,
                ]);
            } else {
                $this->studentRepository->createStudent([
                    'applicant_personal_data_id' => $application->personalData->id,
                    'applicant_id' => $application->id,
                    'student_id_number' => $data['student_number'],
                ]);
            }

            return ['success' => true];
        } catch (\Exception $e) {
            return ['success' => false, 'message' => 'Failed to assign Student ID: '.$e->getMessage()];
        }
    }

    public function bulkGenerate(): int
    {
        $applicants = $this->applicantRepository->enrolledWithYearLevelForPeriod($this->enrollmentPeriodRepository->currentOrLatest())
            ->filter(fn ($a) => ! $a->personalData?->student?->student_id_number);

        $generated = 0;
        foreach ($applicants as $applicant) {
            $prefix = $this->getStudentIdPrefix($applicant->year_level);
            if (! $prefix) {
                continue;
            }

            $year = substr((string) $applicant->school_year, 2, 2);
            $studentId = $this->nextStudentId($prefix, $year);

            $student = $applicant->personalData?->student;
            if ($student) {
                $this->studentRepository->updateStudent($student, ['student_id_number' => $studentId]);
            } else {
                $this->studentRepository->createStudent([
                    'applicant_personal_data_id' => $applicant->applicant_personal_data_id,
                    'applicant_id' => $applicant->id,
                    'student_id_number' => $studentId,
                ]);
            }
            $generated++;
        }

        return $generated;
    }

    public function emailStudentId(int $id): array
    {
        try {
            $application = $this->applicantRepository->findWithPersonalData($id);

            if (! $application->personalData || ! $application->personalData->email) {
                return ['status' => 400, 'message' => 'Applicant email not found.'];
            }

            $student = $this->studentRepository->findForEmail($application->id, $application->personalData->id);

            if (! $student) {
                return ['status' => 400, 'message' => 'Student record not found.'];
            }

            $mailData = [
                'first_name' => $application->personalData->first_name,
                'last_name' => $application->personalData->last_name,
                'student_id_number' => $student->student_id_number ?? 'Not assigned',
                'email' => $application->personalData->email,
            ];

            Mail::to($application->personalData->email)->send(new StudentAdmissionsMail($mailData));

            return ['status' => 200, 'message' => 'Student ID email sent successfully.'];
        } catch (\Exception $e) {
            Log::error('Failed to send student ID email: '.$e->getMessage());

            return ['status' => 500, 'message' => 'Failed to send email: '.$e->getMessage()];
        }
    }

    private function nextStudentId(string $prefix, string $year): string
    {
        $existing = $this->studentRepository->maxIdNumberLike("{$prefix}{$year}%");
        $next = $existing ? ((int) substr($existing, 3) + 1) : 1;

        return sprintf('%s%s%04d', $prefix, $year, $next);
    }

    private function getStudentIdPrefix(string $yearLevel): ?string
    {
        if (str_contains(strtolower($yearLevel), 'kinder')) {
            return 'L';
        }

        $num = (int) filter_var($yearLevel, FILTER_SANITIZE_NUMBER_INT);

        if ($num >= 1 && $num <= 6) {
            return 'L';
        }
        if ($num >= 7 && $num <= 10) {
            return 'J';
        }
        if ($num >= 11) {
            return 'S';
        }

        return null;
    }
}

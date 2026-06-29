<?php

namespace App\Services\Admin;

use App\Models\Attendance;
use App\Models\BlockSection;
use App\Models\StudentEnrollment;
use App\Models\StudentEnrollmentSubject;
use App\Models\Subject;
use App\Repositories\ReportRepository;

class ReportService
{
    private const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4'];

    public function __construct(private ReportRepository $reportRepository)
    {
    }

    public function classRecordData(BlockSection $blockSection, Subject $subject, string $quarter): array
    {
        $components = $this->reportRepository->gradeComponents($subject->id, $blockSection->id, $quarter);
        $enrollments = $this->reportRepository->classRecordEnrollments($blockSection->id, $subject->id);
        $componentIds = $components->pluck('id');
        $weightTotal = $components->sum('weight');

        $header = ['Student ID', 'Last Name', 'First Name', 'Middle Name'];
        foreach ($components as $comp) {
            $header[] = "{$comp->name} (HPS:{$comp->hps} W:{$comp->weight}%)";
        }
        $header[] = 'PS%';
        $header[] = 'Equivalent Grade';
        $header[] = 'Status';

        $rows = $enrollments->map(
            fn ($enrollment) => $this->classRecordRow($enrollment, $components, $componentIds, $weightTotal)
        )->all();

        return ['header' => $header, 'rows' => $rows];
    }

    public function gradingSheetData(BlockSection $blockSection): array
    {
        $subjects = $this->reportRepository->sortedSubjectsForSection($blockSection);
        $enrollments = $this->reportRepository->gradingSheetEnrollments($blockSection->id);

        $header = ['Student ID', 'Last Name', 'First Name', 'Middle Name'];
        foreach ($subjects as $subject) {
            foreach (self::QUARTERS as $q) {
                $header[] = "{$subject->code} {$q}";
            }
            $header[] = "{$subject->code} Final";
        }
        $header[] = 'GWA';

        $rows = $enrollments->map(
            fn ($enrollment) => $this->gradingSheetRow($enrollment, $subjects, $blockSection->id)
        )->all();

        return ['header' => $header, 'rows' => $rows];
    }

    public function reportCardData(StudentEnrollment $studentEnrollment): array
    {
        $this->reportRepository->loadReportCardRelations($studentEnrollment);

        $blockSection = $studentEnrollment->blockSection;
        $subjects = $blockSection->subjects->sortBy('name');
        $personalData = $studentEnrollment->student?->personalData;
        $esBySubject = $studentEnrollment->enrollmentSubjects->keyBy('subject_id');

        $subjectRows = $subjects->map(
            fn ($subject) => $this->reportCardSubjectRow($subject, $esBySubject, $blockSection)
        )->values()->toArray();

        $student = [
            'name' => $this->formatStudentName($personalData),
            'student_id_number' => $studentEnrollment->student?->student_id_number,
            'lrn' => $personalData?->learner_reference_number,
            'subjects' => $subjectRows,
            'gwa' => $studentEnrollment->gwa !== null ? (float) $studentEnrollment->gwa : null,
            'conduct' => $this->reportCardConductData($studentEnrollment),
        ];

        $safeId = $studentEnrollment->student?->student_id_number ?? $studentEnrollment->id;

        return [
            'view' => [
                'blockSection' => $blockSection,
                'students' => [$student],
                'quarters' => self::QUARTERS,
            ],
            'filename' => "report-card-{$blockSection->code}-{$safeId}.pdf",
        ];
    }

    public function attendanceSummaryData(BlockSection $blockSection, Subject $subject): array
    {
        $enrollments = $this->reportRepository->attendanceEnrollments($blockSection->id);
        $byEnrollment = $this->reportRepository->attendanceRecords($enrollments->pluck('id'), $subject->id);

        $header = ['Student ID', 'Last Name', 'First Name', 'Total Absences', 'Total Tardies', 'Total Excused', 'Total Present'];

        $rows = $enrollments->map(
            fn ($enrollment) => $this->attendanceRow($enrollment, $byEnrollment)
        )->all();

        return ['header' => $header, 'rows' => $rows];
    }

    private function classRecordRow($enrollment, $components, $componentIds, float $weightTotal): array
    {
        $es = $enrollment->enrollmentSubjects->first();
        $personalData = $enrollment->student?->personalData;
        $rawScores = $es
            ? $this->reportRepository->rawScoresForEnrollmentSubject($es->id, $componentIds)
            : collect();

        $row = [
            $enrollment->student?->student_id_number ?? '',
            $personalData?->last_name ?? '',
            $personalData?->first_name ?? '',
            $personalData?->middle_name ?? '',
        ];

        $weightedSum = 0;
        $hasAny = false;

        foreach ($components as $comp) {
            $rawScore = $rawScores->get($comp->id)?->raw_score;
            $row[] = $rawScore !== null ? $rawScore : '';

            if ($rawScore !== null && $weightTotal > 0 && $comp->hps > 0) {
                $hasAny = true;
                $pct = ($rawScore / $comp->hps) * 100;
                $weightedSum += $pct * ($comp->weight / $weightTotal);
            }
        }

        if ($hasAny) {
            $ps = round($weightedSum, 2);
            $eg = round(max(60, min(100, $ps * 0.5 + 50)), 2);
            $row[] = $ps . '%';
            $row[] = $eg;
            $row[] = $eg >= 75 ? 'Passed' : 'Failed';
        } else {
            $row[] = '';
            $row[] = '';
            $row[] = '';
        }

        return $row;
    }

    private function gradingSheetRow($enrollment, $subjects, int $blockSectionId): array
    {
        $personalData = $enrollment->student?->personalData;
        $row = [
            $enrollment->student?->student_id_number ?? '',
            $personalData?->last_name ?? '',
            $personalData?->first_name ?? '',
            $personalData?->middle_name ?? '',
        ];

        $esBySubject = $enrollment->enrollmentSubjects->keyBy('subject_id');

        foreach ($subjects as $subject) {
            $es = $esBySubject->get($subject->id);

            foreach (self::QUARTERS as $q) {
                $qGrade = $this->computeQuarterGrade($es, $subject->id, $blockSectionId, $q);
                $row[] = $qGrade !== null ? $qGrade : '';
            }

            $row[] = $es?->grade !== null ? $es->grade : '';
        }

        $row[] = $enrollment->gwa !== null ? $enrollment->gwa : '';

        return $row;
    }

    private function reportCardSubjectRow($subject, $esBySubject, $blockSection): array
    {
        $es = $esBySubject->get($subject->id);
        $quarterGrades = [];
        foreach (self::QUARTERS as $q) {
            $quarterGrades[$q] = $this->computeQuarterGrade($es, $subject->id, $blockSection->id, $q);
        }

        return [
            'code' => $subject->code,
            'name' => $subject->name,
            'quarter_grades' => $quarterGrades,
            'final_grade' => $es?->grade !== null ? (float) $es->grade : null,
            'status' => $es?->grade_status,
        ];
    }

    private function reportCardConductData(StudentEnrollment $studentEnrollment): array
    {
        $conductCategories = $this->reportRepository->activeConductCategoriesOrdered();
        $allCriteriaIds = $conductCategories->flatMap(fn ($c) => $c->criteria->pluck('id'));
        $conductData = [];

        if ($allCriteriaIds->isEmpty()) {
            return $conductData;
        }

        $conductGrades = $this->reportRepository->conductGradesForEnrollment($studentEnrollment->id, $allCriteriaIds);

        foreach ($conductCategories as $category) {
            $criteriaRows = [];
            foreach ($category->criteria as $criterion) {
                $scores = [];
                foreach (self::QUARTERS as $q) {
                    $grade = $conductGrades->get($criterion->id)?->firstWhere('grading_quarter', $q);
                    $scores[$q] = $grade?->score;
                }
                $criteriaRows[] = ['name' => $criterion->name, 'scores' => $scores];
            }
            if ($criteriaRows) {
                $conductData[$category->name] = $criteriaRows;
            }
        }

        return $conductData;
    }

    private function attendanceRow($enrollment, $byEnrollment): array
    {
        $personalData = $enrollment->student?->personalData;
        $records = $byEnrollment->get($enrollment->id, collect());

        return [
            $enrollment->student?->student_id_number ?? '',
            $personalData?->last_name ?? '',
            $personalData?->first_name ?? '',
            $records->where('status', Attendance::STATUS_ABSENT)->count(),
            $records->where('status', Attendance::STATUS_LATE)->count(),
            $records->where('status', Attendance::STATUS_EXCUSED)->count(),
            $records->where('status', Attendance::STATUS_PRESENT)->count(),
        ];
    }

    private function formatStudentName(?object $personalData): string
    {
        $lastName = $personalData?->last_name ?? '';
        $firstName = $personalData?->first_name ?? '';
        $middleName = $personalData?->middle_name ? " {$personalData->middle_name}" : '';
        $suffix = $personalData?->suffix ? ", {$personalData->suffix}" : '';

        return "{$lastName}, {$firstName}{$middleName}{$suffix}";
    }

    private function computeQuarterGrade(?StudentEnrollmentSubject $es, int $subjectId, int $blockSectionId, string $quarter): ?float
    {
        if (! $es) {
            return null;
        }

        $components = $this->reportRepository->gradeComponents($subjectId, $blockSectionId, $quarter);

        if ($components->isEmpty()) {
            return null;
        }

        $weightTotal = $components->sum('weight');
        if ($weightTotal == 0) {
            return null;
        }

        $componentIds = $components->pluck('id');
        $rawScores = $this->reportRepository->rawScoresForEnrollmentSubject($es->id, $componentIds);

        $weightedSum = 0;
        $hasAny = false;

        foreach ($components as $comp) {
            $rawScore = $rawScores->get($comp->id)?->raw_score;
            if ($rawScore === null || $comp->hps == 0) {
                continue;
            }
            $hasAny = true;
            $pct = ($rawScore / $comp->hps) * 100;
            $weightedSum += $pct * ($comp->weight / $weightTotal);
        }

        if (! $hasAny) {
            return null;
        }

        $ps = $weightedSum;
        $eg = max(60, min(100, $ps * 0.5 + 50));

        return round($eg, 2);
    }
}

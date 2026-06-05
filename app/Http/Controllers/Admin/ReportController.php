<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Attendance;
use App\Models\BlockSection;
use App\Models\ConductCategory;
use App\Models\ConductGrade;
use App\Models\GradeComponent;
use App\Models\StudentEnrollment;
use App\Models\StudentEnrollmentSubject;
use App\Models\StudentRawScore;
use App\Models\Subject;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Response;

class ReportController extends Controller
{
    private const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4'];

    /**
     * Export class record for a subject/quarter as CSV.
     * Columns: Student ID, Name, [components...], PS%, EG, Status
     */
    public function classRecord(BlockSection $blockSection, Subject $subject, string $quarter): Response
    {
        abort_unless(in_array($quarter, self::QUARTERS), 404);

        $components = GradeComponent::forSubjectSection($subject->id, $blockSection->id)
            ->forQuarter($quarter)
            ->orderBy('order')
            ->get();

        $enrollments = StudentEnrollment::where('block_section_id', $blockSection->id)
            ->with([
                'student.personalData:id,last_name,first_name,middle_name',
                'enrollmentSubjects' => fn($q) => $q->where('subject_id', $subject->id),
            ])
            ->get()
            ->filter(fn($e) => $e->enrollmentSubjects->isNotEmpty())
            ->sortBy(fn($e) => $e->student?->personalData?->last_name);

        $componentIds = $components->pluck('id');
        $weightTotal  = $components->sum('weight');

        $output  = fopen('php://temp', 'r+');

        // Header row
        $header = ['Student ID', 'Last Name', 'First Name', 'Middle Name'];
        foreach ($components as $comp) {
            $header[] = "{$comp->name} (HPS:{$comp->hps} W:{$comp->weight}%)";
        }
        $header[] = 'PS%';
        $header[] = 'Equivalent Grade';
        $header[] = 'Status';
        fputcsv($output, $header);

        foreach ($enrollments as $enrollment) {
            $es          = $enrollment->enrollmentSubjects->first();
            $personalData = $enrollment->student?->personalData;

            $rawScores = $es
                ? StudentRawScore::where('student_enrollment_subject_id', $es->id)
                    ->whereIn('grade_component_id', $componentIds)
                    ->get()
                    ->keyBy('grade_component_id')
                : collect();

            $row = [
                $enrollment->student?->student_id_number ?? '',
                $personalData?->last_name ?? '',
                $personalData?->first_name ?? '',
                $personalData?->middle_name ?? '',
            ];

            $weightedSum = 0;
            $hasAny      = false;

            foreach ($components as $comp) {
                $rawScore = $rawScores->get($comp->id)?->raw_score;
                $row[]    = $rawScore !== null ? $rawScore : '';

                if ($rawScore !== null && $weightTotal > 0 && $comp->hps > 0) {
                    $hasAny = true;
                    $pct    = ($rawScore / $comp->hps) * 100;
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

            fputcsv($output, $row);
        }

        rewind($output);
        $csv = stream_get_contents($output);
        fclose($output);

        $filename = "class-record-{$blockSection->code}-{$subject->code}-{$quarter}.csv";

        return response($csv, 200, [
            'Content-Type'        => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ]);
    }

    /**
     * Export grading sheet for a block section as CSV.
     * Columns: Student ID, Name, [Subject Q1, Subject Q2, Subject Q3, Subject Q4...], GWA
     */
    public function gradingSheet(BlockSection $blockSection): Response
    {
        $blockSection->load('subjects');
        $subjects = $blockSection->subjects->sortBy('code');

        $enrollments = StudentEnrollment::where('block_section_id', $blockSection->id)
            ->with([
                'student.personalData:id,last_name,first_name,middle_name',
                'enrollmentSubjects',
            ])
            ->get()
            ->sortBy(fn($e) => $e->student?->personalData?->last_name);

        $output = fopen('php://temp', 'r+');

        // Header
        $header = ['Student ID', 'Last Name', 'First Name', 'Middle Name'];
        foreach ($subjects as $subject) {
            foreach (self::QUARTERS as $q) {
                $header[] = "{$subject->code} {$q}";
            }
            $header[] = "{$subject->code} Final";
        }
        $header[] = 'GWA';
        fputcsv($output, $header);

        foreach ($enrollments as $enrollment) {
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
                    // Per-quarter grade: weighted average of that quarter's components
                    $qGrade = $this->computeQuarterGrade($es, $subject->id, $blockSection->id, $q);
                    $row[]  = $qGrade !== null ? $qGrade : '';
                }

                $row[] = $es?->grade !== null ? $es->grade : '';
            }

            $row[] = $enrollment->gwa !== null ? $enrollment->gwa : '';
            fputcsv($output, $row);
        }

        rewind($output);
        $csv = stream_get_contents($output);
        fclose($output);

        $filename = "grading-sheet-{$blockSection->code}.csv";

        return response($csv, 200, [
            'Content-Type'        => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ]);
    }

    /**
     * Generate a PDF report card for a single student enrollment.
     */
    public function reportCard(StudentEnrollment $studentEnrollment)
    {
        $studentEnrollment->load([
            'student.personalData',
            'enrollmentSubjects',
            'blockSection.subjects',
        ]);

        $blockSection = $studentEnrollment->blockSection;
        $subjects     = $blockSection->subjects->sortBy('name');
        $personalData = $studentEnrollment->student?->personalData;
        $esBySubject  = $studentEnrollment->enrollmentSubjects->keyBy('subject_id');

        // Subjects with quarter grades
        $subjectRows = $subjects->map(function ($subject) use ($esBySubject, $blockSection) {
            $es            = $esBySubject->get($subject->id);
            $quarterGrades = [];
            foreach (self::QUARTERS as $q) {
                $quarterGrades[$q] = $this->computeQuarterGrade($es, $subject->id, $blockSection->id, $q);
            }
            return [
                'code'           => $subject->code,
                'name'           => $subject->name,
                'quarter_grades' => $quarterGrades,
                'final_grade'    => $es?->grade !== null ? (float) $es->grade : null,
                'status'         => $es?->grade_status,
            ];
        })->values()->toArray();

        // Conduct grades grouped by category
        $conductCategories = ConductCategory::with('criteria')
            ->where('is_active', true)
            ->orderBy('order')
            ->get();

        $allCriteriaIds = $conductCategories->flatMap(fn($c) => $c->criteria->pluck('id'));
        $conductData    = [];

        if ($allCriteriaIds->isNotEmpty()) {
            $conductGrades = ConductGrade::where('student_enrollment_id', $studentEnrollment->id)
                ->whereIn('conduct_criteria_id', $allCriteriaIds)
                ->get()
                ->groupBy('conduct_criteria_id');

            foreach ($conductCategories as $category) {
                $criteriaRows = [];
                foreach ($category->criteria as $criterion) {
                    $scores = [];
                    foreach (self::QUARTERS as $q) {
                        $grade      = $conductGrades->get($criterion->id)?->firstWhere('grading_quarter', $q);
                        $scores[$q] = $grade?->score;
                    }
                    $criteriaRows[] = ['name' => $criterion->name, 'scores' => $scores];
                }
                if ($criteriaRows) {
                    $conductData[$category->name] = $criteriaRows;
                }
            }
        }

        $lastName   = $personalData?->last_name ?? '';
        $firstName  = $personalData?->first_name ?? '';
        $middleName = $personalData?->middle_name ? " {$personalData->middle_name}" : '';
        $suffix     = $personalData?->suffix ? ", {$personalData->suffix}" : '';

        $student = [
            'name'              => "{$lastName}, {$firstName}{$middleName}{$suffix}",
            'student_id_number' => $studentEnrollment->student?->student_id_number,
            'lrn'               => $personalData?->learner_reference_number,
            'subjects'          => $subjectRows,
            'gwa'               => $studentEnrollment->gwa !== null ? (float) $studentEnrollment->gwa : null,
            'conduct'           => $conductData,
        ];

        $pdf = Pdf::loadView('reports.report-card', [
            'blockSection' => $blockSection,
            'students'     => [$student],
            'quarters'     => self::QUARTERS,
        ])->setPaper('a4', 'portrait');

        $safeId = $studentEnrollment->student?->student_id_number ?? $studentEnrollment->id;
        $filename = "report-card-{$blockSection->code}-{$safeId}.pdf";

        return $pdf->download($filename);
    }

    /**
     * Export attendance summary for a subject as CSV.
     */
    public function attendanceSummary(BlockSection $blockSection, Subject $subject): Response
    {
        $enrollments = StudentEnrollment::where('block_section_id', $blockSection->id)
            ->with('student.personalData:id,last_name,first_name,middle_name')
            ->get()
            ->sortBy(fn($e) => $e->student?->personalData?->last_name);

        $enrollmentIds = $enrollments->pluck('id');

        $attendanceRecords = Attendance::whereIn('student_enrollment_id', $enrollmentIds)
            ->where('subject_id', $subject->id)
            ->get();

        // Group by enrollment_id
        $byEnrollment = $attendanceRecords->groupBy('student_enrollment_id');

        $output = fopen('php://temp', 'r+');
        fputcsv($output, ['Student ID', 'Last Name', 'First Name', 'Total Absences', 'Total Tardies', 'Total Excused', 'Total Present']);

        foreach ($enrollments as $enrollment) {
            $personalData = $enrollment->student?->personalData;
            $records      = $byEnrollment->get($enrollment->id, collect());

            $row = [
                $enrollment->student?->student_id_number ?? '',
                $personalData?->last_name ?? '',
                $personalData?->first_name ?? '',
                $records->where('status', Attendance::STATUS_ABSENT)->count(),
                $records->where('status', Attendance::STATUS_LATE)->count(),
                $records->where('status', Attendance::STATUS_EXCUSED)->count(),
                $records->where('status', Attendance::STATUS_PRESENT)->count(),
            ];

            fputcsv($output, $row);
        }

        rewind($output);
        $csv = stream_get_contents($output);
        fclose($output);

        $filename = "attendance-{$blockSection->code}-{$subject->code}.csv";

        return response($csv, 200, [
            'Content-Type'        => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ]);
    }

    /**
     * Compute a per-quarter grade as the weighted average of that quarter's components.
     */
    private function computeQuarterGrade(?StudentEnrollmentSubject $es, int $subjectId, int $blockSectionId, string $quarter): ?float
    {
        if (!$es) {
            return null;
        }

        $components = GradeComponent::forSubjectSection($subjectId, $blockSectionId)
            ->forQuarter($quarter)
            ->get();

        if ($components->isEmpty()) {
            return null;
        }

        $weightTotal = $components->sum('weight');
        if ($weightTotal == 0) {
            return null;
        }

        $componentIds = $components->pluck('id');
        $rawScores    = StudentRawScore::where('student_enrollment_subject_id', $es->id)
            ->whereIn('grade_component_id', $componentIds)
            ->get()
            ->keyBy('grade_component_id');

        $weightedSum = 0;
        $hasAny      = false;

        foreach ($components as $comp) {
            $rawScore = $rawScores->get($comp->id)?->raw_score;
            if ($rawScore === null || $comp->hps == 0) {
                continue;
            }
            $hasAny = true;
            $pct    = ($rawScore / $comp->hps) * 100;
            $weightedSum += $pct * ($comp->weight / $weightTotal);
        }

        if (!$hasAny) {
            return null;
        }

        $ps = $weightedSum;
        $eg = max(60, min(100, $ps * 0.5 + 50));

        return round($eg, 2);
    }
}

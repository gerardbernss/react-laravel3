<?php

namespace App\Services\Admin;

use App\Models\BlockSection;
use App\Repositories\AttendanceRepository;
use App\Repositories\GradeRepository;
use App\Repositories\SubjectRepository;

class MyStudentsService
{
    public function __construct(
        private SubjectRepository $subjectRepository,
        private GradeRepository $gradeRepository,
        private AttendanceRepository $attendanceRepository,
    ) {
    }

    /**
     * Returns the full student roster for a block section, optionally filtered to a specific subject.
     * Each student row includes their grade and attendance counts for the given subject, plus section-wide statistics.
     *
     * @param  bool  $isFaculty  Whether the viewer is a faculty member (controls what actions are shown on the page)
     */
    public function rosterData(BlockSection $blockSection, ?int $subjectId, bool $isFaculty): array
    {
        $subject = $this->subjectRepository->find($subjectId);
        $enrollments = $this->attendanceRepository->enrollmentsForSectionSortedByLastName($blockSection->id);

        $students = $enrollments->map(fn ($enrollment) => $this->studentRow($enrollment, $subjectId));

        return [
            'blockSection' => $blockSection,
            'subject' => $subject ? ['id' => $subject->id, 'code' => $subject->code, 'name' => $subject->name] : null,
            'students' => $students,
            'isFaculty' => $isFaculty,
            'statistics' => $this->statistics($students),
        ];
    }

    /**
     * Builds a single student's roster row with their grade record and attendance breakdown for the given subject.
     * Attendance rate is computed as (Present + Late) / total sessions. Returns null for the rate if no sessions exist.
     */
    private function studentRow($enrollment, ?int $subjectId): array
    {
        $student = $enrollment->student;
        $personalData = $student?->personalData;

        $gradeRecord = $subjectId ? $this->gradeRepository->findEnrollmentSubject($enrollment->id, $subjectId) : null;

        $attendanceCounts = ['Present' => 0, 'Absent' => 0, 'Late' => 0, 'Excused' => 0];
        if ($subjectId) {
            $attendanceCounts = array_merge($attendanceCounts, $this->attendanceRepository->countsByStatusFor($enrollment->id, $subjectId));
        }

        $totalSessions = array_sum($attendanceCounts);
        $attendedSessions = $attendanceCounts['Present'] + $attendanceCounts['Late'];
        $attendanceRate = $totalSessions > 0 ? round(($attendedSessions / $totalSessions) * 100, 1) : null;

        return [
            'enrollment_id' => $enrollment->id,
            'student_id_number' => $student?->student_id_number,
            'last_name' => $personalData?->last_name,
            'first_name' => $personalData?->first_name,
            'middle_name' => $personalData?->middle_name,
            'grade' => $gradeRecord?->grade,
            'grade_status' => $gradeRecord?->grade_status,
            'present_count' => $attendanceCounts['Present'],
            'absent_count' => $attendanceCounts['Absent'],
            'late_count' => $attendanceCounts['Late'],
            'excused_count' => $attendanceCounts['Excused'],
            'total_sessions' => $totalSessions,
            'attendance_rate' => $attendanceRate,
        ];
    }

    /**
     * Computes section-wide summary stats: total students, how many are graded, how many passed, and the average attendance rate.
     */
    private function statistics($students): array
    {
        $gradedCount = $students->filter(fn ($s) => $s['grade'] !== null)->count();
        $passedCount = $students->filter(fn ($s) => $s['grade_status'] === 'Passed')->count();
        $rates = $students->filter(fn ($s) => $s['attendance_rate'] !== null)->pluck('attendance_rate');

        return [
            'total_students' => $students->count(),
            'graded_count' => $gradedCount,
            'passed_count' => $passedCount,
            'avg_attendance' => $rates->isNotEmpty() ? round($rates->avg(), 1) : null,
        ];
    }
}

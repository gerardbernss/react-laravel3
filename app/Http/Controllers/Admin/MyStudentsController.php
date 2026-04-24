<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Attendance;
use App\Models\BlockSection;
use App\Models\StudentEnrollment;
use App\Models\StudentEnrollmentSubject;
use App\Models\Subject;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class MyStudentsController extends Controller
{
    /**
     * Show the class roster for a block section, scoped to a specific subject.
     * Displays each student's current grade and cumulative attendance summary.
     */
    public function show(BlockSection $blockSection, Request $request)
    {
        $subjectId = $request->input('subject_id');
        $user = auth()->user();
        $isFaculty = $user && $user->hasRole('faculty');

        $subject = $subjectId ? Subject::find($subjectId) : null;

        // Get all enrollments for this section ordered alphabetically by last name
        $enrollments = StudentEnrollment::where('block_section_id', $blockSection->id)
            ->with(['student.personalData:id,last_name,first_name,middle_name'])
            ->orderBy(
                DB::raw('(SELECT last_name FROM applicant_personal_data
                    JOIN students ON students.applicant_personal_data_id = applicant_personal_data.id
                    WHERE students.id = student_enrollments.student_id)'),
                'asc'
            )
            ->get();

        // Build per-student data combining grade + attendance
        $students = $enrollments->map(function ($enrollment) use ($subjectId) {
            $student = $enrollment->student;
            $personalData = $student?->personalData;

            // Grade for this subject
            $gradeRecord = null;
            if ($subjectId) {
                $gradeRecord = StudentEnrollmentSubject::where('enrollment_id', $enrollment->id)
                    ->where('subject_id', $subjectId)
                    ->first();
            }

            // Cumulative attendance summary for this subject
            $attendanceCounts = ['Present' => 0, 'Absent' => 0, 'Late' => 0, 'Excused' => 0];
            if ($subjectId) {
                $counts = Attendance::where('student_enrollment_id', $enrollment->id)
                    ->where('subject_id', $subjectId)
                    ->selectRaw('status, count(*) as cnt')
                    ->groupBy('status')
                    ->pluck('cnt', 'status')
                    ->toArray();
                $attendanceCounts = array_merge($attendanceCounts, $counts);
            }

            $totalSessions = array_sum($attendanceCounts);
            $attendedSessions = $attendanceCounts['Present'] + $attendanceCounts['Late'];
            $attendanceRate = $totalSessions > 0
                ? round(($attendedSessions / $totalSessions) * 100, 1)
                : null;

            return [
                'enrollment_id'     => $enrollment->id,
                'student_id_number' => $student?->student_id_number,
                'last_name'         => $personalData?->last_name,
                'first_name'        => $personalData?->first_name,
                'middle_name'       => $personalData?->middle_name,
                'grade'             => $gradeRecord?->grade,
                'grade_status'      => $gradeRecord?->grade_status,
                'present_count'     => $attendanceCounts['Present'],
                'absent_count'      => $attendanceCounts['Absent'],
                'late_count'        => $attendanceCounts['Late'],
                'excused_count'     => $attendanceCounts['Excused'],
                'total_sessions'    => $totalSessions,
                'attendance_rate'   => $attendanceRate,
            ];
        });

        // Summary statistics
        $gradedCount = $students->filter(fn($s) => $s['grade'] !== null)->count();
        $passedCount = $students->filter(fn($s) => $s['grade_status'] === 'Passed')->count();
        $rates = $students->filter(fn($s) => $s['attendance_rate'] !== null)->pluck('attendance_rate');
        $avgAttendance = $rates->isNotEmpty() ? round($rates->avg(), 1) : null;

        return Inertia::render('Admin/MyStudents/Show', [
            'blockSection' => $blockSection,
            'subject'      => $subject
                ? ['id' => $subject->id, 'code' => $subject->code, 'name' => $subject->name]
                : null,
            'students'     => $students,
            'isFaculty'    => $isFaculty,
            'statistics'   => [
                'total_students' => $students->count(),
                'graded_count'   => $gradedCount,
                'passed_count'   => $passedCount,
                'avg_attendance' => $avgAttendance,
            ],
        ]);
    }
}

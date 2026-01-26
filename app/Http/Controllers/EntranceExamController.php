<?php
namespace App\Http\Controllers;

use App\Http\Requests\StoreEntranceExamRequest;
use App\Http\Requests\UpdateEntranceExamResultRequest;
use App\Models\ApplicantApplicationInfo;
use App\Models\EntranceExam;
use Illuminate\Http\Request;
use Inertia\Inertia;

class EntranceExamController extends Controller
{
    /**
     * Display all entrance exams with filters
     */
    public function index(Request $request)
    {
        $query = EntranceExam::with(['application', 'personalData'])
            ->orderBy('exam_scheduled_date', 'desc');

        // Apply filters
        if ($request->filled('status')) {
            $query->where('exam_status', $request->status);
        }

        if ($request->filled('result')) {
            $query->where('result', $request->result);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->whereHas('personalData', function ($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                    ->orWhere('last_name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        if ($request->filled('date_from') && $request->filled('date_to')) {
            $query->whereBetween('exam_scheduled_date', [
                $request->date_from,
                $request->date_to,
            ]);
        }

        $exams = $query->paginate(15);

        return Inertia::render('Admissions/EntranceExams/Index', [
            'exams'   => $exams,
            'filters' => [
                'status' => $request->status,
                'result' => $request->result,
                'search' => $request->search,
            ],
        ]);
    }

    /**
     * Show form to create entrance exam
     */
    public function create(ApplicantApplicationInfo $application)
    {
        return Inertia::render('Admissions/EntranceExams/Create', [
            'application' => $application->load('personalData'),
        ]);
    }

    /**
     * Store new entrance exam
     */
    public function store(StoreEntranceExamRequest $request)
    {
        $validated = $request->validated();

        $exam = EntranceExam::create([
            'applicant_application_info_id' => $validated['applicant_application_info_id'],
            'applicant_personal_data_id'    => $validated['applicant_personal_data_id'],
            'exam_scheduled_date'           => $validated['exam_scheduled_date'],
            'exam_time'                     => $validated['exam_time'],
            'exam_venue'                    => $validated['exam_venue'],
            'exam_room_number'              => $validated['exam_room_number'],
            'seat_number'                   => $validated['seat_number'],
            'passing_score'                 => $validated['passing_score'] ?? 50,
            'exam_status'                   => 'Scheduled',
        ]);

        return redirect()->route('entrance-exams.show', $exam->id)
            ->with('success', 'Entrance exam scheduled successfully.');
    }

    /**
     * Show entrance exam details
     */
    public function show(EntranceExam $entranceExam)
    {
        $entranceExam->load(['application', 'personalData']);

        return Inertia::render('Admissions/EntranceExams/Show', [
            'exam' => $entranceExam,
        ]);
    }

    /**
     * Show form to edit entrance exam details
     */
    public function edit(EntranceExam $entranceExam)
    {
        $entranceExam->load(['application', 'personalData']);

        return Inertia::render('Admissions/EntranceExams/Edit', [
            'exam' => $entranceExam,
        ]);
    }

    /**
     * Update entrance exam details
     */
    public function update(Request $request, EntranceExam $entranceExam)
    {
        $validated = $request->validate([
            'exam_scheduled_date' => 'required|date',
            'exam_time'           => 'required|date_format:H:i',
            'exam_venue'          => 'required|string|max:255',
            'exam_room_number'    => 'required|string|max:50',
            'seat_number'         => 'required|string|max:20',
            'passing_score'       => 'required|numeric|min:0|max:100',
        ]);

        $entranceExam->update($validated);

        return redirect()->route('entrance-exams.show', $entranceExam->id)
            ->with('success', 'Exam details updated successfully.');
    }

    /**
     * Show form to record exam results
     */
    public function recordResults(EntranceExam $entranceExam)
    {
        $entranceExam->load(['application', 'personalData']);

        return Inertia::render('Admissions/EntranceExams/RecordResults', [
            'exam' => $entranceExam,
        ]);
    }

    /**
     * Store exam results
     */
    public function storeResults(UpdateEntranceExamResultRequest $request, EntranceExam $entranceExam)
    {
        $validated = $request->validated();

        $entranceExam->markCompleted(
            rawScore: $validated['raw_score'],
            totalMarks: $validated['total_marks'] ?? 100,
            passingScore: $validated['passing_score'] ?? $entranceExam->passing_score ?? 50
        );

        $entranceExam->update([
            'invigilator_name'    => $validated['invigilator_name'],
            'invigilator_remarks' => $validated['invigilator_remarks'],
            'exam_remarks'        => $validated['exam_remarks'],
        ]);

        // Add section scores if provided
        if ($request->filled('section_scores')) {
            foreach ($validated['section_scores'] as $section => $score) {
                $entranceExam->addSectionScore($section, $score);
            }
        }

        // Add subject scores if provided
        if ($request->filled('subject_scores')) {
            foreach ($validated['subject_scores'] as $subject => $score) {
                $entranceExam->addSubjectScore($subject, $score);
            }
        }

        // Update application status based on result
        $application = $entranceExam->application;
        if ($entranceExam->result === 'Pass') {
            $application->application_status = 'Exam Taken';
            $application->examination_date   = now()->toDateString();
            $application->save();
        }

        return redirect()->route('entrance-exams.show', $entranceExam->id)
            ->with('success', 'Exam results recorded successfully.');
    }

    /**
     * Cancel an exam
     */
    public function cancel(Request $request, EntranceExam $entranceExam)
    {
        $validated = $request->validate([
            'reason' => 'required|string|max:500',
        ]);

        $entranceExam->markCancelled($validated['reason']);

        return back()->with('success', 'Exam cancelled successfully.');
    }

    /**
     * Mark applicant as no-show
     */
    public function noShow(Request $request, EntranceExam $entranceExam)
    {
        $validated = $request->validate([
            'reason' => 'required|string|max:500',
        ]);

        $entranceExam->markNoShow($validated['reason']);

        return back()->with('success', 'Applicant marked as no-show.');
    }

    /**
     * Get exam statistics
     */
    public function statistics()
    {
        $stats = [
            'total_scheduled' => EntranceExam::scheduled()->count(),
            'total_completed' => EntranceExam::completed()->count(),
            'total_passed'    => EntranceExam::passed()->count(),
            'total_failed'    => EntranceExam::failed()->count(),
            'pass_rate'       => EntranceExam::passed()->count() / EntranceExam::completed()->count() * 100,
            'average_score'   => EntranceExam::completed()->average('percentage_score'),
        ];

        return Inertia::render('Admissions/EntranceExams/Statistics', [
            'statistics' => $stats,
        ]);
    }
}

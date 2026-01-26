<?php
namespace App\Http\Controllers;

use App\Http\Requests\StoreAssessmentRequest;
use App\Models\ApplicantApplicationInfo;
use App\Models\Assessment;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AssessmentController extends Controller
{
    /**
     * Display all assessments
     */
    public function index(Request $request)
    {
        $query = Assessment::with(['application', 'personalData'])
            ->orderBy('assessment_date', 'desc');

        if ($request->filled('type')) {
            $query->where('assessment_type', $request->type);
        }

        if ($request->filled('status')) {
            $query->where('assessment_status', $request->status);
        }

        if ($request->filled('result')) {
            $query->where('result', $request->result);
        }

        $assessments = $query->paginate(15);

        return Inertia::render('Admissions/Assessments/Index', [
            'assessments' => $assessments,
            'filters'     => [
                'type'   => $request->type,
                'status' => $request->status,
                'result' => $request->result,
            ],
        ]);
    }

    /**
     * Show form to create assessment
     */
    public function create(ApplicantApplicationInfo $application)
    {
        return Inertia::render('Admissions/Assessments/Create', [
            'application'     => $application->load('personalData'),
            'assessmentTypes' => [
                'Interview',
                'Practical Test',
                'Group Discussion',
                'Portfolio Review',
                'Aptitude Test',
                'Other',
            ],
        ]);
    }

    /**
     * Store new assessment
     */
    public function store(StoreAssessmentRequest $request)
    {
        $validated = $request->validated();

        $assessment = Assessment::create([
            'applicant_application_info_id' => $validated['applicant_application_info_id'],
            'applicant_personal_data_id'    => $validated['applicant_personal_data_id'],
            'assessment_type'               => $validated['assessment_type'],
            'assessment_date'               => $validated['assessment_date'],
            'assessment_status'             => 'Completed',
            'score'                         => $validated['score'],
            'total_score'                   => $validated['total_score'] ?? 100,
            'result'                        => $validated['score'] >= 50 ? 'Pass' : 'Fail', // Adjust logic as needed
            'assessed_by'                   => $validated['assessed_by'],
            'assessor_remarks'              => $validated['assessor_remarks'],
            'feedback'                      => $validated['feedback'],
        ]);

        return redirect()->route('assessments.show', $assessment->id)
            ->with('success', 'Assessment recorded successfully.');
    }

    /**
     * Show assessment details
     */
    public function show(Assessment $assessment)
    {
        $assessment->load(['application', 'personalData']);

        return Inertia::render('Admissions/Assessments/Show', [
            'assessment' => $assessment,
        ]);
    }

    /**
     * Show form to edit assessment
     */
    public function edit(Assessment $assessment)
    {
        $assessment->load(['application', 'personalData']);

        return Inertia::render('Admissions/Assessments/Edit', [
            'assessment' => $assessment,
        ]);
    }

    /**
     * Update assessment
     */
    public function update(Request $request, Assessment $assessment)
    {
        $validated = $request->validate([
            'assessment_type'   => 'required|string',
            'assessment_date'   => 'required|date',
            'assessment_status' => 'required|in:Pending,Completed,Cancelled',
            'score'             => 'required|numeric|min:0',
            'total_score'       => 'required|numeric|min:0',
            'result'            => 'required|in:Pass,Fail,Pending',
            'assessed_by'       => 'required|string',
            'assessor_remarks'  => 'nullable|string',
            'feedback'          => 'nullable|string',
        ]);

        $assessment->update($validated);

        return redirect()->route('assessments.show', $assessment->id)
            ->with('success', 'Assessment updated successfully.');
    }

    /**
     * Delete assessment
     */
    public function destroy(Assessment $assessment)
    {
        $assessment->delete();

        return redirect()->route('assessments.index')
            ->with('success', 'Assessment deleted successfully.');
    }

    /**
     * Get assessment statistics
     */
    public function statistics()
    {
        $stats = [
            'total_completed' => Assessment::completed()->count(),
            'total_passed'    => Assessment::passed()->count(),
            'total_failed'    => Assessment::failed()->count(),
            'by_type'         => Assessment::completed()
                ->groupBy('assessment_type')
                ->selectRaw('assessment_type, count(*) as count')
                ->get(),
        ];

        return Inertia::render('Admissions/Assessments/Statistics', [
            'statistics' => $stats,
        ]);
    }
}

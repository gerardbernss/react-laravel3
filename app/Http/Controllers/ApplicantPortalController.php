<?php

namespace App\Http\Controllers;

use App\Models\ApplicantApplicationInfo;
use App\Models\ApplicantPersonalData;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class ApplicantPortalController extends Controller
{
    private function getApplicantData()
    {
        $user = Auth::user();
        if (!$user) {
            return null;
        }

        return ApplicantPersonalData::where('email', $user->email)
            ->with(['familyBackground', 'siblings', 'applications' => function ($query) {
                $query->with(['educationalBackground', 'documents'])->latest();
            }])
            ->first();
    }

    private function formatHealthConditions($input)
    {
        if (is_array($input)) {
            $filtered = array_filter($input, fn($item) => ! is_null($item) && $item !== '');
            return empty($filtered) ? 'None' : json_encode($filtered);
        }
        return ($input === null || $input === '') ? 'None' : $input;
    }

    public function index()
    {
        $personalData = $this->getApplicantData();

        if (!$personalData) {
            return Inertia::render('Applicant/Dashboard', [
                'applicant' => null,
                'message' => 'No application record found linked to your account.',
            ]);
        }

        $application = $personalData->applications->first();

        // If no application exists (only personal data), we return minimal data
        if (!$application) {
             return Inertia::render('Applicant/Dashboard', [
                'applicant' => null,
                'personalData' => $personalData,
                'message' => 'Personal data found, but no active application.',
            ]);
        }

        $application->load(['personalData', 'personalData.familyBackground', 'personalData.siblings', 'educationalBackground', 'documents']);

        return Inertia::render('Applicant/Dashboard', [
            'applicant' => $application,
        ]);
    }

    public function edit()
    {
        $personalData = $this->getApplicantData();

        if (!$personalData) {
             return redirect()->route('applicant.dashboard')->with('error', 'Applicant record not found.');
        }

        $application = $personalData->applications->first();

        if (!$application) {
             return redirect()->route('applicant.dashboard')->with('error', 'Application record not found.');
        }

        $application->load(['personalData', 'personalData.familyBackground', 'personalData.siblings', 'educationalBackground', 'documents']);

        return Inertia::render('Applicant/Edit', [
            'applicant' => $application,
        ]);
    }

    public function update(Request $request)
    {
        $personalData = $this->getApplicantData();

        if (!$personalData) {
            return back()->withErrors(['error' => 'Applicant record not found.']);
        }

        $application = $personalData->applications->first();
        if (!$application) {
             return back()->withErrors(['error' => 'Application record not found.']);
        }

        // Validation
        $request->validate([
            'last_name' => 'required|string|max:255',
            'first_name' => 'required|string|max:255',
            'middle_name' => 'required|string|max:255',
            'suffix' => 'nullable|string|max:50',
            'learner_reference_number' => 'nullable|string|max:50',
            'gender' => 'required|in:Male,Female,Other',
            'citizenship' => 'required|string|max:100',
            'religion' => 'nullable|string|max:100',
            'date_of_birth' => 'required|date',
            'place_of_birth' => 'nullable|string|max:255',
            'has_sibling' => 'boolean',
            'alt_email' => 'required|email|max:255',
            'mobile_number' => 'required|string|max:20',

            'present_street' => 'nullable|string|max:255',
            'present_brgy' => 'required|string|max:255',
            'present_city' => 'required|string|max:255',
            'present_province' => 'required|string|max:255',
            'present_zip' => 'required|string|max:20',

            'permanent_street' => 'nullable|string|max:255',
            'permanent_brgy' => 'required|string|max:255',
            'permanent_city' => 'required|string|max:255',
            'permanent_province' => 'required|string|max:255',
            'permanent_zip' => 'required|string|max:20',

            'father_lname' => 'nullable|string|max:255',
            'father_fname' => 'nullable|string|max:255',
            'father_mname' => 'nullable|string|max:255',
            'father_living' => 'nullable|string|max:20',
            'father_citizenship' => 'nullable|string|max:100',
            'father_religion' => 'nullable|string|max:100',
            'father_highest_educ' => 'nullable|string|max:100',
            'father_occupation' => 'nullable|string|max:100',
            'father_income' => 'nullable|string|max:100',
            'father_business_emp' => 'nullable|string|max:255',
            'father_business_address' => 'nullable|string|max:255',
            'father_contact_no' => 'nullable|string|max:20',
            'father_email' => 'nullable|string|email|max:255',
            'father_slu_employee' => 'boolean',
            'father_slu_dept' => 'nullable|string|max:255',

            'mother_lname' => 'nullable|string|max:255',
            'mother_fname' => 'nullable|string|max:255',
            'mother_mname' => 'nullable|string|max:255',
            'mother_living' => 'nullable|string|max:20',
            'mother_citizenship' => 'nullable|string|max:100',
            'mother_religion' => 'nullable|string|max:100',
            'mother_highest_educ' => 'nullable|string|max:100',
            'mother_occupation' => 'nullable|string|max:100',
            'mother_income' => 'nullable|string|max:100',
            'mother_business_emp' => 'nullable|string|max:255',
            'mother_business_address' => 'nullable|string|max:255',
            'mother_contact_no' => 'nullable|string|max:20',
            'mother_email' => 'nullable|string|email|max:255',
            'mother_slu_employee' => 'boolean',
            'mother_slu_dept' => 'nullable|string|max:255',

            'guardian_lname' => 'nullable|string|max:255',
            'guardian_fname' => 'nullable|string|max:255',
            'guardian_mname' => 'nullable|string|max:255',
            'guardian_relationship' => 'nullable|string|max:100',
            'guardian_citizenship' => 'nullable|string|max:100',
            'guardian_religion' => 'nullable|string|max:100',
            'guardian_highest_educ' => 'nullable|string|max:100',
            'guardian_occupation' => 'nullable|string|max:100',
            'guardian_income' => 'nullable|string|max:100',
            'guardian_business_emp' => 'nullable|string|max:255',
            'guardian_business_address' => 'nullable|string|max:255',
            'guardian_contact_no' => 'nullable|string|max:20',
            'guardian_email' => 'nullable|string|email|max:255',
            'guardian_slu_employee' => 'boolean',
            'guardian_slu_dept' => 'nullable|string|max:255',

            'emergency_contact_name' => 'required|string|max:255',
            'emergency_relationship' => 'required|string|max:100',
            'emergency_home_phone' => 'nullable|string|max:20',
            'emergency_mobile_phone' => 'required|string|max:20',
            'emergency_email' => 'nullable|string|email|max:255',

            'school_year' => 'nullable|string|max:20',
            'year_level' => 'nullable|string|max:50',
            'strand' => 'nullable|string|max:255',
            'classification' => 'nullable|string|max:50',
            'learning_mode' => 'nullable|string|max:50',
        ]);

        DB::beginTransaction();

        try {
            // STEP 1: Update Personal Data
            $personalPayload = [
                'last_name'                => $request->last_name,
                'first_name'               => $request->first_name,
                'middle_name'              => $request->middle_name,
                'suffix'                   => $request->suffix,
                'learner_reference_number' => $request->learner_reference_number,
                'gender'                   => $request->gender,
                'citizenship'              => $request->citizenship,
                'religion'                 => $request->religion,
                'date_of_birth'            => $request->date_of_birth,
                'place_of_birth'           => $request->place_of_birth,
                'has_sibling'              => filter_var($request->has_sibling, FILTER_VALIDATE_BOOLEAN),
                'alt_email'                => $request->alt_email,
                'mobile_number'            => $request->mobile_number,
                'present_street'           => $request->present_street,
                'present_brgy'             => $request->present_brgy,
                'present_city'             => $request->present_city,
                'present_province'         => $request->present_province,
                'present_zip'              => $request->present_zip,
                'permanent_street'         => $request->permanent_street,
                'permanent_brgy'           => $request->permanent_brgy,
                'permanent_city'           => $request->permanent_city,
                'permanent_province'       => $request->permanent_province,
                'permanent_zip'            => $request->permanent_zip,
                'stopped_studying'         => $request->stopped_studying ?: 'No',
                'accelerated'              => $request->accelerated ?: 'No',
                'health_conditions'        => $this->formatHealthConditions($request->health_conditions),
            ];

            $personalData->fill($personalPayload);
            $personalData->save();

            // STEP 2: Update Family Background
            $familyPayload = [
                'father_lname'              => $request->father_lname,
                'father_fname'              => $request->father_fname,
                'father_mname'              => $request->father_mname,
                'father_living'             => $request->father_living,
                'father_citizenship'        => $request->father_citizenship,
                'father_religion'           => $request->father_religion,
                'father_highest_educ'       => $request->father_highest_educ,
                'father_occupation'         => $request->father_occupation,
                'father_income'             => $request->father_income,
                'father_business_emp'       => $request->father_business_emp,
                'father_business_address'   => $request->father_business_address,
                'father_contact_no'         => $request->father_contact_no,
                'father_email'              => $request->father_email,
                'father_slu_employee'       => filter_var($request->father_slu_employee, FILTER_VALIDATE_BOOLEAN),
                'father_slu_dept'           => $request->father_slu_dept,
                'mother_lname'              => $request->mother_lname,
                'mother_fname'              => $request->mother_fname,
                'mother_mname'              => $request->mother_mname,
                'mother_living'             => $request->mother_living,
                'mother_citizenship'        => $request->mother_citizenship,
                'mother_religion'           => $request->mother_religion,
                'mother_highest_educ'       => $request->mother_highest_educ,
                'mother_occupation'         => $request->mother_occupation,
                'mother_income'             => $request->mother_income,
                'mother_business_emp'       => $request->mother_business_emp,
                'mother_business_address'   => $request->mother_business_address,
                'mother_contact_no'         => $request->mother_contact_no,
                'mother_email'              => $request->mother_email,
                'mother_slu_employee'       => filter_var($request->mother_slu_employee, FILTER_VALIDATE_BOOLEAN),
                'mother_slu_dept'           => $request->mother_slu_dept,
                'guardian_lname'            => $request->guardian_lname,
                'guardian_fname'            => $request->guardian_fname,
                'guardian_mname'            => $request->guardian_mname,
                'guardian_relationship'     => $request->guardian_relationship,
                'guardian_citizenship'      => $request->guardian_citizenship,
                'guardian_religion'         => $request->guardian_religion,
                'guardian_highest_educ'     => $request->guardian_highest_educ,
                'guardian_occupation'       => $request->guardian_occupation,
                'guardian_income'           => $request->guardian_income,
                'guardian_business_emp'     => $request->guardian_business_emp,
                'guardian_business_address' => $request->guardian_business_address,
                'guardian_contact_no'       => $request->guardian_contact_no,
                'guardian_email'            => $request->guardian_email,
                'guardian_slu_employee'     => filter_var($request->guardian_slu_employee, FILTER_VALIDATE_BOOLEAN),
                'guardian_slu_dept'         => $request->guardian_slu_dept,
                'emergency_contact_name'    => $request->emergency_contact_name,
                'emergency_relationship'    => $request->emergency_relationship,
                'emergency_home_phone'      => $request->emergency_home_phone,
                'emergency_mobile_phone'    => $request->emergency_mobile_phone,
                'emergency_email'           => $request->emergency_email,
            ];

            $personalData->familyBackground()->updateOrCreate(
                ['applicant_personal_data_id' => $personalData->id],
                $familyPayload
            );

            // STEP 3: Update Siblings
            $personalData->siblings()->delete();
            $siblings = is_string($request->siblings) ? json_decode($request->siblings, true) : $request->siblings;

            if (is_array($siblings) && count($siblings) > 0) {
                foreach ($siblings as $sibling) {
                    if (is_array($sibling) && ! empty($sibling['sibling_full_name'])) {
                        $personalData->siblings()->create([
                            'sibling_full_name'   => $sibling['sibling_full_name'],
                            'sibling_grade_level' => $sibling['sibling_grade_level'] ?? null,
                            'sibling_id_number'   => $sibling['sibling_id_number'] ?? null,
                        ]);
                    }
                }
            }

            // STEP 4: Update Application Info
            $applicationPayload = [
                'school_year'          => $request->school_year,
                'semester'             => $request->semester,
                'classification'       => $request->classification,
                'learning_mode'        => $request->learning_mode,
            ];

            if ($request->year_level) $applicationPayload['year_level'] = $request->year_level;
            if ($request->strand) $applicationPayload['strand'] = $request->strand;

            $application->fill($applicationPayload);
            $application->save();

            // STEP 5: Update Educational Background
            $application->educationalBackground()->delete();
            $schools = is_string($request->schools) ? json_decode($request->schools, true) : $request->schools;

            if (is_array($schools) && count($schools) > 0) {
                foreach ($schools as $school) {
                    if (is_array($school) && ! empty($school['school_name'])) {
                        $application->educationalBackground()->create([
                            'school_name'     => $school['school_name'],
                            'school_address'  => $school['school_address'] ?? null,
                            'from_grade'      => $school['from_grade'] ?? null,
                            'to_grade'        => $school['to_grade'] ?? null,
                            'from_year'       => $school['from_year'] ?? null,
                            'to_year'         => $school['to_year'] ?? null,
                            'honors_awards'   => $school['honors_awards'] ?? null,
                            'general_average' => $school['general_average'] ?? null,
                            'class_rank'      => $school['class_rank'] ?? null,
                            'class_size'      => $school['class_size'] ?? null,
                        ]);
                    }
                }
            }

            DB::commit();

            return redirect()->route('applicant.dashboard')
                ->with('success', 'Profile updated successfully.');

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Applicant profile update failed: ' . $e->getMessage());
            return back()->withErrors(['error' => 'Failed to update: ' . $e->getMessage()])->withInput();
        }
    }
}

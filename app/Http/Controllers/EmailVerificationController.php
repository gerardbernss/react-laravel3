<?php

namespace App\Http\Controllers;

use App\Http\Requests\EmailVerification\CheckAltEmailVerificationRequest;
use App\Http\Requests\EmailVerification\CheckEmailVerificationRequest;
use App\Http\Requests\EmailVerification\SendAltEmailVerificationCodeRequest;
use App\Http\Requests\EmailVerification\SendEmailVerificationCodeRequest;
use App\Http\Requests\EmailVerification\VerifyAltEmailCodeRequest;
use App\Http\Requests\EmailVerification\VerifyEmailCodeRequest;
use App\Services\EmailVerificationCodeService;
use Illuminate\Http\JsonResponse;

class EmailVerificationController extends Controller
{
    public function __construct(private EmailVerificationCodeService $emailVerificationCodeService)
    {
    }

    /**
     * Send verification code to email
     */
    public function sendCode(SendEmailVerificationCodeRequest $request): JsonResponse
    {
        $email = $request->validated('email');

        if (! $this->emailVerificationCodeService->canSend($email)) {
            return response()->json([
                'success' => false,
                'message' => 'Please wait before requesting another code',
            ], 429);
        }

        $this->emailVerificationCodeService->send($email);

        return response()->json([
            'success' => true,
            'message' => 'Verification code sent to your email',
        ]);
    }

    public function sendAltCode(SendAltEmailVerificationCodeRequest $request): JsonResponse
    {
        $altEmail = $request->validated('alt_email');

        if (! $this->emailVerificationCodeService->canSend($altEmail)) {
            return response()->json([
                'success' => false,
                'message' => 'Please wait before requesting another code',
            ], 429);
        }

        $this->emailVerificationCodeService->send($altEmail);

        return response()->json([
            'success' => true,
            'message' => 'Verification code sent to your email',
        ]);
    }

    /**
     * Verify the code
     */
    public function verifyCode(VerifyEmailCodeRequest $request): JsonResponse
    {
        $email = $request->validated('email');
        $result = $this->emailVerificationCodeService->verify($email, $request->validated('code'));

        if (! $result['success']) {
            return response()->json($result, 422);
        }

        return response()->json([
            'success' => true,
            'message' => 'Email verified successfully',
            'email' => $email,
            'verified_at' => now()->toISOString(),
        ]);
    }

    public function verifyAltCode(VerifyAltEmailCodeRequest $request): JsonResponse
    {
        $altEmail = $request->validated('alt_email');
        $result = $this->emailVerificationCodeService->verify($altEmail, $request->validated('code'));

        if (! $result['success']) {
            return response()->json($result, 422);
        }

        return response()->json([
            'success' => true,
            'message' => 'Email verified successfully',
            'alt_email' => $altEmail,
            'verified_at' => now()->toISOString(),
        ]);
    }

    /**
     * Check if email is verified (optional helper method)
     */
    public function checkVerification(CheckEmailVerificationRequest $request): JsonResponse
    {
        $email = $request->validated('email');

        return response()->json([
            'success' => true,
            'email' => $email,
            'is_verified' => $this->emailVerificationCodeService->isVerified($email),
        ]);
    }

    public function checkAltVerification(CheckAltEmailVerificationRequest $request): JsonResponse
    {
        $altEmail = $request->validated('alt_email');

        return response()->json([
            'success' => true,
            'alt_email' => $altEmail,
            'is_verified' => $this->emailVerificationCodeService->isVerified($altEmail),
        ]);
    }
}

<?php
namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Validator;

class EmailVerificationController extends Controller
{
    /**
     * Send verification code to email
     */
    public function sendCode(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid email address',
                'errors'  => $validator->errors(),
            ], 422);
        }

        $email = $request->email;

        // Check if code was recently sent (rate limiting)
        $lastSent = Cache::get("email_verification_sent:{$email}");
        if ($lastSent && now()->diffInSeconds($lastSent) < 60) {
            return response()->json([
                'success' => false,
                'message' => 'Please wait before requesting another code',
            ], 429);
        }

        // Generate 6-digit code
        $code = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        // Store code in cache for 10 minutes
        Cache::put("email_verification:{$email}", $code, now()->addMinutes(10));

        // Store last sent time for rate limiting
        Cache::put("email_verification_sent:{$email}", now(), now()->addMinute());

        // Send email directly using Mail facade
        Mail::send([], [], function ($message) use ($email, $code) {
            $message->to($email)
                ->subject('Email Verification Code')
                ->html("
                    <h2>Email Verification</h2>
                    <p>Your email verification code is: <strong>{$code}</strong></p>
                    <p>This code will expire in 10 minutes.</p>
                    <p>If you did not request this code, please ignore this email.</p>
                ");
        });

        return response()->json([
            'success' => true,
            'message' => 'Verification code sent to your email',
        ]);
    }

    public function sendAltCode(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'alt_email' => 'required|email',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid email address',
                'errors'  => $validator->errors(),
            ], 422);
        }

        $alt_email = $request->alt_email;

        // Check if code was recently sent (rate limiting)
        $lastSent = Cache::get("email_verification_sent:{$alt_email}");
        if ($lastSent && now()->diffInSeconds($lastSent) < 60) {
            return response()->json([
                'success' => false,
                'message' => 'Please wait before requesting another code',
            ], 429);
        }

        // Generate 6-digit code
        $code = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        // Store code in cache for 10 minutes
        Cache::put("email_verification:{$alt_email}", $code, now()->addMinutes(10));

        // Store last sent time for rate limiting
        Cache::put("email_verification_sent:{$alt_email}", now(), now()->addMinute());

        // Send email directly using Mail facade
        Mail::send([], [], function ($message) use ($alt_email, $code) {
            $message->to($alt_email)
                ->subject('Email Verification Code')
                ->html("
                    <h2>Email Verification</h2>
                    <p>Your email verification code is: <strong>{$code}</strong></p>
                    <p>This code will expire in 10 minutes.</p>
                    <p>If you did not request this code, please ignore this email.</p>
                ");
        });

        return response()->json([
            'success' => true,
            'message' => 'Verification code sent to your email',
        ]);
    }

    /**
     * Verify the code
     */
    public function verifyCode(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'code'  => 'required|string|size:6',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid input',
                'errors'  => $validator->errors(),
            ], 422);
        }

        $email = $request->email;
        $code  = $request->code;

        // Get code from cache
        $cachedCode = Cache::get("email_verification:{$email}");

        if (! $cachedCode) {
            return response()->json([
                'success' => false,
                'message' => 'Verification code has expired or does not exist',
            ], 422);
        }

        if ($cachedCode !== $code) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid verification code',
            ], 422);
        }

        // Code is valid - store verified status in cache
        Cache::put("email_verified:{$email}", true, now()->addHours(24));

        // Delete the verification code from cache
        Cache::forget("email_verification:{$email}");
        Cache::forget("email_verification_sent:{$email}");

        return response()->json([
            'success'     => true,
            'message'     => 'Email verified successfully',
            'email'       => $email,
            'verified_at' => now()->toISOString(),
        ]);
    }

    public function verifyAltCode(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'alt_email' => 'required|email',
            'code'      => 'required|string|size:6',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid input',
                'errors'  => $validator->errors(),
            ], 422);
        }

        $alt_email = $request->alt_email;
        $code      = $request->code;

        // Get code from cache
        $cachedCode = Cache::get("email_verification:{$alt_email}");

        if (! $cachedCode) {
            return response()->json([
                'success' => false,
                'message' => 'Verification code has expired or does not exist',
            ], 422);
        }

        if ($cachedCode !== $code) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid verification code',
            ], 422);
        }

        // Code is valid - store verified status in cache
        Cache::put("email_verified:{$alt_email}", true, now()->addHours(24));

        // Delete the verification code from cache
        Cache::forget("email_verification:{$alt_email}");
        Cache::forget("email_verification_sent:{$alt_email}");

        return response()->json([
            'success'     => true,
            'message'     => 'Email verified successfully',
            'alt_email'   => $alt_email,
            'verified_at' => now()->toISOString(),
        ]);
    }

    /**
     * Check if email is verified (optional helper method)
     */
    public function checkVerification(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid email address',
            ], 422);
        }

        $isVerified = Cache::get("email_verified:{$request->email}", false);

        return response()->json([
            'success'     => true,
            'email'       => $request->email,
            'is_verified' => $isVerified,
        ]);
    }

    public function checkAltVerification(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'alt_email' => 'required|email',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid email address',
            ], 422);
        }

        $isVerified = Cache::get("email_verified:{$request->alt_email}", false);

        return response()->json([
            'success'     => true,
            'alt_email'   => $request->alt_email,
            'is_verified' => $isVerified,
        ]);
    }
}

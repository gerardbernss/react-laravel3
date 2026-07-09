<?php
use App\Http\Controllers\EmailVerificationController;
use Illuminate\Support\Facades\Route;

// NOTE: these were previously unauthenticated AND unthrottled. auth is intentionally
// not added here (this endpoint is used during registration, before a session exists),
// but throttling matches the equivalent web verification endpoints in routes/auth.php.
Route::post('/email/send-verification', [EmailVerificationController::class, 'sendCode'])
    ->middleware('throttle:6,1')
    ->name('api.email.send-verification');
Route::post('/email/verify', [EmailVerificationController::class, 'verifyCode'])
    ->middleware('throttle:6,1')
    ->name('api.email.verify');
Route::post('/email/send-altverification', [EmailVerificationController::class, 'sendAltCode'])
    ->middleware('throttle:6,1')
    ->name('api.email.send-alt-verification');
Route::post('/email/altverify', [EmailVerificationController::class, 'verifyAltCode'])
    ->middleware('throttle:6,1')
    ->name('api.email.alt-verify');

Route::post('/email/check-verification', [EmailVerificationController::class, 'checkVerification'])
    ->middleware('throttle:10,1')
    ->name('api.email.check-verification'); // Optional

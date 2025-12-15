<?php
use App\Http\Controllers\EmailVerificationController;
use Illuminate\Support\Facades\Route;

Route::post('/email/send-verification', [EmailVerificationController::class, 'sendCode']);
Route::post('/email/verify', [EmailVerificationController::class, 'verifyCode']);
Route::post('/email/send-altverification', [EmailVerificationController::class, 'sendAltCode']);
Route::post('/email/altverify', [EmailVerificationController::class, 'verifyAltCode']);

Route::post('/email/check-verification', [EmailVerificationController::class, 'checkVerification']); // Optional

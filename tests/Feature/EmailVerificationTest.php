<?php

use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Notification;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Support\Facades\URL;

uses(RefreshDatabase::class);

it('dispatches verification email on register', function () {
    Notification::fake();

    $response = $this->post(route('register.store'), [
        'name' => 'Jane Doe',
        'email' => 'jane@example.com',
        'password' => 'Password123!',
        'password_confirmation' => 'Password123!',
    ]);

    $response->assertRedirect(route('verification.notice'));

    $user = User::where('email', 'jane@example.com')->first();
    expect($user)->not->toBeNull();

    Notification::assertSentTo($user, VerifyEmail::class);
});

it('blocks access to dashboard until email is verified', function () {
    $user = User::factory()->create([ 'email_verified_at' => null ]);
    $this->actingAs($user);

    $response = $this->get(route('dashboard'));
    $response->assertRedirect(route('verification.notice'));
});

it('marks email as verified via signed url', function () {
    $user = User::factory()->create([ 'email_verified_at' => null ]);
    $this->actingAs($user);

    $url = URL::temporarySignedRoute(
        'verification.verify',
        now()->addMinutes(60),
        ['id' => $user->id, 'hash' => sha1($user->email)]
    );

    $response = $this->get($url);
    $response->assertRedirect(route('dashboard', absolute: false).'?verified=1');

    $user->refresh();
    expect($user->hasVerifiedEmail())->toBeTrue();
});

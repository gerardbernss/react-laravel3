<?php

use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Auth;
use Laravel\Socialite\Facades\Socialite;
use Laravel\Socialite\Two\User as SocialiteUser;

uses(RefreshDatabase::class);

beforeEach(function () {
    // Create a default role for testing
    Role::create([
        'slug' => 'user',
        'name' => 'User',
        'description' => 'Regular user role',
        'is_active' => true,
    ]);
});

it('redirects to Google OAuth provider', function () {
    $response = $this->get(route('auth.google'));

    $response->assertRedirect();
    expect($response->headers->get('Location'))->toStartWith('https://accounts.google.com/o/oauth2/auth');
});

it('creates new user when Google authentication succeeds', function () {
    $googleUser = Mockery::mock(SocialiteUser::class);
    $googleUser->shouldReceive('getId')->andReturn('google123');
    $googleUser->shouldReceive('getName')->andReturn('John Doe');
    $googleUser->shouldReceive('getEmail')->andReturn('john@example.com');
    $googleUser->shouldReceive('getAvatar')->andReturn('https://example.com/avatar.jpg');

    Socialite::shouldReceive('driver->user')->andReturn($googleUser);

    $response = $this->get(route('auth.google.callback'));

    $response->assertRedirect(route('dashboard', absolute: false));

    $this->assertDatabaseHas('users', [
        'google_id' => 'google123',
        'name' => 'John Doe',
        'email' => 'john@example.com',
        'avatar' => 'https://example.com/avatar.jpg',
    ]);

    expect(Auth::check())->toBeTrue();
    expect(Auth::user()->email)->toBe('john@example.com');
});

it('logs in existing user with Google ID', function () {
    $user = User::factory()->create([
        'google_id' => 'google123',
        'email' => 'john@example.com',
    ]);

    $googleUser = Mockery::mock(SocialiteUser::class);
    $googleUser->shouldReceive('getId')->andReturn('google123');
    $googleUser->shouldReceive('getName')->andReturn('John Doe');
    $googleUser->shouldReceive('getEmail')->andReturn('john@example.com');
    $googleUser->shouldReceive('getAvatar')->andReturn('https://example.com/avatar.jpg');

    Socialite::shouldReceive('driver->user')->andReturn($googleUser);

    $response = $this->get(route('auth.google.callback'));

    $response->assertRedirect(route('dashboard', absolute: false));
    expect(Auth::check())->toBeTrue();
    expect(Auth::user()->id)->toBe($user->id);
});

it('links Google account to existing user with same email', function () {
    $user = User::factory()->create([
        'email' => 'john@example.com',
        'google_id' => null,
    ]);

    $googleUser = Mockery::mock(SocialiteUser::class);
    $googleUser->shouldReceive('getId')->andReturn('google123');
    $googleUser->shouldReceive('getName')->andReturn('John Doe');
    $googleUser->shouldReceive('getEmail')->andReturn('john@example.com');
    $googleUser->shouldReceive('getAvatar')->andReturn('https://example.com/avatar.jpg');

    Socialite::shouldReceive('driver->user')->andReturn($googleUser);

    $response = $this->get(route('auth.google.callback'));

    $response->assertRedirect(route('dashboard', absolute: false));

    $user->refresh();
    expect($user->google_id)->toBe('google123');
    expect($user->avatar)->toBe('https://example.com/avatar.jpg');
    expect(Auth::check())->toBeTrue();
});

it('redirects to login with error when Google authentication fails', function () {
    Socialite::shouldReceive('driver->user')->andThrow(new \Exception('OAuth failed'));

    $response = $this->get(route('auth.google.callback'));

    $response->assertRedirect(route('login'));
    $response->assertSessionHasErrors(['email']);
});

it('assigns default role to new Google users', function () {
    $defaultRole = Role::where('slug', 'user')->first();

    $googleUser = Mockery::mock(SocialiteUser::class);
    $googleUser->shouldReceive('getId')->andReturn('google123');
    $googleUser->shouldReceive('getName')->andReturn('John Doe');
    $googleUser->shouldReceive('getEmail')->andReturn('john@example.com');
    $googleUser->shouldReceive('getAvatar')->andReturn('https://example.com/avatar.jpg');

    Socialite::shouldReceive('driver->user')->andReturn($googleUser);

    $this->get(route('auth.google.callback'));

    $user = User::where('google_id', 'google123')->first();
    expect($user->hasRole('user'))->toBeTrue();
});

it('blocks sign-in when email domain is not allowed', function () {
    config()->set('services.google.allowed_domains', ['example.com']);

    $googleUser = Mockery::mock(SocialiteUser::class);
    $googleUser->shouldReceive('getId')->andReturn('google999');
    $googleUser->shouldReceive('getName')->andReturn('Eve Attacker');
    $googleUser->shouldReceive('getEmail')->andReturn('eve@bad.com');
    $googleUser->shouldReceive('getAvatar')->andReturn('https://example.com/avatar.jpg');

    Socialite::shouldReceive('driver->user')->andReturn($googleUser);

    $response = $this->get(route('auth.google.callback'));

    $response->assertRedirect(route('login'));
    $response->assertSessionHasErrors(['email']);
    $this->assertDatabaseMissing('users', ['email' => 'eve@bad.com']);
});

it('allows sign-in when email domain is allowed', function () {
    config()->set('services.google.allowed_domains', ['example.com']);

    $googleUser = Mockery::mock(SocialiteUser::class);
    $googleUser->shouldReceive('getId')->andReturn('google321');
    $googleUser->shouldReceive('getName')->andReturn('Alice Example');
    $googleUser->shouldReceive('getEmail')->andReturn('alice@example.com');
    $googleUser->shouldReceive('getAvatar')->andReturn('https://example.com/avatar.jpg');

    Socialite::shouldReceive('driver->user')->andReturn($googleUser);

    $response = $this->get(route('auth.google.callback'));

    $response->assertRedirect(route('dashboard', absolute: false));
    $this->assertDatabaseHas('users', ['email' => 'alice@example.com']);
});

afterEach(function () {
    Mockery::close();
});
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * google_id and avatar have been in App\Models\User's $fillable and in active
     * use by GoogleController/GoogleAuthService/UserRepository since Google OAuth
     * login was added, but no migration ever created these columns — they exist
     * on the real database already (added out of band), which is why this only
     * surfaces against a freshly migrated database, e.g. the sqlite test DB.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('google_id')->nullable()->unique()->after('role_id');
            $table->string('avatar')->nullable()->after('google_id');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['google_id', 'avatar']);
        });
    }
};

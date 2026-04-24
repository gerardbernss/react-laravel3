<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('students', function (Blueprint $table) {
            $table->dropColumn(['portal_access_active', 'portal_enrollment_date']);
        });
    }

    public function down(): void
    {
        Schema::table('students', function (Blueprint $table) {
            $table->dateTime('portal_enrollment_date')->nullable()->after('enrollment_status');
            $table->boolean('portal_access_active')->default(false)->after('portal_enrollment_date');
            $table->index('portal_access_active');
        });
    }
};

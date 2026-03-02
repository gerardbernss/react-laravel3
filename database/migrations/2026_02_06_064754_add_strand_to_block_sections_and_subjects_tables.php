<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('block_sections', function (Blueprint $table) {
            $table->string('strand')->nullable()->after('grade_level');
        });

        Schema::table('subjects', function (Blueprint $table) {
            $table->string('strand')->nullable()->after('grade_level');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('block_sections', function (Blueprint $table) {
            $table->dropColumn('strand');
        });

        Schema::table('subjects', function (Blueprint $table) {
            $table->dropColumn('strand');
        });
    }
};

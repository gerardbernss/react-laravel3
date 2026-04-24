<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('enrollment_periods', function (Blueprint $table) {
            $table->id();
            $table->string('school_year');                  // e.g. "2025-2026"
            $table->string('semester');                     // e.g. "First Semester"
            $table->boolean('is_open')->default(false);     // manual open flag
            $table->date('close_date')->nullable();         // set when opened; editable for extension
            $table->timestamp('opened_at')->nullable();     // when admin opened it
            $table->timestamp('closed_at')->nullable();     // when admin manually closed it
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->unique(['school_year', 'semester']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('enrollment_periods');
    }
};

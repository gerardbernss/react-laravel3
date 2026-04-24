<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('schedules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('subject_id')->constrained()->cascadeOnDelete();
            $table->foreignId('block_section_id')->nullable()->constrained()->nullOnDelete();
            $table->string('days', 10);
            $table->string('time', 20);
            $table->string('room', 100)->nullable();
            $table->timestamps();

            $table->unique(['subject_id', 'block_section_id'], 'schedules_subject_section_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('schedules');
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('student_siblings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_personal_data_id')->constrained('student_personal_data')->onDelete('cascade');

            $table->string('sibling_full_name')->nullable();
            $table->string('sibling_grade_level')->nullable();
            $table->string('sibling_id_number')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('student_siblings');
    }
};

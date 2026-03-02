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
        Schema::create('subject_prerequisites', function (Blueprint $table) {
            $table->id();
            $table->foreignId('subject_id')->constrained()->onDelete('cascade');
            $table->foreignId('prerequisite_id')->constrained('subjects')->onDelete('cascade');
            $table->boolean('is_required')->default(true); // Required vs Recommended
            $table->string('minimum_grade')->nullable();   // Minimum grade required (e.g., "3.00")
            $table->timestamps();

            // Ensure unique combinations
            $table->unique(['subject_id', 'prerequisite_id']);

            // Indexes
            $table->index('subject_id');
            $table->index('prerequisite_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('subject_prerequisites');
    }
};

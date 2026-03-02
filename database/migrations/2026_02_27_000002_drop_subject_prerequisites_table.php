<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::disableForeignKeyConstraints();
        Schema::dropIfExists('subject_prerequisites');
        Schema::enableForeignKeyConstraints();
    }

    public function down(): void
    {
        Schema::create('subject_prerequisites', function (\Illuminate\Database\Schema\Blueprint $table) {
            $table->id();
            $table->foreignId('subject_id')->constrained()->cascadeOnDelete();
            $table->foreignId('prerequisite_id')->constrained('subjects')->cascadeOnDelete();
            $table->boolean('is_required')->default(true);
            $table->string('minimum_grade')->nullable();
            $table->timestamps();
            $table->unique(['subject_id', 'prerequisite_id']);
        });
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Create new unified fees table
        Schema::create('fees', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('code', 20);
            $table->enum('category', ['tuition', 'miscellaneous', 'laboratory', 'special']);
            $table->boolean('is_per_unit')->default(false);
            $table->boolean('is_required')->default(true);
            $table->enum('school_level', ['all', 'LES', 'JHS', 'SHS'])->default('all');
            $table->string('school_year', 20);
            $table->enum('semester', ['1st Semester', '2nd Semester', 'Summer', 'Yearly'])->default('Yearly');
            $table->decimal('amount', 10, 2)->default(0);
            $table->text('description')->nullable();
            $table->date('effective_date')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->unique(['code', 'school_year', 'semester', 'school_level']);
        });

        // 2. Update assessment_line_items: drop old FK, rename column, add new FK
        Schema::table('assessment_line_items', function (Blueprint $table) {
            $table->dropForeign(['fee_type_id']);
            $table->renameColumn('fee_type_id', 'fee_id');
        });

        Schema::table('assessment_line_items', function (Blueprint $table) {
            $table->foreignId('fee_id')->nullable()->change();
            $table->foreign('fee_id')->references('id')->on('fees')->onDelete('set null');
        });

        // 3. Drop old tables (data already cleared by previous migrations)
        Schema::dropIfExists('fee_rates');
        Schema::dropIfExists('fee_types');
    }

    public function down(): void
    {
        // Recreate fee_types
        Schema::create('fee_types', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('code', 20)->unique();
            $table->enum('category', ['tuition', 'miscellaneous', 'laboratory', 'special']);
            $table->boolean('is_per_unit')->default(false);
            $table->boolean('is_required')->default(true);
            $table->enum('applies_to', ['all', 'LES', 'JHS', 'SHS'])->default('all');
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // Recreate fee_rates
        Schema::create('fee_rates', function (Blueprint $table) {
            $table->id();
            $table->foreignId('fee_type_id')->constrained('fee_types')->onDelete('cascade');
            $table->string('school_year', 20);
            $table->enum('semester', ['1st Semester', '2nd Semester', 'Summer', 'Yearly'])->default('Yearly');
            $table->enum('grade_level', [
                'all',
                'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6',
                'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12',
            ])->default('all');
            $table->decimal('amount', 10, 2);
            $table->date('effective_date')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->unique(['fee_type_id', 'school_year', 'semester', 'grade_level']);
        });

        // Revert assessment_line_items
        Schema::table('assessment_line_items', function (Blueprint $table) {
            $table->dropForeign(['fee_id']);
            $table->renameColumn('fee_id', 'fee_type_id');
        });

        Schema::dropIfExists('fees');
    }
};

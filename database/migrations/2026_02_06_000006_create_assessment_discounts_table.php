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
        Schema::create('assessment_discounts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('assessment_id')->constrained('student_assessments')->onDelete('cascade');
            $table->foreignId('discount_type_id')->constrained('discount_types');
            $table->string('description');
            $table->decimal('base_amount', 10, 2); // Amount before discount
            $table->decimal('discount_amount', 10, 2); // Actual discount value
            $table->foreignId('verified_by')->nullable()->constrained('users');
            $table->timestamp('verified_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('assessment_discounts');
    }
};

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
        Schema::create('discount_types', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('code', 20)->unique();
            $table->enum('discount_type', ['percentage', 'fixed_amount']);
            $table->decimal('value', 10, 2); // 20 for 20%, or 5000 for fixed amount
            $table->enum('applies_to', ['tuition_only', 'all_fees', 'miscellaneous_only']);
            $table->boolean('requires_verification')->default(true);
            $table->boolean('is_stackable')->default(false);
            $table->decimal('max_discount_cap', 10, 2)->nullable(); // Maximum discount allowed
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('discount_types');
    }
};

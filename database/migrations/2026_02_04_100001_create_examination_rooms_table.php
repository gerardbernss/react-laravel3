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
        Schema::create('examination_rooms', function (Blueprint $table) {
            $table->id();
            $table->string('name'); // e.g., "Room 101", "Auditorium A"
            $table->string('building')->nullable(); // e.g., "Main Building", "Science Hall"
            $table->integer('capacity')->default(30); // Maximum number of examinees
            $table->string('floor')->nullable(); // e.g., "1st Floor", "Ground Floor"
            $table->text('description')->nullable();
            $table->text('facilities')->nullable(); // e.g., "Air-conditioned, Projector"
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('examination_rooms');
    }
};

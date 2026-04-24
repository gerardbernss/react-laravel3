<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('programs')) {
            return;
        }

        Schema::create('programs', function (Blueprint $table) {
            $table->id();
            $table->string('code', 20)->unique();
            $table->string('description', 255);
            $table->enum('school', ['Laboratory Elementary School', 'Junior High School', 'Senior High School']);
            $table->boolean('vocational')->default(false);
            $table->boolean('is_active')->default(true);
            $table->integer('max_load')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('programs');
    }
};

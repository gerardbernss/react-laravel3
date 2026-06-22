<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('discount_types', function (Blueprint $table) {
            $table->dropColumn('max_discount_cap');
        });
    }

    public function down(): void
    {
        Schema::table('discount_types', function (Blueprint $table) {
            $table->decimal('max_discount_cap', 10, 2)->nullable();
        });
    }
};

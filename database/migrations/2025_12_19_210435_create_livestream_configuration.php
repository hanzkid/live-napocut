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
        Schema::table('live_streams', function (Blueprint $table) {
            $table->integer('resolution_width')->nullable()->after('is_active');
            $table->integer('resolution_height')->nullable()->after('resolution_width');
            $table->integer('bitrate')->nullable()->after('resolution_height');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('live_streams', function (Blueprint $table) {
            $table->dropColumn(['resolution_width', 'resolution_height', 'bitrate']);
        });
    }
};

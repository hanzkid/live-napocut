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
        Schema::create('livestream_messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('livestream_id')->constrained('live_streams')->onDelete('cascade');
            $table->string('user_name');
            $table->text('message');
            $table->timestamp('sent_at');
            $table->timestamps();

            $table->index(['livestream_id', 'sent_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('livestream_messages');
    }
};

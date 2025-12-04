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
        Schema::create('asaas_payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained('orders')->onDelete('cascade');
            $table->string('asaas_payment_id')->unique();
            $table->string('asaas_customer_id')->nullable();
            $table->bigInteger('amount_received')->nullable();
            $table->text('pix_code')->nullable();
            $table->text('qr_code_image')->nullable();
            $table->string('status')->default('PENDING');
            $table->timestamp('payment_date')->nullable();
            $table->timestamp('expiration_date')->nullable();
            $table->string('external_reference')->nullable()->index();
            $table->json('asaas_response')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index('asaas_payment_id');
            $table->index('status');
            $table->index('order_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('asaas_payments');
    }
};


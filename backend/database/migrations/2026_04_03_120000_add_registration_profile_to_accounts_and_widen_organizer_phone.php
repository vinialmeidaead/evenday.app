<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('accounts', static function (Blueprint $table) {
            $table->string('organizer_tax_id_type', 10)->nullable()->after('email');
            $table->string('organizer_tax_id', 14)->nullable()->after('organizer_tax_id_type');
            $table->string('pix_key_type', 20)->nullable()->after('organizer_tax_id');
            $table->text('pix_key_value')->nullable()->after('pix_key_type');
            $table->timestamp('registration_declaration_accepted_at')->nullable()->after('pix_key_value');
        });
    }

    public function down(): void
    {
        Schema::table('accounts', static function (Blueprint $table) {
            $table->dropColumn([
                'organizer_tax_id_type',
                'organizer_tax_id',
                'pix_key_type',
                'pix_key_value',
                'registration_declaration_accepted_at',
            ]);
        });
    }
};

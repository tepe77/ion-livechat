<?php

namespace Database\Seeders;

use App\Models\Setting;
use Illuminate\Database\Seeder;

class SettingSeeder extends Seeder
{
    public function run(): void
    {
        $settings = [
            'hotline_number' => '1500-ION',
            'whatsapp_number' => '6281234567890',
            'whatsapp_template' => 'Halo Tim ION Broadband, saya ingin melaporkan kendala koneksi internet pada nomor pelanggan saya.',
            'operational_hours' => 'Senin - Minggu, 08:00 - 22:00 WIB',
            'livechat_enabled' => '1',
        ];

        foreach ($settings as $key => $value) {
            Setting::firstOrCreate(
                ['key' => $key],
                ['value' => $value]
            );
        }
    }
}

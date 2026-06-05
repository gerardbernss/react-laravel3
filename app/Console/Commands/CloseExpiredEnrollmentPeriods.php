<?php

namespace App\Console\Commands;

use App\Models\EnrollmentPeriod;
use Illuminate\Console\Command;

class CloseExpiredEnrollmentPeriods extends Command
{
    protected $signature   = 'enrollment:close-expired';
    protected $description = 'Close enrollment periods whose close_date has passed';

    public function handle(): void
    {
        $count = EnrollmentPeriod::where('is_open', true)
            ->whereNotNull('close_date')
            ->whereDate('close_date', '<', today())
            ->update([
                'is_open'   => false,
                'closed_at' => now(),
            ]);

        $this->info("Closed {$count} expired enrollment period(s).");
    }
}

<?php

namespace App\Console\Commands;

use App\Events\DiscountCodesUpdated;
use App\Models\DiscountCode;
use Illuminate\Console\Command;

class BroadcastDiscountCodes extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'discount-codes:broadcast';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Broadcast currently valid discount codes';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        // Fetch discount codes valid within next 24 hours
        $now = now();
        $twentyFourHoursLater = $now->copy()->addHours(24);

        $discountCodes = DiscountCode::where(function ($query) use ($twentyFourHoursLater) {
            // Codes that start within 24 hours (or have no start date, or already started)
            $query->where(function ($q) use ($twentyFourHoursLater) {
                $q->whereNull('valid_start_date')
                    ->orWhere('valid_start_date', '<=', $twentyFourHoursLater);
            });
        })
            ->where(function ($query) use ($now) {
                // Codes that haven't expired yet (or have no end date)
                $query->whereNull('valid_end_date')
                    ->orWhere('valid_end_date', '>=', $now);
            })
            ->get()
            ->map(function ($code) {
                return [
                    'code' => $code->discount_code,
                    'description' => $code->description,
                    'valid_start_date' => $code->valid_start_date?->toIso8601String(),
                    'valid_end_date' => $code->valid_end_date?->toIso8601String(),
                ];
            })
            ->toArray();

        // Filter to only currently valid codes
        $validCodes = array_filter($discountCodes, function ($code) use ($now) {
            $startDate = $code['valid_start_date'] ? new \DateTime($code['valid_start_date']) : null;
            $endDate = $code['valid_end_date'] ? new \DateTime($code['valid_end_date']) : null;

            // If no dates, always valid
            if (! $startDate && ! $endDate) {
                return true;
            }

            // Check if code has started
            if ($startDate && $now < $startDate) {
                return false;
            }

            // Check if code has expired
            if ($endDate && $now > $endDate) {
                return false;
            }

            return true;
        });

        $validCodesArray = array_values($validCodes);

        // Broadcast the event
        event(new DiscountCodesUpdated($validCodesArray));

        $this->info('Broadcasted '.count($validCodesArray).' valid discount codes');

        return Command::SUCCESS;
    }
}

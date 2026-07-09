<?php

namespace App\Services\Admin;

use App\Models\Fee;
use App\Repositories\FeeRepository;
use Illuminate\Support\Facades\DB;

class FeeService
{
    public function __construct(private FeeRepository $feeRepository)
    {
    }

    /**
     * Creates a new fee, but only if the fee code is not already used for the same school year, semester, and school level.
     * Returns null if a duplicate is detected.
     */
    public function create(array $data): ?Fee
    {
        if ($this->feeRepository->codeExistsForPeriod($data['code'], $data['school_year'], $data['semester'], $data['school_level'])) {
            return null;
        }

        return $this->feeRepository->create($data);
    }

    /**
     * Updates a fee, skipping the duplicate check against the fee's own record.
     * Returns false if another fee already uses the same code for the same period and level.
     */
    public function update(Fee $fee, array $data): bool
    {
        if ($this->feeRepository->codeExistsForPeriod($data['code'], $data['school_year'], $data['semester'], $data['school_level'], $fee->id)) {
            return false;
        }

        $this->feeRepository->update($fee, $data);

        return true;
    }

    /**
     * Deletes a fee, but blocks deletion if it has already been applied to any assessment line items.
     * Returns false if blocked, true on success.
     */
    public function delete(Fee $fee): bool
    {
        if ($this->feeRepository->hasLineItems($fee)) {
            return false;
        }

        $this->feeRepository->delete($fee);

        return true;
    }

    /**
     * Flips a fee between active and inactive.
     */
    public function toggleStatus(Fee $fee): void
    {
        $this->feeRepository->update($fee, ['is_active' => ! $fee->is_active]);
    }

    /**
     * Copies all fees from one school year to another, optionally adjusting amounts by a percentage.
     * Skips any fee whose code already exists in the target year to avoid duplicates.
     * Returns the number of fees copied, or false if no source fees were found.
     *
     * @param  float|null  $adjustPercentage  e.g. 10 increases all amounts by 10%, -5 decreases by 5%
     */
    public function copyFromYear(string $sourceYear, string $targetYear, ?float $adjustPercentage): int|false
    {
        $sourceFees = $this->feeRepository->forSchoolYear($sourceYear);

        if ($sourceFees->isEmpty()) {
            return false;
        }

        $multiplier = 1 + (($adjustPercentage ?? 0) / 100);

        return DB::transaction(function () use ($sourceFees, $targetYear, $multiplier) {
            $copied = 0;

            foreach ($sourceFees as $fee) {
                if ($this->feeRepository->codeExistsForPeriod($fee->code, $targetYear, $fee->semester, $fee->school_level)) {
                    continue;
                }

                $this->feeRepository->create([
                    'name' => $fee->name,
                    'code' => $fee->code,
                    'category' => $fee->category,
                    'is_per_unit' => $fee->is_per_unit,
                    'is_required' => $fee->is_required,
                    'school_level' => $fee->school_level,
                    'school_year' => $targetYear,
                    'semester' => $fee->semester,
                    'amount' => round($fee->amount * $multiplier, 2),
                    'description' => $fee->description,
                    'is_active' => true,
                ]);
                $copied++;
            }

            return $copied;
        });
    }
}

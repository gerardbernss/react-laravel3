<?php

namespace App\Repositories;

use App\Models\DiscountType;
use Illuminate\Database\Eloquent\Collection;

class DiscountTypeRepository
{
    /**
     * Returns all discount types sorted alphabetically by name.
     */
    public function allOrderedByName(): Collection
    {
        return DiscountType::orderBy('name')->get();
    }

    /**
     * Returns all discount types that are currently active.
     */
    public function allActive(): Collection
    {
        return DiscountType::where('is_active', true)->get();
    }

    /**
     * Creates and returns a new discount type record.
     */
    public function create(array $data): DiscountType
    {
        return DiscountType::create($data);
    }

    /**
     * Updates the given discount type with the supplied data.
     */
    public function update(DiscountType $discountType, array $data): void
    {
        $discountType->update($data);
    }

    /**
     * Returns true if this discount type has been applied to at least one assessment — used to prevent deletion of in-use discounts.
     */
    public function hasAssessmentDiscounts(DiscountType $discountType): bool
    {
        return $discountType->assessmentDiscounts()->exists();
    }

    /**
     * Deletes the given discount type record.
     */
    public function delete(DiscountType $discountType): void
    {
        $discountType->delete();
    }

    /**
     * Finds an active discount type by its code (e.g. "SIBLING"), or returns null if not found or inactive.
     */
    public function findActiveByCode(string $code): ?DiscountType
    {
        return DiscountType::where('code', $code)->where('is_active', true)->first();
    }

    /**
     * Returns active discount types excluding the given IDs — used to show discounts not yet applied to an assessment.
     */
    public function activeExcluding(array $excludeIds): Collection
    {
        return DiscountType::where('is_active', true)->whereNotIn('id', $excludeIds)->get();
    }

    /**
     * Returns active discount types whose IDs are in the given list — used to validate selected discounts before applying them.
     */
    public function activeByIds(array $ids): Collection
    {
        return DiscountType::whereIn('id', $ids)->where('is_active', true)->get();
    }

    /**
     * Counts how many of the given discount IDs are non-stackable — used to enforce the rule that only one non-stackable discount may be applied at a time.
     */
    public function nonStackableCount(array $ids): int
    {
        return DiscountType::whereIn('id', $ids)->where('is_stackable', false)->count();
    }
}

<?php

namespace App\Repositories;

use App\Models\DiscountType;
use Illuminate\Database\Eloquent\Collection;

class DiscountTypeRepository
{
    public function allOrderedByName(): Collection
    {
        return DiscountType::orderBy('name')->get();
    }

    public function allActive(): Collection
    {
        return DiscountType::where('is_active', true)->get();
    }

    public function create(array $data): DiscountType
    {
        return DiscountType::create($data);
    }

    public function update(DiscountType $discountType, array $data): void
    {
        $discountType->update($data);
    }

    public function hasAssessmentDiscounts(DiscountType $discountType): bool
    {
        return $discountType->assessmentDiscounts()->exists();
    }

    public function delete(DiscountType $discountType): void
    {
        $discountType->delete();
    }

    public function findActiveByCode(string $code): ?DiscountType
    {
        return DiscountType::where('code', $code)->where('is_active', true)->first();
    }

    public function activeExcluding(array $excludeIds): Collection
    {
        return DiscountType::where('is_active', true)->whereNotIn('id', $excludeIds)->get();
    }

    public function activeByIds(array $ids): Collection
    {
        return DiscountType::whereIn('id', $ids)->where('is_active', true)->get();
    }

    public function nonStackableCount(array $ids): int
    {
        return DiscountType::whereIn('id', $ids)->where('is_stackable', false)->count();
    }
}

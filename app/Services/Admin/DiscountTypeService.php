<?php

namespace App\Services\Admin;

use App\Models\DiscountType;
use App\Repositories\DiscountTypeRepository;

class DiscountTypeService
{
    public function __construct(private DiscountTypeRepository $discountTypeRepository)
    {
    }

    public function indexData(): array
    {
        return [
            'discountTypes' => $this->discountTypeRepository->allOrderedByName(),
            'discountTypeOptions' => DiscountType::$discountTypes,
            'appliesToOptions' => DiscountType::$appliesTo,
        ];
    }

    public function formOptions(): array
    {
        return [
            'discountTypeOptions' => DiscountType::$discountTypes,
            'appliesToOptions' => DiscountType::$appliesTo,
        ];
    }

    public function showData(DiscountType $discountType): array
    {
        return array_merge(['discountType' => $discountType], $this->formOptions());
    }

    public function store(array $data): array
    {
        if ($error = $this->percentageError($data)) {
            return $error;
        }

        $this->discountTypeRepository->create($data);

        return [];
    }

    public function update(DiscountType $discountType, array $data): array
    {
        if ($error = $this->percentageError($data)) {
            return $error;
        }

        $this->discountTypeRepository->update($discountType, $data);

        return [];
    }

    public function destroy(DiscountType $discountType): array
    {
        if ($this->discountTypeRepository->hasAssessmentDiscounts($discountType)) {
            return ['error' => 'Cannot delete discount type that has been used in assessments.'];
        }

        $this->discountTypeRepository->delete($discountType);

        return [];
    }

    public function toggleStatus(DiscountType $discountType): void
    {
        $this->discountTypeRepository->update($discountType, ['is_active' => ! $discountType->is_active]);
    }

    private function percentageError(array $data): ?array
    {
        if ($data['discount_type'] === 'percentage' && $data['value'] > 100) {
            return ['error_field' => 'value', 'error_message' => 'Percentage discount cannot exceed 100%.'];
        }

        return null;
    }
}

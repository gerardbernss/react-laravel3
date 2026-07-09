<?php

namespace App\Services\Admin;

use App\Models\DiscountType;
use App\Repositories\DiscountTypeRepository;

class DiscountTypeService
{
    public function __construct(private DiscountTypeRepository $discountTypeRepository)
    {
    }

    /**
     * Returns all discount types and the option lists needed to render the index page.
     */
    public function indexData(): array
    {
        return [
            'discountTypes' => $this->discountTypeRepository->allOrderedByName(),
            'discountTypeOptions' => DiscountType::$discountTypes,
            'appliesToOptions' => DiscountType::$appliesTo,
        ];
    }

    /**
     * Returns the dropdown option lists shared by the create and edit forms.
     */
    public function formOptions(): array
    {
        return [
            'discountTypeOptions' => DiscountType::$discountTypes,
            'appliesToOptions' => DiscountType::$appliesTo,
        ];
    }

    /**
     * Returns a single discount type together with the form option lists, for the detail/edit page.
     */
    public function showData(DiscountType $discountType): array
    {
        return array_merge(['discountType' => $discountType], $this->formOptions());
    }

    /**
     * Creates a new discount type after validating the percentage value.
     * Returns an error array if validation fails, or an empty array on success.
     */
    public function store(array $data): array
    {
        if ($error = $this->percentageError($data)) {
            return $error;
        }

        $this->discountTypeRepository->create($data);

        return [];
    }

    /**
     * Updates a discount type after validating the percentage value.
     * Returns an error array if validation fails, or an empty array on success.
     */
    public function update(DiscountType $discountType, array $data): array
    {
        if ($error = $this->percentageError($data)) {
            return $error;
        }

        $this->discountTypeRepository->update($discountType, $data);

        return [];
    }

    /**
     * Deletes a discount type, but blocks deletion if it has already been applied to any assessment.
     * Returns an error array if blocked, or an empty array on success.
     */
    public function destroy(DiscountType $discountType): array
    {
        if ($this->discountTypeRepository->hasAssessmentDiscounts($discountType)) {
            return ['error' => 'Cannot delete discount type that has been used in assessments.'];
        }

        $this->discountTypeRepository->delete($discountType);

        return [];
    }

    /**
     * Flips a discount type between active and inactive.
     */
    public function toggleStatus(DiscountType $discountType): void
    {
        $this->discountTypeRepository->update($discountType, ['is_active' => ! $discountType->is_active]);
    }

    /**
     * Returns an error array if a percentage-type discount has a value above 100, otherwise null.
     */
    private function percentageError(array $data): ?array
    {
        if ($data['discount_type'] === 'percentage' && $data['value'] > 100) {
            return ['error_field' => 'value', 'error_message' => 'Percentage discount cannot exceed 100%.'];
        }

        return null;
    }
}

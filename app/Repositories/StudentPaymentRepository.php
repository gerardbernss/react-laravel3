<?php

namespace App\Repositories;

use App\Models\StudentPayment;

class StudentPaymentRepository
{
    /**
     * Creates and returns a new student payment record.
     */
    public function create(array $data): StudentPayment
    {
        return StudentPayment::create($data);
    }

    /**
     * Updates the given payment record with the supplied data.
     */
    public function update(StudentPayment $payment, array $data): void
    {
        $payment->update($data);
    }

    /**
     * Deletes the given payment record.
     */
    public function delete(StudentPayment $payment): void
    {
        $payment->delete();
    }
}

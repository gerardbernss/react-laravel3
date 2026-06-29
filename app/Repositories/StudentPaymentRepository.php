<?php

namespace App\Repositories;

use App\Models\StudentPayment;

class StudentPaymentRepository
{
    public function create(array $data): StudentPayment
    {
        return StudentPayment::create($data);
    }

    public function update(StudentPayment $payment, array $data): void
    {
        $payment->update($data);
    }

    public function delete(StudentPayment $payment): void
    {
        $payment->delete();
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DiscountCode extends Model
{
    protected $fillable = [
        'discount_code',
        'description',
        'valid_start_date',
        'valid_end_date',
    ];

    protected $casts = [
        'valid_start_date' => 'datetime',
        'valid_end_date' => 'datetime',
    ];

    /**
     * Check if the discount code is currently valid
     */
    public function isValid(): bool
    {
        $now = now();
        
        if ($this->valid_start_date && $now->lt($this->valid_start_date)) {
            return false;
        }
        
        if ($this->valid_end_date && $now->gt($this->valid_end_date)) {
            return false;
        }
        
        return true;
    }
}

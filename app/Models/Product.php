<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    protected $fillable = [
        'name',
        'description',
        'price',
        'link',
    ];

    protected $casts = [
        'price' => 'decimal:2',
    ];

    public function images()
    {
        return $this->hasMany(ProductImage::class)->orderBy('order');
    }

    public function livestreams()
    {
        return $this->belongsToMany(LiveStream::class, 'livestream_product');
    }
}

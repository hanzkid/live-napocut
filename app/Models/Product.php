<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Number;

class Product extends Model
{
    protected $fillable = [
        'name',
        'description',
        'price',
        'link',
        'category_id',
    ];

    protected $casts = [
        'price' => 'decimal:2',
    ];

    protected $appends = [
        'formatted_price',
        'plain_price',
    ];

    protected function formattedPrice(): Attribute
    {
        return Attribute::make(
            get: fn() => Number::currency($this->price, 'IDR', 'id'),
        );
    }

    protected function plainPrice(): Attribute
    {
        return Attribute::make(
            get: fn(): string => "Rp. " . number_format((float) $this->price, 0, ',', '.'),
        );
    }

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function images()
    {
        return $this->hasMany(ProductImage::class)->orderBy('order');
    }

    public function livestreams()
    {
        return $this->belongsToMany(LiveStream::class, 'livestream_product');
    }
}

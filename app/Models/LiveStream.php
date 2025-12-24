<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Casts\Attribute;


class LiveStream extends Model
{
    protected $fillable = [
        'title',
        'ws_url',
        'stream_key',
        'ingress_id',
        'egress_id',
        's3_path',
        'is_active',
        'started_at',
        'ended_at',
        'resolution_width',
        'resolution_height',
        'bitrate',
    ];

    public function products()
    {
        return $this->belongsToMany(Product::class, 'livestream_product');
    }

    protected function cleanTitle(): Attribute
    {
        return Attribute::make(
            get: fn () => preg_replace('/[^a-zA-Z0-9]/', '', $this->title),
        );
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LiveStream extends Model
{
    protected $fillable = [
        'title',
        'ws_url',
        'stream_key',
        'ingress_id',
        's3_path',
        'is_active',
        'started_at',
        'ended_at',
    ];

    public function products()
    {
        return $this->belongsToMany(Product::class, 'livestream_product');
    }
}

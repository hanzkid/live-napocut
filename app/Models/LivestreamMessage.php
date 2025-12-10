<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LivestreamMessage extends Model
{
    use HasFactory;

    protected $fillable = [
        'livestream_id',
        'user_name',
        'message',
        'sent_at',
    ];

    protected $casts = [
        'sent_at' => 'datetime',
    ];

    public function livestream()
    {
        return $this->belongsTo(LiveStream::class);
    }
}

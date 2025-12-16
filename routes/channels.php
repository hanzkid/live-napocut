<?php

use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

// Public channel for discount codes
Broadcast::channel('discount-codes', function () {
    return true;
});

// Public channel for products
Broadcast::channel('products', function () {
    return true;
});

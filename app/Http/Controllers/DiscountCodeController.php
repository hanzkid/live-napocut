<?php

namespace App\Http\Controllers;

use App\Models\DiscountCode;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Inertia\Inertia;
use Inertia\Response;

class DiscountCodeController extends Controller
{
    public function index(): Response
    {
        $discountCodes = DiscountCode::latest()
            ->get()
            ->map(function ($code) {
                return [
                    'id' => $code->id,
                    'discount_code' => $code->discount_code,
                    'description' => $code->description,
                    // Return ISO 8601 format with timezone to ensure correct parsing in JavaScript
                    'valid_start_date' => $code->valid_start_date?->toAtomString(),
                    'valid_end_date' => $code->valid_end_date?->toAtomString(),
                    'is_valid' => $code->isValid(),
                    'created_at' => $code->created_at,
                ];
            });

        return Inertia::render('discount-codes/index', [
            'discountCodes' => $discountCodes,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'discount_code' => ['required', 'string', 'max:255', 'unique:discount_codes,discount_code'],
            'description' => ['nullable', 'string'],
            'valid_start_date' => ['nullable', 'date'],
            'valid_end_date' => ['nullable', 'date', 'after_or_equal:valid_start_date'],
        ]);

        DiscountCode::create($validated);

        // Broadcast updated discount codes immediately
        Artisan::call('discount-codes:broadcast');

        return redirect()
            ->route('discount-codes.index')
            ->with('success', 'Discount code created successfully.');
    }

    public function update(Request $request, DiscountCode $discountCode): RedirectResponse
    {
        $validated = $request->validate([
            'discount_code' => ['required', 'string', 'max:255', 'unique:discount_codes,discount_code,'.$discountCode->id],
            'description' => ['nullable', 'string'],
            'valid_start_date' => ['nullable', 'date'],
            'valid_end_date' => ['nullable', 'date', 'after_or_equal:valid_start_date'],
        ]);

        $discountCode->update($validated);

        // Broadcast updated discount codes immediately
        Artisan::call('discount-codes:broadcast');

        return redirect()
            ->route('discount-codes.index')
            ->with('success', 'Discount code updated successfully.');
    }

    public function destroy(DiscountCode $discountCode): RedirectResponse
    {
        $discountCode->delete();

        // Broadcast updated discount codes immediately
        Artisan::call('discount-codes:broadcast');

        return redirect()
            ->route('discount-codes.index')
            ->with('success', 'Discount code deleted successfully.');
    }
}

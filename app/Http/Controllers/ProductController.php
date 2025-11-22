<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\ProductImage;
use App\Services\ProductImportService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class ProductController extends Controller
{
    public function index(): Response
    {
        $products = Product::with('images')
            ->latest()
            ->get()
            ->map(function ($product) {
                return [
                    'id' => $product->id,
                    'name' => $product->name,
                    'description' => $product->description,
                    'price' => $product->price,
                    'link' => $product->link,
                    'images' => $product->images->map(fn($img) => [
                        'id' => $img->id,
                        'url' => $img->url,
                        'order' => $img->order,
                    ]),
                    'created_at' => $product->created_at,
                ];
            });

        return Inertia::render('products/index', [
            'products' => $products,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'price' => ['required', 'numeric', 'min:0'],
            'link' => ['nullable', 'url', 'max:255'],
            'images' => ['nullable', 'array'],
            'images.*' => ['image', 'max:5120'], // 5MB max
        ]);

        $product = Product::create([
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
            'price' => $validated['price'],
            'link' => $validated['link'] ?? null,
        ]);

        // Handle image uploads
        if ($request->hasFile('images')) {
            foreach ($request->file('images') as $index => $image) {
                $path = $image->store('products', 's3');
                $url = config('livekit.s3_public_url') . '/' . $path;

                ProductImage::create([
                    'product_id' => $product->id,
                    'path' => $path,
                    'url' => $url,
                    'order' => $index,
                ]);
            }
        }

        return redirect()
            ->route('products.index')
            ->with('success', 'Product created successfully.');
    }

    public function update(Request $request, Product $product): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'price' => ['required', 'numeric', 'min:0'],
            'link' => ['nullable', 'url', 'max:255'],
            'images' => ['nullable', 'array'],
            'images.*' => ['image', 'max:5120'], // 5MB max
        ]);

        $product->update([
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
            'price' => $validated['price'],
            'link' => $validated['link'] ?? null,
        ]);

        // Handle new image uploads
        if ($request->hasFile('images')) {
            $currentMaxOrder = $product->images()->max('order') ?? -1;

            foreach ($request->file('images') as $index => $image) {
                $path = $image->store('products', 's3');
                $url = config('livekit.s3_public_url') . '/' . $path;

                ProductImage::create([
                    'product_id' => $product->id,
                    'path' => $path,
                    'url' => $url,
                    'order' => $currentMaxOrder + $index + 1,
                ]);
            }
        }

        return redirect()
            ->route('products.index')
            ->with('success', 'Product updated successfully.');
    }

    public function destroy(Product $product): RedirectResponse
    {
        // Delete all images from S3 (only if they have a path)
        foreach ($product->images as $image) {
            if ($image->path) {
                Storage::disk('s3')->delete($image->path);
            }
        }

        $product->delete();

        return redirect()
            ->route('products.index')
            ->with('success', 'Product deleted successfully.');
    }

    public function importFromUrl(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'url' => ['required', 'url', 'max:500'],
        ]);

        try {
            $importService = new ProductImportService();
            $productData = $importService->importFromUrl($validated['url']);

            // Create the product
            $product = Product::create([
                'name' => $productData['name'],
                'description' => $productData['description'],
                'price' => $productData['price'],
                'link' => $productData['link'],
            ]);

            // Create product images with external URLs
            foreach ($productData['images'] as $index => $imageUrl) {
                ProductImage::create([
                    'product_id' => $product->id,
                    'path' => null, // No S3 path for external images
                    'url' => $imageUrl,
                    'order' => $index,
                ]);
            }

            return redirect()
                ->route('products.index')
                ->with('success', 'Product imported successfully from URL.');
        } catch (\Exception $e) {
            return redirect()
                ->route('products.index')
                ->with('error', 'Failed to import product: ' . $e->getMessage());
        }
    }

    public function deleteImage(ProductImage $image): RedirectResponse
    {
        // Delete from S3 only if path exists
        if ($image->path) {
            Storage::disk('s3')->delete($image->path);
        }

        $image->delete();

        return back()->with('success', 'Image deleted successfully.');
    }
}

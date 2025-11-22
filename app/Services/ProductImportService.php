<?php

namespace App\Services;

use DOMDocument;
use DOMXPath;
use Exception;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ProductImportService
{
    /**
     * Import product data from a URL by scraping JSON-LD structured data
     *
     * @param string $url The URL to scrape
     * @return array The parsed product data
     * @throws Exception If scraping fails or data is invalid
     */
    public function importFromUrl(string $url): array
    {
        // Fetch the HTML content
        $html = $this->fetchHtml($url);

        // Extract JSON-LD data
        $jsonLdData = $this->extractJsonLd($html);

        // Parse and validate product data
        $productData = $this->parseProductData($jsonLdData, $url);

        return $productData;
    }

    /**
     * Fetch HTML content from URL
     *
     * @param string $url
     * @return string
     * @throws Exception
     */
    private function fetchHtml(string $url): string
    {
        try {
            $response = Http::timeout(30)->get($url);

            if (!$response->successful()) {
                throw new Exception("Failed to fetch URL. HTTP status: {$response->status()}");
            }

            return $response->body();
        } catch (\Illuminate\Http\Client\ConnectionException $e) {
            throw new Exception("Connection error: Unable to reach the URL");
        } catch (Exception $e) {
            Log::error("Error fetching URL: {$url}", ['error' => $e->getMessage()]);
            throw new Exception("Failed to fetch URL: {$e->getMessage()}");
        }
    }

    /**
     * Extract JSON-LD structured data from HTML
     *
     * @param string $html
     * @return array
     * @throws Exception
     */
    private function extractJsonLd(string $html): array
    {
        // Suppress warnings from DOMDocument
        libxml_use_internal_errors(true);

        $dom = new DOMDocument();
        $dom->loadHTML($html);

        libxml_clear_errors();

        $xpath = new DOMXPath($dom);
        $scripts = $xpath->query('//script[@type="application/ld+json"]');

        if ($scripts->length === 0) {
            throw new Exception("No JSON-LD structured data found on the page");
        }

        // Try to find Product schema
        foreach ($scripts as $script) {
            $jsonData = json_decode($script->textContent, true);

            if (json_last_error() !== JSON_ERROR_NONE) {
                continue;
            }

            // Check if it's a Product schema
            if (isset($jsonData['@type']) && $jsonData['@type'] === 'Product') {
                return $jsonData;
            }
        }

        throw new Exception("No Product schema found in JSON-LD data");
    }

    /**
     * Parse and validate product data from JSON-LD
     *
     * @param array $jsonLdData
     * @param string $sourceUrl
     * @return array
     * @throws Exception
     */
    private function parseProductData(array $jsonLdData, string $sourceUrl): array
    {
        // Extract name
        if (!isset($jsonLdData['name']) || empty($jsonLdData['name'])) {
            throw new Exception("Product name not found in structured data");
        }

        // Extract description
        $description = $jsonLdData['description'] ?? '';

        // Extract price from offers
        $price = $this->extractPrice($jsonLdData);

        // Extract images
        $images = $this->extractImages($jsonLdData);

        if (empty($images)) {
            throw new Exception("No product images found");
        }

        return [
            'name' => $this->cleanText($jsonLdData['name']),
            'description' => $this->cleanText($description),
            'price' => $price,
            'link' => $sourceUrl,
            'images' => $images,
        ];
    }

    /**
     * Clean HTML entities and tags from text
     *
     * @param string $text
     * @return string
     */
    private function cleanText(string $text): string
    {
        // Decode HTML entities (&nbsp;, &amp;, etc.)
        $text = html_entity_decode($text, ENT_QUOTES | ENT_HTML5, 'UTF-8');

        // Remove HTML tags
        $text = strip_tags($text);

        // Replace multiple spaces with single space
        $text = preg_replace('/\s+/', ' ', $text);

        // Trim whitespace
        return trim($text);
    }

    /**
     * Extract price from offers data
     *
     * @param array $jsonLdData
     * @return float
     * @throws Exception
     */
    private function extractPrice(array $jsonLdData): float
    {
        if (!isset($jsonLdData['offers'])) {
            throw new Exception("No price information found");
        }

        $offers = $jsonLdData['offers'];

        // Handle array of offers
        if (is_array($offers) && !isset($offers['price'])) {
            $offers = $offers[0] ?? [];
        }

        $price = $offers['price'] ?? $offers['lowPrice'] ?? null;

        if ($price === null) {
            throw new Exception("Price not found in offers data");
        }

        // Convert to float and keep original currency
        return (float) $price;
    }

    /**
     * Extract image URLs from product data
     *
     * @param array $jsonLdData
     * @return array
     */
    private function extractImages(array $jsonLdData): array
    {
        $images = [];

        if (isset($jsonLdData['image'])) {
            $imageData = $jsonLdData['image'];

            // Handle single image (string)
            if (is_string($imageData)) {
                $images[] = $imageData;
            }
            // Handle array of images
            elseif (is_array($imageData)) {
                foreach ($imageData as $image) {
                    if (is_string($image)) {
                        $images[] = $image;
                    } elseif (is_array($image) && isset($image['url'])) {
                        $images[] = $image['url'];
                    }
                }
            }
        }

        return array_values(array_filter($images));
    }
}

package com.check24.app.utils

/**
 * ImageUtils - Convert relative image paths to absolute URLs
 *
 * The API returns relative paths like "assets/images/companies/devk.svg"
 * This utility converts them to full URLs pointing to the Core Service
 */
object ImageUtils {

    // Change this to match your ApiService baseUrl
    // For emulator: http://10.0.2.2:8000
    // For real device: http://YOUR_LOCAL_IP:8000
    private const val BASE_URL = "http://10.0.2.2:8000"

    /**
     * Convert a relative image path to an absolute URL
     *
     * @param imagePath The relative path from the API (e.g., "assets/images/companies/devk.svg")
     * @return Full URL or null if path is invalid
     *
     * Examples:
     * - "assets/images/companies/devk.svg" -> "http://10.0.2.2:8000/assets/images/companies/devk.svg"
     * - "https://example.com/image.jpg" -> "https://example.com/image.jpg" (already absolute)
     * - null -> null
     */
    fun getImageUrl(imagePath: String?): String? {
        if (imagePath.isNullOrBlank()) {
            return null
        }

        // If it's already an absolute URL (starts with http:// or https://), return as-is
        if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
            return imagePath
        }

        // Convert relative path to absolute URL
        // Remove leading slash if present to avoid double slashes
        val cleanPath = imagePath.trimStart('/')

        return "$BASE_URL/$cleanPath"
    }

    /**
     * Alternative: Extract filename and build URL
     * Use this if you want to reorganize how images are stored
     */
    fun getImageUrlByFilename(imagePath: String?, imageType: String = "companies"): String? {
        if (imagePath.isNullOrBlank()) {
            return null
        }

        // Extract just the filename
        val filename = imagePath.split('/').lastOrNull() ?: return null

        // Build URL based on image type
        return "$BASE_URL/assets/images/$imageType/$filename"
    }
}
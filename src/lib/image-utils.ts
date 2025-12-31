/**
 * Utility functions for handling image URLs
 */

/**
 * Get the full URL for an image
 * Handles both local uploads (/uploads/products/...) and external URLs (http://...)
 * In development, uses Vite proxy to avoid CORS issues
 */
export function getImageUrl(imageUrl?: string | null): string | undefined {
  if (!imageUrl) return undefined;
  
  // If it's already a full URL (http/https), return as is
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }
  
  // In development, use Vite proxy (relative path)
  // This avoids CORS issues by proxying through Vite dev server
  if (import.meta.env.DEV) {
    // Ensure imageUrl starts with /
    const imagePath = imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`;
    return imagePath;
  }
  
  // In production, construct full URL
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
  
  // Handle different base URL formats
  let baseWithoutApi: string;
  if (baseUrl.includes('/api')) {
    baseWithoutApi = baseUrl.replace('/api', '');
  } else {
    // If no /api, assume it's already the base URL
    baseWithoutApi = baseUrl;
  }
  
  // Remove trailing slash from base
  baseWithoutApi = baseWithoutApi.replace(/\/$/, '');
  
  // Ensure imageUrl starts with /
  const imagePath = imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`;
  
  const fullUrl = `${baseWithoutApi}${imagePath}`;
  
  return fullUrl;
}


/**
 * Helper functions for Supabase Storage URLs
 * Centralized way to manage asset URLs from Supabase Storage
 */

const SUPABASE_URL = 'https://vulusxqgknaejdxnhiex.supabase.co';
const STORAGE_URL = `${SUPABASE_URL}/storage/v1/object/public`;

/**
 * Get the full URL for an asset in Supabase Storage
 * @param bucket - The storage bucket name
 * @param path - The file path within the bucket
 * @returns The full public URL for the asset
 */
export function getStorageUrl(bucket: string, path: string): string {
  return `${STORAGE_URL}/${bucket}/${path}`;
}

/**
 * Get logo URLs - predefined logo paths
 */
export const LOGOS = {
  navbar: getStorageUrl('assets', 'logos/logo-navbar.svg'),
  home: getStorageUrl('assets', 'logos/logo-home.svg'),
} as const;

/**
 * Get other common asset URLs
 */
export const ASSETS = {
  placeholder: getStorageUrl('assets', 'placeholders/placeholder.svg'),
  placeholderUser: getStorageUrl('assets', 'placeholders/placeholder-user.jpg'),
} as const; 
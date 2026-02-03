import { TMDB_BASE_URL, TMDB_IMAGE_BASE_URL, TMDB_IMAGE_SIZES } from '../../lib/constants';

const API_KEY = process.env.EXPO_PUBLIC_TMDB_API_KEY;
const ACCESS_TOKEN = process.env.EXPO_PUBLIC_TMDB_ACCESS_TOKEN;

class TMDBClient {
  private baseUrl = TMDB_BASE_URL;

  async fetch<T>(endpoint: string, params: Record<string, any> = {}): Promise<T> {
    const url = new URL(`${this.baseUrl}${endpoint}`);

    // Add params to URL
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value));
      }
    });

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`TMDB API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }
}

export const tmdbClient = new TMDBClient();

// Image URL helpers
export function getPosterUrl(
  path: string | null,
  size: keyof typeof TMDB_IMAGE_SIZES.poster = 'large'
): string | null {
  if (!path) return null;
  return `${TMDB_IMAGE_BASE_URL}/${TMDB_IMAGE_SIZES.poster[size]}${path}`;
}

export function getBackdropUrl(
  path: string | null,
  size: keyof typeof TMDB_IMAGE_SIZES.backdrop = 'medium'
): string | null {
  if (!path) return null;
  return `${TMDB_IMAGE_BASE_URL}/${TMDB_IMAGE_SIZES.backdrop[size]}${path}`;
}

export function getProfileUrl(
  path: string | null,
  size: keyof typeof TMDB_IMAGE_SIZES.profile = 'medium'
): string | null {
  if (!path) return null;
  return `${TMDB_IMAGE_BASE_URL}/${TMDB_IMAGE_SIZES.profile[size]}${path}`;
}

import { tmdbClient } from './client';
import {
  TMDBPaginatedResponse,
  TMDBMovie,
  TMDBTVShow,
  TMDBMovieDetails,
  TMDBTVDetails,
  TMDBGenresResponse,
  DiscoverMovieParams,
  DiscoverTVParams,
} from './types';

// ============ Discover ============

export async function discoverMovies(
  params: DiscoverMovieParams = {}
): Promise<TMDBPaginatedResponse<TMDBMovie>> {
  return tmdbClient.fetch<TMDBPaginatedResponse<TMDBMovie>>('/discover/movie', {
    include_adult: false,
    language: 'en-US',
    sort_by: 'popularity.desc',
    'vote_count.gte': 100,
    ...params,
  });
}

export async function discoverTV(
  params: DiscoverTVParams = {}
): Promise<TMDBPaginatedResponse<TMDBTVShow>> {
  return tmdbClient.fetch<TMDBPaginatedResponse<TMDBTVShow>>('/discover/tv', {
    include_adult: false,
    language: 'en-US',
    sort_by: 'popularity.desc',
    'vote_count.gte': 50,
    ...params,
  });
}

// ============ Details ============

export async function getMovieDetails(id: number): Promise<TMDBMovieDetails> {
  return tmdbClient.fetch<TMDBMovieDetails>(`/movie/${id}`, {
    language: 'en-US',
    append_to_response: 'credits,videos,recommendations,watch/providers,keywords',
  });
}

// Get movie keywords separately (lightweight call for ML features)
export async function getMovieKeywords(id: number): Promise<{ keywords: { id: number; name: string }[] }> {
  return tmdbClient.fetch<{ keywords: { id: number; name: string }[] }>(`/movie/${id}/keywords`);
}

export async function getTVDetails(id: number): Promise<TMDBTVDetails> {
  return tmdbClient.fetch<TMDBTVDetails>(`/tv/${id}`, {
    language: 'en-US',
    append_to_response: 'credits,videos,recommendations,watch/providers',
  });
}

// ============ Trending ============

export async function getTrending(
  mediaType: 'movie' | 'tv' | 'all' = 'movie',
  timeWindow: 'day' | 'week' = 'week'
): Promise<TMDBPaginatedResponse<TMDBMovie | TMDBTVShow>> {
  return tmdbClient.fetch<TMDBPaginatedResponse<TMDBMovie | TMDBTVShow>>(
    `/trending/${mediaType}/${timeWindow}`,
    { language: 'en-US' }
  );
}

// ============ Search ============

export async function searchMovies(
  query: string,
  page = 1
): Promise<TMDBPaginatedResponse<TMDBMovie>> {
  return tmdbClient.fetch<TMDBPaginatedResponse<TMDBMovie>>('/search/movie', {
    query,
    page,
    include_adult: false,
    language: 'en-US',
  });
}

export async function searchTV(
  query: string,
  page = 1
): Promise<TMDBPaginatedResponse<TMDBTVShow>> {
  return tmdbClient.fetch<TMDBPaginatedResponse<TMDBTVShow>>('/search/tv', {
    query,
    page,
    include_adult: false,
    language: 'en-US',
  });
}

export async function searchMulti(
  query: string,
  page = 1
): Promise<TMDBPaginatedResponse<TMDBMovie | TMDBTVShow>> {
  return tmdbClient.fetch<TMDBPaginatedResponse<TMDBMovie | TMDBTVShow>>('/search/multi', {
    query,
    page,
    include_adult: false,
    language: 'en-US',
  });
}

// ============ Genres ============

export async function getMovieGenres(): Promise<TMDBGenresResponse> {
  return tmdbClient.fetch<TMDBGenresResponse>('/genre/movie/list', {
    language: 'en-US',
  });
}

export async function getTVGenres(): Promise<TMDBGenresResponse> {
  return tmdbClient.fetch<TMDBGenresResponse>('/genre/tv/list', {
    language: 'en-US',
  });
}

// ============ Popular / Top Rated ============

export async function getPopularMovies(page = 1): Promise<TMDBPaginatedResponse<TMDBMovie>> {
  return tmdbClient.fetch<TMDBPaginatedResponse<TMDBMovie>>('/movie/popular', {
    page,
    language: 'en-US',
  });
}

export async function getTopRatedMovies(page = 1): Promise<TMDBPaginatedResponse<TMDBMovie>> {
  return tmdbClient.fetch<TMDBPaginatedResponse<TMDBMovie>>('/movie/top_rated', {
    page,
    language: 'en-US',
  });
}

export async function getUpcomingMovies(page = 1): Promise<TMDBPaginatedResponse<TMDBMovie>> {
  return tmdbClient.fetch<TMDBPaginatedResponse<TMDBMovie>>('/movie/upcoming', {
    page,
    language: 'en-US',
  });
}

export async function getNowPlayingMovies(page = 1): Promise<TMDBPaginatedResponse<TMDBMovie>> {
  return tmdbClient.fetch<TMDBPaginatedResponse<TMDBMovie>>('/movie/now_playing', {
    page,
    language: 'en-US',
  });
}

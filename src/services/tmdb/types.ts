// Raw TMDB API response types

export interface TMDBPaginatedResponse<T> {
  page: number;
  total_pages: number;
  total_results: number;
  results: T[];
}

export interface TMDBMovie {
  id: number;
  title: string;
  original_title: string;
  poster_path: string | null;
  backdrop_path: string | null;
  overview: string;
  release_date: string;
  vote_average: number;
  vote_count: number;
  genre_ids: number[];
  popularity: number;
  adult: boolean;
  original_language: string;
  video: boolean;
}

export interface TMDBTVShow {
  id: number;
  name: string;
  original_name: string;
  poster_path: string | null;
  backdrop_path: string | null;
  overview: string;
  first_air_date: string;
  vote_average: number;
  vote_count: number;
  genre_ids: number[];
  popularity: number;
  origin_country: string[];
  original_language: string;
}

export interface TMDBMovieDetails extends TMDBMovie {
  budget: number;
  revenue: number;
  runtime: number;
  status: string;
  tagline: string;
  genres: TMDBGenre[];
  production_companies: TMDBProductionCompany[];
  credits?: TMDBCredits;
  videos?: TMDBVideoResults;
  recommendations?: TMDBPaginatedResponse<TMDBMovie>;
  'watch/providers'?: TMDBWatchProviders;
}

export interface TMDBTVDetails extends TMDBTVShow {
  episode_run_time: number[];
  number_of_episodes: number;
  number_of_seasons: number;
  status: string;
  type: string;
  genres: TMDBGenre[];
  networks: TMDBNetwork[];
  created_by: TMDBCreator[];
  credits?: TMDBCredits;
  videos?: TMDBVideoResults;
  recommendations?: TMDBPaginatedResponse<TMDBTVShow>;
  'watch/providers'?: TMDBWatchProviders;
}

export interface TMDBGenre {
  id: number;
  name: string;
}

export interface TMDBProductionCompany {
  id: number;
  name: string;
  logo_path: string | null;
  origin_country: string;
}

export interface TMDBNetwork {
  id: number;
  name: string;
  logo_path: string | null;
}

export interface TMDBCreator {
  id: number;
  name: string;
  profile_path: string | null;
}

export interface TMDBCredits {
  cast: TMDBCastMember[];
  crew: TMDBCrewMember[];
}

export interface TMDBCastMember {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
  order: number;
}

export interface TMDBCrewMember {
  id: number;
  name: string;
  job: string;
  department: string;
  profile_path: string | null;
}

export interface TMDBVideoResults {
  results: TMDBVideo[];
}

export interface TMDBVideo {
  id: string;
  key: string;
  name: string;
  site: string;
  type: string;
  official: boolean;
}

export interface TMDBWatchProviders {
  results: {
    [countryCode: string]: {
      link: string;
      flatrate?: TMDBStreamingProvider[];
      rent?: TMDBStreamingProvider[];
      buy?: TMDBStreamingProvider[];
    };
  };
}

export interface TMDBStreamingProvider {
  provider_id: number;
  provider_name: string;
  logo_path: string;
  display_priority: number;
}

export interface TMDBGenresResponse {
  genres: TMDBGenre[];
}

// Discover params
export interface DiscoverMovieParams {
  page?: number;
  sort_by?: string;
  with_genres?: string;
  'vote_average.gte'?: number;
  'vote_count.gte'?: number;
  'primary_release_date.gte'?: string;
  'primary_release_date.lte'?: string;
  include_adult?: boolean;
}

export interface DiscoverTVParams {
  page?: number;
  sort_by?: string;
  with_genres?: string;
  'vote_average.gte'?: number;
  'vote_count.gte'?: number;
  'first_air_date.gte'?: string;
  'first_air_date.lte'?: string;
}

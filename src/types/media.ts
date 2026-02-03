export interface Media {
  id: number;
  type: 'movie' | 'tv';
  title: string;
  originalTitle?: string;
  posterPath: string | null;
  backdropPath: string | null;
  overview: string;
  releaseDate: string;
  releaseYear: number;
  rating: number;
  voteCount: number;
  genreIds: number[];
  popularity: number;
}

export interface MovieDetails extends Media {
  type: 'movie';
  runtime: number;
  budget: number;
  revenue: number;
  tagline: string;
  status: string;
  genres: Genre[];
  productionCompanies: ProductionCompany[];
  credits: Credits;
  videos: VideoResults;
  watchProviders?: WatchProviders;
  recommendations?: MediaResults;
}

export interface TVDetails extends Media {
  type: 'tv';
  numberOfSeasons: number;
  numberOfEpisodes: number;
  episodeRunTime: number[];
  status: string;
  genres: Genre[];
  networks: Network[];
  createdBy: Creator[];
  credits: Credits;
  videos: VideoResults;
  watchProviders?: WatchProviders;
  recommendations?: MediaResults;
}

export interface Genre {
  id: number;
  name: string;
}

export interface ProductionCompany {
  id: number;
  name: string;
  logoPath: string | null;
  originCountry: string;
}

export interface Network {
  id: number;
  name: string;
  logoPath: string | null;
}

export interface Creator {
  id: number;
  name: string;
  profilePath: string | null;
}

export interface Credits {
  cast: CastMember[];
  crew: CrewMember[];
}

export interface CastMember {
  id: number;
  name: string;
  character: string;
  profilePath: string | null;
  order: number;
}

export interface CrewMember {
  id: number;
  name: string;
  job: string;
  department: string;
  profilePath: string | null;
}

export interface VideoResults {
  results: Video[];
}

export interface Video {
  id: string;
  key: string;
  name: string;
  site: 'YouTube' | 'Vimeo';
  type: 'Trailer' | 'Teaser' | 'Clip' | 'Featurette' | 'Behind the Scenes';
  official: boolean;
}

export interface WatchProviders {
  results: {
    [countryCode: string]: {
      link: string;
      flatrate?: StreamingProvider[];
      rent?: StreamingProvider[];
      buy?: StreamingProvider[];
    };
  };
}

export interface StreamingProvider {
  providerId: number;
  providerName: string;
  logoPath: string;
  displayPriority: number;
}

export interface MediaResults {
  page: number;
  totalPages: number;
  totalResults: number;
  results: Media[];
}

// Swipe-related types
export interface SwipeItem {
  id: string;
  userId: string;
  contentType: 'movie' | 'tv';
  contentId: number;
  direction: SwipeDirection;
  contentSnapshot: {
    title: string;
    posterPath: string;
    releaseYear: number;
    voteAverage: number;
  };
  createdAt: Date;
  sessionContext: 'solo' | 'group';
}

export type SwipeDirection = 'left' | 'right' | 'up';

// Watchlist types
export interface WatchlistItem {
  id: string;
  contentType: 'movie' | 'tv';
  contentId: number;
  title: string;
  posterPath: string;
  releaseYear: number;
  voteAverage: number;
  genres: number[];
  overview: string;
  addedAt: Date;
  addedFrom: 'solo' | 'group';
  groupId?: string;
  watched: boolean;
  watchedAt?: Date;
  userRating?: number;
  notes?: string;
}

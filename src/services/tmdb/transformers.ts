import { TMDBMovie, TMDBTVShow, TMDBMovieDetails, TMDBTVDetails } from './types';
import { Media, MovieDetails, TVDetails, CastMember, CrewMember, Video, StreamingProvider } from '../../types';

// Transform TMDB movie to app Media type
export function transformMovie(movie: TMDBMovie): Media {
  return {
    id: movie.id,
    type: 'movie',
    title: movie.title,
    originalTitle: movie.original_title,
    posterPath: movie.poster_path,
    backdropPath: movie.backdrop_path,
    overview: movie.overview,
    releaseDate: movie.release_date,
    releaseYear: movie.release_date ? new Date(movie.release_date).getFullYear() : 0,
    rating: movie.vote_average,
    voteCount: movie.vote_count,
    genreIds: movie.genre_ids,
    popularity: movie.popularity,
  };
}

// Transform TMDB TV show to app Media type
export function transformTVShow(show: TMDBTVShow): Media {
  return {
    id: show.id,
    type: 'tv',
    title: show.name,
    originalTitle: show.original_name,
    posterPath: show.poster_path,
    backdropPath: show.backdrop_path,
    overview: show.overview,
    releaseDate: show.first_air_date,
    releaseYear: show.first_air_date ? new Date(show.first_air_date).getFullYear() : 0,
    rating: show.vote_average,
    voteCount: show.vote_count,
    genreIds: show.genre_ids,
    popularity: show.popularity,
  };
}

// Transform TMDB movie details
export function transformMovieDetails(movie: TMDBMovieDetails): MovieDetails {
  const trailer = movie.videos?.results.find(
    (v) => v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser') && v.official
  );

  return {
    id: movie.id,
    type: 'movie',
    title: movie.title,
    originalTitle: movie.original_title,
    posterPath: movie.poster_path,
    backdropPath: movie.backdrop_path,
    overview: movie.overview,
    releaseDate: movie.release_date,
    releaseYear: movie.release_date ? new Date(movie.release_date).getFullYear() : 0,
    rating: movie.vote_average,
    voteCount: movie.vote_count,
    genreIds: movie.genres.map((g) => g.id),
    popularity: movie.popularity,
    runtime: movie.runtime,
    budget: movie.budget,
    revenue: movie.revenue,
    tagline: movie.tagline,
    status: movie.status,
    genres: movie.genres,
    productionCompanies: movie.production_companies.map((c) => ({
      id: c.id,
      name: c.name,
      logoPath: c.logo_path,
      originCountry: c.origin_country,
    })),
    credits: {
      cast: movie.credits?.cast.map(transformCastMember) || [],
      crew: movie.credits?.crew.map(transformCrewMember) || [],
    },
    videos: {
      results: movie.videos?.results.map(transformVideo) || [],
    },
    watchProviders: movie['watch/providers']
      ? {
          results: transformWatchProviders(movie['watch/providers'].results),
        }
      : undefined,
    recommendations: movie.recommendations
      ? {
          page: movie.recommendations.page,
          totalPages: movie.recommendations.total_pages,
          totalResults: movie.recommendations.total_results,
          results: movie.recommendations.results.map(transformMovie),
        }
      : undefined,
  };
}

// Transform TMDB TV details
export function transformTVDetails(show: TMDBTVDetails): TVDetails {
  const trailer = show.videos?.results.find(
    (v) => v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser') && v.official
  );

  return {
    id: show.id,
    type: 'tv',
    title: show.name,
    originalTitle: show.original_name,
    posterPath: show.poster_path,
    backdropPath: show.backdrop_path,
    overview: show.overview,
    releaseDate: show.first_air_date,
    releaseYear: show.first_air_date ? new Date(show.first_air_date).getFullYear() : 0,
    rating: show.vote_average,
    voteCount: show.vote_count,
    genreIds: show.genres.map((g) => g.id),
    popularity: show.popularity,
    numberOfSeasons: show.number_of_seasons,
    numberOfEpisodes: show.number_of_episodes,
    episodeRunTime: show.episode_run_time,
    status: show.status,
    genres: show.genres,
    networks: show.networks.map((n) => ({
      id: n.id,
      name: n.name,
      logoPath: n.logo_path,
    })),
    createdBy: show.created_by.map((c) => ({
      id: c.id,
      name: c.name,
      profilePath: c.profile_path,
    })),
    credits: {
      cast: show.credits?.cast.map(transformCastMember) || [],
      crew: show.credits?.crew.map(transformCrewMember) || [],
    },
    videos: {
      results: show.videos?.results.map(transformVideo) || [],
    },
    watchProviders: show['watch/providers']
      ? {
          results: transformWatchProviders(show['watch/providers'].results),
        }
      : undefined,
    recommendations: show.recommendations
      ? {
          page: show.recommendations.page,
          totalPages: show.recommendations.total_pages,
          totalResults: show.recommendations.total_results,
          results: show.recommendations.results.map(transformTVShow),
        }
      : undefined,
  };
}

function transformCastMember(member: any): CastMember {
  return {
    id: member.id,
    name: member.name,
    character: member.character,
    profilePath: member.profile_path,
    order: member.order,
  };
}

function transformCrewMember(member: any): CrewMember {
  return {
    id: member.id,
    name: member.name,
    job: member.job,
    department: member.department,
    profilePath: member.profile_path,
  };
}

function transformVideo(video: any): Video {
  return {
    id: video.id,
    key: video.key,
    name: video.name,
    site: video.site,
    type: video.type,
    official: video.official,
  };
}

function transformWatchProviders(providers: any): any {
  const result: any = {};
  for (const [country, data] of Object.entries(providers as Record<string, any>)) {
    result[country] = {
      link: data.link,
      flatrate: data.flatrate?.map(transformStreamingProvider),
      rent: data.rent?.map(transformStreamingProvider),
      buy: data.buy?.map(transformStreamingProvider),
    };
  }
  return result;
}

function transformStreamingProvider(provider: any): StreamingProvider {
  return {
    providerId: provider.provider_id,
    providerName: provider.provider_name,
    logoPath: provider.logo_path,
    displayPriority: provider.display_priority,
  };
}

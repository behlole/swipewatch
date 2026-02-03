import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Text, Button } from '../../../components/ui';
import { useTheme, spacing, borderRadius } from '../../../theme';
import { searchMulti, getPopularMovies, getPosterUrl, transformMovie } from '../../../services/tmdb';
import { Media } from '../../../types';
import { useAuthStore } from '../../auth/stores/authStore';
import { seedTasteProfileFromOnboarding } from '../../../services/firebase/tasteProfile';

interface TasteOnboardingProps {
  onComplete: () => void;
  onSkip: () => void;
}

const MIN_SELECTIONS = 3;
const MAX_SELECTIONS = 10;

export function TasteOnboarding({ onComplete, onSkip }: TasteOnboardingProps) {
  const theme = useTheme();
  const firebaseUser = useAuthStore((state) => state.firebaseUser);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Media[]>([]);
  const [popularMovies, setPopularMovies] = useState<Media[]>([]);
  const [selectedMovies, setSelectedMovies] = useState<Media[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Load popular movies on mount
  React.useEffect(() => {
    loadPopularMovies();
  }, []);

  const loadPopularMovies = async () => {
    setIsLoading(true);
    try {
      const response = await getPopularMovies(1);
      const movies = response.results
        .filter((m: any) => m.poster_path)
        .map(transformMovie);
      setPopularMovies(movies);
    } catch (error) {
      console.warn('Failed to load popular movies:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Debounced search
  const searchTimeoutRef = React.useRef<NodeJS.Timeout>();

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    searchTimeoutRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const response = await searchMulti(query);
        const movies = response.results
          .filter((item: any) =>
            (item.media_type === 'movie' || item.media_type === 'tv') &&
            item.poster_path
          )
          .map((item: any) => ({
            id: item.id,
            type: item.media_type as 'movie' | 'tv',
            title: item.title || item.name,
            overview: item.overview || '',
            posterPath: item.poster_path,
            backdropPath: item.backdrop_path,
            releaseYear: new Date(item.release_date || item.first_air_date || '').getFullYear() || 0,
            rating: item.vote_average,
            voteCount: item.vote_count,
            genreIds: item.genre_ids || [],
            popularity: item.popularity,
            originalLanguage: item.original_language,
          }));
        setSearchResults(movies);
      } catch (error) {
        console.warn('Search failed:', error);
      } finally {
        setIsSearching(false);
      }
    }, 300);
  }, []);

  const toggleSelection = useCallback((movie: Media) => {
    setSelectedMovies((prev) => {
      const isSelected = prev.some((m) => m.id === movie.id);
      if (isSelected) {
        return prev.filter((m) => m.id !== movie.id);
      }
      if (prev.length >= MAX_SELECTIONS) {
        return prev;
      }
      return [...prev, movie];
    });
  }, []);

  const isSelected = useCallback(
    (movieId: number) => selectedMovies.some((m) => m.id === movieId),
    [selectedMovies]
  );

  const handleComplete = async () => {
    if (selectedMovies.length < MIN_SELECTIONS) return;

    setIsSaving(true);
    try {
      // Save to Firebase if user is available
      if (firebaseUser?.uid) {
        await seedTasteProfileFromOnboarding(firebaseUser.uid, selectedMovies);
      }
      onComplete();
    } catch (error) {
      console.warn('Failed to save taste profile:', error);
      // Still proceed even if saving fails
      onComplete();
    } finally {
      setIsSaving(false);
    }
  };

  const moviesToShow = searchQuery.length >= 2 ? searchResults : popularMovies;

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background.primary }]}
      edges={['top', 'bottom']}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text variant="h2">What do you like?</Text>
        <Text variant="body" color="secondary" style={styles.subtitle}>
          Pick {MIN_SELECTIONS}+ movies or shows you enjoy. We'll use this to personalize your recommendations.
        </Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={[styles.searchBar, { backgroundColor: theme.colors.background.secondary }]}>
          <Ionicons name="search" size={20} color={theme.colors.text.tertiary} />
          <TextInput
            style={[styles.searchInput, { color: theme.colors.text.primary }]}
            placeholder="Search movies & TV shows..."
            placeholderTextColor={theme.colors.text.tertiary}
            value={searchQuery}
            onChangeText={handleSearch}
            returnKeyType="search"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => handleSearch('')}>
              <Ionicons name="close-circle" size={20} color={theme.colors.text.tertiary} />
            </Pressable>
          )}
        </View>
      </View>

      {/* Selection Counter */}
      <View style={styles.counterContainer}>
        <Text variant="caption" color="secondary">
          {selectedMovies.length} selected
          {selectedMovies.length < MIN_SELECTIONS && ` (pick at least ${MIN_SELECTIONS})`}
        </Text>
      </View>

      {/* Movies Grid */}
      {isLoading || isSearching ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary[500]} />
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.gridContainer}
          showsVerticalScrollIndicator={false}
        >
          {searchQuery.length >= 2 && moviesToShow.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="search-outline" size={48} color={theme.colors.text.tertiary} />
              <Text variant="body" color="secondary" align="center">
                No results found for "{searchQuery}"
              </Text>
            </View>
          ) : (
            <View style={styles.grid}>
              {moviesToShow.map((movie) => (
                <MovieCard
                  key={`${movie.type}-${movie.id}`}
                  movie={movie}
                  isSelected={isSelected(movie.id)}
                  onPress={() => toggleSelection(movie)}
                />
              ))}
            </View>
          )}
        </ScrollView>
      )}

      {/* Selected Movies Preview */}
      {selectedMovies.length > 0 && (
        <View style={[styles.selectedPreview, { backgroundColor: theme.colors.background.secondary }]}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {selectedMovies.map((movie) => (
              <Pressable
                key={`selected-${movie.id}`}
                onPress={() => toggleSelection(movie)}
                style={styles.selectedItem}
              >
                <Image
                  source={{ uri: getPosterUrl(movie.posterPath, 'small') }}
                  style={styles.selectedPoster}
                  contentFit="cover"
                />
                <View style={[styles.removeIcon, { backgroundColor: theme.colors.error }]}>
                  <Ionicons name="close" size={12} color="white" />
                </View>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Footer Buttons */}
      <View style={styles.footer}>
        <Pressable onPress={onSkip} style={styles.skipButton}>
          <Text variant="body" color="secondary">
            Skip for now
          </Text>
        </Pressable>
        <Button
          onPress={handleComplete}
          disabled={selectedMovies.length < MIN_SELECTIONS || isSaving}
          style={styles.continueButton}
        >
          {isSaving ? 'Saving...' : 'Continue'}
        </Button>
      </View>
    </SafeAreaView>
  );
}

interface MovieCardProps {
  movie: Media;
  isSelected: boolean;
  onPress: () => void;
}

function MovieCard({ movie, isSelected, onPress }: MovieCardProps) {
  const theme = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.movieCard,
        isSelected && [styles.movieCardSelected, { borderColor: theme.colors.primary[500] }],
      ]}
    >
      <Image
        source={{ uri: getPosterUrl(movie.posterPath, 'medium') }}
        style={styles.poster}
        contentFit="cover"
        transition={200}
      />
      {isSelected && (
        <View style={[styles.checkmark, { backgroundColor: theme.colors.primary[500] }]}>
          <Ionicons name="checkmark" size={16} color="white" />
        </View>
      )}
      <View style={styles.movieInfo}>
        <Text variant="caption" numberOfLines={2} style={styles.movieTitle}>
          {movie.title}
        </Text>
        {movie.releaseYear > 0 && (
          <Text variant="caption" color="tertiary" style={styles.movieYear}>
            {movie.releaseYear}
          </Text>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: spacing.screenPadding,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  subtitle: {
    marginTop: spacing.sm,
  },
  searchContainer: {
    paddingHorizontal: spacing.screenPadding,
    paddingBottom: spacing.md,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    height: 44,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  counterContainer: {
    paddingHorizontal: spacing.screenPadding,
    paddingBottom: spacing.sm,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  gridContainer: {
    paddingHorizontal: spacing.screenPadding,
    paddingBottom: spacing.xl,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: spacing['4xl'],
    gap: spacing.md,
  },
  movieCard: {
    width: '31%',
    marginBottom: spacing.sm,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  movieCardSelected: {
    borderWidth: 2,
  },
  poster: {
    width: '100%',
    aspectRatio: 2 / 3,
    borderRadius: borderRadius.md,
  },
  checkmark: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  movieInfo: {
    paddingTop: spacing.xs,
  },
  movieTitle: {
    fontWeight: '500',
    fontSize: 12,
  },
  movieYear: {
    fontSize: 10,
  },
  selectedPreview: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.screenPadding,
  },
  selectedItem: {
    marginRight: spacing.sm,
    position: 'relative',
  },
  selectedPoster: {
    width: 50,
    height: 75,
    borderRadius: borderRadius.sm,
  },
  removeIcon: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.screenPadding,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  skipButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  continueButton: {
    flex: 1,
  },
});

export default TasteOnboarding;

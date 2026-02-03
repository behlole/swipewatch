import { Stack } from 'expo-router';
import { useTheme } from '../../src/theme';

export default function OnboardingLayout() {
  const theme = useTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.colors.background.primary },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="genres" />
      <Stack.Screen name="taste" />
      <Stack.Screen name="tutorial" />
    </Stack>
  );
}

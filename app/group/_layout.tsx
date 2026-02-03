import { Stack } from 'expo-router';
import { useTheme } from '../../src/theme';

export default function GroupLayout() {
  const theme = useTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.colors.background.primary },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="create" />
      <Stack.Screen name="[id]/lobby" />
      <Stack.Screen name="[id]/swipe" />
      <Stack.Screen name="[id]/results" />
    </Stack>
  );
}

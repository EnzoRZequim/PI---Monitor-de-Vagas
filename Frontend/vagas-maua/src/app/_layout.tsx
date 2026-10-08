import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { Montserrat_700Bold } from '@expo-google-fonts/montserrat';
import { SpaceMono_400Regular } from '@expo-google-fonts/space-mono';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { cores } from '@/theme';

export default function RootLayout() {
  const [fontesCarregadas] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Montserrat_700Bold,
    SpaceMono_400Regular,
  });

  if (!fontesCarregadas) return null;

  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: cores.fundo } }}>
        <Stack.Screen name="index" options={{ title: 'Vagas Maua' }} />
      </Stack>
    </>
  );
}

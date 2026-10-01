import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold } from '@expo-google-fonts/inter';
import { Montserrat_700Bold } from '@expo-google-fonts/montserrat';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { cores } from '@/theme';

export default function RootLayout() {
  const [fontesCarregadas] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Montserrat_700Bold,
  });

  if (!fontesCarregadas) return null;

  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: cores.fundo } }}>
        <Stack.Screen name="index" options={{ title: 'Vagas Maua' }} />
        <Stack.Screen name="parceiros" options={{ title: 'Nossos parceiros | Vagas Maua' }} />
      </Stack>
    </>
  );
}

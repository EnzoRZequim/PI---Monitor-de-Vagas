import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { Montserrat_400Regular, Montserrat_700Bold } from '@expo-google-fonts/montserrat';
import { SpaceMono_400Regular } from '@expo-google-fonts/space-mono';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SystemUI from 'expo-system-ui';
import { StatusBar } from 'react-native';

import { cores } from '@/theme';

// No Android o app vai até as bordas da tela e as barras do sistema são transparentes: o que aparece
// atrás delas é esta cor de fundo da raiz (e não a do Stack, que só pinta o conteúdo das telas)
SystemUI.setBackgroundColorAsync(cores.fundo);

export default function RootLayout() {
  const [fontesCarregadas] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Montserrat_400Regular,
    Montserrat_700Bold,
    SpaceMono_400Regular,
  });

  if (!fontesCarregadas) return null;

  return (
    <>
      {/* backgroundColor só vale em Androids sem edge-to-edge (ex.: Expo Go no Android 14 ou anterior),
          onde a barra é opaca; nos demais ela é transparente e é ignorado */}
      <StatusBar barStyle="dark-content" backgroundColor={cores.fundo} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: cores.fundo } }}>
        <Stack.Screen name="index" options={{ title: 'Vagas Maua' }} />
      </Stack>
    </>
  );
}

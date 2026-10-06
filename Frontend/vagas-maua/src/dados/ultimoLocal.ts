import AsyncStorage from '@react-native-async-storage/async-storage';

// Guardado só no próprio aparelho (no navegador, fica no localStorage)
const CHAVE = 'vagas-maua:ultimo-local';

export type UltimoLocal = {
  parceiroId: string;
  campusId: string;
};

export async function salvarUltimoLocal(local: UltimoLocal) {
  try {
    await AsyncStorage.setItem(CHAVE, JSON.stringify(local));
  } catch {
    // Sem armazenamento disponível (ex.: navegação privada); o app segue sem lembrar o local
  }
}

export async function lerUltimoLocal(): Promise<UltimoLocal | null> {
  try {
    const valor = await AsyncStorage.getItem(CHAVE);
    if (!valor) return null;

    const local = JSON.parse(valor);
    if (typeof local?.parceiroId !== 'string' || typeof local?.campusId !== 'string') return null;
    return { parceiroId: local.parceiroId, campusId: local.campusId };
  } catch {
    return null;
  }
}

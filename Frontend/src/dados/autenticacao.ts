import { Platform } from 'react-native';

import { API_URL } from './api';

const web = Platform.OS === 'web';
let token: string | undefined;

type Sessao = { usuario: string; perfil: 'admin'; token?: string };
type Resposta<T> = { success: boolean; data?: T; error?: string };

async function chamar<T>(rota: string, corpo?: object): Promise<T | null> {
  let resposta: Response;
  try {
    resposta = await fetch(`${API_URL}/auth/${rota}`, {
      method: corpo ? 'POST' : 'GET',
      credentials: web ? 'include' : 'omit',
      headers: {
        ...(corpo ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: corpo ? JSON.stringify(corpo) : undefined,
    });
  } catch {
    throw new Error('Não foi possível conectar ao servidor. Tente novamente.');
  }

  if (rota === 'sessao' && resposta.status === 401) return null;
  const json = await resposta.json().catch(() => null) as Resposta<T> | null;
  if (!resposta.ok || !json?.success || json.data === undefined) {
    throw new Error(json?.error ?? 'Não foi possível concluir a solicitação.');
  }
  return json.data;
}

export async function entrar(usuario: string, senha: string) {
  const sessao = await chamar<Sessao>('login', { usuario, senha, transporte: web ? 'cookie' : 'bearer' });
  token = sessao?.token;
  if (!(await consultarSessao())) {
    throw new Error('O servidor aceitou o login, mas a sessão não foi iniciada.');
  }
}

export function consultarSessao() {
  return chamar<Sessao>('sessao');
}

export async function encerrarSessao() {
  await chamar('logout', {});
  token = undefined;
}

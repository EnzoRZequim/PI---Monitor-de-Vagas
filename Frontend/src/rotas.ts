import type { Href } from 'expo-router';

import type { Parceiro } from '@/dados/parceiros';

export function rotaDoCampus(parceiroId: string, campusId: string): Href {
  return { pathname: '/parceiros/[parceiroId]/[campusId]', params: { parceiroId, campusId } };
}

// Parceiro com um único campus pula a lista de locais e abre direto os blocos
export function rotaDoParceiro(parceiro: Parceiro): Href {
  if (parceiro.campi.length === 1) return rotaDoCampus(parceiro.id, parceiro.campi[0].id);
  return { pathname: '/parceiros/[parceiroId]', params: { parceiroId: parceiro.id } };
}

import { Feather } from '@expo/vector-icons';
import { router, type Href } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BarraNavegacao } from '@/components/BarraNavegacao';
import { cores, espaco, fontes, tipografia } from '@/theme';

export type SecaoParceiro = 'inicio' | 'locais' | 'dados';

type Item = {
  titulo: string;
  icone: keyof typeof Feather.glyphMap;
  secao?: SecaoParceiro;
  // Sem rota o item aparece, mas não faz nada
  rota?: Href;
  sair?: boolean;
};

const ITENS: Item[] = [
  { titulo: 'Início', icone: 'home', secao: 'inicio', rota: '/area-parceiro' },
  { titulo: 'Locais', icone: 'grid', secao: 'locais', rota: '/area-parceiro/locais' },
  // Sem tela no Figma ainda
  { titulo: 'Dados', icone: 'database', secao: 'dados' },
  // Sem autenticação: sair só volta para a tela inicial
  { titulo: 'Sair', icone: 'log-out', rota: '/', sair: true },
];

function abrir(item: Item) {
  if (!item.rota) return;
  // Ao sair, troca o histórico para o "voltar" do navegador não reabrir a área do parceiro
  if (item.sair) router.replace(item.rota);
  else router.navigate(item.rota);
}

// Navegação da área do parceiro no Cabecalho do desktop
export function NavegacaoParceiro({ ativa }: { ativa: SecaoParceiro }) {
  return (
    <View style={styles.linha}>
      {ITENS.map((item) => (
        <ItemNavegacao key={item.titulo} item={item} ativo={item.secao === ativa} />
      ))}
    </View>
  );
}

function ItemNavegacao({ item, ativo }: { item: Item; ativo: boolean }) {
  const [hover, setHover] = useState(false);
  const habilitado = !!item.rota;

  let cor: string = cores.secundaria;
  if (item.sair) cor = cores.perigo;
  else if (ativo || (hover && habilitado)) cor = cores.primaria;
  else if (!habilitado) cor = cores.inativo;

  return (
    <Pressable
      onPress={() => abrir(item)}
      disabled={!habilitado}
      onHoverIn={() => setHover(true)}
      onHoverOut={() => setHover(false)}
      accessibilityRole="link"
      accessibilityState={{ selected: ativo, disabled: !habilitado }}
      style={styles.item}
    >
      <View style={styles.conteudo}>
        <Feather name={item.icone} size={20} color={cor} />
        <Text style={[styles.titulo, { color: cor }, ativo && styles.tituloAtivo]}>{item.titulo}</Text>
      </View>
      <View style={[styles.marcador, ativo && styles.marcadorAtivo]} />
    </Pressable>
  );
}

// Barra inferior no celular ("Navbar" no Figma)
export function BarraParceiro() {
  return (
    <BarraNavegacao
      itens={ITENS.map((item) => ({
        titulo: item.titulo,
        icone: item.icone,
        perigo: item.sair,
        onPress: item.rota ? () => abrir(item) : undefined,
      }))}
    />
  );
}

const styles = StyleSheet.create({
  linha: {
    flexDirection: 'row',
    gap: espaco[6],
  },
  item: {
    gap: espaco[1],
    paddingTop: espaco[1],
  },
  conteudo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco[2],
  },
  titulo: {
    ...tipografia.corpo,
    fontFamily: fontes.inter.medio,
  },
  tituloAtivo: {
    fontFamily: fontes.inter.seminegrito,
  },
  // Sublinha a seção aberta
  marcador: {
    height: 2,
    borderRadius: 1,
  },
  marcadorAtivo: {
    backgroundColor: cores.primaria,
  },
});

import { Feather } from '@expo/vector-icons';
import { useState, type ReactNode } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';

import { CaixaGradiente } from '@/components/CaixaGradiente';
import { cores, espaco, fontes, gradientes, raio, sombras, tipografia } from '@/theme';

type Props = Omit<TextInputProps, 'style'> & {
  // Caixa externa (largura, margens)
  style?: StyleProp<ViewStyle>;
};

// Input do Figma: cantos de cartão, sem ícone
export function CampoTexto(props: Props) {
  return <Campo {...props} raioCampo={raio.cartao} paddingVertical={18} />;
}

// Barra de pesquisa do Figma: pílula com lupa
export function CampoBusca(props: Props) {
  return <Campo {...props} raioCampo={raio.pilula} paddingVertical={14} icone="search" />;
}

type Opcao = { rotulo: string; valor: string };

type SelecaoProps = {
  opcoes: Opcao[];
  valor: string | null;
  onChange: (valor: string) => void;
  placeholder: string;
  style?: StyleProp<ViewStyle>;
};

// Select do Figma. O Figma só define o campo fechado; a lista aberta segue o estilo dos cartões.
export function CampoSelecao({ opcoes, valor, onChange, placeholder, style }: SelecaoProps) {
  const [aberto, setAberto] = useState(false);
  const selecionada = opcoes.find((opcao) => opcao.valor === valor);

  return (
    <View style={style}>
      <Pressable
        onPress={() => setAberto(!aberto)}
        accessibilityRole="button"
        accessibilityState={{ expanded: aberto }}
        accessibilityLabel={placeholder}
      >
        <Moldura foco={aberto} raioCampo={raio.pilula} paddingVertical={14}>
          <Text style={[styles.texto, { color: selecionada ? cores.texto : corDoTexto(aberto) }]} numberOfLines={1}>
            {selecionada?.rotulo ?? placeholder}
          </Text>
          <Feather name="chevron-down" size={24} color={corDoIcone(aberto)} />
        </Moldura>
      </Pressable>

      {aberto && (
        <CaixaGradiente
          borda={gradientes.neutro.borda}
          fundo={cores.superficie}
          raio={raio.cartao}
          style={styles.lista}
          estiloConteudo={styles.listaConteudo}
        >
          {opcoes.map((opcao) => (
            <Pressable
              key={opcao.valor}
              onPress={() => {
                onChange(opcao.valor);
                setAberto(false);
              }}
              accessibilityRole="button"
              style={({ pressed }) => [styles.opcao, pressed && styles.opcaoPressionada]}
            >
              <Text style={[styles.texto, opcao.valor === valor && styles.opcaoSelecionada]}>{opcao.rotulo}</Text>
            </Pressable>
          ))}
        </CaixaGradiente>
      )}
    </View>
  );
}

// Placeholder e ícone ficam azuis quando o campo está em foco
const corDoTexto = (foco: boolean) => (foco ? cores.secundaria : cores.textoSuave);
const corDoIcone = (foco: boolean) => (foco ? cores.primariaClara : cores.textoSuave);

type CampoProps = Props & {
  raioCampo: number;
  paddingVertical: number;
  icone?: keyof typeof Feather.glyphMap;
};

function Campo({ raioCampo, paddingVertical, icone, style, onFocus, onBlur, ...props }: CampoProps) {
  const [foco, setFoco] = useState(false);

  return (
    <Moldura foco={foco} raioCampo={raioCampo} paddingVertical={paddingVertical} style={style}>
      <TextInput
        {...props}
        onFocus={(e) => {
          setFoco(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFoco(false);
          onBlur?.(e);
        }}
        placeholderTextColor={corDoTexto(foco)}
        style={styles.campo}
      />
      {icone && <Feather name={icone} size={24} color={corDoIcone(foco)} />}
    </Moldura>
  );
}

type MolduraProps = {
  foco: boolean;
  raioCampo: number;
  paddingVertical: number;
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
};

// Fundo, borda e sombra comuns a todos os campos
function Moldura({ foco, raioCampo, paddingVertical, style, children }: MolduraProps) {
  return (
    <CaixaGradiente
      borda={foco ? gradientes.foco.borda : gradientes.neutro.borda}
      fundo={cores.superficie}
      raio={raioCampo}
      style={[foco && styles.sombraFoco, style]}
      estiloConteudo={[styles.conteudo, { paddingVertical }]}
    >
      {children}
    </CaixaGradiente>
  );
}

const styles = StyleSheet.create({
  conteudo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco[2],
    paddingHorizontal: espaco[4],
  },
  sombraFoco: {
    boxShadow: sombras.foco,
  },
  texto: {
    ...tipografia.corpo,
    flex: 1,
    color: cores.texto,
  },
  campo: {
    ...tipografia.corpo,
    flex: 1,
    // Na web o input tem largura mínima própria e empurraria a lupa para fora
    minWidth: 0,
    padding: 0,
    color: cores.texto,
    // Remove o contorno de foco padrão do navegador; o foco é indicado pela borda azul.
    // O estilo precisa ser 'solid': com o 'auto' padrão o Chrome ignora a largura 0.
    outlineStyle: 'solid',
    outlineWidth: 0,
  },
  lista: {
    marginTop: espaco[2],
  },
  listaConteudo: {
    paddingVertical: espaco[1],
    overflow: 'hidden',
  },
  opcao: {
    paddingHorizontal: espaco[4],
    paddingVertical: espaco[3],
  },
  opcaoPressionada: {
    backgroundColor: cores.fundo,
  },
  opcaoSelecionada: {
    fontFamily: fontes.inter.seminegrito,
    color: cores.primaria,
  },
});

import { StyleSheet, Text } from 'react-native';

import { CaixaGradiente } from '@/components/CaixaGradiente';
import { espaco, fontes, ocupacao, raio, tipografia } from '@/theme';

export function taxaDeOcupacao(ocupadas: number, total: number) {
  return total > 0 ? Math.min(ocupadas / total, 1) : 1;
}

// Abaixo de 50% ocupado: verde; até 80%: amarelo; acima disso: vermelho
export function corDaOcupacao(ocupadas: number, total: number) {
  const taxa = taxaDeOcupacao(ocupadas, total);
  if (taxa < 0.5) return ocupacao.livre;
  if (taxa <= 0.8) return ocupacao.moderado;
  return ocupacao.cheio;
}

// Badge com a quantidade de vagas ocupadas
export function IndicadorOcupacao({ ocupadas, total }: { ocupadas: number; total: number }) {
  const cor = corDaOcupacao(ocupadas, total);

  return (
    <CaixaGradiente
      borda={cor.borda}
      fundo={cor.fundo}
      raio={raio.pilula}
      espessura={1}
      estiloConteudo={styles.conteudo}
    >
      <Text style={[styles.texto, { color: cor.texto }]} accessibilityLabel={`${ocupadas} de ${total} vagas ocupadas`}>
        {ocupadas}/{total}
      </Text>
    </CaixaGradiente>
  );
}

const styles = StyleSheet.create({
  conteudo: {
    alignItems: 'center',
    paddingHorizontal: espaco[2],
    paddingVertical: 6,
  },
  texto: {
    ...tipografia.pequeno,
    fontFamily: fontes.inter.medio,
  },
});

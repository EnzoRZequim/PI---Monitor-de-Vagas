// Cada caractere vale o código ASCII menos 48 (0-9 continuam valendo 0-9; A vale 17, B 18...)
function digitoVerificador(base: string) {
  const soma = [...base].reduce((total, caractere, i) => {
    // Pesos de 2 a 9, da direita para a esquerda, recomeçando em 2
    const peso = ((base.length - 1 - i) % 8) + 2;
    return total + (caractere.charCodeAt(0) - 48) * peso;
  }, 0);
  const resto = soma % 11;
  return resto < 2 ? 0 : 11 - resto;
}

export function cnpjValido(texto: string) {
  const c = texto;
  if (!/^[0-9A-Z]{12}\d{2}$/.test(c)) return false;
  // Sequências repetidas (00.000.000/0000-00) passam no cálculo, mas não existem
  if (/^(.)\1{13}$/.test(c)) return false;

  const primeiro = digitoVerificador(c.slice(0, 12));
  const segundo = digitoVerificador(c.slice(0, 12) + primeiro);
  return c.endsWith(`${primeiro}${segundo}`);
}

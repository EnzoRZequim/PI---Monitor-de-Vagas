// Desde julho de 2026 o CNPJ pode ter letras nas 12 primeiras posições (CNPJ alfanumérico); os
// 2 dígitos verificadores continuam numéricos.

// Mantém só letras e números, em maiúsculas, até 14 caracteres
export function limparCnpj(texto: string) {
  return texto.replace(/[^0-9a-z]/gi, '').toUpperCase().slice(0, 14);
}

// Formata enquanto o usuário digita: 00.000.000/0001-00
export function formatarCnpj(texto: string) {
  const c = limparCnpj(texto);
  let saida = c.slice(0, 2);
  if (c.length > 2) saida += `.${c.slice(2, 5)}`;
  if (c.length > 5) saida += `.${c.slice(5, 8)}`;
  if (c.length > 8) saida += `/${c.slice(8, 12)}`;
  if (c.length > 12) saida += `-${c.slice(12, 14)}`;
  return saida;
}

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
  const c = limparCnpj(texto);
  if (!/^[0-9A-Z]{12}\d{2}$/.test(c)) return false;
  // Sequências repetidas (00.000.000/0000-00) passam no cálculo, mas não existem
  if (/^(.)\1{13}$/.test(c)) return false;

  const primeiro = digitoVerificador(c.slice(0, 12));
  const segundo = digitoVerificador(c.slice(0, 12) + primeiro);
  return c.endsWith(`${primeiro}${segundo}`);
}

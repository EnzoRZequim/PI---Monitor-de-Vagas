import { readFileSync } from "node:fs";
import { detectarVeiculos } from "../src/services/DetectorVeiculos";
import { buscarMapa } from "../src/services/MapaStorage";


async function testeDetector(): Promise<void> {
  const mapa = await buscarMapa("Teste");
  if (!mapa) {
    console.error("Mapa Teste não encontrado.");
    return;
  }


  const imagem = readFileSync("data/images/Teste.jpg");
  const inicio = Date.now();
  const caixas = await detectarVeiculos(imagem, mapa);
  const tempo = Date.now() - inicio;


  console.log(`Detectados ${caixas.length} veículos em ${tempo} ms`);


  for (const caixa of caixas.slice(0, 5)) {
    console.log(caixa);
  }
}


testeDetector().catch(erro => {
  console.error(erro);
  process.exit(1);
});
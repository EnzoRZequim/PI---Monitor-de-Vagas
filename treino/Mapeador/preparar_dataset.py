import json
import random
import shutil
from pathlib import Path

# ==============================
# CONFIGURAÇÕES
# ==============================

PKLOT_DIR = Path(r"D:\IA\PKLot\PKLot\PKLot")
SAIDA_DIR = Path(r"D:\IA\Treino Mapeador")

MAPAS_DIR = Path(
    r"E:\MAUA\PI 6s\Codigo2\PI---Monitor-de-Vagas"
    r"\treino\Mapeador\Mapas"
)

DATASET_DIR = SAIDA_DIR / "dataset_yolo"
RUNS_DIR = SAIDA_DIR / "runs"
MODELOS_DIR = SAIDA_DIR / "modelos"
LOGS_DIR = SAIDA_DIR / "logs"

TRAIN_RATIO = 0.8
VAL_RATIO = 0.1
TEST_RATIO = 0.1

MAPAS = [
    "01.json",
    "02.json",
    "03.json",
]

CAMERAS_VALIDAS = [
    "PUCPR",
    "UFPR04",
    "UFPR05",
]

CLASS_ID = 0


# ==============================
# FUNÇÕES
# ==============================

def carregar_mapa(caminho: Path):
    with open(caminho, encoding="utf-8") as arquivo:
        return json.load(arquivo)


def identificar_camera(mapa):
    nome = str(mapa.get("Nome", "")).strip().upper()

    if nome not in CAMERAS_VALIDAS:
        raise ValueError(
            f"Nome de câmera inválido no mapa: {nome}. "
            f"Esperado: {CAMERAS_VALIDAS}"
        )

    return nome


def criar_pastas():
    for split in ["train", "val", "test"]:
        (DATASET_DIR / "images" / split).mkdir(parents=True, exist_ok=True)
        (DATASET_DIR / "labels" / split).mkdir(parents=True, exist_ok=True)

    RUNS_DIR.mkdir(parents=True, exist_ok=True)
    MODELOS_DIR.mkdir(parents=True, exist_ok=True)
    LOGS_DIR.mkdir(parents=True, exist_ok=True)


def gerar_linha_yolo(pontos):
    valores = []

    for ponto in pontos:
        x = float(ponto["X"])
        y = float(ponto["Y"])

        x = max(0.0, min(1.0, x))
        y = max(0.0, min(1.0, y))

        valores.append(f"{x:.6f}")
        valores.append(f"{y:.6f}")

    return f"{CLASS_ID} " + " ".join(valores)


def processar_camera(camera, mapa, split):
    pasta_camera = PKLOT_DIR / camera

    if not pasta_camera.exists():
        print(f"[ERRO] Pasta da câmera não encontrada: {pasta_camera}")
        return 0

    imagens = list(pasta_camera.rglob("*.jpg"))

    if not imagens:
        print(f"[AVISO] Nenhuma imagem encontrada em {camera}")
        return 0

    random.shuffle(imagens)

    total = len(imagens)
    qtd_train = int(total * TRAIN_RATIO)
    qtd_val = int(total * VAL_RATIO)

    if split == "train":
        selecionadas = imagens[:qtd_train]
    elif split == "val":
        selecionadas = imagens[qtd_train:qtd_train + qtd_val]
    else:
        selecionadas = imagens[qtd_train + qtd_val:]

    total_split = len(selecionadas)
    contador = 0

    print(f"[{camera}] {split}: {total_split} imagens para processar")

    for indice, imagem_path in enumerate(selecionadas, start=1):
        nome_seguro = f"{camera}_{imagem_path.stem}.jpg"
        destino_imagem = DATASET_DIR / "images" / split / nome_seguro
        destino_label = DATASET_DIR / "labels" / split / f"{Path(nome_seguro).stem}.txt"

        linhas = []

        for vaga in mapa["Vagas"]:
            pontos = vaga["Pontos"]

            if len(pontos) < 3:
                continue

            linhas.append(gerar_linha_yolo(pontos))

        if not linhas:
            continue

        shutil.copy2(imagem_path, destino_imagem)
        destino_label.write_text("\n".join(linhas), encoding="utf-8")

        contador += 1

        if indice % 100 == 0 or indice == total_split:
            print(
                f"[{camera}] {split}: "
                f"{indice}/{total_split} imagens processadas"
            )

    return contador


def main():
    random.seed(42)
    criar_pastas()

    total_geral = 0

    for nome_arquivo in MAPAS:
        caminho_mapa = MAPAS_DIR / nome_arquivo

        if not caminho_mapa.exists():
            print(f"[ERRO] Mapa não encontrado: {caminho_mapa}")
            continue

        mapa = carregar_mapa(caminho_mapa)
        camera = identificar_camera(mapa)

        print(f"Processando {camera} usando {nome_arquivo}...")

        for split in ["train", "val", "test"]:
            quantidade = processar_camera(camera, mapa, split)
            print(f"  {split}: {quantidade} imagens")
            total_geral += quantidade

    print(f"\nTotal de imagens processadas: {total_geral}")
    print(f"Dataset gerado em: {DATASET_DIR}")


if __name__ == "__main__":
    main()
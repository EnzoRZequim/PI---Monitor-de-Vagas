import json
import os
from pathlib import Path
from PIL import Image

RAIZ = Path(__file__).resolve().parent.parent
DATASET = Path(r"C:\IA\Monitor de vagas\PKLot.v2-640.coco")
SAIDA = Path(r"C:\IA\Monitor de vagas\treino_dados")

def processar_split(nome_split):
    pasta = DATASET / nome_split
    jsons = list(pasta.glob("*.json"))
    if not jsons:
        print(f"[AVISO] Nenhum .json em {pasta}")
        return
    with open(jsons[0], "r", encoding="utf-8") as f:
        coco = json.load(f)

    imagens = {img["id"]: img for img in coco["images"]}
    categorias = {cat["id"]: cat["name"] for cat in coco["categories"]}
    print(f"[{nome_split}] Categorias: {categorias}")

    contagem = {"livre": 0, "ocupada": 0}
    for ann in coco["annotations"]:
        cat_nome = categorias[ann["category_id"]].lower()
        if "empty" in cat_nome or "livre" in cat_nome or "free" in cat_nome:
            classe = "livre"
        elif "occupied" in cat_nome or "ocupada" in cat_nome or "busy" in cat_nome:
            classe = "ocupada"
        else:
            print(f"[AVISO] Categoria desconhecida: {cat_nome}")
            continue

        img_info = imagens[ann["image_id"]]
        img_path = pasta / img_info["file_name"]
        if not img_path.exists():
            continue

        x, y, w, h = ann["bbox"]
        img = Image.open(img_path).convert("RGB")
        recorte = img.crop((int(x), int(y), int(x + w), int(y + h)))
        if recorte.width < 10 or recorte.height < 10:
            continue

        pasta_saida = SAIDA / nome_split / classe
        pasta_saida.mkdir(parents=True, exist_ok=True)
        nome_arquivo = f"{img_info['id']}_{ann['id']}.jpg"
        recorte.save(pasta_saida / nome_arquivo, quality=90)
        contagem[classe] += 1

    print(f"[{nome_split}] livros: {contagem['livre']} | ocupadas: {contagem['ocupada']}")

for split in ["train", "valid", "test"]:
    processar_split(split)

print("Concluído. Recortes salvos em:", SAIDA)
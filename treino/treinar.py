import torch
import torch.nn as nn
from torch.utils.data import DataLoader
from torchvision import datasets, transforms, models
import onnx
import onnxslim
from pathlib import Path


def main():
    RAIZ = Path(__file__).resolve().parent.parent
    DADOS = Path(r"C:\IA\Monitor de vagas\treino_dados")
    SAIDA = RAIZ / "data" / "models" / "classificador_vagas.onnx"

    DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    BATCH = 256
    EPOCAS = 3
    IMG = 128

    transform_treino = transforms.Compose([
        transforms.Resize((IMG, IMG)),
        transforms.RandomHorizontalFlip(),
        transforms.ColorJitter(brightness=0.2, contrast=0.2),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
    ])
    transform_val = transforms.Compose([
        transforms.Resize((IMG, IMG)),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
    ])

    train_ds = datasets.ImageFolder(DADOS / "train", transform_treino)
    val_ds = datasets.ImageFolder(DADOS / "valid", transform_val)
    train_dl = DataLoader(train_ds, batch_size=BATCH, shuffle=True, num_workers=4, pin_memory=True)
    val_dl = DataLoader(val_ds, batch_size=BATCH, shuffle=False, num_workers=4, pin_memory=True)

    print(f"Device: {DEVICE} | Classes: {train_ds.classes}")

    modelo = models.mobilenet_v3_small(weights=models.MobileNet_V3_Small_Weights.IMAGENET1K_V1)
    modelo.classifier[3] = nn.Linear(modelo.classifier[3].in_features, 1)
    modelo = modelo.to(DEVICE)

    criterio = nn.BCEWithLogitsLoss()
    otimizador = torch.optim.AdamW(modelo.parameters(), lr=1e-4)

    for epoca in range(EPOCAS):
        modelo.train()
        perda_total, correta, total = 0.0, 0, 0
        total_lotes = len(train_dl)
        for i, (imgs, labels) in enumerate(train_dl):
            imgs, labels = imgs.to(DEVICE), labels.float().unsqueeze(1).to(DEVICE)
            otimizador.zero_grad()
            saida = modelo(imgs)
            perda = criterio(saida, labels)
            perda.backward()
            otimizador.step()
            perda_total += perda.item() * imgs.size(0)
            preds = (torch.sigmoid(saida) > 0.5).float()
            correta += (preds == labels).sum().item()
            total += imgs.size(0)

            if (i + 1) % 100 == 0 or (i + 1) == total_lotes:
                pct = 100 * (i + 1) / total_lotes
                acc_parcial = correta / total if total else 0
                print(f"[Época {epoca+1}] lote {i+1}/{total_lotes} ({pct:.1f}%) | acurácia parcial: {acc_parcial:.3f}")

        print(f"[Época {epoca+1}/{EPOCAS}] perda={perda_total/total:.4f} acurácia_treino={correta/total:.4f}")

        modelo.eval()
        correta_v, total_v = 0, 0
        with torch.no_grad():
            for imgs, labels in val_dl:
                imgs, labels = imgs.to(DEVICE), labels.float().unsqueeze(1).to(DEVICE)
                saida = modelo(imgs)
                preds = (torch.sigmoid(saida) > 0.5).float()
                correta_v += (preds == labels).sum().item()
                total_v += imgs.size(0)
        print(f"[Validação] acurácia={correta_v/total_v:.4f}")

    # Exportar ONNX
    modelo.eval().cpu()
    exemplo = torch.randn(1, 3, IMG, IMG)
    SAIDA.parent.mkdir(parents=True, exist_ok=True)
    torch.onnx.export(
        modelo, exemplo, str(SAIDA),
        input_names=["input"], output_names=["logits"],
        dynamic_axes={"input": {0: "batch"}, "logits": {0: "batch"}},
        opset_version=17,
    )
    onnxslim.slim(str(SAIDA), str(SAIDA))
    onnx.checker.check_model(onnx.load(str(SAIDA)))
    print(f"Modelo salvo em: {SAIDA}")


if __name__ == "__main__":
    main()
from ultralytics import YOLO

DATA_YAML = r"E:\MAUA\PI 6s\Codigo2\PI---Monitor-de-Vagas\treino\Mapeador\data.yaml"
CAMINHO_MODELO = r"D:\IA\Treino Mapeador\runs\vagas_seg_v1\weights\best.pt"


def main():
    modelo = YOLO(CAMINHO_MODELO)

    metricas = modelo.val(
        data=DATA_YAML,
        split="test",
        imgsz=640,
    )

    print("\n=== RESULTADOS NO CONJUNTO DE TESTE ===")
    print(f"Imagens de teste: 1244")
    print(f"Box  mAP50:     {metricas.box.map50:.4f}")
    print(f"Box  mAP50-95:  {metricas.box.map:.4f}")
    print(f"Mask mAP50:     {metricas.seg.map50:.4f}")
    print(f"Mask mAP50-95:  {metricas.seg.map:.4f}")
    print(f"Mask Precisão:  {metricas.seg.mp:.4f}")
    print(f"Mask Recall:    {metricas.seg.mr:.4f}")


if __name__ == "__main__":
    main()
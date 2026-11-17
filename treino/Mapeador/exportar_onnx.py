from ultralytics import YOLO

CAMINHO_MODELO = r"D:\IA\Treino Mapeador\runs\vagas_seg_v1\weights\best.pt"
PASTA_MODELOS = r"D:\IA\Treino Mapeador\modelos"


def main():
    modelo = YOLO(CAMINHO_MODELO)

    modelo.export(
        format="onnx",
        imgsz=640,
        opset=12,
        simplify=True,
        project=PASTA_MODELOS,
    )


if __name__ == "__main__":
    main()
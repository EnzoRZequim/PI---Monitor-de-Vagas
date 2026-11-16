from ultralytics import YOLO

CAMINHO_MODELO = r"D:\IA\Treino Mapeador\runs\vagas_seg_v1\weights\best.pt"
IMAGEM_TESTE = r"D:\IA\PKLot\PKLot\PKLot\PUCPR\Sunny\2012-09-11\2012-09-11_15_16_58.jpg"


def main():
    modelo = YOLO(CAMINHO_MODELO)

    resultados = modelo.predict(
        source=IMAGEM_TESTE,
        imgsz=640,
        conf=0.25,
        save=True,
    )

    for resultado in resultados:
        print(f"Imagem: {resultado.path}")
        print(f"Máscaras detectadas: {len(resultado.masks)}")


if __name__ == "__main__":
    main()
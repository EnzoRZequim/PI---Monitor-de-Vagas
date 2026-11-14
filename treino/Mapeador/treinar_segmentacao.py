from ultralytics import YOLO

DATA_YAML = r"E:\MAUA\PI 6s\Codigo2\PI---Monitor-de-Vagas\treino\Mapeador\data.yaml"
RUNS_DIR = r"D:\IA\Treino Mapeador\runs"

MODELO_BASE = "yolov8n-seg.pt"
EPOCAS = 50
IMGSZ = 640
BATCH = 8
WORKERS = 2
NOME_EXECUCAO = "vagas_seg_v1"


def main():
    modelo = YOLO(MODELO_BASE)

    modelo.train(
        data=DATA_YAML,
        epochs=EPOCAS,
        imgsz=IMGSZ,
        batch=BATCH,
        workers=WORKERS,
        project=RUNS_DIR,
        name=NOME_EXECUCAO,
        patience=10,
        save=True,
        plots=True,
    )


if __name__ == "__main__":
    main()
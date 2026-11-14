from pathlib import Path

import cv2
import numpy as np
import torch
from segment_anything import SamPredictor, sam_model_registry

MODELO = "vit_b"
CAMINHO_MODELO = Path(__file__).resolve().parent / "sam_vit_b_01ec64.pth"

AREA_MINIMA = 500
AREA_MAXIMA_PROPORCAO = 0.008
PROPORCAO_MINIMA = 0.2
PROPORCAO_MAXIMA = 5.0


class SugeridorVaga:
    def __init__(self) -> None:
        self.dispositivo = "cuda" if torch.cuda.is_available() else "cpu"

        if not CAMINHO_MODELO.exists():
            raise RuntimeError(
                "Modelo SAM não encontrado. Baixe sam_vit_b_01ec64.pth e coloque em ia_mapa/."
            )

        sam = sam_model_registry[MODELO](checkpoint=str(CAMINHO_MODELO))
        sam.to(device=self.dispositivo)
        self.predictor = SamPredictor(sam)

    def sugerir(
        self,
        imagem_bytes: bytes,
        x_normalizado: float,
        y_normalizado: float,
    ) -> list[tuple[float, float]]:
        imagem = self._decodificar(imagem_bytes)
        altura, largura = imagem.shape[:2]

        x_pixel = x_normalizado * largura
        y_pixel = y_normalizado * altura

        ponto = np.array([[x_pixel, y_pixel]])
        rotulo = np.array([1])

        tamanho_base = min(largura, altura)
        largura_caixa = tamanho_base * 0.04
        altura_caixa = tamanho_base * 0.06

        caixa = np.array([
            max(0, x_pixel - largura_caixa / 2),
            max(0, y_pixel - altura_caixa / 2),
            min(largura - 1, x_pixel + largura_caixa / 2),
            min(altura - 1, y_pixel + altura_caixa / 2),
        ])

        self.predictor.set_image(imagem)

        mascaras, pontuacoes, _ = self.predictor.predict(
            point_coords=ponto,
            point_labels=rotulo,
            box=caixa,
            multimask_output=True,
        )

        candidata = self._escolher_mascara(
            mascaras,
            pontuacoes,
            x_pixel,
            y_pixel,
            largura,
            altura,
        )

        if candidata is None:
            raise ValueError("Não foi possível identificar uma vaga próxima ao ponto clicado.")

        cantos = self._extrair_cantos(candidata)

        if cantos is None:
            raise ValueError("Não foi possível identificar uma vaga próxima ao ponto clicado.")

        return [
            (float(canto[0] / largura), float(canto[1] / altura))
            for canto in cantos
        ]

    def _decodificar(self, imagem_bytes: bytes) -> np.ndarray:
        array = np.frombuffer(imagem_bytes, np.uint8)
        imagem = cv2.imdecode(array, cv2.IMREAD_COLOR)

        if imagem is None:
            raise ValueError("Não foi possível ler a imagem enviada.")

        return cv2.cvtColor(imagem, cv2.COLOR_BGR2RGB)

    def _escolher_mascara(
        self,
        mascaras: np.ndarray,
        pontuacoes: np.ndarray,
        x_pixel: float,
        y_pixel: float,
        largura: int,
        altura: int,
    ) -> np.ndarray | None:
        area_imagem = largura * altura
        candidatas: list[tuple[float, float, np.ndarray]] = []

        for mascara, pontuacao in zip(mascaras, pontuacoes):
            area = int(mascara.sum())

            if area < AREA_MINIMA:
                continue

            proporcao_area = area / area_imagem

            if proporcao_area > AREA_MAXIMA_PROPORCAO:
                continue

            if not mascara[int(y_pixel), int(x_pixel)]:
                continue

            contornos, _ = cv2.findContours(
                mascara.astype(np.uint8),
                cv2.RETR_EXTERNAL,
                cv2.CHAIN_APPROX_SIMPLE,
            )

            if not contornos:
                continue

            contorno = max(contornos, key=cv2.contourArea)
            x, y, largura_contorno, altura_contorno = cv2.boundingRect(contorno)

            if largura_contorno == 0 or altura_contorno == 0:
                continue

            proporcao = largura_contorno / altura_contorno

            if proporcao < PROPORCAO_MINIMA or proporcao > PROPORCAO_MAXIMA:
                continue

            centro_x = x + largura_contorno / 2
            centro_y = y + altura_contorno / 2
            distancia = np.hypot(centro_x - x_pixel, centro_y - y_pixel)

            candidatas.append((float(distancia), float(pontuacao), mascara))

        if not candidatas:
            return None

        candidatas.sort(key=lambda item: (item[0], -item[1]))
        return candidatas[0][2]

    def _extrair_cantos(self, mascara: np.ndarray) -> np.ndarray | None:
        mascara_uint8 = mascara.astype(np.uint8) * 255
        contornos, _ = cv2.findContours(
            mascara_uint8,
            cv2.RETR_EXTERNAL,
            cv2.CHAIN_APPROX_SIMPLE,
        )

        if not contornos:
            return None

        contorno = max(contornos, key=cv2.contourArea)

        if cv2.contourArea(contorno) < AREA_MINIMA:
            return None

        return self._aproximar_quadrilatero(contorno)

    def _aproximar_quadrilatero(self, contorno: np.ndarray) -> np.ndarray | None:
        perimetro = cv2.arcLength(contorno, True)

        for tolerancia in np.linspace(0.01, 0.1, 10):
            aproximacao = cv2.approxPolyDP(contorno, tolerancia * perimetro, True)

            if len(aproximacao) == 4:
                return aproximacao.reshape(4, 2)

        caixa = cv2.boxPoints(cv2.minAreaRect(contorno))
        return caixa.astype(np.int32)
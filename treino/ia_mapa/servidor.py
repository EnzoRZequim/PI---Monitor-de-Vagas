from contextlib import asynccontextmanager

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from sam_service import SugeridorVaga

sugeridor: SugeridorVaga | None = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global sugeridor
    sugeridor = SugeridorVaga()

    yield


app = FastAPI(title="Serviço de sugestão de vagas", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


class PontosResposta(BaseModel):
    Pontos: list[dict[str, float]]


@app.get("/saude")
async def saude() -> dict[str, str]:
    dispositivo = sugeridor.dispositivo if sugeridor else "indisponivel"
    return {"status": "ok", "dispositivo": dispositivo}


@app.post("/sugerir-vaga", response_model=PontosResposta)
async def sugerir_vaga(
    Imagem: UploadFile = File(...),
    X: float = Form(...),
    Y: float = Form(...),
) -> PontosResposta:
    if not 0 <= X <= 1 or not 0 <= Y <= 1:
        raise HTTPException(status_code=400, detail="X e Y devem estar entre 0 e 1.")

    conteudo = await Imagem.read()

    try:
        pontos = sugeridor.sugerir(conteudo, X, Y)
    except ValueError as erro:
        raise HTTPException(status_code=422, detail=str(erro))
    except Exception as erro:
        raise HTTPException(status_code=500, detail=f"Erro ao analisar a imagem: {erro}")

    return PontosResposta(
        Pontos=[
            {"X": round(ponto[0], 6), "Y": round(ponto[1], 6)}
            for ponto in pontos
        ]
    )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8001)
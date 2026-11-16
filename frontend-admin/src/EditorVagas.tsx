import { useRef, useState } from "react";
import type { Mapa, Ponto, Vaga } from "./tipos";

type Props = {
    mapa: Mapa;
    vagas: Vaga[];
    selecionadaID: string | null;
    rascunho: Ponto[] | null;
    aoSelecionar: (id: string | null) => void;
    aoMoverPonto: (id: string, indice: number, ponto: Ponto) => void;
    aoAdicionarPonto: (ponto: Ponto) => void;
};

function paraTexto(pontos: Ponto[], mapa: Mapa): string {
    return pontos.map((p) => `${p.X * mapa.Largura},${p.Y * mapa.Altura}`).join(" ");
}

export function EditorVagas({
    mapa,
    vagas,
    selecionadaID,
    rascunho,
    aoSelecionar,
    aoMoverPonto,
    aoAdicionarPonto
}: Props) {
    const svgRef = useRef<SVGSVGElement>(null);
    const [arrastando, setArrastando] = useState<{ ID: string; indice: number } | null>(null);

    function pontoDoEvento(evento: { clientX: number; clientY: number }): Ponto | null {
        const matriz = svgRef.current?.getScreenCTM();
        if (!matriz) return null;

        const p = new DOMPoint(evento.clientX, evento.clientY).matrixTransform(matriz.inverse());

        return {
            X: Math.max(0, Math.min(1, p.x / mapa.Largura)),
            Y: Math.max(0, Math.min(1, p.y / mapa.Altura))
        };
    }

    const selecionada = vagas.find((vaga) => vaga.ID === selecionadaID);
    const raio = Math.max(5, mapa.Largura / 120);

    return (
        <svg
            ref={svgRef}
            className="editor-svg"
            viewBox={`0 0 ${mapa.Largura} ${mapa.Altura}`}
            style={{ aspectRatio: `${mapa.Largura} / ${mapa.Altura}` }}
            onPointerDown={(evento) => {
                if (rascunho) {
                    const ponto = pontoDoEvento(evento);
                    if (ponto) aoAdicionarPonto(ponto);
                    return;
                }
                aoSelecionar(null);
            }}
            onPointerMove={(evento) => {
                if (!arrastando) return;
                const ponto = pontoDoEvento(evento);
                if (ponto) aoMoverPonto(arrastando.ID, arrastando.indice, ponto);
            }}
            onPointerUp={() => setArrastando(null)}
            onPointerCancel={() => setArrastando(null)}
        >
            <image
                href={`/imagens/${encodeURIComponent(mapa.Imagem)}`}
                width={mapa.Largura}
                height={mapa.Altura}
                pointerEvents="none"
            />

            {vagas.map((vaga) => (
                <polygon
                    key={vaga.ID}
                    points={paraTexto(vaga.Pontos, mapa)}
                    className={vaga.ID === selecionadaID ? "vaga selecionada" : "vaga"}
                    onPointerDown={(evento) => {
                        if (rascunho) return;
                        evento.stopPropagation();
                        aoSelecionar(vaga.ID);
                    }}
                />
            ))}

            {rascunho && rascunho.length > 1 && (
                <polyline points={paraTexto(rascunho, mapa)} className="rascunho" />
            )}

            {rascunho?.map((ponto, indice) => (
                <circle
                    key={indice}
                    cx={ponto.X * mapa.Largura}
                    cy={ponto.Y * mapa.Altura}
                    r={raio}
                    className="ponto rascunho-ponto"
                />
            ))}

            {!rascunho &&
                selecionada?.Pontos.map((ponto, indice) => (
                    <circle
                        key={indice}
                        cx={ponto.X * mapa.Largura}
                        cy={ponto.Y * mapa.Altura}
                        r={raio}
                        className="ponto"
                        onPointerDown={(evento) => {
                            evento.stopPropagation();
                            svgRef.current?.setPointerCapture(evento.pointerId);
                            setArrastando({ ID: selecionada.ID, indice });
                        }}
                    />
                ))}
        </svg>
    );
}
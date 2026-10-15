import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { analisarMapa, buscarMapa } from "./api";
import type { Mapa, OcupacaoMapa, ResumoMapa } from "./tipos";
import "./App.css";


type Props = {
    mapas: ResumoMapa[];
};


function textoDoErro(erro: unknown): string {
    return erro instanceof Error ? erro.message : "Ocorreu um erro inesperado.";
}


export function MonitorVagas({ mapas }: Props) {
    const [mapaID, setMapaID] = useState("");
    const [mapa, setMapa] = useState<Mapa | null>(null);
    const [imagem, setImagem] = useState<File | null>(null);
    const [urlImagem, setUrlImagem] = useState<string | null>(null);
    const [ocupacao, setOcupacao] = useState<OcupacaoMapa | null>(null);
    const [ocupado, setOcupado] = useState(false);
    const [mensagem, setMensagem] = useState("");

    const urlImagemRef = useRef<string | null>(null);


    useEffect(() => {
        if (!mapaID) return;

        let ignorar = false;
        buscarMapa(mapaID)
            .then((dados) => {
                if (!ignorar) setMapa(dados);
            })
            .catch((erro: unknown) => setMensagem(textoDoErro(erro)));

        return () => {
            ignorar = true;
        };
    }, [mapaID]);


    useEffect(() => {
        return () => {
            if (urlImagemRef.current) {
                URL.revokeObjectURL(urlImagemRef.current);
                urlImagemRef.current = null;
            }
        };
    }, []);


    function aoSelecionarMapa(evento: ChangeEvent<HTMLSelectElement>) {
        const id = evento.target.value;
        setMapaID(id);
        if (!id) {
            setMapa(null);
            setImagem(null);
            setUrlImagem(null);
        }
        setOcupacao(null);
        setMensagem("");
    }


    function aoSelecionarImagem(evento: ChangeEvent<HTMLInputElement>) {
        const arquivo = evento.target.files?.[0] ?? null;
        setImagem(arquivo);
        setOcupacao(null);
        setMensagem("");

        if (urlImagemRef.current) {
            URL.revokeObjectURL(urlImagemRef.current);
            urlImagemRef.current = null;
        }

        if (arquivo) {
            const url = URL.createObjectURL(arquivo);
            urlImagemRef.current = url;
            setUrlImagem(url);
        } else {
            setUrlImagem(null);
        }
    }


    async function aoAnalisar(evento: FormEvent<HTMLFormElement>) {
        evento.preventDefault();

        if (!mapaID) return setMensagem("Selecione um mapa.");
        if (!imagem) return setMensagem("Selecione uma imagem para analisar.");

        setOcupado(true);

        try {
            const resultado = await analisarMapa(mapaID, imagem);
            setOcupacao(resultado);
            setMensagem(`Análise concluída: ${resultado.Vagas.filter((vaga) => vaga.Ocupada).length} vaga(s) ocupada(s).`);
        } catch (erro) {
            setMensagem(textoDoErro(erro));
        } finally {
            setOcupado(false);
        }
    }


    function estadoVaga(id: string): boolean | null {
        if (!ocupacao) return null;
        return ocupacao.Vagas.find((vaga) => vaga.ID === id)?.Ocupada ?? null;
    }


    return (
        <section className="monitor">
            <h2>Monitor de vagas</h2>

            <form className="paineis" onSubmit={(evento) => void aoAnalisar(evento)}>
                <div className="painel">
                    <h3>Mapa</h3>
                    <select value={mapaID} onChange={aoSelecionarMapa}>
                        <option value="" disabled>
                            {mapas.length ? "Selecione um mapa" : "Nenhum mapa cadastrado"}
                        </option>
                        {mapas.map((item) => (
                            <option key={item.ID} value={item.ID}>
                                {item.Nome} ({item.QuantidadeVagas} vagas)
                            </option>
                        ))}
                    </select>
                </div>

                <div className="painel">
                    <h3>Imagem a analisar</h3>
                    <input type="file" accept="image/jpeg,image/png" onChange={aoSelecionarImagem} />
                </div>

                <div className="painel">
                    <button type="submit" disabled={ocupado || !mapaID || !imagem}>
                        {ocupado ? "Analisando..." : "Analisar"}
                    </button>
                </div>
            </form>

            <p className="mensagem">{mensagem}</p>

            {mapa && urlImagem && (
                <div className="area">
                    <svg
                        className="editor-svg"
                        viewBox={`0 0 ${mapa.Largura} ${mapa.Altura}`}
                        style={{ aspectRatio: `${mapa.Largura} / ${mapa.Altura}` }}
                    >
                        <image href={urlImagem} width={mapa.Largura} height={mapa.Altura} />


                        {mapa.Vagas.map((vaga) => {
                            const estado = estadoVaga(vaga.ID);
                            const classe = estado === null ? "vaga" : estado ? "vaga ocupada" : "vaga livre";


                            return (
                                <polygon
                                    key={vaga.ID}
                                    points={vaga.Pontos.map((ponto) => `${ponto.X * mapa.Largura},${ponto.Y * mapa.Altura}`).join(" ")}
                                    className={classe}
                                />
                            );
                        })}
                    </svg>
                </div>
            )}

            {mapa && !urlImagem && (
                <p>Selecione uma imagem para visualizar as vagas deste mapa.</p>
            )}
        </section>
    );
}

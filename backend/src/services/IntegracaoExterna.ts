import { INTEGRACAO_API_URL } from '../config/integracao';
import type { Mapa } from '../types/Mapa';
import type { OcupacaoMapa } from '../types/Ocupacao';


export interface PayloadIntegracao {
    mapaId: string;
    organizacaoId: string;
    estacionamentoId: string;
    timestamp: string;
    totalVagas: number;
    vagas: Array<{
        id: string;
        nome: string;
        ocupada: boolean;
        sobreposicao: number;
        pontos: Array<{ x: number; y: number }>;
    }>;
}


interface EventoPendente {
    payload: PayloadIntegracao;
    tentativas: number;
}


const fila: EventoPendente[] = [];
const MAX_TENTATIVAS = 3;
const INTERVALO_RETRY_MS = 30000;


function montarPayload(mapa: Mapa, ocupacao: OcupacaoMapa): PayloadIntegracao {
    return {
        mapaId: mapa.ID,
        organizacaoId: mapa.OrganizacaoID,
        estacionamentoId: mapa.EstacionamentoID,
        timestamp: ocupacao.Data,
        totalVagas: ocupacao.Vagas.length,
        vagas: ocupacao.Vagas.map((vaga) => {
            const vagaMapa = mapa.Vagas.find((v) => v.ID === vaga.ID);
            return {
                id: vaga.ID,
                nome: vaga.Nome,
                ocupada: vaga.Ocupada,
                sobreposicao: vaga.Sobreposicao,
                pontos: vagaMapa?.Pontos.map((p) => ({ x: p.X, y: p.Y })) ?? []
            };
        })
    };
}


async function enviar(payload: PayloadIntegracao): Promise<boolean> {
    if (!INTEGRACAO_API_URL) {
        return false;
    }


    try {
        const resposta = await fetch(INTEGRACAO_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });


        return resposta.ok;
    } catch {
        return false;
    }
}


function agendarRetry(): void {
    setTimeout(() => {
        void processarFila();
    }, INTERVALO_RETRY_MS);
}


async function processarFila(): Promise<void> {
    const pendentes = [...fila];
    fila.length = 0;


    for (const evento of pendentes) {
        const sucesso = await enviar(evento.payload);


        if (!sucesso) {
            evento.tentativas++;
            if (evento.tentativas < MAX_TENTATIVAS) {
                fila.push(evento);
            }
        }
    }


    if (fila.length > 0) {
        agendarRetry();
    }
}


export function publicarOcupacao(mapa: Mapa, ocupacao: OcupacaoMapa): void {
    const payload = montarPayload(mapa, ocupacao);


    void enviar(payload).then((sucesso) => {
        if (!sucesso) {
            fila.push({ payload, tentativas: 1 });
            agendarRetry();
        }
    });
}
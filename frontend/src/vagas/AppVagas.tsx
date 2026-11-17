import { BrowserRouter, Route, Routes } from "react-router-dom";
import App from "../App";
import TelaBlocos from "./TelaBlocos";
import TelaEmBreve from "./TelaEmBreve";
import TelaInicio from "./TelaInicio";
import TelaLocais from "./TelaLocais";
import TelaMapaBloco from "./TelaMapaBloco";

export default function AppVagas() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<TelaInicio />} />
        <Route path="/locais" element={<TelaLocais />} />
        <Route path="/locais/:localID" element={<TelaBlocos />} />
        <Route path="/locais/:localID/blocos/:blocoID" element={<TelaMapaBloco />} />

        {/* Área do parceiro: telas da próxima etapa */}
        <Route path="/parceiro/*" element={<TelaEmBreve />} />

        {/* Ferramenta interna já existente (editor de vagas e monitor) */}
        <Route path="/editor" element={<App />} />

        <Route path="*" element={<TelaEmBreve />} />
      </Routes>
    </BrowserRouter>
  );
}

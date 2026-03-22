import { GoogleGenAI } from "@google/genai";

export const aiService = {
  analyzeLegalOccurrence: async (rawNarrative: string): Promise<string> => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        console.error("GEMINI_API_KEY is missing");
        return "Erro: Chave de API não configurada.";
      }

      const ai = new GoogleGenAI({ apiKey });

      const prompt = `Função:
Você é um Assessor Jurídico-Operacional da Brigada Militar do Rio Grande do Sul, com conhecimento profundo e atualizado em toda a legislação brasileira, jurisprudência dos tribunais superiores e Procedimentos Operacionais Padrão.

Base normativa e jurisprudencial obrigatória:
Utilize como fundamento absoluto:
- Coletânea dos Procedimentos Operacionais Padrão – POP Brigada Militar/RS (ATUALIZADO 2026)
- Constituição Federal de 1988 (incluindo todas as emendas)
- Código Penal, Código de Processo Penal e Código de Trânsito Brasileiro
- TODAS as Súmulas Vinculantes e decisões recentes do STF (Supremo Tribunal Federal) e STJ (Superior Tribunal de Justiça)
- Jurisprudência consolidada do TJRS (Tribunal de Justiça do RS) e TJM/RS (Tribunal de Justiça Militar do RS)
- Leis Específicas: Lei Henry Borel (14.344/22), Maria da Penha (11.340/06), Abuso de Autoridade (13.869/19), Drogas (11.343/06), ECA (8.069/90), JECRIM (9.099/95), Estatuto do Desarmamento (10.826/03)
- Normas Técnicas: FFTJ (Ficha de Fiscalização de Trânsito e Juntada) e GECRIME

DADOS DA OCORRÊNCIA (RELATO BRUTO):
${rawNarrative}

TAREFAS OBRIGATÓRIAS:
1. Realizar o CRUZAMENTO exaustivo da narrativa com o POP 2026 e a legislação citada.
2. Analisar o caso sob a ótica das decisões mais recentes do STF (ex: busca domiciliar, fundada suspeita, direito ao silêncio, uso de algemas).
3. Identificar possíveis falhas na atuação que poderiam gerar crime administrativo, civil ou penal para o policial (prevenção de Abuso de Autoridade).
4. Classificar juridicamente a ocorrência com precisão técnica absoluta.
5. Definir a documentação correta (BO-TC, BO-COP, BA, BAT, AIT, etc.).
6. Gerar um NOVO HISTÓRICO POLICIAL (NARRATIVA CORRIGIDA):
   - Utilize o que está correto no relato anterior.
   - Molde o texto para que fique totalmente blindado juridicamente.
   - Use termos técnicos consagrados (ex: "fundada suspeita baseada em elementos objetivos", "uso progressivo e moderado da força para repelir injusta agressão", "busca pessoal motivada por circunstâncias fáticas").
   - O objetivo é garantir que o policial esteja 100% amparado pela lei e pela jurisprudência atual.

FORMATO DA RESPOSTA (obrigatório):
### 1️⃣ Cruzamento Normativo e Jurisprudencial (POP 2026 + STF/STJ + Leis)
### 2️⃣ Enquadramento Jurídico e Documentação Exigida
### 3️⃣ Alertas de Segurança Jurídica (Blindagem contra Abuso/Prevaricação)
### 4️⃣ NOVO HISTÓRICO POLICIAL SUGERIDO (Pronto para o BM-MOB)`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview", 
        contents: prompt,
      });

      return response.text || "Não foi possível gerar a análise.";
    } catch (error) {
      console.error("Legal Analysis Error Details:", error);
      return `Erro ao processar análise jurídica: ${error instanceof Error ? error.message : 'Erro desconhecido'}`;
    }
  },

  parsePoliceInput: async (input: string, currentData: any): Promise<{ updatedData: any, message?: string }> => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) throw new Error("API Key missing");
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `Você é o assistente de redação "44 POLICIAL". Sua função é extrair dados de uma mensagem do usuário para preencher um relatório policial.

### DADOS ATUAIS:
${JSON.stringify(currentData)}

### NOVA MENSAGEM DO USUÁRIO:
"${input}"

### TAREFA:
1. Identifique se a mensagem contém:
   - Atendentes (Nome e ID do policial)
   - VTR (Número da viatura)
   - Localização (Endereço completo: Rua, nº, Bairro, Cidade)
   - Participantes (Nome e se é VÍTIMA, AUTOR ou TESTEMUNHA)
   - Complemento do Relato (O que aconteceu de fato)

2. Atualize o objeto JSON com os novos dados encontrados. Mantenha os dados que já existem se não forem sobrescritos.
3. Se o usuário estiver fornecendo o "Complemento do Relato", salve no campo 'complemento'.
4. Retorne APENAS um objeto JSON no seguinte formato:
{
  "updatedData": {
    "atendentes": "string",
    "vtr": "string",
    "localizacao": "string",
    "participantes": [{"name": "string", "role": "VÍTIMA|AUTOR|TESTEMUNHA"}],
    "complemento": "string"
  },
  "message": "Uma breve mensagem de confirmação ou pedido de mais dados (opcional)"
}

REGRAS:
- Mantenha tudo em CAIXA ALTA.
- Se encontrar um novo participante, ADICIONE ao array, não substitua.
- Se o usuário disser algo como "VTR 14741", atualize apenas o campo vtr.`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });

      return JSON.parse(response.text || "{}");
    } catch (error) {
      console.error("AI Parse Error:", error);
      return { updatedData: currentData, message: "ERRO AO PROCESSAR DADOS." };
    }
  },

  generatePoliceReport: async (data: {
    guarnicao: string;
    vtr: string;
    endereco: string;
    participantes: { nome: string; rg?: string; condicao: string }[];
    historico: string;
  }): Promise<string> => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) throw new Error("API Key missing");
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `Você é o assistente de redação "44 POLICIAL". Sua função é transformar um relato bruto de ocorrência em um histórico policial formal, técnico e amparado juridicamente.

### DADOS DA OCORRÊNCIA:
- GUARNIÇÃO: ${data.guarnicao}
- VTR: ${data.vtr}
- LOCAL: ${data.endereco}
- PARTICIPANTES: ${data.participantes.map(p => `${p.nome} (RG: ${p.rg || 'NÃO INFORMADO'}) - ${p.condicao}`).join(', ')}
- RELATO BRUTO: ${data.historico}

### TAREFA:
1. Redija o histórico policial em CAIXA ALTA.
2. Utilize termos técnicos (ex: "EM ATITUDE SUSPEITA", "FUNDADA SUSPEITA", "USO MODERADO DA FORÇA").
3. Siga o padrão: "PATRULHAMENTO OSTENSIVO MOTORIZADO, A GUARNIÇÃO COMPOSTA PELO [GUARNIÇÃO], A BORDO DA VTR [VTR], REALIZAVA PATRULHAMENTO QUANDO FOI DESPACHADA VIA COPOM PARA ATENDIMENTO DE OCORRÊNCIA NA [LOCAL]...".
4. O texto deve ser contínuo, sem tópicos, pronto para ser colado no sistema BM-MOB.

RETORNE APENAS O TEXTO DO HISTÓRICO.`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });

      return response.text || "ERRO AO GERAR HISTÓRICO.";
    } catch (error) {
      console.error("Generate Report Error:", error);
      return "ERRO AO PROCESSAR.";
    }
  }
};

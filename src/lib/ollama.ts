export async function generateWithOllama(model: string, prompt: string): Promise<string> {
  const url = "http://localhost:11434/api/generate";
  const body = {
    model: model || "llama3",
    prompt,
    stream: false,
  };

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`Ollama erro ${res.status}: ${txt}`);
    }

    const data = await res.json();
    // Ollama returns { response: string, ... }
    return data.response || "";
  } catch (err: any) {
    // Likely CORS or connectivity
    throw new Error(
      `Falha ao conectar ao Ollama. Verifique se está rodando em http://localhost:11434 e configure CORS: OLLAMA_ORIGINS=*. Detalhe: ${err?.message || err}`
    );
  }
}

export async function checkOllama(): Promise<boolean> {
  try {
    const res = await fetch("http://localhost:11434/api/tags");
    return res.ok;
  } catch {
    return false;
  }
}

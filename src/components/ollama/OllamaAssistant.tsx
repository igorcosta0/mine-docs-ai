import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { checkOllama } from "@/lib/ollama";

function useOllamaStatus() {
  const [checking, setChecking] = useState(true);
  const [ok, setOk] = useState<boolean | null>(null);

  const refresh = async () => {
    setChecking(true);
    try {
      const r = await checkOllama();
      setOk(r);
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  return { checking, ok, refresh };
}

const windowsCommands = [
  {
    label: "Sessão atual (PowerShell)",
    cmd: `$env:OLLAMA_ORIGINS = "http://localhost:5173,http://127.0.0.1:5173"\nollama serve`,
  },
  {
    label: "Permanente (reabra o PowerShell)",
    cmd: `setx OLLAMA_ORIGINS "http://localhost:5173,http://127.0.0.1:5173"\n# Feche e abra o PowerShell novamente\nollama serve`,
  },
  {
    label: "Baixar modelo (em outra aba)",
    cmd: `ollama pull llama3`,
  },
  {
    label: "Testar API",
    cmd: `Invoke-RestMethod -Uri "http://localhost:11434/api/tags"`,
  },
];

function CodeBlock({ code }: { code: string }) {
  const pretty = useMemo(() => code, [code]);
  const [copied, setCopied] = useState(false);
  return (
    <div className="rounded-md border bg-muted/40">
      <div className="flex items-center justify-between px-3 py-2">
        <span className="text-xs text-muted-foreground">PowerShell</span>
        <Button
          size="sm"
          variant="secondary"
          onClick={async () => {
            await navigator.clipboard.writeText(code);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
        >
          {copied ? "Copiado" : "Copiar"}
        </Button>
      </div>
      <pre className="overflow-x-auto p-3 text-sm"><code>{pretty}</code></pre>
    </div>
  );
}

const OllamaAssistant = () => {
  const { checking, ok, refresh } = useOllamaStatus();

  if (checking) return null;
  if (ok) return null;

  return (
    <Card className="border-destructive/30">
      <CardHeader>
        <CardTitle>Conectar ao Ollama (Windows)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Não foi possível acessar o Ollama em http://localhost:11434. Siga os passos abaixo e depois clique em "Testar novamente".
        </p>
        <ol className="list-decimal pl-5 space-y-3 text-sm">
          <li>Abra o PowerShell.</li>
          <li>Defina o CORS para permitir o Vite (porta 5173) e inicie o servidor:</li>
          <CodeBlock code={windowsCommands[0].cmd} />
          <li>Se preferir definir a variável de forma permanente:</li>
          <CodeBlock code={windowsCommands[1].cmd} />
          <li>Em outra janela, baixe um modelo (ex.: llama3):</li>
          <CodeBlock code={windowsCommands[2].cmd} />
          <li>Teste se a API responde:</li>
          <CodeBlock code={windowsCommands[3].cmd} />
        </ol>
        <div className="flex gap-2">
          <Button variant="hero" onClick={refresh}>Testar novamente</Button>
          <a
            className="text-sm underline text-foreground"
            href="https://github.com/ollama/ollama"
            target="_blank"
            rel="noreferrer"
          >
            Documentação do Ollama
          </a>
        </div>
      </CardContent>
    </Card>
  );
};

export default OllamaAssistant;

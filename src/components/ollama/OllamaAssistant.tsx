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

function CodeBlock({ code, label = "bash" }: { code: string; label?: string }) {
  const pretty = useMemo(() => code, [code]);
  const [copied, setCopied] = useState(false);
  return (
    <div className="rounded-md border bg-muted/40">
      <div className="flex items-center justify-between px-3 py-2">
        <span className="text-xs text-muted-foreground">{label}</span>
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

  const origins = useMemo(() => {
    const current = typeof window !== "undefined" ? window.location.origin : "";
    const allow = [
      "http://localhost:5173",
      "http://127.0.0.1:5173",
    ];
    if (current && !allow.includes(current)) allow.unshift(current);
    return allow.join(",");
  }, []);

  const displayedOrigin = useMemo(() => (typeof window !== "undefined" ? window.location.origin : ""), []);

  const windows = useMemo(
    () => [
      {
        label: "Sessão atual (PowerShell)",
        cmd: `$env:OLLAMA_ORIGINS = "${origins}"\nollama serve`,
      },
      {
        label: "Permanente (reabra o PowerShell)",
        cmd: `setx OLLAMA_ORIGINS "${origins}"\n# Feche e abra o PowerShell novamente\nollama serve`,
      },
      { label: "Baixar modelo (em outra aba)", cmd: `ollama pull llama3` },
      { label: "Testar API", cmd: `Invoke-RestMethod -Uri "http://localhost:11434/api/tags"` },
    ],
    [origins]
  );

  const nix = useMemo(
    () => [
      {
        label: "Sessão atual (bash/zsh)",
        cmd: `export OLLAMA_ORIGINS="${origins}"\nollama serve`,
      },
      {
        label: "Permanente (bash/zsh)",
        cmd: `echo 'export OLLAMA_ORIGINS="${origins}"' >> ~/.zshrc\n# ou ~/.bashrc\nsource ~/.zshrc\nollama serve`,
      },
      { label: "Baixar modelo (em outro terminal)", cmd: `ollama pull llama3` },
      { label: "Testar API", cmd: `curl http://localhost:11434/api/tags` },
    ],
    [origins]
  );

  if (checking) return null;
  if (ok) return null;

  return (
    <Card className="border-destructive/30">
      <CardHeader>
        <CardTitle>Conectar ao Ollama (Windows, macOS/Linux)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Não foi possível acessar o Ollama em http://localhost:11434. Inicie o serviço, configure CORS e depois clique em "Testar novamente".
        </p>
        <p className="text-xs text-muted-foreground">
          Incluímos automaticamente seu domínio permitido: <code>{displayedOrigin || "(indisponível)"}</code>
        </p>

        <section className="space-y-3">
          <h3 className="text-sm font-medium">Windows</h3>
          <ol className="list-decimal pl-5 space-y-3 text-sm">
            <li>Abra o PowerShell.</li>
            <li>Defina o CORS e inicie o servidor:</li>
            <CodeBlock code={windows[0].cmd} label="PowerShell" />
            <li>Opcional: definir de forma permanente:</li>
            <CodeBlock code={windows[1].cmd} label="PowerShell" />
            <li>Em outra janela, baixe um modelo (ex.: llama3):</li>
            <CodeBlock code={windows[2].cmd} label="PowerShell" />
            <li>Teste se a API responde:</li>
            <CodeBlock code={windows[3].cmd} label="PowerShell" />
          </ol>
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-medium">macOS / Linux</h3>
          <ol className="list-decimal pl-5 space-y-3 text-sm">
            <li>Abra o Terminal.</li>
            <li>Defina o CORS e inicie o servidor:</li>
            <CodeBlock code={nix[0].cmd} label="bash" />
            <li>Opcional: definir de forma permanente:</li>
            <CodeBlock code={nix[1].cmd} label="bash" />
            <li>Em outro terminal, baixe um modelo (ex.: llama3):</li>
            <CodeBlock code={nix[2].cmd} label="bash" />
            <li>Teste se a API responde:</li>
            <CodeBlock code={nix[3].cmd} label="bash" />
          </ol>
        </section>

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

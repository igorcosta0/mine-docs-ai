import { useState, useEffect } from "react";
import { AlertCircle, CheckCircle2, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AVAILABLE_MODELS, checkOllama, listAvailableModels } from "@/lib/ollama";

export function AgentConfig() {
  const [provider, setProvider] = useState("ollama");
  const [ollamaUrl, setOllamaUrl] = useState("http://localhost:11434");
  const [selectedModel, setSelectedModel] = useState("llama3");
  const [temperature, setTemperature] = useState([0.7]);
  const [maxTokens, setMaxTokens] = useState([2048]);
  const [isConnected, setIsConnected] = useState(false);
  const [installedModels, setInstalledModels] = useState<string[]>([]);
  const [isCheckingConnection, setIsCheckingConnection] = useState(false);

  useEffect(() => {
    checkInstalledModels();
  }, []);

  const checkInstalledModels = async () => {
    try {
      const models = await listAvailableModels();
      setInstalledModels(models);
    } catch (error) {
      console.error('Error checking installed models:', error);
    }
  };

  const testConnection = async () => {
    setIsCheckingConnection(true);
    try {
      const connected = await checkOllama();
      setIsConnected(connected);
      if (connected) {
        await checkInstalledModels();
      }
    } catch (error) {
      setIsConnected(false);
    } finally {
      setIsCheckingConnection(false);
    }
  };

  const isModelInstalled = (modelName: string) => {
    return installedModels.some(installed => 
      installed.includes(modelName) || modelName.includes(installed)
    );
  };

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-6">
        {/* Provider Selection */}
        <div className="space-y-3">
          <Label className="text-base font-semibold">🔌 Provedor de IA</Label>
          <RadioGroup value={provider} onValueChange={setProvider}>
            <div className="flex items-center space-x-2 p-3 rounded-lg border">
              <RadioGroupItem value="ollama" id="ollama" />
              <Label htmlFor="ollama" className="flex-1 cursor-pointer">
                <div className="flex items-center gap-2">
                  <span>Ollama (Local)</span>
                  <Badge variant="secondary" className="text-xs">Recomendado</Badge>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Privado, rápido, sem custos
                </div>
              </Label>
            </div>
            <div className="flex items-center space-x-2 p-3 rounded-lg border opacity-60">
              <RadioGroupItem value="openai" id="openai" disabled />
              <Label htmlFor="openai" className="flex-1">
                <span>OpenAI-Compatible</span>
                <div className="text-xs text-muted-foreground mt-1">
                  Nuvem, requer API key
                </div>
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* Ollama Config */}
        {provider === "ollama" && (
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="ollama-url">URL do Servidor</Label>
              <Input
                id="ollama-url"
                value={ollamaUrl}
                onChange={(e) => setOllamaUrl(e.target.value)}
                placeholder="http://localhost:11434"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ollama-model">Modelo</Label>
              <Select value={selectedModel} onValueChange={setSelectedModel}>
                <SelectTrigger id="ollama-model">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AVAILABLE_MODELS.map((model) => {
                    const installed = isModelInstalled(model.name);
                    return (
                      <SelectItem 
                        key={model.name} 
                        value={model.name}
                        disabled={!installed && installedModels.length > 0}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span>{model.displayName}</span>
                          {installed && (
                            <CheckCircle2 className="h-3 w-3 text-green-500 ml-2" />
                          )}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {AVAILABLE_MODELS.find(m => m.name === selectedModel)?.description}
              </p>
            </div>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={testConnection}
              disabled={isCheckingConnection}
            >
              {isCheckingConnection ? (
                <>
                  <Zap className="h-4 w-4 mr-2 animate-pulse" />
                  Verificando...
                </>
              ) : isConnected ? (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
                  Conectado ({installedModels.length} modelos)
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4 mr-2" />
                  Testar Conexão
                </>
              )}
            </Button>
          </div>
        )}

        {/* Operation Mode */}
        <div className="space-y-3">
          <Label className="text-base font-semibold">🎭 Modo de Operação</Label>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div>
                <div className="font-medium text-sm">Reativo</div>
                <div className="text-xs text-muted-foreground">Responde quando chamado</div>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg border opacity-60">
              <div>
                <div className="font-medium text-sm">Proativo</div>
                <div className="text-xs text-muted-foreground">Monitora eventos</div>
              </div>
              <Switch disabled />
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg border opacity-60">
              <div>
                <div className="font-medium text-sm">Autopilot</div>
                <div className="text-xs text-muted-foreground">Age automaticamente</div>
              </div>
              <Switch disabled />
            </div>
          </div>
        </div>

        {/* Parameters */}
        <div className="space-y-3">
          <Label className="text-base font-semibold">🎛️ Parâmetros</Label>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <Label className="text-sm">Temperature</Label>
                <span className="text-sm text-muted-foreground">{temperature[0]}</span>
              </div>
              <Slider
                value={temperature}
                onValueChange={setTemperature}
                max={1}
                step={0.1}
                className="w-full"
              />
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <Label className="text-sm">Max Tokens</Label>
                <span className="text-sm text-muted-foreground">{maxTokens[0]}</span>
              </div>
              <Slider
                value={maxTokens}
                onValueChange={setMaxTokens}
                max={4096}
                step={128}
                className="w-full"
              />
            </div>
          </div>
        </div>

        {/* Security */}
        <div className="space-y-3">
          <Label className="text-base font-semibold">🔐 Segurança</Label>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="local-logs" className="text-sm">Logs locais apenas</Label>
              <Switch id="local-logs" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="no-sensitive" className="text-sm">Não enviar dados sensíveis</Label>
              <Switch id="no-sensitive" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="debug" className="text-sm">Modo debug</Label>
              <Switch id="debug" />
            </div>
          </div>
        </div>

        {/* Info Banner */}
        <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 flex gap-2">
          <AlertCircle className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-muted-foreground">
            Esta é uma demonstração visual. A implementação completa incluirá integração real com Ollama e funcionalidades RAG.
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" className="flex-1">Restaurar</Button>
          <Button className="flex-1">Salvar</Button>
        </div>
      </div>
    </ScrollArea>
  );
}

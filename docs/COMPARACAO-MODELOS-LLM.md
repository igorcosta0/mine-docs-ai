# Comparação de Modelos LLM (Llama 3 vs Qwen 2.5)

## 📋 Visão Geral

Este projeto agora suporta múltiplos modelos LLM locais via Ollama, permitindo comparar a performance entre diferentes modelos durante o processamento do Data Lake.

## 🤖 Modelos Disponíveis

### 1. **Llama 3** (Meta)
- **Tamanho**: 4.7GB
- **Características**: Rápido e eficiente, excelente para tarefas gerais
- **Ideal para**: Processamento rápido de documentos, análises simples
- **Comando de instalação**: `ollama pull llama3`

### 2. **Qwen 2.5 (14B)** (Alibaba)
- **Tamanho**: 9GB
- **Características**: Otimizado para tarefas complexas, raciocínio avançado
- **Ideal para**: Análises técnicas profundas, extração de conhecimento especializado
- **Comando de instalação**: `ollama pull qwen2.5:14b`

### 3. **Qwen 2.5 (7B)** (Alibaba)
- **Tamanho**: 4.7GB
- **Características**: Versão menor e mais rápida do Qwen
- **Ideal para**: Balanço entre velocidade e capacidade de análise
- **Comando de instalação**: `ollama pull qwen2.5:7b`

## 🚀 Como Usar

### Passo 1: Instalar os Modelos

Antes de usar, instale os modelos desejados via terminal:

```bash
# Instalar Llama 3
ollama pull llama3

# Instalar Qwen 2.5 (14B)
ollama pull qwen2.5:14b

# Instalar Qwen 2.5 (7B)
ollama pull qwen2.5:7b
```

### Passo 2: Ativar Modo Offline

1. Acesse o **Data Lake** ou o **Assistente IA**
2. Ative o switch **"Offline"** ou **"Offline (Ollama)"**
3. O seletor de modelo aparecerá automaticamente

### Passo 3: Selecionar o Modelo

- No **Data Lake AI Assistant**: O seletor aparece abaixo do switch Offline
- No **Agent Dock** (assistente flutuante): Acesse as configurações no rodapé

### Passo 4: Executar Análises

Após selecionar o modelo, todas as operações usarão o modelo escolhido:
- Análise Completa do Data Lake
- Processamento de documentos
- Consultas ao especialista IA
- Geração de expertise

## 📊 Comparação de Performance

### Visualização Automática

A aba **"⚡ Performance"** no Data Lake AI Assistant mostra:

- **Tempo Médio de Resposta**: Quanto tempo cada modelo leva para processar
- **Tokens por Segundo**: Velocidade de geração de texto
- **Taxa de Sucesso**: Confiabilidade de cada modelo
- **Número de Testes**: Quantidade de execuções realizadas

### Métricas Capturadas Automaticamente

O sistema registra automaticamente:
- ✅ Tempo de resposta (em segundos)
- ✅ Velocidade de geração (tokens/segundo)
- ✅ Taxa de sucesso vs falhas
- ✅ Timestamp de cada execução

### Como Comparar

1. Execute a **Análise Completa** com o **Llama 3**
2. Note o tempo de processamento e resultados
3. Execute novamente com o **Qwen 2.5**
4. Acesse a aba **"⚡ Performance"** para ver a comparação

## 🏆 Qual Escolher?

### Escolha o Llama 3 se:
- ⚡ Precisa de velocidade máxima
- 💻 Tem recursos limitados de hardware
- 📄 Está processando documentos simples
- 🔄 Precisa de alta taxa de processamento

### Escolha o Qwen 2.5 (14B) se:
- 🧠 Precisa de análise técnica profunda
- 📚 Documentos são muito especializados
- 🎯 Qualidade é mais importante que velocidade
- 💪 Tem recursos de hardware robustos (>16GB RAM)

### Escolha o Qwen 2.5 (7B) se:
- ⚖️ Quer balanço entre velocidade e qualidade
- 💻 Recursos moderados de hardware
- 🔀 Documentos têm complexidade variada

## 💡 Dicas de Performance

### Otimização de Hardware

- **RAM Recomendada**: 
  - Llama 3: 8GB+
  - Qwen 7B: 8GB+
  - Qwen 14B: 16GB+

- **CPU**: Quanto mais cores, melhor o desempenho
- **GPU**: Ollama pode usar GPU se disponível (acelera muito!)

### Processamento em Lote

O sistema já processa **5 documentos em paralelo** por padrão. Com modelos mais rápidos como Llama 3, você pode:
- Aumentar o lote no código (`BATCH_SIZE = 10`)
- Processar mais documentos simultaneamente

### Cache e Reutilização

O sistema **não reprocessa** documentos já analisados, economizando tempo e recursos.

## 🔧 Configuração Avançada

### Testando Conexão

Use o botão **"Testar Conexão"** em **Configurações do Agente** para:
- ✅ Verificar se o Ollama está rodando
- ✅ Ver quantos modelos estão instalados
- ✅ Validar conectividade

### Performance Tracking

As métricas de performance são salvas em memória e limitadas a:
- **100 registros totais** (automaticamente limpa os mais antigos)
- **20 registros por modelo** para comparação
- Atualização em tempo real durante processamento

## 📈 Benchmarks Esperados

### Processamento de 50 Documentos Técnicos

| Modelo | Tempo Total | Conhecimentos Extraídos | Taxa Sucesso |
|--------|------------|------------------------|--------------|
| Llama 3 | ~8-12 min | 250-350 | 95-98% |
| Qwen 7B | ~10-15 min | 280-400 | 96-99% |
| Qwen 14B | ~15-20 min | 300-450 | 97-99% |

*Valores aproximados, variam com hardware e complexidade dos documentos*

## 🐛 Solução de Problemas

### Modelo não aparece na lista

```bash
# Verifique modelos instalados
ollama list

# Se não estiver instalado
ollama pull [nome-do-modelo]
```

### Erro de conexão

```bash
# Verifique se Ollama está rodando
ollama serve

# Configure CORS se necessário
export OLLAMA_ORIGINS=*
```

### Performance baixa

- Feche outros aplicativos pesados
- Verifique uso de RAM/CPU no gerenciador de tarefas
- Considere usar modelo menor (Llama 3 ou Qwen 7B)

## 🎯 Casos de Uso Recomendados

### Desenvolvimento Rápido
**Modelo**: Llama 3  
**Cenário**: Testar o sistema, desenvolvimento iterativo

### Produção Balanceada
**Modelo**: Qwen 2.5 (7B)  
**Cenário**: Uso diário, documentos variados

### Análise Crítica
**Modelo**: Qwen 2.5 (14B)  
**Cenário**: Projetos importantes, documentos complexos

## 📚 Próximos Passos

- Execute testes com ambos os modelos
- Compare os resultados na aba Performance
- Escolha o modelo que melhor atende suas necessidades
- Configure como padrão nas configurações do agente

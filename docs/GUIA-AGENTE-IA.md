# 🤖 Guia do Assistente IA - Mine Docs

## ✨ O que é?

O **Assistente IA** é um agente inteligente que está sempre disponível em todas as páginas do sistema através de um botão flutuante. Ele pode ajudar você com consultas técnicas, análise de documentos e muito mais!

## 🚀 Como Usar

### 1. Acessando o Assistente

- **Botão Flutuante**: No canto inferior direito de qualquer página, você verá um botão circular com o ícone 💬
- **Clique no botão** para abrir o assistente
- **Badge vermelho**: Indica mensagens não lidas (quando o agente detecta eventos)

### 2. Modos de Operação

#### 🔵 Modo Passivo (Padrão)
- O agente **responde apenas quando você pergunta**
- Ideal para consultas pontuais
- Não gera notificações automáticas

#### 🟢 Modo Proativo (Recomendado)
- O agente **monitora eventos do sistema**
- **Detecta automaticamente**:
  - 📄 Novos documentos enviados
  - ✅ Documentos indexados
  - 🔄 Duplicatas encontradas
  - ⚠️ Erros de processamento
- **Oferece sugestões** sem você precisar perguntar
- **Notificações inteligentes** quando você está em outra página

**Como ativar:**
1. Abra o assistente
2. Role até o final
3. Ative o switch "Modo Proativo"

### 3. Modo Offline vs Online

#### ☁️ Online (OpenAI) - Padrão
- Usa a API do OpenAI (GPT-4)
- **Vantagens**: Respostas mais precisas e rápidas
- **Requer**: Conexão com internet e chave API configurada

#### 💻 Offline (Ollama) - Privacidade Total
- Usa IA local rodando no seu computador
- **Vantagens**: 
  - ✅ Dados nunca saem do seu ambiente
  - ✅ Não precisa de conexão
  - ✅ Privacidade total
- **Requer**: Ollama instalado localmente

**Como alternar:**
1. Abra o assistente
2. Role até o final
3. Ative o switch "Offline (Ollama)"

## 💬 Exemplos de Uso

### Consultas Técnicas

```
Você: "Quais equipamentos de britagem temos cadastrados?"

Agente: "Encontrei 3 equipamentos de britagem no seu Data Lake:
1. Britador Cônico HP-500
   - Capacidade: 650 t/h
   - Fonte: folha-dados-2023.pdf
2. Britador de Mandíbula XR-800
   - Capacidade: 800 t/h
   - Fonte: especificacao-britagem.docx
..."
```

### Análise de Documentos

```
Você: "Quais normas ABNT são mais citadas nos documentos?"

Agente: "Analisando seus documentos, as normas mais citadas são:
1. ABNT NBR 13028 (8 menções)
2. ABNT NBR 12655 (5 menções)
3. ABNT NBR 6118 (4 menções)
..."
```

### Geração de Relatórios

```
Você: "Gere um resumo dos documentos de 2024"

Agente: "📊 Resumo dos documentos de 2024:
- Total: 15 documentos
- Tipos:
  • 5 Memoriais Descritivos
  • 4 Folhas de Dados
  • 3 Especificações Técnicas
  • 3 Outros
- Principais tópicos: Fundações, Britagem, Estruturas de Concreto
..."
```

## 🎯 Recursos Proativos

### 📄 Detecção de Upload
Quando você faz upload de documentos:
```
Agente: "📄 Detectei 3 novos documentos: 'Memorial-Fundacoes.pdf'. 
Quer que eu analise e sugira tags/categorias?"
```

### ✅ Indexação Concluída
Após processar documentos:
```
Agente: "✅ 5 documentos indexados com sucesso. 
Quer um resumo do conhecimento extraído?"
```

### 🔄 Duplicatas
Quando detecta duplicatas:
```
Agente: "🔄 Duplicata detectada: 'Especificacao-Bomba-X.pdf' 
já existe como 'Bomba-X-Rev2.pdf'"
```

### ⚠️ Erros
Se algo der errado:
```
Agente: "⚠️ Erro detectado: Falha ao processar documento. 
Precisa de ajuda para diagnosticar?"
```

## ⚙️ Configurações

### Acessando Configurações
1. Abra o assistente
2. Role até o final para ver os switches de configuração

### Opções Disponíveis

| Configuração | Descrição | Recomendação |
|-------------|-----------|--------------|
| **Modo Proativo** | Monitora eventos e oferece sugestões | ✅ Ativar para produtividade máxima |
| **Offline (Ollama)** | Usa IA local em vez da nuvem | Ativar se privacidade é prioridade |
| **Notificações** | Avisos quando em outra página | ✅ Manter ativado |

### Limpar Histórico
- Clique em "Limpar Histórico" para apagar todas as mensagens
- Útil para começar uma nova conversa limpa

## 🎨 Interface

### Estados do Botão

#### 🔵 Normal
- Botão azul no canto inferior direito
- Clique para abrir

#### 🔴 Com Notificações
- Badge vermelho com número de mensagens não lidas
- Exemplo: `3` mensagens

#### 🟢 Aberto
- Janela de chat completa
- 400px de largura, 600px de altura

#### 🟡 Minimizado
- Barra compacta no canto inferior direito
- Clique para expandir

### Controles

| Ícone | Função |
|-------|--------|
| 🗕 (Minimize) | Reduz para barra compacta |
| 🗖 (Maximize) | Expande para janela completa |
| ✕ (Close) | Fecha completamente (volta para botão) |
| ⚙️ (Settings) | Mostra/oculta configurações |

## 📊 Estatísticas

O agente rastreia automaticamente:
- **Mensagens trocadas**: Total de interações
- **Respostas IA**: Quantas vezes o agente respondeu
- **Fontes consultadas**: Documentos referenciados
- **Nível de confiança**: Precisão das respostas (0-100%)

## 🔒 Privacidade & Segurança

### Modo Online (OpenAI)
- ✅ Dados enviados via HTTPS criptografado
- ✅ OpenAI não treina em seus dados (política API)
- ⚠️ Requer conexão internet

### Modo Offline (Ollama)
- ✅ **Nada sai do seu computador**
- ✅ 100% privado e local
- ✅ Sem risco de vazamento de dados
- ✅ Funciona sem internet

## 🆘 Troubleshooting

### "Erro ao processar sua mensagem"
**Causas comuns:**
1. OpenAI API key não configurada
2. Ollama não está rodando (modo offline)
3. Sem documentos no Data Lake

**Solução:**
- Verifique se há documentos carregados
- Se usar modo offline, certifique-se que Ollama está rodando
- Tente alternar entre modo online/offline

### "Não encontrei informações relevantes"
**Causas:**
- Documentos ainda não foram indexados
- Pergunta muito específica sem dados correspondentes

**Solução:**
1. Vá para "Data Lake"
2. Clique em "Iniciar Análise Completa"
3. Aguarde indexação terminar
4. Tente perguntar novamente

### Botão não aparece
**Solução:**
- Recarregue a página (F5)
- Limpe o cache do navegador
- Verifique se está em uma página com AppLayout

## 💡 Dicas de Uso

### ✅ Perguntas Eficazes

**BOA:**
```
"Quais equipamentos temos com capacidade acima de 500 t/h?"
"Liste todos os documentos sobre fundações"
"Qual a norma mais recente para concreto?"
```

**RUIM:**
```
"O que há aqui?" (muito genérico)
"Sim" (sem contexto)
"???" (não é uma pergunta clara)
```

### 📝 Contexto é Importante

O agente lembra das mensagens anteriores na conversa:

```
Você: "Quais britadores temos?"
Agente: "Temos 3 britadores: HP-500, XR-800, GX-700"

Você: "Qual tem maior capacidade?"
Agente: "O XR-800 tem a maior capacidade: 800 t/h"
```

### 🎯 Use Comandos Específicos

```
"Gere um relatório de..."
"Liste todos os..."
"Compare X com Y"
"Resuma o documento..."
"Quais são as diferenças entre..."
```

## 🚀 Produtividade

### Economia de Tempo Estimada

| Tarefa | Sem Agente | Com Agente | Economia |
|--------|------------|------------|----------|
| Buscar info em docs | 15 min | 10 seg | ⚡ 90x |
| Gerar relatório | 1 hora | 2 min | ⚡ 30x |
| Encontrar normas | 20 min | 5 seg | ⚡ 240x |
| Comparar equipamentos | 30 min | 30 seg | ⚡ 60x |

### Fluxo Recomendado

1. **📤 Upload documentos** → Agente detecta e oferece análise
2. **✅ Aceita análise** → Agente extrai conhecimento automaticamente
3. **💬 Faça perguntas** → Respostas instantâneas baseadas nos docs
4. **📊 Gere relatórios** → Compilados automáticos quando precisar

## 🎓 Casos de Uso Avançados

### Para Engenheiros
```
"Liste todos os equipamentos por fabricante"
"Quais documentos precisam de revisão?"
"Compare as especificações técnicas de X e Y"
```

### Para Gerentes
```
"Gere um dashboard executivo do Data Lake"
"Quantos documentos foram adicionados este mês?"
"Quais áreas técnicas estão bem documentadas?"
```

### Para Auditores
```
"Quais documentos não seguem a norma ABNT X?"
"Liste não-conformidades encontradas"
"Gere relatório de compliance"
```

## 📞 Suporte

Se tiver problemas ou sugestões:
1. Limpe o histórico do chat
2. Tente reload da página
3. Verifique os logs do console (F12)
4. Entre em contato com o suporte técnico

---

**Última atualização:** 2025-01-02
**Versão do Agente:** 2.0 (Fase 2 - Proativo)

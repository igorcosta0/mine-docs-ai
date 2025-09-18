# 🚀 Sistema Híbrido: Lovable + Bolt.new

Este projeto foi desenvolvido com um **sistema híbrido de IA** que funciona perfeitamente em ambas as plataformas.

## 🎯 Como Funciona

### Detecção Automática
O sistema detecta automaticamente a plataforma onde está rodando:
- ✅ **Lovable** - Sistema híbrido com Ollama local + OpenAI
- ✅ **Bolt.new** - IA via OpenAI (cloud-only)
- ✅ **Local** - Sistema híbrido com Ollama local + OpenAI

### Indicador Visual
No canto superior direito, você verá um indicador mostrando:
- 🟦 **Bolt.new** - Rodando em nuvem
- 🟣 **Lovable** - Sistema híbrido ativo  
- 🟢 **Local** - Desenvolvimento local

## 🔄 Migração Entre Plataformas

### De Lovable para Bolt.new

1. **Via GitHub (Recomendado)**:
   - No Lovable, conecte ao GitHub: `GitHub → Connect to GitHub`
   - No Bolt.new, importe: `Import from GitHub`
   - ✅ Código migrado automaticamente

2. **Via Upload Manual**:
   - No Lovable, baixe o projeto
   - No Bolt.new, faça upload do arquivo ZIP
   - ⚠️ Histórico perdido, mas funciona

### De Bolt.new para Lovable

1. **Via GitHub**:
   - No Bolt.new, conecte ao GitHub
   - No Lovable, importe o repositório
   - ✅ Sync bidirecional ativo

## 🤖 Sistema de IA

### No Lovable
```
🔄 SISTEMA HÍBRIDO
├── 1º Tenta Ollama (local, gratuito)
├── 2º Fallback OpenAI (se configurado)
└── ✅ Melhor de ambos os mundos
```

### No Bolt.new  
```
☁️ CLOUD-ONLY
├── Usa OpenAI automaticamente
├── Não precisa de Ollama local
└── ✅ Funciona imediatamente
```

## ⚙️ Configuração

### Chaves de API
As chaves são configuradas automaticamente via Supabase:
- `OPENAI_API_KEY` - Para OpenAI GPT
- Outras APIs disponíveis via Edge Functions

### Ollama (Apenas Lovable/Local)
```bash
# Instalar Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# Iniciar servidor
ollama serve

# Instalar modelo
ollama pull llama3
```

## 🚦 Status dos Provedores

O dashboard mostra o status em tempo real:
- ✅ **Disponível** - Provider funcionando
- ❌ **Indisponível** - Provider offline/não configurado
- 🔄 **Auto** - Sistema escolhe o melhor

## 📈 Funcionalidades por Plataforma

| Funcionalidade | Lovable | Bolt.new | Local |
|----------------|---------|----------|-------|
| IA Local (Ollama) | ✅ | ❌ | ✅ |
| IA Cloud (OpenAI) | ✅ | ✅ | ✅ |
| Hot Reload | ✅ | ✅ | ✅ |
| GitHub Sync | ✅ | Manual | Manual |
| Deploy Automático | ✅ | ✅ | ❌ |
| Alterações em Tempo Real | ✅ | ✅ | ✅ |

## 🔧 Vantagens do Sistema Híbrido

### Para Desenvolvimento
- **Lovable**: Ollama gratuito + backup OpenAI
- **Local**: Controle total + privacidade

### Para Produção  
- **Bolt.new**: Deploy imediato + OpenAI confiável
- **Lovable**: GitHub sync + deploy automático

## 🎉 Resultado

Você tem **um projeto, múltiplas plataformas**:
- Desenvolva no Lovable com IA local gratuita
- Deploy no Bolt.new com IA cloud confiável  
- Transição suave sem alterações de código
- Sistema inteligente se adapta automaticamente

## 🔗 Links Úteis

- [Lovable](https://lovable.dev) - Plataforma de desenvolvimento
- [Bolt.new](https://bolt.new) - Deploy e execução em nuvem
- [Ollama](https://ollama.ai) - IA local gratuita
- [OpenAI](https://openai.com) - API de IA em nuvem

---

💡 **Dica**: O indicador visual no canto superior direito sempre mostra onde você está rodando e quais capacidades estão disponíveis!
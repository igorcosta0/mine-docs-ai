import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { generateWithOllama } from '@/lib/ollama';
import { DocumentType, BaseFields } from '@/types';
import { DOC_TYPES } from '@/config/documentTypes';
import { getUserKnowledge, DocumentKnowledge } from '@/lib/knowledgeProcessor';
import { Sparkles, MessageCircle, CheckCircle, AlertCircle, Lightbulb, Loader2, Brain } from 'lucide-react';

interface DocumentAIAssistantProps {
  documentType: DocumentType;
  formData: Partial<BaseFields & Record<string, string>>;
  onSuggestionApply: (field: string, value: string) => void;
}

interface AISuggestion {
  field: string;
  suggestion: string;
  confidence: 'high' | 'medium' | 'low';
  type: 'improvement' | 'completion' | 'correction';
}

export const DocumentAIAssistant: React.FC<DocumentAIAssistantProps> = ({
  documentType,
  formData,
  onSuggestionApply
}) => {
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [chatResponse, setChatResponse] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [userKnowledge, setUserKnowledge] = useState<DocumentKnowledge[]>([]);
  const [knowledgeLoaded, setKnowledgeLoaded] = useState(false);

  const docConfig = DOC_TYPES[documentType];

  // Carregar conhecimento do usuário
  const loadUserKnowledge = async () => {
    if (knowledgeLoaded) return;
    
    try {
      const knowledge = await getUserKnowledge(
        documentType,
        undefined,
        formData.titulo ? [formData.titulo.toLowerCase()] : undefined
      );
      setUserKnowledge(knowledge);
      setKnowledgeLoaded(true);
    } catch (error) {
      console.error('Erro ao carregar conhecimento:', error);
    }
  };

  // Gerar sugestões rápidas e específicas
  const generateSuggestions = async () => {
    if (!formData.titulo && !formData.descricao) return;
    
    setLoading(true);
    try {
      console.log('Gerando sugestões para:', documentType, formData);
      
      // Buscar conhecimento específico com base no título atual
      const titleWords = formData.titulo?.toLowerCase().split(' ').filter(w => w.length > 2) || [];
      const descWords = formData.descricao?.toLowerCase().split(' ').filter(w => w.length > 2) || [];
      const allKeywords = [...titleWords, ...descWords].slice(0, 8);
      
      const relevantKnowledge = await getUserKnowledge(
        documentType,
        undefined,
        allKeywords.length > 0 ? allKeywords : undefined
      );

      console.log('Conhecimento encontrado:', relevantKnowledge.length, 'itens');

      // Mapear campos específicos do tipo de documento
      const getAvailableFields = () => {
        const baseFields = ['titulo', 'descricao', 'normas'];
        if (documentType === 'memorial') {
          return [...baseFields, 'metodologia', 'justificativas', 'escopo'];
        } else if (documentType === 'especificacao') {
          return [...baseFields, 'requisitos', 'tolerancias'];
        } else if (documentType === 'folha-dados') {
          return [...baseFields, 'material', 'dimensoes', 'capacidade'];
        }
        return baseFields;
      };

      const availableFields = getAvailableFields();
      const filledFields = availableFields.filter(field => formData[field] && formData[field].trim());
      const emptyFields = availableFields.filter(field => !formData[field] || !formData[field].trim());

      // Criar contexto específico baseado no tipo de documento
      const specificContext = topKnowledge => {
        if (documentType === 'memorial') {
          return `\nCONTEXTO PARA MEMORIAL DESCRITIVO:
CAMPOS DISPONÍVEIS: ${availableFields.join(', ')}
CAMPOS PREENCHIDOS: ${filledFields.join(', ')} 
CAMPOS VAZIOS: ${emptyFields.join(', ')}

ORIENTAÇÕES TÉCNICAS:
- Metodologia: procedimentos, etapas, sequências, premissas técnicas
- Justificativas: critérios de projeto, alternativas avaliadas, bases de cálculo
- Escopo: delimitação clara do fornecimento, interfaces, exclusões

${topKnowledge.length > 0 ? `CONHECIMENTO ESPECÍFICO (${topKnowledge.length} itens):
${topKnowledge.map((k, i) => `${i+1}. ${k.title}: ${k.content.substring(0, 150)}`).join('\n')}` : 'Nenhum conhecimento específico encontrado.'}`;
        } else if (documentType === 'especificacao') {
          return `\nCONTEXTO PARA ESPECIFICAÇÃO TÉCNICA:
CAMPOS DISPONÍVEIS: ${availableFields.join(', ')}
CAMPOS PREENCHIDOS: ${filledFields.join(', ')}
CAMPOS VAZIOS: ${emptyFields.join(', ')}

ORIENTAÇÕES TÉCNICAS:
- Requisitos: critérios mensuráveis, normas aplicáveis
- Tolerâncias: limites aceitáveis, métodos de medição

${topKnowledge.length > 0 ? `CONHECIMENTO ESPECÍFICO (${topKnowledge.length} itens):
${topKnowledge.map((k, i) => `${i+1}. ${k.title}: ${k.content.substring(0, 150)}`).join('\n')}` : 'Nenhum conhecimento específico encontrado.'}`;
        } else if (documentType === 'folha-dados') {
          return `\nCONTEXTO PARA FOLHA DE DADOS:
CAMPOS DISPONÍVEIS: ${availableFields.join(', ')}
CAMPOS PREENCHIDOS: ${filledFields.join(', ')}
CAMPOS VAZIOS: ${emptyFields.join(', ')}

ORIENTAÇÕES TÉCNICAS:
- Material: especificação completa, normas
- Dimensões: medidas principais, tolerâncias
- Capacidade: valores nominais, condições operacionais

${topKnowledge.length > 0 ? `CONHECIMENTO ESPECÍFICO (${topKnowledge.length} itens):
${topKnowledge.map((k, i) => `${i+1}. ${k.title}: ${k.content.substring(0, 150)}`).join('\n')}` : 'Nenhum conhecimento específico encontrado.'}`;
        }
        return '';
      };

      // Focar no conhecimento mais relevante
      const topKnowledge = relevantKnowledge.slice(0, 5);

      const prompt = `Você é um assistente especializado em ${docConfig.label} para engenharia industrial.

DOCUMENTO ATUAL:
- Tipo: ${documentType}
- Título: "${formData.titulo || '[vazio]'}"
- Descrição: "${formData.descricao || '[vazio]'}"
- Normas: "${formData.normas || '[vazio]'}"
${docConfig.technical.map(field => `- ${field.label}: "${formData[field.name] || '[vazio]'}"`).join('\n')}${specificContext(topKnowledge)}

TAREFA: Gere 2-3 sugestões PRÁTICAS e ESPECÍFICAS para os campos mais relevantes.

PRIORIDADE DE SUGESTÕES:
1. Campos vazios mais importantes (metodologia, justificativas, escopo para memorial)
2. Melhoria de campos preenchidos
3. Padronização e normas técnicas

FORMATO OBRIGATÓRIO - use EXATAMENTE este padrão:
SUGESTAO_INICIO
CAMPO: [${availableFields.join('|')}]
TEXTO: [sugestão específica com terminologia técnica - mínimo 80 caracteres]
CONFIANCA: [alta|media|baixa]
TIPO: [completar|melhorar|padronizar]
SUGESTAO_FIM

EXEMPLOS VÁLIDOS:
SUGESTAO_INICIO
CAMPO: metodologia
TEXTO: Detalhe a sequência de cálculos estruturais conforme NBR 8800, incluindo verificação de estabilidade global e local, análise de fadiga para estruturas sujeitas a carregamentos cíclicos e dimensionamento das ligações soldadas e parafusadas.
CONFIANCA: alta
TIPO: completar
SUGESTAO_FIM

IMPORTANTE: 
- Foque APENAS nos campos do formulário atual
- Use terminologia técnica específica da engenharia industrial
- Seja objetivo e evite generalidades
- Priorize campos vazios relevantes ao documento`;

      console.log('Enviando prompt para Ollama...', prompt.substring(0, 200));
      const response = await generateWithOllama('llama3', prompt);
      console.log('Resposta do Ollama:', response.substring(0, 300));
      
      // Parser robusto que aceita múltiplos formatos
      let parsedSuggestions: AISuggestion[] = [];
      
      // Primeiro, tenta o formato estruturado
      const suggestionMatches = response.match(/SUGESTAO_INICIO([\s\S]*?)SUGESTAO_FIM/g);
      
      if (suggestionMatches && suggestionMatches.length > 0) {
        console.log('Encontradas', suggestionMatches.length, 'sugestões no formato estruturado');
        
        parsedSuggestions = suggestionMatches.map((match, index) => {
          try {
            const content = match.replace(/SUGESTAO_INICIO|SUGESTAO_FIM/g, '').trim();
            const lines = content.split('\n').map(l => l.trim()).filter(l => l);
            
            let field = '';
            let suggestion = '';
            let confidence: 'high' | 'medium' | 'low' = 'medium';
            let type: 'improvement' | 'completion' | 'correction' = 'improvement';
            
            for (const line of lines) {
              if (line.startsWith('CAMPO:')) {
                field = line.replace('CAMPO:', '').trim().toLowerCase();
              } else if (line.startsWith('TEXTO:')) {
                suggestion = line.replace('TEXTO:', '').trim();
              } else if (line.startsWith('CONFIANCA:')) {
                const confidenceText = line.replace('CONFIANCA:', '').trim().toLowerCase();
                if (confidenceText === 'alta' || confidenceText === 'high') confidence = 'high';
                else if (confidenceText === 'media' || confidenceText === 'média' || confidenceText === 'medium') confidence = 'medium';
                else confidence = 'low';
              } else if (line.startsWith('TIPO:')) {
                const typeText = line.replace('TIPO:', '').trim().toLowerCase();
                if (typeText === 'completar' || typeText === 'completion') type = 'completion';
                else if (typeText === 'melhorar' || typeText === 'improvement') type = 'improvement';
                else if (typeText === 'padronizar' || typeText === 'correction') type = 'correction';
              }
            }
            
            // Validar se o campo existe nos campos disponíveis
            if (field && suggestion && suggestion.length > 20 && availableFields.includes(field)) {
              console.log(`Sugestão estruturada ${index + 1}:`, { field, suggestion: suggestion.substring(0, 50), confidence, type });
              return { field, suggestion, confidence, type };
            }
            
            return null;
          } catch (error) {
            console.error('Erro ao processar sugestão estruturada:', error);
            return null;
          }
        }).filter(s => s !== null) as AISuggestion[];
      } else {
        // Fallback: parser para formato alternativo (**SUGESTÃO N**)
        console.log('Tentando formato alternativo de sugestões...');
        
        const alternativeMatches = response.match(/\*\*SUGESTÃO \d+\*\*([\s\S]*?)(?=\*\*SUGESTÃO \d+\*\*|$)/g);
        
        if (alternativeMatches) {
          console.log('Encontradas', alternativeMatches.length, 'sugestões no formato alternativo');
          
          parsedSuggestions = alternativeMatches.map((match, index) => {
            try {
              const lines = match.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('**SUGESTÃO'));
              
              let field = '';
              let suggestion = '';
              let confidence: 'high' | 'medium' | 'low' = 'medium';
              let type: 'improvement' | 'completion' | 'correction' = 'improvement';
              
              for (const line of lines) {
                if (line.toLowerCase().includes('campo:') || line.toLowerCase().includes('field:')) {
                  const fieldMatch = line.match(/campo:\s*([^,\n]*)/i) || line.match(/field:\s*([^,\n]*)/i);
                  if (fieldMatch) {
                    field = fieldMatch[1].trim().toLowerCase();
                  }
                } else if (line.toLowerCase().includes('texto:') || line.toLowerCase().includes('text:')) {
                  const textMatch = line.match(/texto:\s*(.*)/i) || line.match(/text:\s*(.*)/i);
                  if (textMatch) {
                    suggestion = textMatch[1].trim();
                  }
                } else if (line.toLowerCase().includes('confianca:') || line.toLowerCase().includes('confidence:')) {
                  if (line.toLowerCase().includes('alta') || line.toLowerCase().includes('high')) confidence = 'high';
                  else if (line.toLowerCase().includes('baixa') || line.toLowerCase().includes('low')) confidence = 'low';
                } else if (line.toLowerCase().includes('tipo:') || line.toLowerCase().includes('type:')) {
                  if (line.toLowerCase().includes('completar') || line.toLowerCase().includes('completion')) type = 'completion';
                  else if (line.toLowerCase().includes('padronizar') || line.toLowerCase().includes('correction')) type = 'correction';
                }
                
                // Se não encontrou campo/texto estruturado, tenta extrair do texto livre
                if (!field || !suggestion) {
                  const fieldKeywords = ['título', 'title', 'descrição', 'description', 'normas', 'standards', 'metodologia', 'methodology', 'justificativas', 'justifications', 'escopo', 'scope'];
                  
                  for (const keyword of fieldKeywords) {
                    if (line.toLowerCase().includes(keyword.toLowerCase()) && suggestion.length < 10) {
                      field = keyword.toLowerCase().replace('título', 'titulo').replace('descrição', 'descricao');
                      suggestion = line.length > 50 ? line : suggestion;
                      break;
                    }
                  }
                }
              }
              
              // Se ainda não encontrou, usa toda a sugestão como texto
              if (!suggestion && lines.length > 0) {
                suggestion = lines.join(' ').replace(/campo:|texto:|confianca:|tipo:/gi, '').trim();
                if (!field && suggestion.toLowerCase().includes('metodologia')) field = 'metodologia';
                else if (!field && suggestion.toLowerCase().includes('justificativa')) field = 'justificativas';
                else if (!field && suggestion.toLowerCase().includes('escopo')) field = 'escopo';
                else if (!field && suggestion.toLowerCase().includes('norma')) field = 'normas';
                else if (!field) field = emptyFields[index] || availableFields[index] || 'descricao';
              }
              
              if (field && suggestion && suggestion.length > 20 && availableFields.includes(field)) {
                console.log(`Sugestão alternativa ${index + 1}:`, { field, suggestion: suggestion.substring(0, 50), confidence, type });
                return { field, suggestion, confidence, type };
              }
              
              return null;
            } catch (error) {
              console.error('Erro ao processar sugestão alternativa:', error);
              return null;
            }
          }).filter(s => s !== null) as AISuggestion[];
        }
      }
      
      console.log('Sugestões processadas:', parsedSuggestions.length);
      setSuggestions(parsedSuggestions);
      
      if (parsedSuggestions.length === 0) {
        console.log('Nenhuma sugestão encontrada em nenhum formato');
        console.log('Resposta completa:', response);
      }
    } catch (error) {
      console.error('Erro ao gerar sugestões:', error);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  // Chat especializado com conhecimento específico
  const handleChatSubmit = async () => {
    if (!chatMessage.trim()) return;
    
    setChatLoading(true);
    try {
      console.log('Processando pergunta do chat:', chatMessage);
      
      // Buscar conhecimento específico para a pergunta de forma mais inteligente
      const queryWords = chatMessage.toLowerCase()
        .split(' ')
        .filter(w => w.length > 3)
        .slice(0, 5);
      
      // Buscar também com base no título do documento atual
      const documentWords = formData.titulo ? 
        formData.titulo.toLowerCase().split(' ').filter(w => w.length > 2) : [];
      
      const allKeywords = [...queryWords, ...documentWords];
      
      const relevantKnowledge = await getUserKnowledge(
        documentType,
        undefined,
        allKeywords
      );

      console.log('Conhecimento para chat:', relevantKnowledge.length, 'itens');

      // Priorizar conhecimento mais relevante para a pergunta
      const specificKnowledge = relevantKnowledge.filter(k => 
        queryWords.some(word => 
          k.title.toLowerCase().includes(word) || 
          k.content.toLowerCase().includes(word) ||
          k.keywords.some(keyword => keyword.toLowerCase().includes(word))
        )
      );

      const knowledgeToUse = specificKnowledge.length > 0 ? specificKnowledge : relevantKnowledge;

      // Contexto específico baseado no tipo de documento
      const specificPromptContext = documentType === 'memorial' 
        ? `\nESPECÍFICO PARA MEMORIAL DESCRITIVO:
- Metodologia: explique procedimentos, etapas, sequências de trabalho
- Justificativas técnicas: fundamente decisões com critérios objetivos
- Escopo: delimite claramente fornecimentos, interfaces e responsabilidades
- Use linguagem técnica apropriada para engenharia industrial`
        : documentType === 'especificacao'
        ? `\nESPECÍFICO PARA ESPECIFICAÇÃO TÉCNICA:
- Requisitos: defina critérios mensuráveis e verificáveis
- Tolerâncias: especifique limites aceitáveis
- Critérios de aceitação: estabeleça métodos de verificação`
        : `\nESPECÍFICO PARA FOLHA DE DADOS:
- Parâmetros técnicos: forneça valores numéricos precisos
- Especificações: detalhe características físicas e operacionais`;

      const specificContext = knowledgeToUse.length > 0 
        ? `\n\nCONHECIMENTO ESPECÍFICO DO SEU DATA LAKE (${knowledgeToUse.length} itens relevantes):
${knowledgeToUse.slice(0, 3).map((k, i) => 
  `${i+1}. ${k.title}: ${k.content.substring(0, 200)}`
).join('\n\n')}`
        : '\n\n[Nenhum conhecimento específico encontrado no Data Lake para esta pergunta]';

      const prompt = `Especialista em ${docConfig.label} para engenharia industrial.
Documento atual: "${formData.titulo || 'Sem título'}" (Tipo: ${documentType})${specificPromptContext}

PERGUNTA: "${chatMessage}"${specificContext}

INSTRUÇÕES:
1. Use APENAS o conhecimento específico do Data Lake quando disponível
2. Seja TÉCNICO, ESPECÍFICO e PRÁTICO - evite respostas genéricas
3. Para memorial descritivo: foque em metodologia, justificativas e escopo
4. Se há conhecimento relevante, dê resposta detalhada baseada nele
5. Se não há conhecimento específico, seja honesto e sugira adicionar mais documentos
6. Referencie especificamente os itens de conhecimento utilizados
7. Use terminologia técnica apropriada para engenharia industrial

Resposta técnica especializada:`;

      console.log('Enviando prompt do chat para Ollama...');
      const response = await generateWithOllama('llama3', prompt);
      console.log('Resposta do chat recebida:', response.substring(0, 100));
      
      setChatResponse(response);
      setChatMessage('');
    } catch (error) {
      console.error('Erro no chat:', error);
      setChatResponse('Erro ao processar sua pergunta. Verifique se o Ollama está funcionando.');
    } finally {
      setChatLoading(false);
    }
  };

  // Carregar conhecimento ao montar o componente
  useEffect(() => {
    loadUserKnowledge();
  }, [documentType]);

  // Sugestões mais rápidas (1 segundo de debounce)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.titulo || formData.descricao) {
        generateSuggestions();
      }
    }, 1000); // Debounce reduzido para 1 segundo

    return () => clearTimeout(timer);
  }, [formData.titulo, formData.descricao, documentType, knowledgeLoaded]);

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'high': return 'bg-green-100 text-green-800 border-green-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'improvement': return <Sparkles className="h-4 w-4" />;
      case 'completion': return <CheckCircle className="h-4 w-4" />;
      case 'correction': return <AlertCircle className="h-4 w-4" />;
      default: return <Lightbulb className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Base de Conhecimento */}
      {userKnowledge.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              Conhecimento Aplicável ({userKnowledge.length} itens)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {userKnowledge.slice(0, 5).map((knowledge, index) => (
                <div key={index} className="text-sm p-2 bg-muted/50 rounded border-l-4 border-primary/30">
                  <div className="font-medium">{knowledge.title}</div>
                  <div className="text-muted-foreground text-xs">
                    {knowledge.content.substring(0, 100)}...
                  </div>
                  <div className="flex gap-1 mt-1">
                    {knowledge.keywords.slice(0, 3).map((keyword, i) => (
                      <Badge key={i} variant="outline" className="text-xs px-1 py-0">
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sugestões Automáticas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Sugestões da IA
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {suggestions.length === 0 && !loading ? (
            <div className="text-center py-8 text-muted-foreground">
              <Lightbulb className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Preencha o título e descrição para receber sugestões da IA</p>
            </div>
          ) : (
            <div className="space-y-3">
              {suggestions.map((suggestion, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getTypeIcon(suggestion.type)}
                      <span className="font-medium capitalize">{suggestion.field}</span>
                    </div>
                    <Badge 
                      variant="outline" 
                      className={getConfidenceColor(suggestion.confidence)}
                    >
                      {suggestion.confidence === 'high' ? 'Alta confiança' : 
                       suggestion.confidence === 'medium' ? 'Média confiança' : 'Baixa confiança'}
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-muted-foreground">
                    {suggestion.suggestion}
                  </p>
                  
                  {/* Orientações por nível de confiança */}
                  <div className="text-xs p-2 rounded bg-muted/30">
                    {suggestion.confidence === 'high' && (
                      <div className="flex items-center gap-1 text-green-700">
                        <CheckCircle className="h-3 w-3" />
                        <span>Alta confiança: Use sem hesitar, baseada em conhecimento específico</span>
                      </div>
                    )}
                    {suggestion.confidence === 'medium' && (
                      <div className="flex items-center gap-1 text-yellow-700">
                        <AlertCircle className="h-3 w-3" />
                        <span>Média confiança: Revise antes de aplicar</span>
                      </div>
                    )}
                    {suggestion.confidence === 'low' && (
                      <div className="flex items-center gap-1 text-red-700">
                        <Lightbulb className="h-3 w-3" />
                        <span>Baixa confiança: Use como ponto de partida, personalize bastante</span>
                      </div>
                    )}
                  </div>
                  
                  <Button 
                    size="sm" 
                    variant={suggestion.confidence === 'high' ? 'default' : 'outline'}
                    onClick={() => {
                      // Mapear nomes de campos corretamente
                      const fieldMapping: { [key: string]: string } = {
                        'título': 'titulo',
                        'titulo': 'titulo', 
                        'descrição': 'descricao',
                        'descricao': 'descricao',
                        'normas': 'normas',
                        'metodologia': 'metodologia',
                        'justificativas': 'justificativas',
                        'escopo': 'escopo'
                      };
                      const mappedField = fieldMapping[suggestion.field.toLowerCase()] || suggestion.field.toLowerCase();
                      onSuggestionApply(mappedField, suggestion.suggestion);
                    }}
                    className="w-full"
                  >
                    {suggestion.confidence === 'high' ? '✓ Aplicar (Recomendado)' : 
                     suggestion.confidence === 'medium' ? '⚠ Aplicar (Revisar)' : 
                     '💡 Usar como Base'}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Chat com IA */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-primary" />
            Pergunte à IA
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Textarea
              placeholder="Digite sua dúvida sobre o documento..."
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
              rows={3}
            />
            <Button 
              onClick={handleChatSubmit} 
              disabled={chatLoading || !chatMessage.trim()}
              className="w-full"
            >
              {chatLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Perguntar
                </>
              )}
            </Button>
          </div>
          
          {chatResponse && (
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Sparkles className="h-4 w-4 text-primary" />
                Resposta da IA
              </div>
              <div className="text-sm whitespace-pre-wrap">
                {chatResponse}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dicas Rápidas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-primary" />
            Dicas para {docConfig.label}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex items-start gap-2">
              <span className="text-primary mt-1">•</span>
              <span>Seja específico no título para identificação clara</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-primary mt-1">•</span>
              <span>Inclua normas técnicas aplicáveis (ABNT, ISO, ASTM)</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-primary mt-1">•</span>
              <span>Descreva o contexto e objetivo do documento</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-primary mt-1">•</span>
              <span>Use terminologia técnica adequada à área</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
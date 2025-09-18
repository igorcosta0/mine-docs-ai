import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { aiProvider } from '@/lib/aiProvider';
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
      // Buscar conhecimento específico com base no título atual
      const titleWords = formData.titulo?.toLowerCase().split(' ').filter(w => w.length > 2) || [];
      const relevantKnowledge = await getUserKnowledge(
        documentType,
        undefined,
        titleWords.length > 0 ? titleWords : undefined
      );

      // Calcular correspondência para determinar confiança
      const calculateConfidence = (knowledge: DocumentKnowledge): 'high' | 'medium' | 'low' => {
        if (!formData.titulo) return 'low';
        
        const titleLower = formData.titulo.toLowerCase();
        const knowledgeTitle = knowledge.title.toLowerCase();
        const knowledgeKeywords = knowledge.keywords.map(k => k.toLowerCase());
        
        // Alta confiança: correspondência exata de título ou palavras-chave
        if (knowledgeTitle.includes(titleLower) || 
            titleWords.some(word => knowledgeKeywords.includes(word)) ||
            knowledge.confidence_score >= 0.9) {
          return 'high';
        }
        
        // Média confiança: correspondência parcial
        if (titleWords.some(word => knowledgeTitle.includes(word)) ||
            knowledge.confidence_score >= 0.7) {
          return 'medium';
        }
        
        return 'low';
      };

      // Focar no conhecimento mais relevante e ordenar por confiança
      const topKnowledge = relevantKnowledge
        .slice(0, 5)
        .sort((a, b) => calculateConfidence(b) === 'high' ? 1 : -1);

      const knowledgeContext = topKnowledge.length > 0 
        ? `\nCONHECIMENTO ESPECÍFICO APLICÁVEL (${topKnowledge.length} itens):
${topKnowledge.map((k, i) => `${i+1}. ${k.title}: ${k.content.substring(0, 200)}`).join('\n')}`
        : '';

      const prompt = `Assistente especializado para ${docConfig.label} com análise inteligente de contexto. 

DADOS ATUAIS DO DOCUMENTO:
Título: "${formData.titulo || '[vazio]'}"
Descrição: "${formData.descricao || '[vazio]'}"
Normas: "${formData.normas || '[vazio]'}"${knowledgeContext}

ALGORITMO DE SUGESTÕES INTELIGENTES:
1. Para ALTA confiança: use conhecimento específico com correspondência exata
2. Para MÉDIA confiança: use conhecimento com correspondência parcial ou interpretação
3. Para BAIXA confiança: use apenas quando necessário completar campo essencial

REGRAS ESPECÍFICAS:
- Analise o título e identifique padrões técnicos no conhecimento disponível
- Para descrições, use especificações técnicas específicas do conhecimento
- Para normas, referencie normas específicas encontradas no conhecimento técnico
- Priorize informações numéricas, modelos, fabricantes, especificações

CAMPOS PARA SUGERIR:
- título: melhorar precisão técnica e nomenclatura padrão
- descricao: completar com especificações técnicas detalhadas
- normas: adicionar normas técnicas específicas aplicáveis

FORNEÇA 2-4 SUGESTÕES TÉCNICAS ESPECÍFICAS:

Formato exato:
CAMPO: [título/descricao/normas]
SUGESTÃO: [texto específico baseado no conhecimento técnico do Data Lake]
CONFIANÇA: [alta/média/baixa]
TIPO: [melhoria/completar/padronizar]
FONTE: [conhecimento_específico/interpretação_técnica/sugestão_padrão]

FOQUE EM: aplicar conhecimento técnico específico, padronizar nomenclaturas, completar especificações técnicas.`;

      const response = await aiProvider.generateText(prompt, {
        provider: 'auto',
        model: 'llama3',
        temperature: 0.7,
        maxTokens: 1500
      });
      
      // Parser das sugestões com análise avançada
      const suggestionMatches = response.match(/CAMPO: (.+?)\nSUGESTÃO: (.+?)\nCONFIANÇA: (.+?)\nTIPO: (.+?)(?:\nFONTE: (.+?))?(?=\n|$)/g);
      
      if (suggestionMatches) {
        const parsedSuggestions: AISuggestion[] = suggestionMatches.map(match => {
          const lines = match.split('\n');
          const field = lines[0].replace('CAMPO: ', '').trim();
          const suggestion = lines[1].replace('SUGESTÃO: ', '').trim();
          let confidenceText = lines[2].replace('CONFIANÇA: ', '').trim().toLowerCase();
          const type = lines[3].replace('TIPO: ', '').trim().toLowerCase() as 'improvement' | 'completion' | 'correction';
          const fonte = lines[4] ? lines[4].replace('FONTE: ', '').trim() : '';
          
          // Converter confiança do português para inglês
          let confidence: 'high' | 'medium' | 'low' = 'low';
          if (confidenceText === 'alta' || confidenceText === 'high') confidence = 'high';
          else if (confidenceText === 'média' || confidenceText === 'medium') confidence = 'medium';
          else confidence = 'low';
          
          // Algoritmo inteligente de ajuste de confiança
          let confidenceScore = 0;
          
          // Pontuação base por confiança declarada
          if (confidence === 'high') confidenceScore = 80;
          else if (confidence === 'medium') confidenceScore = 60;
          else confidenceScore = 40;
          
          // Bonificação por conhecimento específico disponível
          if (topKnowledge.length > 0) {
            const hasDirectMatch = topKnowledge.some(k => 
              k.title.toLowerCase().includes(field.toLowerCase()) ||
              k.keywords.some(kw => suggestion.toLowerCase().includes(kw.toLowerCase()))
            );
            
            const hasContentMatch = topKnowledge.some(k => 
              suggestion.toLowerCase().includes(k.content.toLowerCase().substring(0, 100))
            );
            
            if (hasDirectMatch) confidenceScore += 20;
            if (hasContentMatch) confidenceScore += 15;
            if (fonte === 'conhecimento_específico') confidenceScore += 10;
          }
          
          // Bonificação por qualidade da sugestão
          if (suggestion.length > 100) confidenceScore += 10;
          if (/\b(norma|especificação|técnico|padrão)\b/i.test(suggestion)) confidenceScore += 10;
          
          // Redefinir confiança baseada na pontuação final
          if (confidenceScore >= 90) confidence = 'high';
          else if (confidenceScore >= 70) confidence = 'medium';
          else confidence = 'low';
          
          return { field, suggestion, confidence, type };
        });
        
        // Ordenar por confiança e relevância
        const sortedSuggestions = parsedSuggestions.sort((a, b) => {
          const confidenceOrder = { 'high': 3, 'medium': 2, 'low': 1 };
          return confidenceOrder[b.confidence] - confidenceOrder[a.confidence];
        });
        
        setSuggestions(sortedSuggestions);
      }
    } catch (error) {
      console.error('Erro ao gerar sugestões:', error);
    } finally {
      setLoading(false);
    }
  };

  // Chat especializado com conhecimento específico
  const handleChatSubmit = async () => {
    if (!chatMessage.trim()) return;
    
    setChatLoading(true);
    try {
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

      // Priorizar conhecimento mais relevante para a pergunta
      const specificKnowledge = relevantKnowledge.filter(k => 
        queryWords.some(word => 
          k.title.toLowerCase().includes(word) || 
          k.content.toLowerCase().includes(word) ||
          k.keywords.some(keyword => keyword.toLowerCase().includes(word))
        )
      );

      const knowledgeToUse = specificKnowledge.length > 0 ? specificKnowledge : relevantKnowledge;

      const specificContext = knowledgeToUse.length > 0 
        ? `\n\nCONHECIMENTO ESPECÍFICO DO SEU DATA LAKE (${knowledgeToUse.length} itens relevantes):
${knowledgeToUse.slice(0, 3).map((k, i) => 
  `${i+1}. ${k.title}: ${k.content.substring(0, 300)}`
).join('\n\n')}`
        : '\n\n[Nenhum conhecimento específico encontrado no Data Lake para esta pergunta]';

      const prompt = `Especialista em ${docConfig.label}. 
Documento atual: "${formData.titulo || 'Sem título'}"
Tipo: ${documentType}

PERGUNTA ESPECÍFICA: "${chatMessage}"${specificContext}

INSTRUÇÕES:
- Use APENAS o conhecimento específico do Data Lake do usuário
- Seja TÉCNICO e ESPECÍFICO, não genérico
- Se há conhecimento relevante, dê uma resposta detalhada baseada nele
- Se não há conhecimento específico, seja honesto e sugira que o usuário adicione mais documentos ao Data Lake
- Referencie especificamente os itens de conhecimento que está usando

Resposta técnica específica:`;

      const response = await aiProvider.generateText(prompt, {
        provider: 'auto',
        model: 'llama3',
        temperature: 0.7,
        maxTokens: 1000
      });
      setChatResponse(response);
      setChatMessage('');
    } catch (error) {
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
                        'normas': 'normas'
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
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Brain, 
  Sparkles, 
  MessageCircle, 
  TrendingUp, 
  Database, 
  Target,
  Lightbulb,
  AlertCircle,
  CheckCircle,
  Loader2,
  BarChart3,
  Zap,
  Wifi,
  WifiOff,
  Play,
  Pause,
  RefreshCw,
  FileText,
  Users,
  BookOpen,
  Search,
  Activity
} from 'lucide-react';
import { toast } from 'sonner';
import { aiSpecialist, type DataLakeAnalysis, type AIExpertise, type SpecialistConsultation } from '@/lib/aiSpecialist';
import { 
  processDocumentWithOllama, 
  saveKnowledgeToDatabase, 
  getDocumentContent,
  ExtractedKnowledge 
} from '@/lib/knowledgeProcessor';
import { type LakeItem } from '@/lib/datalake';

interface DataLakeAIAssistantProps {
  documents: LakeItem[];
  onRefresh?: () => void;
}

interface ProcessingStatus {
  isProcessing: boolean;
  processedCount: number;
  totalDocuments: number;
  currentDocument: string;
  extractedKnowledge: number;
  phase: 'idle' | 'processing' | 'analyzing' | 'complete';
}

export const DataLakeAIAssistant: React.FC<DataLakeAIAssistantProps> = ({ documents, onRefresh }) => {
  const [useOllama, setUseOllama] = useState(false);
  
  // Processing state
  const [processing, setProcessing] = useState<ProcessingStatus>({
    isProcessing: false,
    processedCount: 0,
    totalDocuments: 0,
    currentDocument: '',
    extractedKnowledge: 0,
    phase: 'idle'
  });

  // Analysis state
  const [analysis, setAnalysis] = useState<DataLakeAnalysis | null>(null);
  const [dataLakeStats, setDataLakeStats] = useState<any>(null);
  const [expertise, setExpertise] = useState<AIExpertise[]>([]);
  
  // Consultation state
  const [consultationQuestion, setConsultationQuestion] = useState('');
  const [consultationResult, setConsultationResult] = useState<SpecialistConsultation | null>(null);
  const [consultationLoading, setConsultationLoading] = useState(false);

  // Auto-detection states
  const [needsProcessing, setNeedsProcessing] = useState(false);
  const [readinessScore, setReadinessScore] = useState(0);

  useEffect(() => {
    loadExistingExpertise();
    checkDataLakeReadiness();
  }, [documents]);

  const loadExistingExpertise = async () => {
    try {
      const existingExpertise = await aiSpecialist.getExistingExpertise();
      setExpertise(existingExpertise);
    } catch (error) {
      console.error('Error loading expertise:', error);
    }
  };

  const checkDataLakeReadiness = async () => {
    // Simulate checking which documents need processing
    const unprocessedDocs = documents.filter(doc => {
      // This would check if document has been processed in knowledge table
      return true; // Simplified for now
    });
    
    setNeedsProcessing(unprocessedDocs.length > 0);
    setReadinessScore(documents.length > 0 ? Math.max(20, 100 - (unprocessedDocs.length / documents.length) * 80) : 0);
  };

  const handleFullWorkflow = async () => {
    if (documents.length === 0) {
      toast.error("Nenhum documento disponível para processar");
      return;
    }

    setProcessing({
      isProcessing: true,
      processedCount: 0,
      totalDocuments: documents.length,
      currentDocument: '',
      extractedKnowledge: 0,
      phase: 'processing'
    });

    try {
      // Phase 1: Process documents
      let totalExtracted = 0;
      for (let i = 0; i < documents.length; i++) {
        const doc = documents[i];
        setProcessing(prev => ({
          ...prev,
          currentDocument: doc.title,
          processedCount: i
        }));
        
        try {
          const content = await getDocumentContent(doc);
          const extractedKnowledge = await processDocumentWithOllama(doc, content);
          
          if (extractedKnowledge.length > 0) {
            const result = await saveKnowledgeToDatabase(doc.id, extractedKnowledge);
            if (result.success) {
              totalExtracted += extractedKnowledge.length;
              setProcessing(prev => ({
                ...prev,
                extractedKnowledge: totalExtracted
              }));
            }
          }
          
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
          console.error(`Erro ao processar documento ${doc.title}:`, error);
        }
      }

      // Phase 2: Analyze Data Lake
      setProcessing(prev => ({
        ...prev,
        phase: 'analyzing',
        currentDocument: 'Analisando Data Lake...'
      }));

      const analysisResult = await aiSpecialist.analyzeDataLake(useOllama);
      setAnalysis(analysisResult.analysis);
      setDataLakeStats(analysisResult.data_lake_stats);

      // Phase 3: Complete
      setProcessing(prev => ({
        ...prev,
        phase: 'complete',
        processedCount: documents.length,
        currentDocument: ''
      }));

      await loadExistingExpertise();
      
      if (onRefresh) onRefresh();

      toast.success(`Workflow completo! ${totalExtracted} conhecimentos extraídos e Data Lake analisado.`);
      
      setTimeout(() => {
        setProcessing(prev => ({ ...prev, isProcessing: false, phase: 'idle' }));
        setNeedsProcessing(false);
        setReadinessScore(95);
      }, 2000);

    } catch (error) {
      console.error('Error in full workflow:', error);
      toast.error('Erro no workflow: ' + (error as Error).message);
      setProcessing(prev => ({ ...prev, isProcessing: false, phase: 'idle' }));
    }
  };

  const handleConsultSpecialist = async () => {
    if (!consultationQuestion.trim()) return;
    
    setConsultationLoading(true);
    try {
      const result = await aiSpecialist.consultSpecialist(consultationQuestion, undefined, useOllama);
      setConsultationResult(result.consultation);
      toast.success('Consulta ao especialista concluída!');
    } catch (error) {
      console.error('Error consulting specialist:', error);
      toast.error('Erro na consulta: ' + (error as Error).message);
    } finally {
      setConsultationLoading(false);
    }
  };

  const getPhaseMessage = () => {
    switch (processing.phase) {
      case 'processing': return 'Extraindo conhecimento dos documentos...';
      case 'analyzing': return 'Analisando Data Lake com IA...';
      case 'complete': return 'Workflow concluído com sucesso!';
      default: return '';
    }
  };

  const getReadinessColor = () => {
    if (readinessScore >= 80) return 'text-green-600';
    if (readinessScore >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const progress = processing.totalDocuments > 0 ? (processing.processedCount / processing.totalDocuments) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Main Status Dashboard */}
      <Card className="border-l-4 border-l-primary">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-6 w-6 text-primary" />
                Assistente IA do Data Lake
                {useOllama ? (
                  <Badge variant="secondary" className="ml-2 flex items-center gap-1">
                    <WifiOff className="h-3 w-3" />
                    Offline
                  </Badge>
                ) : (
                  <Badge variant="default" className="ml-2 flex items-center gap-1">
                    <Wifi className="h-3 w-3" />
                    Online
                  </Badge>
                )}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Assistente inteligente para análise e consulta do seu repositório técnico
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="ollama-mode"
                checked={useOllama}
                onCheckedChange={setUseOllama}
                disabled={processing.isProcessing}
              />
              <Label htmlFor="ollama-mode">Offline</Label>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Status Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-primary">{documents.length}</div>
              <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                <FileText className="h-3 w-3" />
                Documentos
              </div>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className={`text-2xl font-bold ${getReadinessColor()}`}>
                {Math.round(readinessScore)}%
              </div>
              <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                <Activity className="h-3 w-3" />
                Prontidão
              </div>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-primary">{expertise.length}</div>
              <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                <BookOpen className="h-3 w-3" />
                Expertises
              </div>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-primary">
                {dataLakeStats?.knowledge_items || 0}
              </div>
              <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                <Target className="h-3 w-3" />
                Conhecimentos
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <Button 
              onClick={handleFullWorkflow}
              disabled={processing.isProcessing || documents.length === 0}
              className="flex-1"
              size="lg"
            >
              {processing.isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  {getPhaseMessage()}
                </>
              ) : needsProcessing ? (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Iniciar Análise Completa
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Atualizar Análise
                </>
              )}
            </Button>
          </div>

          {/* Progress Display */}
          {processing.isProcessing && (
            <div className="space-y-3 p-4 bg-muted/30 rounded-lg">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{getPhaseMessage()}</span>
                <span>{processing.processedCount}/{processing.totalDocuments}</span>
              </div>
              <Progress value={progress} className="h-2" />
              
              {processing.currentDocument && (
                <div className="text-xs text-muted-foreground">
                  📄 {processing.currentDocument}
                </div>
              )}
              
              <div className="flex items-center justify-between text-xs">
                <Badge variant="outline" className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  {processing.processedCount} processados
                </Badge>
                <Badge variant="outline" className="flex items-center gap-1">
                  <Brain className="h-3 w-3" />
                  {processing.extractedKnowledge} conhecimentos
                </Badge>
                <Badge variant="outline" className="flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  {processing.phase}
                </Badge>
              </div>
            </div>
          )}

          {/* Quick Status Alerts */}
          {needsProcessing && !processing.isProcessing && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Documentos não processados detectados.</strong> Execute a análise completa para extrair conhecimento e obter insights.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="consultation" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="consultation">💬 Consulta Inteligente</TabsTrigger>
          <TabsTrigger value="analysis">📊 Análise & Insights</TabsTrigger>
          <TabsTrigger value="expertise">🎯 Expertise Gerada</TabsTrigger>
        </TabsList>

        {/* Smart Consultation */}
        <TabsContent value="consultation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                Consulta Inteligente ao Especialista
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Faça perguntas técnicas e obtenha respostas baseadas no seu Data Lake
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Textarea
                  placeholder="Ex: Como fazer um memorial descritivo de fundações? Quais são as melhores práticas para especificação de concreto?"
                  value={consultationQuestion}
                  onChange={(e) => setConsultationQuestion(e.target.value)}
                  rows={3}
                  className="flex-1"
                />
                <Button 
                  onClick={handleConsultSpecialist}
                  disabled={consultationLoading || !consultationQuestion.trim()}
                  className="self-end"
                >
                  {consultationLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                </Button>
              </div>
              
              {consultationResult && (
                <Card className="bg-muted/50">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-primary" />
                      Resposta do Especialista
                      <Badge variant="outline">
                        {Math.round(consultationResult.confidence_level * 100)}% confiança
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="prose prose-sm max-w-none">
                      <p className="whitespace-pre-wrap">{consultationResult.specialist_response}</p>
                    </div>
                    
                    {consultationResult.knowledge_sources.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-2 flex items-center gap-1">
                          <BookOpen className="h-4 w-4" />
                          Fontes de Conhecimento
                        </h4>
                        <div className="flex flex-wrap gap-1">
                          {consultationResult.knowledge_sources.slice(0, 5).map((source, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {source.source}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {consultationResult.recommendations.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-2 flex items-center gap-1">
                          <Lightbulb className="h-4 w-4" />
                          Recomendações
                        </h4>
                        <ul className="space-y-1">
                          {consultationResult.recommendations.map((rec, index) => (
                            <li key={index} className="text-sm text-muted-foreground">• {rec.action}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analysis & Insights */}
        <TabsContent value="analysis" className="space-y-4">
          {analysis ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Análise Estratégica do Data Lake
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Score de Prontidão</span>
                      <span className="text-sm font-bold">{Math.round(analysis.overall_assessment.readiness_score * 100)}%</span>
                    </div>
                    <Progress value={analysis.overall_assessment.readiness_score * 100} />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium text-green-800 mb-2 flex items-center gap-1">
                        <CheckCircle className="h-4 w-4" />
                        Pontos Fortes
                      </h4>
                      <ul className="space-y-1">
                        {analysis.overall_assessment.strengths.slice(0, 3).map((strength, index) => (
                          <li key={index} className="text-sm text-green-700">• {strength}</li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-medium text-red-800 mb-2 flex items-center gap-1">
                        <AlertCircle className="h-4 w-4" />
                        Oportunidades
                      </h4>
                      <ul className="space-y-1">
                        {analysis.overall_assessment.weaknesses.slice(0, 3).map((weakness, index) => (
                          <li key={index} className="text-sm text-red-700">• {weakness}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Áreas de Expertise Identificadas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3">
                    {analysis.expertise_areas.slice(0, 4).map((area, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <h4 className="font-medium">{area.area}</h4>
                          <div className="flex gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {area.document_count} docs
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {Math.round(area.confidence_level * 100)}% confiança
                            </Badge>
                          </div>
                        </div>
                        <Button size="sm" variant="outline">
                          <Zap className="h-3 w-3 mr-1" />
                          Gerar
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground">Execute a análise completa para ver insights detalhados</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Generated Expertise */}
        <TabsContent value="expertise" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                Expertise Especializada Disponível
              </CardTitle>
            </CardHeader>
            <CardContent>
              {expertise.length > 0 ? (
                <div className="grid gap-3">
                  {expertise.map((exp) => (
                    <div key={exp.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium">{exp.expertise_area}</h4>
                        <Badge variant="outline">
                          {Math.round(exp.confidence_level * 100)}% confiança
                        </Badge>
                      </div>
                      
                      <Progress value={exp.confidence_level * 100} className="mb-3" />
                      
                      <div className="flex flex-wrap gap-1">
                        {exp.keywords.slice(0, 8).map((keyword, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {keyword}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhuma expertise foi gerada ainda.</p>
                  <p className="text-sm">Execute a análise completa para gerar conhecimentos especializados.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
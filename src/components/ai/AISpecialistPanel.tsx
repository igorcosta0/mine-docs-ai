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
  Cog
} from 'lucide-react';
import { toast } from 'sonner';
import { aiSpecialist, type DataLakeAnalysis, type AIExpertise, type SpecialistConsultation } from '@/lib/aiSpecialist';
import { DocumentProcessor } from '@/components/datalake/DocumentProcessor';
import { type LakeItem } from '@/lib/datalake';

interface AISpecialistPanelProps {
  documents: LakeItem[];
  onRefresh?: () => void;
}

export const AISpecialistPanel: React.FC<AISpecialistPanelProps> = ({ documents, onRefresh }) => {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<DataLakeAnalysis | null>(null);
  const [dataLakeStats, setDataLakeStats] = useState<any>(null);
  const [expertise, setExpertise] = useState<AIExpertise[]>([]);
  const [consultationQuestion, setConsultationQuestion] = useState('');
  const [consultationResult, setConsultationResult] = useState<SpecialistConsultation | null>(null);
  const [consultationLoading, setConsultationLoading] = useState(false);
  const [useOllama, setUseOllama] = useState(false);

  // Carregar dados iniciais
  useEffect(() => {
    loadExistingExpertise();
  }, []);

  const loadExistingExpertise = async () => {
    try {
      const existingExpertise = await aiSpecialist.getExistingExpertise();
      setExpertise(existingExpertise);
    } catch (error) {
      console.error('Error loading expertise:', error);
    }
  };

  const handleAnalyzeDataLake = async () => {
    setLoading(true);
    try {
      const result = await aiSpecialist.analyzeDataLake(useOllama);
      setAnalysis(result.analysis);
      setDataLakeStats(result.data_lake_stats);
      toast.success('Análise do Data Lake concluída!');
    } catch (error) {
      console.error('Error analyzing data lake:', error);
      toast.error('Erro ao analisar Data Lake: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateExpertise = async (area: string) => {
    setLoading(true);
    try {
      await aiSpecialist.generateExpertise(area, undefined, useOllama);
      await loadExistingExpertise();
      toast.success(`Expertise em ${area} gerada com sucesso!`);
    } catch (error) {
      console.error('Error generating expertise:', error);
      toast.error('Erro ao gerar expertise: ' + (error as Error).message);
    } finally {
      setLoading(false);
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

  const getStrengthColor = (strength: string) => {
    switch (strength) {
      case 'alta': return 'bg-green-100 text-green-800 border-green-200';
      case 'media': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'baixa': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critica': return 'bg-red-100 text-red-800 border-red-200';
      case 'alta': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'media': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'baixa': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-6 w-6 text-primary" />
            Especialista IA em Data Lake
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
            IA especializada dedicada exclusivamente ao seu Data Lake para análises mais precisas e contextualizadas.
          </p>
          <div className="flex items-center space-x-2 pt-2">
            <Switch
              id="ollama-mode"
              checked={useOllama}
              onCheckedChange={setUseOllama}
            />
            <Label htmlFor="ollama-mode">
              Modo Offline (Ollama)
            </Label>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button 
              onClick={handleAnalyzeDataLake} 
              disabled={loading}
              className="flex items-center gap-2"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <BarChart3 className="h-4 w-4" />}
              Analisar Data Lake
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="preparation" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="preparation">Preparação</TabsTrigger>
          <TabsTrigger value="analysis">Análise</TabsTrigger>
          <TabsTrigger value="expertise">Expertise</TabsTrigger>
          <TabsTrigger value="consultation">Consulta</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        {/* Preparação - Processamento de Conhecimento */}
        <TabsContent value="preparation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cog className="h-5 w-5" />
                Preparação do Data Lake
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Primeira etapa: extrair conhecimento dos documentos para análises posteriores
              </p>
            </CardHeader>
            <CardContent>
              <DocumentProcessor 
                documents={documents}
                onProcessComplete={onRefresh}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Análise do Data Lake */}
        <TabsContent value="analysis" className="space-y-4">
          {dataLakeStats && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Estatísticas do Data Lake
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">{dataLakeStats.total_documents}</div>
                    <div className="text-sm text-muted-foreground">Documentos</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">{dataLakeStats.knowledge_items}</div>
                    <div className="text-sm text-muted-foreground">Itens de Conhecimento</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">{dataLakeStats.document_types?.length || 0}</div>
                    <div className="text-sm text-muted-foreground">Tipos de Documento</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">{dataLakeStats.technical_areas?.length || 0}</div>
                    <div className="text-sm text-muted-foreground">Áreas Técnicas</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {analysis && (
            <>
              {/* Avaliação Geral */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Avaliação Geral
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Prontidão do Data Lake</span>
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
                        {analysis.overall_assessment.strengths.map((strength, index) => (
                          <li key={index} className="text-sm text-green-700">• {strength}</li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-medium text-red-800 mb-2 flex items-center gap-1">
                        <AlertCircle className="h-4 w-4" />
                        Pontos Fracos
                      </h4>
                      <ul className="space-y-1">
                        {analysis.overall_assessment.weaknesses.map((weakness, index) => (
                          <li key={index} className="text-sm text-red-700">• {weakness}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-blue-800 mb-2 flex items-center gap-1">
                      <Lightbulb className="h-4 w-4" />
                      Recomendações Estratégicas
                    </h4>
                    <ul className="space-y-1">
                      {analysis.overall_assessment.strategic_recommendations.map((rec, index) => (
                        <li key={index} className="text-sm text-blue-700">• {rec}</li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>

              {/* Áreas de Expertise */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Áreas de Expertise Identificadas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analysis.expertise_areas.map((area, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">{area.area}</h4>
                          <div className="flex gap-2">
                            <Badge variant="outline" className={getStrengthColor(area.strength)}>
                              {area.strength} força
                            </Badge>
                            <Badge variant="outline">
                              {area.document_count} docs
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="mb-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Qualidade: {area.knowledge_quality}</span>
                            <span className="text-sm">Confiança: {Math.round(area.confidence_level * 100)}%</span>
                          </div>
                          <Progress value={area.confidence_level * 100} className="mt-1" />
                        </div>

                        <div className="flex flex-wrap gap-1">
                          {area.key_topics.map((topic, topicIndex) => (
                            <Badge key={topicIndex} variant="secondary" className="text-xs">
                              {topic}
                            </Badge>
                          ))}
                        </div>

                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="mt-2"
                          onClick={() => handleGenerateExpertise(area.area)}
                          disabled={loading}
                        >
                          <Zap className="h-3 w-3 mr-1" />
                          Gerar Expertise
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Gaps de Conhecimento */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5" />
                    Lacunas de Conhecimento
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analysis.knowledge_gaps.map((gap, index) => (
                      <Alert key={index}>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          <div className="flex justify-between items-start">
                            <div>
                              <strong>{gap.area}</strong>
                              <p className="text-sm mt-1">{gap.recommendation}</p>
                            </div>
                            <Badge variant="outline" className={getSeverityColor(gap.severity)}>
                              {gap.severity}
                            </Badge>
                          </div>
                        </AlertDescription>
                      </Alert>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Expertise Gerada */}
        <TabsContent value="expertise" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                Expertise Especializada Gerada
              </CardTitle>
            </CardHeader>
            <CardContent>
              {expertise.length > 0 ? (
                <div className="space-y-4">
                  {expertise.map((exp) => (
                    <div key={exp.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium">{exp.expertise_area}</h4>
                        <div className="flex gap-2">
                          <Badge variant="outline">
                            {Math.round(exp.confidence_level * 100)}% confiança
                          </Badge>
                          <Badge variant="secondary">
                            {exp.document_count} docs
                          </Badge>
                        </div>
                      </div>
                      
                      <Progress value={exp.confidence_level * 100} className="mb-3" />
                      
                      <div className="flex flex-wrap gap-1 mb-3">
                        {exp.keywords.slice(0, 10).map((keyword, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {keyword}
                          </Badge>
                        ))}
                      </div>
                      
                      <p className="text-sm text-muted-foreground">
                        Criado em: {new Date(exp.created_at).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhuma expertise especializada foi gerada ainda.</p>
                  <p className="text-sm">Execute uma análise do Data Lake primeiro.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Consulta ao Especialista */}
        <TabsContent value="consultation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                Consulta ao Especialista IA
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Textarea
                  placeholder="Faça uma pergunta técnica específica sobre seu Data Lake..."
                  value={consultationQuestion}
                  onChange={(e) => setConsultationQuestion(e.target.value)}
                  rows={3}
                />
              </div>
              
              <Button 
                onClick={handleConsultSpecialist}
                disabled={consultationLoading || !consultationQuestion.trim()}
                className="w-full"
              >
                {consultationLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <MessageCircle className="h-4 w-4 mr-2" />
                )}
                Consultar Especialista
              </Button>

              {consultationResult && (
                <div className="border rounded-lg p-4 space-y-4">
                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <Brain className="h-4 w-4" />
                      Resposta do Especialista
                    </h4>
                    <div className="prose prose-sm max-w-none">
                      <p className="whitespace-pre-wrap">{consultationResult.specialist_response}</p>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <Badge variant="outline">
                      Confiança: {Math.round(consultationResult.confidence_level * 100)}%
                    </Badge>
                    <Progress value={consultationResult.confidence_level * 100} className="w-32" />
                  </div>

                  {consultationResult.knowledge_sources.length > 0 && (
                    <div>
                      <h5 className="font-medium mb-2">Fontes de Conhecimento:</h5>
                      <div className="space-y-1">
                        {consultationResult.knowledge_sources.map((source, index) => (
                          <div key={index} className="text-sm flex justify-between">
                            <span>{source.source}</span>
                            <Badge variant="outline">
                              {source.relevance}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {consultationResult.recommendations.length > 0 && (
                    <div>
                      <h5 className="font-medium mb-2">Recomendações:</h5>
                      <div className="space-y-2">
                        {consultationResult.recommendations.map((rec, index) => (
                          <div key={index} className="border-l-2 border-primary pl-3">
                            <div className="flex justify-between items-start">
                              <strong className="text-sm">{rec.action}</strong>
                              <Badge variant="outline">
                                {rec.priority}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">{rec.rationale}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {consultationResult.limitations && (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Limitações:</strong> {consultationResult.limitations}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Insights */}
        <TabsContent value="insights" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Insights do Especialista
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Lightbulb className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Insights avançados serão mostrados aqui.</p>
                <p className="text-sm">Execute análises e consultas para gerar insights personalizados.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
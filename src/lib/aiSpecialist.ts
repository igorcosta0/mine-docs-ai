import { supabase } from '@/integrations/supabase/client';

export interface DataLakeAnalysis {
  expertise_areas: Array<{
    area: string;
    strength: 'alta' | 'media' | 'baixa';
    document_count: number;
    knowledge_quality: 'excelente' | 'boa' | 'regular' | 'fraca';
    key_topics: string[];
    confidence_level: number;
  }>;
  knowledge_gaps: Array<{
    area: string;
    severity: 'critica' | 'alta' | 'media' | 'baixa';
    recommendation: string;
  }>;
  overall_assessment: {
    readiness_score: number;
    strengths: string[];
    weaknesses: string[];
    strategic_recommendations: string[];
  };
}

export interface AIExpertise {
  id: string;
  expertise_area: string;
  knowledge_summary: string;
  document_count: number;
  confidence_level: number;
  keywords: string[];
  created_at: string;
}

export interface SpecialistConsultation {
  specialist_response: string;
  confidence_level: number;
  knowledge_sources: Array<{
    source: string;
    relevance: 'alta' | 'media' | 'baixa';
    technical_area: string;
  }>;
  recommendations: Array<{
    action: string;
    priority: 'alta' | 'media' | 'baixa';
    rationale: string;
  }>;
  limitations: string;
}

export class AIDataLakeSpecialist {
  private async callSpecialistFunction(action: string, data?: any) {
    const { data: result, error } = await supabase.functions.invoke('ai-data-lake-specialist', {
      body: { action, data }
    });

    if (error) {
      console.error('Specialist function error:', error);
      throw new Error(error.message || 'Erro na consulta ao especialista de IA');
    }

    return result;
  }

  async analyzeDataLake(): Promise<{
    analysis: DataLakeAnalysis;
    data_lake_stats: {
      total_documents: number;
      knowledge_items: number;
      document_types: string[];
      manufacturers: string[];
      technical_areas: string[];
    };
  }> {
    console.log('Analyzing Data Lake with AI Specialist...');
    
    try {
      const result = await this.callSpecialistFunction('analyze_data_lake');
      
      // Parse da análise se vier como string
      let analysis;
      if (typeof result.analysis === 'string') {
        try {
          analysis = JSON.parse(result.analysis);
        } catch {
          // Se não conseguir fazer parse, cria uma análise básica
          analysis = {
            expertise_areas: [],
            knowledge_gaps: [],
            overall_assessment: {
              readiness_score: 0.5,
              strengths: ['Data Lake configurado'],
              weaknesses: ['Análise detalhada não disponível'],
              strategic_recommendations: ['Adicionar mais documentos técnicos']
            }
          };
        }
      } else {
        analysis = result.analysis;
      }

      return {
        analysis,
        data_lake_stats: result.data_lake_stats
      };
    } catch (error) {
      console.error('Error analyzing Data Lake:', error);
      throw error;
    }
  }

  async generateExpertise(expertiseArea: string, documentsFocus?: string[]): Promise<{
    expertise: AIExpertise;
    analysis: string;
    source_documents: number;
    knowledge_items: number;
  }> {
    console.log(`Generating expertise for area: ${expertiseArea}`);
    
    try {
      return await this.callSpecialistFunction('generate_expertise', {
        expertise_area: expertiseArea,
        documents_focus: documentsFocus
      });
    } catch (error) {
      console.error('Error generating expertise:', error);
      throw error;
    }
  }

  async consultSpecialist(
    question: string, 
    context?: { 
      technical_area?: string; 
      document_type?: string; 
      additional_info?: any 
    }
  ): Promise<{
    consultation: SpecialistConsultation;
    conversation_id: string;
    expertise_used: number;
    knowledge_referenced: number;
  }> {
    console.log('Consulting AI Specialist...');
    
    try {
      const result = await this.callSpecialistFunction('consult_specialist', {
        question,
        context,
        document_type: context?.document_type
      });

      // Parse da consulta se vier como string
      let consultation;
      if (typeof result.consultation === 'string') {
        try {
          consultation = JSON.parse(result.consultation);
        } catch {
          // Se não conseguir fazer parse, cria uma resposta básica
          consultation = {
            specialist_response: result.consultation,
            confidence_level: 0.7,
            knowledge_sources: [],
            recommendations: [],
            limitations: 'Resposta baseada no conhecimento disponível no Data Lake'
          };
        }
      } else {
        consultation = result.consultation;
      }

      return {
        consultation,
        conversation_id: result.conversation_id,
        expertise_used: result.expertise_used,
        knowledge_referenced: result.knowledge_referenced
      };
    } catch (error) {
      console.error('Error consulting specialist:', error);
      throw error;
    }
  }

  async getSpecializedContext(params: {
    document_type?: string;
    technical_area?: string;
    keywords?: string[];
  }): Promise<{
    specialized_context: {
      expertise_areas: AIExpertise[];
      relevant_knowledge: any[];
      context_strength: 'high' | 'medium' | 'low';
      recommendations: {
        use_expertise: boolean;
        knowledge_confidence: number;
        suggested_approach: 'specialist_consultation' | 'general_knowledge';
      };
    };
  }> {
    console.log('Getting specialized context...');
    
    try {
      return await this.callSpecialistFunction('get_specialized_context', params);
    } catch (error) {
      console.error('Error getting specialized context:', error);
      throw error;
    }
  }

  async getExistingExpertise(): Promise<AIExpertise[]> {
    console.log('Getting existing expertise...');
    
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        throw new Error('Usuário não autenticado');
      }

      const { data, error } = await supabase
        .from('ai_data_lake_expertise')
        .select('*')
        .eq('user_id', user.user.id)
        .order('confidence_level', { ascending: false });

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error getting existing expertise:', error);
      throw error;
    }
  }

  async getConversationHistory(limit = 10) {
    console.log('Getting conversation history...');
    
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        throw new Error('Usuário não autenticado');
      }

      const { data, error } = await supabase
        .from('ai_specialist_conversations')
        .select('*')
        .eq('user_id', user.user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error getting conversation history:', error);
      throw error;
    }
  }
}

// Instância singleton
export const aiSpecialist = new AIDataLakeSpecialist();
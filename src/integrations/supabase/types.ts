export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      ai_data_lake_expertise: {
        Row: {
          confidence_level: number | null
          created_at: string
          document_count: number | null
          expertise_area: string
          id: string
          keywords: string[] | null
          knowledge_summary: string
          last_training: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          confidence_level?: number | null
          created_at?: string
          document_count?: number | null
          expertise_area: string
          id?: string
          keywords?: string[] | null
          knowledge_summary: string
          last_training?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          confidence_level?: number | null
          created_at?: string
          document_count?: number | null
          expertise_area?: string
          id?: string
          keywords?: string[] | null
          knowledge_summary?: string
          last_training?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_specialist_conversations: {
        Row: {
          context_data: Json | null
          conversation_type: string
          created_at: string
          id: string
          messages: Json | null
          specialist_insights: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          context_data?: Json | null
          conversation_type: string
          created_at?: string
          id?: string
          messages?: Json | null
          specialist_insights?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          context_data?: Json | null
          conversation_type?: string
          created_at?: string
          id?: string
          messages?: Json | null
          specialist_insights?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      document_knowledge: {
        Row: {
          confidence_score: number | null
          content: string
          created_at: string
          document_type: string | null
          id: string
          keywords: string[] | null
          knowledge_type: string
          source_document_id: string | null
          technical_area: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          confidence_score?: number | null
          content: string
          created_at?: string
          document_type?: string | null
          id?: string
          keywords?: string[] | null
          knowledge_type: string
          source_document_id?: string | null
          technical_area?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          confidence_score?: number | null
          content?: string
          created_at?: string
          document_type?: string | null
          id?: string
          keywords?: string[] | null
          knowledge_type?: string
          source_document_id?: string | null
          technical_area?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_knowledge_source_document_id_fkey"
            columns: ["source_document_id"]
            isOneToOne: false
            referencedRelation: "lake_items"
            referencedColumns: ["id"]
          },
        ]
      }
      documentos_especificacao: {
        Row: {
          checksum_sha256: string
          classification: string | null
          contractor: string | null
          created_at: string | null
          customer: string | null
          disciplines: string[] | null
          doc_number: string
          doc_type: Database["public"]["Enums"]["doc_type_enum"]
          extra: Json
          figures_tables: string[] | null
          id: string
          issue_date: string | null
          location: string | null
          norms: string[] | null
          project: string | null
          rev: string
          status: Database["public"]["Enums"]["doc_status_enum"]
          storage_path: string
          title: string
          updated_at: string | null
          uploader: string | null
        }
        Insert: {
          checksum_sha256: string
          classification?: string | null
          contractor?: string | null
          created_at?: string | null
          customer?: string | null
          disciplines?: string[] | null
          doc_number: string
          doc_type: Database["public"]["Enums"]["doc_type_enum"]
          extra?: Json
          figures_tables?: string[] | null
          id?: string
          issue_date?: string | null
          location?: string | null
          norms?: string[] | null
          project?: string | null
          rev: string
          status?: Database["public"]["Enums"]["doc_status_enum"]
          storage_path: string
          title: string
          updated_at?: string | null
          uploader?: string | null
        }
        Update: {
          checksum_sha256?: string
          classification?: string | null
          contractor?: string | null
          created_at?: string | null
          customer?: string | null
          disciplines?: string[] | null
          doc_number?: string
          doc_type?: Database["public"]["Enums"]["doc_type_enum"]
          extra?: Json
          figures_tables?: string[] | null
          id?: string
          issue_date?: string | null
          location?: string | null
          norms?: string[] | null
          project?: string | null
          rev?: string
          status?: Database["public"]["Enums"]["doc_status_enum"]
          storage_path?: string
          title?: string
          updated_at?: string | null
          uploader?: string | null
        }
        Relationships: []
      }
      documentos_folha_dados: {
        Row: {
          autor: string | null
          capacidade: string | null
          caracteristicas_tecnicas: Json | null
          conteudo: string
          created_at: string
          data: string | null
          descricao: string | null
          equipamento: string | null
          fabricante: string | null
          id: string
          modelo: string | null
          normas: string | null
          parametros_operacionais: Json | null
          potencia: string | null
          titulo: string
          updated_at: string
          user_id: string
          voltagem: string | null
        }
        Insert: {
          autor?: string | null
          capacidade?: string | null
          caracteristicas_tecnicas?: Json | null
          conteudo: string
          created_at?: string
          data?: string | null
          descricao?: string | null
          equipamento?: string | null
          fabricante?: string | null
          id?: string
          modelo?: string | null
          normas?: string | null
          parametros_operacionais?: Json | null
          potencia?: string | null
          titulo: string
          updated_at?: string
          user_id: string
          voltagem?: string | null
        }
        Update: {
          autor?: string | null
          capacidade?: string | null
          caracteristicas_tecnicas?: Json | null
          conteudo?: string
          created_at?: string
          data?: string | null
          descricao?: string | null
          equipamento?: string | null
          fabricante?: string | null
          id?: string
          modelo?: string | null
          normas?: string | null
          parametros_operacionais?: Json | null
          potencia?: string | null
          titulo?: string
          updated_at?: string
          user_id?: string
          voltagem?: string | null
        }
        Relationships: []
      }
      documentos_memorial: {
        Row: {
          autor: string | null
          conteudo: string
          created_at: string
          cronograma: Json | null
          data: string | null
          descricao: string | null
          id: string
          localização: string | null
          metodologia: string | null
          normas: string | null
          objetivo: string | null
          projeto_referencia: string | null
          recursos: Json | null
          responsaveis: Json | null
          titulo: string
          updated_at: string
          user_id: string
        }
        Insert: {
          autor?: string | null
          conteudo: string
          created_at?: string
          cronograma?: Json | null
          data?: string | null
          descricao?: string | null
          id?: string
          localização?: string | null
          metodologia?: string | null
          normas?: string | null
          objetivo?: string | null
          projeto_referencia?: string | null
          recursos?: Json | null
          responsaveis?: Json | null
          titulo: string
          updated_at?: string
          user_id: string
        }
        Update: {
          autor?: string | null
          conteudo?: string
          created_at?: string
          cronograma?: Json | null
          data?: string | null
          descricao?: string | null
          id?: string
          localização?: string | null
          metodologia?: string | null
          normas?: string | null
          objetivo?: string | null
          projeto_referencia?: string | null
          recursos?: Json | null
          responsaveis?: Json | null
          titulo?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      documents: {
        Row: {
          checksum_sha256: string
          classification: string | null
          contractor: string | null
          created_at: string | null
          customer: string | null
          disciplines: string[] | null
          doc_number: string
          doc_type: Database["public"]["Enums"]["doc_type_enum"]
          extra: Json
          figures_tables: string[] | null
          id: string
          issue_date: string | null
          location: string | null
          norms: string[] | null
          project: string | null
          rev: string
          status: Database["public"]["Enums"]["doc_status_enum"]
          storage_path: string
          title: string
          updated_at: string | null
          uploader: string | null
        }
        Insert: {
          checksum_sha256: string
          classification?: string | null
          contractor?: string | null
          created_at?: string | null
          customer?: string | null
          disciplines?: string[] | null
          doc_number: string
          doc_type: Database["public"]["Enums"]["doc_type_enum"]
          extra?: Json
          figures_tables?: string[] | null
          id?: string
          issue_date?: string | null
          location?: string | null
          norms?: string[] | null
          project?: string | null
          rev: string
          status?: Database["public"]["Enums"]["doc_status_enum"]
          storage_path: string
          title: string
          updated_at?: string | null
          uploader?: string | null
        }
        Update: {
          checksum_sha256?: string
          classification?: string | null
          contractor?: string | null
          created_at?: string | null
          customer?: string | null
          disciplines?: string[] | null
          doc_number?: string
          doc_type?: Database["public"]["Enums"]["doc_type_enum"]
          extra?: Json
          figures_tables?: string[] | null
          id?: string
          issue_date?: string | null
          location?: string | null
          norms?: string[] | null
          project?: string | null
          rev?: string
          status?: Database["public"]["Enums"]["doc_status_enum"]
          storage_path?: string
          title?: string
          updated_at?: string | null
          uploader?: string | null
        }
        Relationships: []
      }
      lake_items: {
        Row: {
          checksum_sha256: string | null
          created_at: string
          description: string | null
          doc_type: string | null
          equipment_model: string | null
          file_path: string
          id: string
          manufacturer: string | null
          norm_source: string | null
          plant_unit: string | null
          revision_version: string | null
          serial_number: string | null
          system_area: string | null
          tags: string[] | null
          title: string
          updated_at: string
          user_id: string
          year: number | null
        }
        Insert: {
          checksum_sha256?: string | null
          created_at?: string
          description?: string | null
          doc_type?: string | null
          equipment_model?: string | null
          file_path: string
          id?: string
          manufacturer?: string | null
          norm_source?: string | null
          plant_unit?: string | null
          revision_version?: string | null
          serial_number?: string | null
          system_area?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string
          user_id: string
          year?: number | null
        }
        Update: {
          checksum_sha256?: string | null
          created_at?: string
          description?: string | null
          doc_type?: string | null
          equipment_model?: string | null
          file_path?: string
          id?: string
          manufacturer?: string | null
          norm_source?: string | null
          plant_unit?: string | null
          revision_version?: string | null
          serial_number?: string | null
          system_area?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string
          user_id?: string
          year?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          company: string | null
          created_at: string | null
          default_norms: string[] | null
          department: string | null
          favorite_manufacturers: string[] | null
          full_name: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          company?: string | null
          created_at?: string | null
          default_norms?: string[] | null
          department?: string | null
          favorite_manufacturers?: string[] | null
          full_name?: string | null
          id: string
          updated_at?: string | null
        }
        Update: {
          company?: string | null
          created_at?: string | null
          default_norms?: string[] | null
          department?: string | null
          favorite_manufacturers?: string[] | null
          full_name?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_ai_availability: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
    }
    Enums: {
      doc_status_enum: "ingested" | "processing" | "error"
      doc_type_enum: "especificacao_tecnica"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      doc_status_enum: ["ingested", "processing", "error"],
      doc_type_enum: ["especificacao_tecnica"],
    },
  },
} as const

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
      documentos_especificacao: {
        Row: {
          acabamento: string | null
          autor: string | null
          conteudo: string
          created_at: string
          data: string | null
          descricao: string | null
          dimensoes: Json | null
          ensaios: string | null
          escopo: string | null
          id: string
          materiais: Json | null
          normas: string | null
          titulo: string
          tolerancias: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          acabamento?: string | null
          autor?: string | null
          conteudo: string
          created_at?: string
          data?: string | null
          descricao?: string | null
          dimensoes?: Json | null
          ensaios?: string | null
          escopo?: string | null
          id?: string
          materiais?: Json | null
          normas?: string | null
          titulo: string
          tolerancias?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          acabamento?: string | null
          autor?: string | null
          conteudo?: string
          created_at?: string
          data?: string | null
          descricao?: string | null
          dimensoes?: Json | null
          ensaios?: string | null
          escopo?: string | null
          id?: string
          materiais?: Json | null
          normas?: string | null
          titulo?: string
          tolerancias?: string | null
          updated_at?: string
          user_id?: string
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
      lake_items: {
        Row: {
          created_at: string
          doc_type: string | null
          file_path: string
          id: string
          tags: string[] | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          doc_type?: string | null
          file_path: string
          id?: string
          tags?: string[] | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          doc_type?: string | null
          file_path?: string
          id?: string
          tags?: string[] | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const

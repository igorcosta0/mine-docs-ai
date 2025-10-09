import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { DocumentType } from '@/types';

export interface UserProfile {
  full_name: string | null;
  company: string | null;
  department: string | null;
  default_norms: string[];
  favorite_manufacturers: string[];
}

export interface SmartFormSuggestions {
  autor: string;
  normas: string;
  data: string;
  recentTags: string[];
  recentManufacturers: string[];
  recentEquipment: string[];
  similarDocuments: Array<{
    id: string;
    titulo: string;
    tipo: string;
  }>;
}

export function useSmartFormData(documentType: DocumentType) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [suggestions, setSuggestions] = useState<SmartFormSuggestions>({
    autor: '',
    normas: '',
    data: new Date().toISOString().split('T')[0],
    recentTags: [],
    recentManufacturers: [],
    recentEquipment: [],
    similarDocuments: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSmartData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Buscar perfil do usuário
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileData) {
          setProfile(profileData);
        }

        // Buscar documentos similares recentes
        const { data: recentDocs } = await supabase
          .from('lake_items')
          .select('id, title, doc_type, tags, manufacturer, equipment_model')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(10);

        // Extrair tags, fabricantes e equipamentos mais usados
        const tags = new Set<string>();
        const manufacturers = new Set<string>();
        const equipment = new Set<string>();
        const similar: Array<{ id: string; titulo: string; tipo: string }> = [];

        recentDocs?.forEach((doc) => {
          if (doc.doc_type === documentType) {
            similar.push({
              id: doc.id,
              titulo: doc.title,
              tipo: doc.doc_type || '',
            });
          }
          doc.tags?.forEach((tag: string) => tags.add(tag));
          if (doc.manufacturer) manufacturers.add(doc.manufacturer);
          if (doc.equipment_model) equipment.add(doc.equipment_model);
        });

        setSuggestions({
          autor: profileData?.full_name || user.email || '',
          normas: profileData?.default_norms?.join(', ') || 'ABNT NBR ISO 9001, NR-22',
          data: new Date().toISOString().split('T')[0],
          recentTags: Array.from(tags).slice(0, 10),
          recentManufacturers: Array.from(manufacturers).slice(0, 5),
          recentEquipment: Array.from(equipment).slice(0, 5),
          similarDocuments: similar.slice(0, 3),
        });
      } catch (error) {
        console.error('Erro ao carregar dados inteligentes:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSmartData();
  }, [documentType]);

  return { profile, suggestions, loading };
}

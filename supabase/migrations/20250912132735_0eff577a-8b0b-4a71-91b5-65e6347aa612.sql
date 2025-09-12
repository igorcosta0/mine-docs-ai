-- Drop the existing table with wrong structure
DROP TABLE IF EXISTS public.lake_items CASCADE;

-- Create the lake_items table with correct structure
CREATE TABLE public.lake_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  file_path TEXT NOT NULL,
  title TEXT NOT NULL,
  doc_type TEXT,
  equipment_model TEXT,
  manufacturer TEXT,
  year INTEGER,
  norm_source TEXT,
  description TEXT,
  serial_number TEXT,
  plant_unit TEXT,
  system_area TEXT,
  revision_version TEXT,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.lake_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user access
CREATE POLICY "Users can view their own lake items" 
ON public.lake_items 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own lake items" 
ON public.lake_items 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own lake items" 
ON public.lake_items 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own lake items" 
ON public.lake_items 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_lake_items_updated_at
BEFORE UPDATE ON public.lake_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
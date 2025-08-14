-- Add metadata fields for technical PDF documents
ALTER TABLE public.lake_items 
ADD COLUMN equipment_model TEXT,
ADD COLUMN manufacturer TEXT,
ADD COLUMN year INTEGER,
ADD COLUMN norm_source TEXT,
ADD COLUMN description TEXT,
ADD COLUMN serial_number TEXT,
ADD COLUMN plant_unit TEXT,
ADD COLUMN system_area TEXT,
ADD COLUMN revision_version TEXT;

-- Add indexes for better search performance
CREATE INDEX idx_lake_items_equipment_model ON public.lake_items(equipment_model);
CREATE INDEX idx_lake_items_manufacturer ON public.lake_items(manufacturer);
CREATE INDEX idx_lake_items_year ON public.lake_items(year);
CREATE INDEX idx_lake_items_norm_source ON public.lake_items(norm_source);

-- Add trigger for updated_at
CREATE TRIGGER update_lake_items_updated_at
BEFORE UPDATE ON public.lake_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
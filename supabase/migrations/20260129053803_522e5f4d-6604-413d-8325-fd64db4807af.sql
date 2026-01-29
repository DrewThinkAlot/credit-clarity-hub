-- Add new columns for expert credit analysis data
ALTER TABLE public.discrepancies 
ADD COLUMN IF NOT EXISTS violation_type text,
ADD COLUMN IF NOT EXISTS fcra_section text,
ADD COLUMN IF NOT EXISTS priority_rank integer,
ADD COLUMN IF NOT EXISTS account_number_partial text,
ADD COLUMN IF NOT EXISTS date_of_first_delinquency date;
-- Add additional profile fields for personalization
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS ssn_last_four TEXT,
ADD COLUMN IF NOT EXISTS notification_email_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS notification_analysis_complete BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS notification_response_received BOOLEAN DEFAULT true;

-- Add letter tracking fields
ALTER TABLE public.letters
ADD COLUMN IF NOT EXISTS sent_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS response_due_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS resolution_status TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS response_content TEXT;

-- Add index for faster letter queries
CREATE INDEX IF NOT EXISTS idx_letters_user_status ON public.letters(user_id, status);
CREATE INDEX IF NOT EXISTS idx_letters_response_due ON public.letters(response_due_date) WHERE response_due_date IS NOT NULL;
-- Create new enum type for match status
CREATE TYPE public.match_status AS ENUM ('PENDING', 'IN_PROGRESS', 'FINISHED', 'CANCELED');

-- Add new court column
ALTER TABLE public.matches ADD COLUMN court text;

-- Convert existing status column to use the new enum
-- First, ensure all existing values are valid
UPDATE public.matches 
SET status = 'PENDING' 
WHERE status NOT IN ('PENDING', 'FINISHED', 'CANCELED');

-- Then alter the column type
ALTER TABLE public.matches 
  ALTER COLUMN status TYPE match_status 
  USING (
    CASE status
      WHEN 'NOT_STARTED' THEN 'PENDING'::match_status
      WHEN 'FINISHED' THEN 'FINISHED'::match_status
      WHEN 'CANCELED' THEN 'CANCELED'::match_status
      ELSE 'PENDING'::match_status
    END
  );

-- Set a default value for the status column
ALTER TABLE public.matches 
  ALTER COLUMN status SET DEFAULT 'PENDING'::match_status; 
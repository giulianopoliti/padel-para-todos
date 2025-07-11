-- Add court column to matches table
ALTER TABLE "public"."matches" ADD COLUMN IF NOT EXISTS "court" text;

-- Create match status enum type
DO $$ BEGIN
    CREATE TYPE "public"."match_status" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Convert status column to use enum
ALTER TABLE "public"."matches" 
    ALTER COLUMN "status" TYPE "public"."match_status" 
    USING "status"::"public"."match_status";

-- Set default value for status column
ALTER TABLE "public"."matches" 
    ALTER COLUMN "status" SET DEFAULT 'PENDING'::"public"."match_status"; 
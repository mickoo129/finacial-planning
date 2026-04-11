ALTER TABLE public.mpf_funds ADD COLUMN IF NOT EXISTS name_zh text;
ALTER TABLE public.mpf_funds ADD COLUMN IF NOT EXISTS return_1m numeric;
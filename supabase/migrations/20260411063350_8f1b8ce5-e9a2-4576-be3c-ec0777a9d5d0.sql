ALTER TABLE public.mpf_funds 
  ADD COLUMN IF NOT EXISTS return_5y numeric,
  ADD COLUMN IF NOT EXISTS return_10y numeric,
  ADD COLUMN IF NOT EXISTS return_2024 numeric,
  ADD COLUMN IF NOT EXISTS return_2023 numeric,
  ADD COLUMN IF NOT EXISTS return_2022 numeric,
  ADD COLUMN IF NOT EXISTS return_2021 numeric,
  ADD COLUMN IF NOT EXISTS trustee_name text,
  ADD COLUMN IF NOT EXISTS scheme_name text,
  ADD COLUMN IF NOT EXISTS fee_ratio numeric,
  ADD COLUMN IF NOT EXISTS sub_category text;
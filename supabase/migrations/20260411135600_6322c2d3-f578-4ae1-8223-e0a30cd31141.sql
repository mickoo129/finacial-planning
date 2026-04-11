ALTER TABLE public.mpf_funds
  ADD COLUMN IF NOT EXISTS fund_size numeric,
  ADD COLUMN IF NOT EXISTS launch_date date,
  ADD COLUMN IF NOT EXISTS fer numeric,
  ADD COLUMN IF NOT EXISTS return_since_launch numeric,
  ADD COLUMN IF NOT EXISTS mpfa_name text;
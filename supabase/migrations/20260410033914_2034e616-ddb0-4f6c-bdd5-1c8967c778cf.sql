
-- Table for MPF fund ranking data
CREATE TABLE public.mpf_funds (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  etnet_fund_id TEXT NOT NULL,
  etnet_plan_id TEXT,
  etnet_provider_id TEXT,
  name TEXT NOT NULL,
  risk_level TEXT, -- 高/中/低
  category TEXT, -- subtype category from etnet
  return_ytd NUMERIC,
  return_3m NUMERIC,
  return_1y NUMERIC,
  return_3y NUMERIC,
  data_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(etnet_fund_id)
);

-- Scrape log
CREATE TABLE public.mpf_scrape_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  status TEXT NOT NULL DEFAULT 'pending',
  funds_count INTEGER DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.mpf_funds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mpf_scrape_logs ENABLE ROW LEVEL SECURITY;

-- Public read access (MPF data is public information)
CREATE POLICY "Anyone can view MPF funds" ON public.mpf_funds FOR SELECT USING (true);
CREATE POLICY "Anyone can view scrape logs" ON public.mpf_scrape_logs FOR SELECT USING (true);

-- Service role can insert/update (edge functions use service role)
CREATE POLICY "Service role can manage funds" ON public.mpf_funds FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role can manage logs" ON public.mpf_scrape_logs FOR ALL USING (true) WITH CHECK (true);

-- Index for fast lookups
CREATE INDEX idx_mpf_funds_return_1y ON public.mpf_funds(return_1y DESC);
CREATE INDEX idx_mpf_funds_category ON public.mpf_funds(category);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_mpf_funds_updated_at
BEFORE UPDATE ON public.mpf_funds
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

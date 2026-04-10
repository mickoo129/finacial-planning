
-- Drop overly permissive policies
DROP POLICY "Service role can manage funds" ON public.mpf_funds;
DROP POLICY "Service role can manage logs" ON public.mpf_scrape_logs;

-- Only service_role can write (edge functions authenticate with service role key)
CREATE POLICY "Service role can insert funds" ON public.mpf_funds FOR INSERT TO service_role WITH CHECK (true);
CREATE POLICY "Service role can update funds" ON public.mpf_funds FOR UPDATE TO service_role USING (true);
CREATE POLICY "Service role can delete funds" ON public.mpf_funds FOR DELETE TO service_role USING (true);

CREATE POLICY "Service role can insert logs" ON public.mpf_scrape_logs FOR INSERT TO service_role WITH CHECK (true);
CREATE POLICY "Service role can update logs" ON public.mpf_scrape_logs FOR UPDATE TO service_role USING (true);

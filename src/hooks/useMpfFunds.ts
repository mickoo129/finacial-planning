import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface MpfFund {
  id: string;
  etnet_fund_id: string;
  etnet_plan_id: string | null;
  etnet_provider_id: string | null;
  name: string;
  risk_level: string | null;
  category: string | null;
  return_ytd: number | null;
  return_3m: number | null;
  return_1y: number | null;
  return_3y: number | null;
  data_date: string | null;
  updated_at: string;
}

export function useMpfFunds() {
  return useQuery({
    queryKey: ['mpf-funds'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mpf_funds')
        .select('*')
        .order('return_1y', { ascending: false, nullsFirst: false });
      
      if (error) throw error;
      return (data || []) as MpfFund[];
    },
    staleTime: 1000 * 60 * 30, // 30 min cache
  });
}

export function useMpfScrapeStatus() {
  return useQuery({
    queryKey: ['mpf-scrape-status'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mpf_scrape_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (error) return null;
      return data;
    },
    staleTime: 1000 * 60 * 5,
  });
}

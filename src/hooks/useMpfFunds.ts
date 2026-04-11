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
  sub_category: string | null;
  trustee_name: string | null;
  scheme_name: string | null;
  fee_ratio: number | null;
  return_ytd: number | null;
  return_3m: number | null;
  return_1y: number | null;
  return_3y: number | null;
  return_5y: number | null;
  return_10y: number | null;
  return_2024: number | null;
  return_2023: number | null;
  return_2022: number | null;
  return_2021: number | null;
  return_1m: number | null;
  name_zh: string | null;
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
    staleTime: 1000 * 60 * 30,
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

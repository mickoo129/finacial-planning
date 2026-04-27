import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { detectSource, type DataSource } from '@/lib/fundSource';

export interface MpfFund {
  dataSource: DataSource;
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
  return_2025: number | null;
  return_2024: number | null;
  return_2023: number | null;
  return_2022: number | null;
  return_2021: number | null;
  return_1m: number | null;
  name_zh: string | null;
  data_date: string | null;
  fund_size: number | null;
  launch_date: string | null;
  fer: number | null;
  return_since_launch: number | null;
  mpfa_name: string | null;
  updated_at: string;
}

export function useMpfFunds() {
  return useQuery({
    queryKey: ['mpf-funds'],
    queryFn: async () => {
      // 雙源策略：取齊全部，唔再用 data_date filter
      // 分頁攞，避免 Supabase 1000 row 限制（雖然依家 559 條，預留位）
      const { data, error } = await supabase
        .from('mpf_funds')
        .select('*')
        .order('return_1y', { ascending: false, nullsFirst: false })
        .range(0, 1999);

      if (error) throw error;
      return (data || []).map((f) => ({
        ...f,
        dataSource: detectSource(f.etnet_fund_id),
      })) as MpfFund[];
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

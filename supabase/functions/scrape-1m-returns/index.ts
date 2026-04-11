import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function parseReturn(text: string): number | null {
  if (!text) return null;
  const cleaned = text.replace(/[+%\s]/g, '');
  if (cleaned === '-' || cleaned === 'N/A' || cleaned === '' || cleaned === '--') return null;
  const val = parseFloat(cleaned);
  return isNaN(val) ? null : val;
}

function parse1mFromDetail(html: string): number | null {
  const match = html.match(/1個月<\/td>\s*<td[^>]*>\s*([\s\S]*?)<\/td>/);
  if (!match) return null;
  const valMatch = match[1].match(/([+-]?\d+\.?\d*)%/);
  if (!valMatch) return null;
  return parseReturn(valMatch[1] + '%');
}

const FETCH_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  'Accept-Language': 'zh-TW,zh;q=0.9',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  try {
    // Get all etnet funds
    const { data: funds, error } = await supabase
      .from('mpf_funds')
      .select('etnet_fund_id, etnet_plan_id, etnet_provider_id')
      .like('etnet_fund_id', 'ETNSI%');

    if (error) throw new Error(error.message);
    console.log(`Fetching 1M returns for ${funds?.length || 0} funds`);

    let updated = 0;
    const batchSize = 10;
    const allFunds = funds || [];

    for (let i = 0; i < allFunds.length; i += batchSize) {
      const batch = allFunds.slice(i, i + batchSize);
      const results = await Promise.all(batch.map(async (fund) => {
        try {
          const url = `https://www.etnet.com.hk/www/tc/mpf/fund_detail.php?fund=${fund.etnet_fund_id}` +
            (fund.etnet_plan_id ? `&plan=${fund.etnet_plan_id}` : '') +
            (fund.etnet_provider_id ? `&provider=${fund.etnet_provider_id}` : '');
          const resp = await fetch(url, { headers: FETCH_HEADERS });
          if (!resp.ok) return null;
          const html = await resp.text();
          const return1m = parse1mFromDetail(html);
          return { id: fund.etnet_fund_id, return_1m: return1m };
        } catch { return null; }
      }));

      // Batch update
      for (const r of results) {
        if (r && r.return_1m !== null) {
          await supabase.from('mpf_funds').update({ return_1m: r.return_1m }).eq('etnet_fund_id', r.id);
          updated++;
        }
      }

      if (i + batchSize < allFunds.length) {
        await new Promise(r => setTimeout(r, 200));
      }
    }

    console.log(`Updated 1M returns for ${updated}/${allFunds.length} funds`);

    return new Response(
      JSON.stringify({ success: true, total: allFunds.length, updated }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

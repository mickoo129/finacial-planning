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

function parseDetailMarkdown(md: string) {
  const result: Record<string, number | null> = {
    return_5y: null, return_10y: null, return_1m: null,
    return_2025: null, return_2024: null, return_2023: null, return_2022: null, return_2021: null,
  };
  const lines = md.split('\n');

  for (const line of lines) {
    if (/^\|\s*1個月\s*\|/.test(line)) { const c = line.split('|').map(s=>s.trim()).filter(Boolean); if (c.length>=2) result.return_1m = parseReturn(c[1]); }
    if (/^\|\s*5年\s*\|/.test(line)) { const c = line.split('|').map(s=>s.trim()).filter(Boolean); if (c.length>=2) result.return_5y = parseReturn(c[1]); }
    if (/^\|\s*10年\s*\|/.test(line)) { const c = line.split('|').map(s=>s.trim()).filter(Boolean); if (c.length>=2) result.return_10y = parseReturn(c[1]); }
  }

  for (let i = 0; i < lines.length; i++) {
    if (!/2021/.test(lines[i]) || !/2024/.test(lines[i])) continue;
    const hCells = lines[i].split('|').map(s=>s.trim()).filter(Boolean);
    const yCols: Record<string, number> = {};
    hCells.forEach((c, idx) => { const m = c.match(/^(2021|2022|2023|2024|2025)$/); if (m) yCols[m[1]] = idx; });
    if (Object.keys(yCols).length < 3) continue;
    for (let j = i+1; j < Math.min(i+4, lines.length); j++) {
      if (/---/.test(lines[j]) && !/\d/.test(lines[j].replace(/-/g,''))) continue;
      if (/本積金/.test(lines[j]) || /[+-]?\d+\.\d+%/.test(lines[j])) {
        const dCells = lines[j].split('|').map(s=>s.trim()).filter(Boolean);
        for (const [year, idx] of Object.entries(yCols)) {
          if (idx < dCells.length) result[`return_${year}`] = parseReturn(dCells[idx]);
        }
        break;
      }
    }
    break;
  }
  return result;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY');

  if (!firecrawlApiKey) {
    return new Response(JSON.stringify({ success: false, error: 'FIRECRAWL_API_KEY not configured' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  // Get funds missing return_2025
  const { data: funds, error: fetchErr } = await supabase
    .from('mpf_funds')
    .select('id, etnet_fund_id')
    .is('return_2025', null)
    .limit(20); // Process 20 at a time to stay within timeout

  if (fetchErr) {
    return new Response(JSON.stringify({ success: false, error: fetchErr.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  if (!funds || funds.length === 0) {
    return new Response(JSON.stringify({ success: true, message: 'All funds already have 2025 data', updated: 0 }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  let updated = 0;
  let errors = 0;

  // Process funds sequentially with Firecrawl
  for (const fund of funds) {
    try {
      const url = `https://www.etnet.com.hk/www/tc/mpf/fund_detail.php?fund=${fund.etnet_fund_id}`;
      const resp = await fetch('https://api.firecrawl.dev/v1/scrape', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${firecrawlApiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, formats: ['markdown'], waitFor: 3000, onlyMainContent: true }),
      });

      if (!resp.ok) { errors++; await resp.text(); continue; }

      const data = await resp.json();
      const md = data?.data?.markdown || '';
      if (!md) { errors++; continue; }

      const detail = parseDetailMarkdown(md);

      // Update this fund immediately
      const updateData: Record<string, number | null> = {};
      for (const [key, val] of Object.entries(detail)) {
        if (val !== null) updateData[key] = val;
      }

      if (Object.keys(updateData).length > 0) {
        await supabase.from('mpf_funds').update(updateData).eq('id', fund.id);
        updated++;
      }
    } catch (e) {
      console.error(`Error for ${fund.etnet_fund_id}:`, e);
      errors++;
    }

    // Small delay between requests
    await new Promise(r => setTimeout(r, 500));
  }

  console.log(`Detail scrape batch: ${updated} updated, ${errors} errors, ${funds.length} processed`);

  const remaining = await supabase.from('mpf_funds').select('id', { count: 'exact', head: true }).is('return_2025', null);

  return new Response(
    JSON.stringify({ success: true, updated, errors, remaining: remaining.count ?? 0 }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
});

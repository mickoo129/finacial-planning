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

function parseNum(text: string): number | null {
  if (!text) return null;
  const cleaned = text.replace(/[,\s%]/g, '');
  if (cleaned === '-' || cleaned === 'N/A' || cleaned === '' || cleaned === '--') return null;
  const val = parseFloat(cleaned);
  return isNaN(val) ? null : val;
}

function parseDetailMarkdown(md: string) {
  const result: Record<string, number | null> = {
    return_5y: null, return_10y: null, return_1m: null,
    return_2025: null, return_2024: null, return_2023: null, return_2022: null, return_2021: null,
    fer: null, fund_size: null,
  };
  const lines = md.split('\n');

  // Parse cumulative returns
  for (const line of lines) {
    if (/^\|\s*1個月\s*\|/.test(line)) { const c = line.split('|').map(s=>s.trim()).filter(Boolean); if (c.length>=2) result.return_1m = parseReturn(c[1]); }
    if (/^\|\s*5年\s*\|/.test(line)) { const c = line.split('|').map(s=>s.trim()).filter(Boolean); if (c.length>=2) result.return_5y = parseReturn(c[1]); }
    if (/^\|\s*10年\s*\|/.test(line)) { const c = line.split('|').map(s=>s.trim()).filter(Boolean); if (c.length>=2) result.return_10y = parseReturn(c[1]); }
  }

  // Parse yearly returns table
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

  // Parse FER (基金開支比率) from the top summary area
  // Format: "收費\n(基金開支比率)\n(截至 ... 止年度)\n 1.17%"
  const fullText = md;
  
  // Try pattern: "收費" section with a percentage
  const ferMatch = fullText.match(/收費[^|]*基金開支比率[^|]*?\n\s*([\d.]+)\s*%?/);
  if (ferMatch) {
    result.fer = parseNum(ferMatch[1]);
  } else {
    // Alternative: look for FER in table format near 收費
    const ferMatch2 = fullText.match(/基金開支比率[^\n]*\n[^\n]*?([\d.]+)\s*%/);
    if (ferMatch2) result.fer = parseNum(ferMatch2[1]);
  }

  // Parse management fee (管理費)
  const mgmtMatch = fullText.match(/管理費\s*\|\s*([\d.]+)\s*%/);
  if (mgmtMatch && !result.fer) {
    result.fer = parseNum(mgmtMatch[1]);
  }

  // Parse fund size if available (基金規模/資產淨值)
  const sizeMatch = fullText.match(/(?:基金規模|資產淨值)[^\n]*?([\d,]+(?:\.\d+)?)\s*(?:百萬|million)/i);
  if (sizeMatch) {
    result.fund_size = parseNum(sizeMatch[1]);
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

  // Parse request body for mode
  let mode = 'missing_returns'; // default
  try {
    const body = await req.json();
    if (body?.mode) mode = body.mode;
  } catch { /* no body, use default */ }

  let funds: { id: string; etnet_fund_id: string; etnet_plan_id: string | null; etnet_provider_id: string | null }[] = [];

  if (mode === 'missing_fer') {
    // Get funds missing FER that have real etnet IDs
    const { data, error } = await supabase
      .from('mpf_funds')
      .select('id, etnet_fund_id, etnet_plan_id, etnet_provider_id')
      .is('fer', null)
      .not('etnet_fund_id', 'like', 'MPFA_%')
      .not('etnet_fund_id', 'like', 'MANUAL_%')
      .limit(5);
    if (error) {
      return new Response(JSON.stringify({ success: false, error: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    funds = data || [];
  } else if (mode === 'missing_all') {
    // Get funds missing FER OR return_2025 (prioritize those missing the most)
    const { data, error } = await supabase
      .from('mpf_funds')
      .select('id, etnet_fund_id, etnet_plan_id, etnet_provider_id')
      .or('fer.is.null,return_2025.is.null')
      .not('etnet_fund_id', 'like', 'MPFA_%')
      .not('etnet_fund_id', 'like', 'MANUAL_%')
      .limit(5);
    if (error) {
      return new Response(JSON.stringify({ success: false, error: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    funds = data || [];
  } else {
    // Default: missing return_2025
    const { data, error } = await supabase
      .from('mpf_funds')
      .select('id, etnet_fund_id, etnet_plan_id, etnet_provider_id')
      .is('return_2025', null)
      .not('etnet_fund_id', 'like', 'MPFA_%')
      .not('etnet_fund_id', 'like', 'MANUAL_%')
      .limit(5);
    if (error) {
      return new Response(JSON.stringify({ success: false, error: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    funds = data || [];
  }

  if (!funds || funds.length === 0) {
    return new Response(JSON.stringify({ success: true, message: `No funds need updating (mode: ${mode})`, updated: 0 }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  let updated = 0;
  let errors = 0;
  const details: string[] = [];

  for (const fund of funds) {
    try {
      // Build URL with plan and provider if available
      let url = `https://www.etnet.com.hk/www/tc/mpf/fund_detail.php?fund=${fund.etnet_fund_id}`;
      if (fund.etnet_plan_id) url += `&plan=${fund.etnet_plan_id}`;
      if (fund.etnet_provider_id) url += `&provider=${fund.etnet_provider_id}`;

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

      const updateData: Record<string, number | null> = {};
      for (const [key, val] of Object.entries(detail)) {
        if (val !== null) updateData[key] = val;
      }

      if (Object.keys(updateData).length > 0) {
        await supabase.from('mpf_funds').update(updateData).eq('id', fund.id);
        updated++;
        details.push(`${fund.etnet_fund_id}: updated ${Object.keys(updateData).join(', ')}`);
      } else {
        details.push(`${fund.etnet_fund_id}: no data found`);
      }
    } catch (e) {
      console.error(`Error for ${fund.etnet_fund_id}:`, e);
      errors++;
    }

    await new Promise(r => setTimeout(r, 500));
  }

  for (const d of details) console.log(d);
  console.log(`Detail scrape (${mode}): ${updated} updated, ${errors} errors, ${funds.length} processed`);

  return new Response(
    JSON.stringify({ success: true, mode, updated, errors, processed: funds.length, details }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
});

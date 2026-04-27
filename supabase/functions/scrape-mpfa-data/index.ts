import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function parseNum(s: string): number | null {
  if (!s) return null;
  const cleaned = s.trim().replace(/,/g, '');
  if (!cleaned || cleaned === 'n.a.' || cleaned === '-' || cleaned === 'N/A' || cleaned === '不適用') return null;
  const val = parseFloat(cleaned);
  return isNaN(val) ? null : val;
}

function parseDate(s: string): string | null {
  const m = s.trim().match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (!m) return null;
  return `${m[3]}-${m[2]}-${m[1]}`;
}

// MPFA scheme → trustee/scheme mapping
const SCHEME_MAP: Record<string, { trustee: string; scheme: string }> = {
  '友邦強積金優選計劃': { trustee: '友邦', scheme: '優選計劃' },
  'AMTD強積金計劃': { trustee: 'AMTD', scheme: '強積金計劃' },
  '交通銀行愉盈退休強積金計劃': { trustee: '交通銀行', scheme: '愉盈退休' },
  'BCT（強積金）行業計劃': { trustee: '銀聯信託', scheme: '行業計劃' },
  'BCT積金之選': { trustee: '銀聯信託', scheme: '積金之選' },
  'BCT強積金策略計劃': { trustee: '銀聯信託', scheme: '策略計劃' },
  '東亞（強積金）行業計劃': { trustee: '東亞', scheme: '行業計劃' },
  '東亞（強積金）集成信託計劃': { trustee: '東亞', scheme: '集成信託' },
  '東亞（強積金）享惠計劃': { trustee: '東亞', scheme: '享惠計劃' },
  '中銀保誠簡易強積金計劃': { trustee: '中銀保誠', scheme: '簡易強積金' },
  '中國人壽強積金集成信託計劃': { trustee: '中國人壽', scheme: '強積金計劃' },
  '富達退休集成信託': { trustee: '富達', scheme: '退休集成' },
  '海通MPF退休金': { trustee: '海通', scheme: 'MPF計劃' },
  '恒生強積金智選計劃': { trustee: '恒生', scheme: '智選計劃' },
  '滙豐強積金智選計劃': { trustee: '匯豐', scheme: '智選計劃' },
  '宏利環球精選（強積金）計劃': { trustee: '宏利', scheme: '環球精選' },
  '宏利退休精選（強積金）計劃': { trustee: '宏利', scheme: '退休精選' },
  '萬全強制性公積金計劃': { trustee: '萬通', scheme: '萬全計劃' },
  '我的強積金計劃': { trustee: '中銀保誠', scheme: '我的強積金' },
  '信安強積金—易富之選': { trustee: '信安', scheme: '易富之選' },
  '信安強積金—明智之選': { trustee: '信安', scheme: '明智之選' },
  '信安強積金計劃800系列': { trustee: '信安', scheme: '800系列' },
  '新地強積金僱主營辦計劃': { trustee: '新鴻基', scheme: '行業計劃' },
  '永明彩虹強積金計劃': { trustee: '永明', scheme: '彩虹計劃' },
};

function splitCategory(typeStr: string): { category: string; sub_category: string } {
  // Remove markdown escaping
  const t = typeStr.replace(/\\/g, '').trim();
  const parts = t.split(/\s*[-–—]\s*/);
  if (parts.length >= 2) {
    return { category: parts[0].trim(), sub_category: parts.slice(1).join(' - ').trim() };
  }
  return { category: t, sub_category: t };
}

function generateStableId(scheme: string, fund: string): string {
  const key = `${scheme}::${fund}`;
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = ((hash << 5) - hash) + key.charCodeAt(i);
    hash = hash & hash;
  }
  return `MPFA_${Math.abs(hash).toString(36).padStart(6, '0')}`;
}

// Normalize name for fuzzy matching
function normalizeName(name: string): string {
  return name
    .replace(/^(?:友邦優選|友邦)/, '')
    .replace(/^(?:AMTD\s*景順|AMTD\s*安聯精選|AMTD)/, '')
    .replace(/^(?:恒生強積金智選|恒生智選|恒生強積金)/, '')
    .replace(/^(?:滙豐強積金智選|滙豐智選|匯豐強積金智選|匯豐智選|匯豐強積金|滙豐強積金)/, '')
    .replace(/^(?:中銀保誠簡易強積金|中銀保誠我的強積金|中銀保誠簡易|中銀保誠我的|中銀保誠)/, '')
    .replace(/^(?:東亞集成信託|東亞享惠|東亞行業|東亞（強積金）集成|東亞（強積金）行業|東亞（強積金）享惠|東亞)/, '')
    .replace(/^(?:銀聯積金之選|銀聯策略景順|銀聯策略|銀聯行業|BCT積金之選|BCT策略|BCT行業|BCT（行業）|BCT|銀聯)/, '')
    .replace(/^(?:交通銀行愉盈退休|交通銀行愉盈|交通銀行)/, '')
    .replace(/^(?:富達退休集成|富達退休|富達)/, '')
    .replace(/^(?:永明彩虹強積金|永明彩虹|永明)/, '')
    .replace(/^(?:海通MPF退休金|海通MPF|海通)/, '')
    .replace(/^(?:信安800系列|信安800|信安明智之選|信安明智|信安易富之選|信安易富|信安)/, '')
    .replace(/^(?:萬通萬全|萬全|萬通)/, '')
    .replace(/^(?:中國人壽強積金|中國人壽)/, '')
    .replace(/^(?:新地強積金|新鴻基)/, '')
    .replace(/^(?:宏利退休精選|宏利環球精選|宏利退休|宏利環球|宏利)/, '')
    .replace(/^(?:景順)/, '')
    .replace(/\s*[-–—]\s*(?:單位)?(?:類別)?\s*[A-Z]\s*$/i, '')
    .replace(/\s+/g, '')
    .trim();
}

interface ParsedFund {
  scheme_name: string;
  fund_name: string;
  trustee_raw: string;
  category_full: string;
  launch_date: string | null;
  fund_size: number | null;
  risk_level: string | null;
  fer: number | null;
  ret_1y_ann: number | null;
  ret_5y_ann: number | null;
  ret_10y_ann: number | null;
  ret_since_launch: number | null;
  ret_2025: number | null;
  ret_2024: number | null;
  ret_2023: number | null;
  ret_2022: number | null;
  ret_2021: number | null;
}

function parseMpfaMarkdown(md: string): ParsedFund[] {
  const funds: ParsedFund[] = [];
  const lines = md.split('\n');

  for (const line of lines) {
    if (!line.startsWith('|')) continue;
    // Skip separator/header rows
    if (/^[\s|:-]+$/.test(line)) continue;
    // Skip header rows with sort icons or bold column names (but NOT data rows with Icon_Document)
    if (/comparison_up|comparison_down/.test(line)) continue;
    if (/\*\*計劃\*\*|\*\*受託人\*\*|\*\*基金類別\*\*|\*\*一年期\*\*|\*\*五年期\*\*|\*\*推出日期\*\*/.test(line)) continue;

    const cells = line.split('|').map(c => c.trim()).filter(c => c !== '');
    if (cells.length < 20) continue;

    // Find launch date cell (DD-MM-YYYY) as anchor
    let dateIdx = -1;
    for (let i = 3; i < Math.min(cells.length, 12); i++) {
      if (/^\d{2}-\d{2}-\d{4}$/.test(cells[i])) {
        dateIdx = i;
        break;
      }
    }
    if (dateIdx < 4) continue;

    // Extract fields relative to date position
    const categoryFull = (cells[dateIdx - 1] || '').replace(/\\/g, '');
    const trusteeRaw = cells[dateIdx - 2] || '';
    const fundName = cells[dateIdx - 3] || '';

    // Find scheme name (skip image/link cells)
    let schemeName = '';
    for (let i = dateIdx - 4; i >= 0; i--) {
      const c = cells[i];
      if (c && !c.includes('Icon_Document') && !c.includes('![') && !c.includes('mpfa.org') && c.length > 2) {
        schemeName = c;
        break;
      }
    }
    if (!fundName || !schemeName) continue;

    const fundSizeStr = cells[dateIdx + 1] || '';
    const riskStr = cells[dateIdx + 2] || '';
    const ferStr = cells[dateIdx + 3] || '';

    // Returns: starting from dateIdx + 4
    // Ann: 1Y, 5Y, 10Y, since_launch (4 values)
    // Cum: 1Y, 5Y, 10Y, since_launch (4 values)
    // Cal: 2025, 2024, 2023, 2022, 2021 (5 values)
    const r = dateIdx + 4;

    funds.push({
      scheme_name: schemeName,
      fund_name: fundName,
      trustee_raw: trusteeRaw,
      category_full: categoryFull,
      launch_date: parseDate(cells[dateIdx]),
      fund_size: parseNum(fundSizeStr),
      risk_level: riskStr || null,
      fer: parseNum(ferStr),
      ret_1y_ann: parseNum(cells[r] || ''),
      ret_5y_ann: parseNum(cells[r + 1] || ''),
      ret_10y_ann: parseNum(cells[r + 2] || ''),
      ret_since_launch: parseNum(cells[r + 3] || ''),
      // Skip cumulative (r+4 to r+7)
      ret_2025: parseNum(cells[r + 8] || ''),
      ret_2024: parseNum(cells[r + 9] || ''),
      ret_2023: parseNum(cells[r + 10] || ''),
      ret_2022: parseNum(cells[r + 11] || ''),
      ret_2021: parseNum(cells[r + 12] || ''),
    });
  }
  return funds;
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

  try {
    // Step 1: Fetch MPFA page via Firecrawl (JS rendering needed)
    console.log('Fetching MPFA fund platform via Firecrawl...');
    const resp = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: 'https://mfp.mpfa.org.hk/tch/mpp_list.jsp',
        formats: ['markdown'],
        waitFor: 10000,
        onlyMainContent: false,
      }),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      throw new Error(`Firecrawl error: ${resp.status} ${errText.substring(0, 300)}`);
    }

    const scrapeData = await resp.json();
    const md = scrapeData?.data?.markdown || scrapeData?.markdown || '';
    if (!md || md.length < 1000) {
      throw new Error(`MPFA page too short (${md.length} chars)`);
    }
    console.log(`Got MPFA markdown: ${md.length} chars`);

    // Step 2: Parse funds
    const parsed = parseMpfaMarkdown(md);
    console.log(`Parsed ${parsed.length} funds from MPFA`);

    if (parsed.length < 50) {
      return new Response(JSON.stringify({
        success: false,
        error: `Only ${parsed.length} funds parsed, expected 300+`,
        md_length: md.length,
        sample: parsed.slice(0, 3),
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Step 3: Load existing etnet funds for matching
    const { data: existingFunds } = await supabase
      .from('mpf_funds')
      .select('id, etnet_fund_id, name, name_zh, trustee_name, scheme_name, mpfa_name');

    // Build lookup maps - multiple strategies
    const etnetBySchemeAndName = new Map<string, any>();
    const etnetByTrusteeAndName = new Map<string, any>();
    const etnetByNormName = new Map<string, any>();
    
    for (const ef of (existingFunds || [])) {
      // Strategy 1: scheme + normalized name (most precise)
      if (ef.scheme_name && ef.name_zh) {
        const key = `${ef.scheme_name}::${normalizeName(ef.name_zh)}`;
        etnetBySchemeAndName.set(key, ef);
      }
      // Strategy 2: trustee + exact name_zh
      if (ef.trustee_name && ef.name_zh) {
        const key = `${ef.trustee_name}::${ef.name_zh}`;
        if (!etnetByTrusteeAndName.has(key)) {
          etnetByTrusteeAndName.set(key, ef);
        }
      }
      // Strategy 3: trustee + normalized name
      if (ef.trustee_name && ef.name_zh) {
        const key = `${ef.trustee_name}::${normalizeName(ef.name_zh)}`;
        if (!etnetByNormName.has(key)) {
          etnetByNormName.set(key, ef);
        }
      }
    }

    // Step 4: Match and build upsert records
    let matched = 0, newCount = 0;
    const upsertRecords: Record<string, unknown>[] = [];
    const matchLog: string[] = [];

    for (const fund of parsed) {
      const mapping = SCHEME_MAP[fund.scheme_name];
      const trusteeName = mapping?.trustee || fund.trustee_raw.replace(/信託$/, '').replace(/有限公司$/, '').trim();
      const schemeName = mapping?.scheme || fund.scheme_name;
      const { category, sub_category } = splitCategory(fund.category_full);
      const fundNorm = normalizeName(fund.fund_name);

      // Try matching strategies in order of precision
      const key1 = `${schemeName}::${fundNorm}`;
      const key2 = `${trusteeName}::${fund.fund_name}`;
      const key3 = `${trusteeName}::${fundNorm}`;
      
      const existingFund = etnetBySchemeAndName.get(key1) 
        || etnetByTrusteeAndName.get(key2) 
        || etnetByNormName.get(key3);

      let etnetFundId: string;
      if (existingFund) {
        etnetFundId = existingFund.etnet_fund_id;
        matched++;
      } else {
        etnetFundId = generateStableId(fund.scheme_name, fund.fund_name);
        newCount++;
        if (newCount <= 10) {
          matchLog.push(`NEW: "${fund.scheme_name}" / "${fund.fund_name}" → ${etnetFundId}`);
        }
      }

      upsertRecords.push({
        etnet_fund_id: etnetFundId,
        name: existingFund?.name || fund.fund_name,
        name_zh: fund.fund_name,
        mpfa_name: fund.fund_name,
        trustee_name: trusteeName,
        scheme_name: schemeName,
        category,
        sub_category,
        launch_date: fund.launch_date,
        fund_size: fund.fund_size,
        fer: fund.fer,
        risk_level: fund.risk_level,
        return_5y: fund.ret_5y_ann,
        return_10y: fund.ret_10y_ann,
        return_since_launch: fund.ret_since_launch,
        return_2025: fund.ret_2025,
        return_2024: fund.ret_2024,
        return_2023: fund.ret_2023,
        return_2022: fund.ret_2022,
        return_2021: fund.ret_2021,
        // Don't overwrite etnet short-term fields (return_ytd, return_1m, return_3m, return_1y)
      });
    }

    for (const log of matchLog) console.log(log);
    console.log(`Match results: ${matched} matched, ${newCount} new`);

    // Coverage check: count non-null values per return field in parsed batch
    const fields = ['ret_1y_ann','ret_5y_ann','ret_10y_ann','ret_since_launch','ret_2025','ret_2024','ret_2023','ret_2022','ret_2021'] as const;
    const coverage: Record<string, number> = {};
    for (const f of fields) {
      coverage[f] = parsed.filter((p) => (p as any)[f] !== null && (p as any)[f] !== undefined).length;
    }
    const total = parsed.length || 1;
    const covSummary = Object.entries(coverage).map(([k,v]) => `${k}=${v}/${total} (${Math.round(v/total*100)}%)`).join(', ');
    console.log(`Coverage: ${covSummary}`);
    // Sanity: warn if any long-term field drops below 50%
    for (const f of ['ret_5y_ann','ret_10y_ann'] as const) {
      const pct = coverage[f] / total;
      if (pct < 0.5) console.warn(`⚠️ ${f} coverage low (${Math.round(pct*100)}%) — possible parser column shift`);
    }
    // NOTE: MPFA does NOT publish 3Y annualised returns. If a future schema change adds it,
    // update parseMpfaMarkdown() to extract ret_3y_ann and surface here. Currently 3Y stays on ETNET.

    // Step 5: Deduplicate by etnet_fund_id (keep last occurrence) then batch upsert
    const deduped = new Map<string, Record<string, unknown>>();
    for (const rec of upsertRecords) {
      deduped.set(rec.etnet_fund_id as string, rec);
    }
    const uniqueRecords = [...deduped.values()];
    console.log(`Deduplicated: ${upsertRecords.length} → ${uniqueRecords.length}`);

    let upserted = 0;
    for (let i = 0; i < uniqueRecords.length; i += 50) {
      const batch = uniqueRecords.slice(i, i + 50);
      const { error } = await supabase
        .from('mpf_funds')
        .upsert(batch, { onConflict: 'etnet_fund_id' });
      if (error) {
        console.error(`Upsert batch ${i} error: ${error.message}`);
      } else {
        upserted += batch.length;
      }
    }

    // Log
    await supabase.from('mpf_scrape_logs').insert({
      status: 'success',
      funds_count: parsed.length,
      error_message: `MPFA: ${matched} matched, ${newCount} new`,
    });

    const result = {
      success: true,
      total_parsed: parsed.length,
      matched,
      new_funds: newCount,
      upserted,
    };
    console.log(`MPFA scrape done: ${JSON.stringify(result)}`);

    return new Response(JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('MPFA scrape error:', msg);
    return new Response(JSON.stringify({ success: false, error: msg }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});

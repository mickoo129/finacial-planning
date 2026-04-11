import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MpfaFund {
  scheme: string;
  fund_name: string;
  trustee_abbr: string;
  fund_type: string;
  launch_date: string | null;
  fund_size: number | null;
  risk_class: string | null;
  fer: number | null;
  return_1y_ann: number | null;
  return_5y_ann: number | null;
  return_10y_ann: number | null;
  return_since_launch_ann: number | null;
  return_2025: number | null;
  return_2024: number | null;
  return_2023: number | null;
  return_2022: number | null;
  return_2021: number | null;
}

function parseNum(text: string): number | null {
  const cleaned = text.trim().replace(/,/g, '');
  if (!cleaned || cleaned === 'n.a.' || cleaned === '-' || cleaned === 'N/A') return null;
  const val = parseFloat(cleaned);
  return isNaN(val) ? null : val;
}

// MPFA scheme name → { trustee (Chinese), scheme (Chinese) }
const SCHEME_MAP: Record<string, { trustee: string; scheme: string }> = {
  'AIA MPF - Prime Value Choice': { trustee: '友邦', scheme: '優選計劃' },
  'AMTD MPF Scheme': { trustee: 'AMTD', scheme: '強積金計劃' },
  'BCOM Joyful Retirement MPF Scheme': { trustee: '交通銀行', scheme: '愉盈退休' },
  'BCT (MPF) Industry Choice': { trustee: '銀聯信託', scheme: '行業計劃' },
  'BCT (MPF) Pro Choice': { trustee: '銀聯信託', scheme: '積金之選' },
  'BCT Strategic MPF Scheme': { trustee: '銀聯信託', scheme: '策略計劃' },
  'BEA (MPF) Industry Scheme': { trustee: '東亞', scheme: '行業計劃' },
  'BEA (MPF) Master Trust Scheme': { trustee: '東亞', scheme: '集成信託' },
  'BEA (MPF) Value Scheme': { trustee: '東亞', scheme: '享惠計劃' },
  'BOC-Prudential Easy-Choice Mandatory Provident Fund Scheme': { trustee: '中銀保誠', scheme: '簡易強積金' },
  'China Life MPF Master Trust Scheme': { trustee: '中國人壽', scheme: '強積金計劃' },
  'Fidelity Retirement Master Trust': { trustee: '富達', scheme: '退休集成' },
  'Haitong MPF Retirement Fund': { trustee: '海通', scheme: 'MPF計劃' },
  'Hang Seng Mandatory Provident Fund - SuperTrust Plus': { trustee: '恒生', scheme: '智選計劃' },
  'HSBC Mandatory Provident Fund - SuperTrust Plus': { trustee: '匯豐', scheme: '智選計劃' },
  'Manulife Global Select (MPF) Scheme': { trustee: '宏利', scheme: '環球精選' },
  'Manulife RetireChoice (MPF) Scheme': { trustee: '宏利', scheme: '退休精選' },
  'MASS Mandatory Provident Fund Scheme': { trustee: '萬通', scheme: '萬全計劃' },
  'My Choice Mandatory Provident Fund Scheme': { trustee: '中銀保誠', scheme: '我的強積金' },
  'Principal MPF - Simple Plan': { trustee: '信安', scheme: '易富之選' },
  'Principal MPF - Smart Plan': { trustee: '信安', scheme: '明智之選' },
  'Principal MPF Scheme Series 800': { trustee: '信安', scheme: '800系列' },
  'SHKP MPF Employer Sponsored Scheme': { trustee: '新鴻基', scheme: '行業計劃' },
  'Sun Life Rainbow MPF Scheme': { trustee: '永明', scheme: '彩虹計劃' },
};

// Comprehensive keyword pairs: English regex → Chinese substrings to look for
const FUND_KEYWORDS: Array<{ en: RegExp; zh: string[]; weight: number }> = [
  // DIS - high weight
  { en: /Core Accumulation/i, zh: ['核心累積'], weight: 15 },
  { en: /Age 65 Plus/i, zh: ['65歲後'], weight: 15 },
  // Conservative
  { en: /MPF Conservative/i, zh: ['強積金保守'], weight: 15 },
  { en: /Conservative/i, zh: ['保守'], weight: 8 },
  // Guaranteed
  { en: /Guaranteed/i, zh: ['保證'], weight: 12 },
  // Index tracking
  { en: /Hang Seng.*Index|HSI/i, zh: ['恒指', '恒生指數'], weight: 15 },
  { en: /Index.*Track|Tracking/i, zh: ['指數', '追蹤'], weight: 10 },
  // Region - specific before general
  { en: /Greater China/i, zh: ['大中華'], weight: 12 },
  { en: /Hong Kong.*China|China.*Hong Kong/i, zh: ['大中華', '香港中國', '中國', '香港'], weight: 10 },
  { en: /Hong Kong Dollar/i, zh: ['港元'], weight: 12 },
  { en: /Hong Kong/i, zh: ['香港'], weight: 8 },
  { en: /China|Chinese/i, zh: ['中國', '中華'], weight: 8 },
  { en: /Japan/i, zh: ['日本'], weight: 10 },
  { en: /Korea/i, zh: ['韓國'], weight: 10 },
  { en: /Asia.*Pacific/i, zh: ['亞太'], weight: 10 },
  { en: /Asian|Asia/i, zh: ['亞洲', '亞太', '亞歐', '亞'], weight: 6 },
  { en: /Europe/i, zh: ['歐洲', '歐'], weight: 8 },
  { en: /North Americ/i, zh: ['北美', '美洲', '美國'], weight: 10 },
  { en: /United States|U\.?S\.?\s|American/i, zh: ['美國', '美洲', '北美'], weight: 10 },
  { en: /Global|World|International/i, zh: ['環球', '全球', '國際'], weight: 6 },
  { en: /Eurasia/i, zh: ['亞歐', '歐亞'], weight: 12 },
  // Asset type
  { en: /Equity/i, zh: ['股票', '股'], weight: 5 },
  { en: /Bond/i, zh: ['債券', '債'], weight: 6 },
  { en: /Fixed Income/i, zh: ['固定收益'], weight: 10 },
  { en: /Money Market/i, zh: ['貨幣'], weight: 12 },
  { en: /RMB|Renminbi/i, zh: ['人民幣'], weight: 12 },
  // Strategy
  { en: /Growth/i, zh: ['增長', '進取'], weight: 6 },
  { en: /Balanced/i, zh: ['均衡', '平衡'], weight: 8 },
  { en: /Stable|Capital Stable/i, zh: ['穩定', '穩健', '平穩'], weight: 8 },
  { en: /Dynamic/i, zh: ['靈活', '動態', '動力'], weight: 6 },
  { en: /Green|ESG|Sustainable/i, zh: ['綠色', 'ESG', '環保'], weight: 10 },
  { en: /Flexi/i, zh: ['靈活'], weight: 8 },
  { en: /Manager.*Choice/i, zh: ['基金經理', '精選退休'], weight: 12 },
  { en: /Target/i, zh: ['目標'], weight: 6 },
  // Mixed asset ratios (E30, E50, E70, E90)
  { en: /E30\b/i, zh: ['E30'], weight: 20 },
  { en: /E50\b/i, zh: ['E50'], weight: 20 },
  { en: /E70\b/i, zh: ['E70'], weight: 20 },
  { en: /E90\b/i, zh: ['E90'], weight: 20 },
  // Provider-specific fund names
  { en: /SaveEasy/i, zh: ['自在退休'], weight: 15 },
  { en: /Income.*Retirement/i, zh: ['收入退休'], weight: 10 },
  // Allianz sub-fund patterns (for Manulife)
  { en: /Allianz.*Oriental|Oriental.*Pacific/i, zh: ['東方太平洋'], weight: 15 },
  { en: /Allianz.*Growth/i, zh: ['安聯增長', '增長'], weight: 8 },
  { en: /Allianz.*Balanced/i, zh: ['安聯均衡', '均衡'], weight: 8 },
  { en: /Allianz.*Stable/i, zh: ['安聯穩定', '穩定'], weight: 8 },
  { en: /Allianz.*Dynamic/i, zh: ['安聯靈活', '靈活'], weight: 8 },
  { en: /Allianz.*Capital Stable/i, zh: ['安聯穩定資本', '穩定資本'], weight: 10 },
  { en: /Allianz.*Choice/i, zh: ['安聯精選'], weight: 6 },
  { en: /Allianz/i, zh: ['安聯'], weight: 5 },
];

// Extract class suffix (A, B, T, H, I, D, etc.)
function getClassSuffix(name: string): string | null {
  // English: "... - Class A", "... - Unit Class H", "... Class T"
  const enMatch = name.match(/[-–]\s*(?:Unit\s+)?Class\s+([A-Z])\b/i);
  if (enMatch) return enMatch[1].toUpperCase();
  // Chinese: "... - A", "... - T", "... - B"
  const zhMatch = name.match(/[-–]\s*([A-Z])\s*$/);
  if (zhMatch) return zhMatch[1].toUpperCase();
  return null;
}

// Strip class suffix for matching
function stripClass(name: string): string {
  return name
    .replace(/\s*[-–]\s*(?:Unit\s+)?Class\s+[A-Z]\b/i, '')
    .replace(/\s*[-–]\s*[A-Z]\s*$/, '')
    .trim();
}

// Map MPFA fund types to Chinese categories
function mapFundType(type: string): { category: string; subCategory: string } {
  const t = type.trim();
  if (t.includes('Default Investment Strategy')) {
    if (t.includes('Core Accumulation')) return { category: '預設投資策略', subCategory: '預設投資-核心累積基金' };
    if (t.includes('Age 65 Plus')) return { category: '預設投資策略', subCategory: '預設投資-65歲後基金' };
    return { category: '預設投資策略', subCategory: '預設投資策略' };
  }
  if (t.includes('Equity Fund')) {
    if (t.includes('Greater China')) return { category: '股票基金', subCategory: '股票基金-大中華' };
    if (t.includes('Asia')) return { category: '股票基金', subCategory: '股票基金-亞洲' };
    if (t.includes('China')) return { category: '股票基金', subCategory: '股票基金-中國' };
    if (t.includes('Europe')) return { category: '股票基金', subCategory: '股票基金-歐洲' };
    if (t.includes('Hong Kong') && t.includes('Index')) return { category: '股票基金', subCategory: '股票基金-香港指數追蹤' };
    if (t.includes('Hong Kong')) return { category: '股票基金', subCategory: '股票基金-香港' };
    if (t.includes('Japan')) return { category: '股票基金', subCategory: '股票基金-日本' };
    if (t.includes('United States')) return { category: '股票基金', subCategory: '股票基金-美國' };
    if (t.includes('Global')) return { category: '股票基金', subCategory: '股票基金-環球' };
    return { category: '股票基金', subCategory: '股票基金-其他' };
  }
  if (t.includes('Mixed Assets Fund')) {
    if (t.includes('81% to 100%')) return { category: '混合資產基金', subCategory: '混合資產基金-81%至100%股票' };
    if (t.includes('61% to 80%')) return { category: '混合資產基金', subCategory: '混合資產基金-61%至80%股票' };
    if (t.includes('41% to 60%')) return { category: '混合資產基金', subCategory: '混合資產基金-41%至60%股票' };
    if (t.includes('21% to 40%')) return { category: '混合資產基金', subCategory: '混合資產基金-21%至40%股票' };
    return { category: '混合資產基金', subCategory: '混合資產基金-其他' };
  }
  if (t.includes('Bond Fund')) {
    if (t.includes('Asia')) return { category: '債券基金', subCategory: '債券基金-亞洲' };
    if (t.includes('Global')) return { category: '債券基金', subCategory: '債券基金-環球' };
    if (t.includes('Hong Kong Dollar')) return { category: '債券基金', subCategory: '債券基金-港元' };
    if (t.includes('RMB')) return { category: '債券基金', subCategory: '債券基金-人民幣' };
    return { category: '債券基金', subCategory: '債券基金-其他' };
  }
  if (t.includes('Guaranteed')) return { category: '保證基金', subCategory: '保證基金' };
  if (t.includes('MPF Conservative')) return { category: '強積金保守基金', subCategory: '強積金保守基金' };
  if (t.includes('Money Market')) return { category: '貨幣市場基金', subCategory: '貨幣市場基金' };
  return { category: '其他', subCategory: '其他' };
}

function parseMpfaHtml(html: string): MpfaFund[] {
  const funds: MpfaFund[] = [];
  const rows = html.split(/<tr class="wr"/);
  
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const labelMatch = row.match(/<label[^>]*>\s*([^<]+?)\s*<\/label>/);
    const scheme = labelMatch ? labelMatch[1].trim() : '';
    const tdLeftMatches = [...row.matchAll(/colspan="2"\s+align="left"\s+class="table"\s*>([^<]*(?:<[^>]*>[^<]*)*?)<\/td>/g)];
    const fundName = tdLeftMatches.length >= 1 ? tdLeftMatches[0][1].replace(/<[^>]*>/g, '').trim() : '';
    const fundType = tdLeftMatches.length >= 2 ? tdLeftMatches[1][1].replace(/<[^>]*>/g, '').trim() : '';
    const trusteeMatch = row.match(/<div\s+align="center">\s*([^<\s]+)\s*<\/div>/);
    const trusteeAbbr = trusteeMatch ? trusteeMatch[1].trim() : '';
    const launchMatch = row.match(/align="center"\s+class="table mpp_tab_green">\s*([^<]+?)\s*<\/td>/);
    const launchDate = launchMatch ? launchMatch[1].trim() : null;
    const rightGreenMatches = [...row.matchAll(/align="right"\s+class="table mpp_tab_green">\s*([^<]+?)\s*<\/td>/g)];
    const fundSize = rightGreenMatches.length >= 1 ? parseNum(rightGreenMatches[0][1]) : null;
    const risk = rightGreenMatches.length >= 2 ? rightGreenMatches[1][1].trim() : null;
    const ferMatch = row.match(/colspan="2"\s+align="right"\s+class="table">\s*([\d.]+)\s*<\/td>/);
    const fer = ferMatch ? parseNum(ferMatch[1]) : null;
    const arMatches = [...row.matchAll(/class="arCol\s+mpp_tab_green"[^>]*>\s*([^<]*?)\s*<\/td>/g)];
    const arValues = arMatches.map(m => m[1].trim());
    const cyrMatches = [...row.matchAll(/class="cyrCol\s+mpp_tab_green"[^>]*>\s*([^<]*?)\s*<\/td>/g)];
    const cyrValues = cyrMatches.map(m => m[1].trim());
    
    if (!fundName && !scheme) continue;
    
    funds.push({
      scheme, fund_name: fundName, trustee_abbr: trusteeAbbr, fund_type: fundType,
      launch_date: launchDate, fund_size: fundSize, risk_class: risk, fer,
      return_1y_ann: arValues[0] ? parseNum(arValues[0]) : null,
      return_5y_ann: arValues[1] ? parseNum(arValues[1]) : null,
      return_10y_ann: arValues[2] ? parseNum(arValues[2]) : null,
      return_since_launch_ann: arValues[3] ? parseNum(arValues[3]) : null,
      return_2025: cyrValues[0] ? parseNum(cyrValues[0]) : null,
      return_2024: cyrValues[1] ? parseNum(cyrValues[1]) : null,
      return_2023: cyrValues[2] ? parseNum(cyrValues[2]) : null,
      return_2022: cyrValues[3] ? parseNum(cyrValues[3]) : null,
      return_2021: cyrValues[4] ? parseNum(cyrValues[4]) : null,
    });
  }
  return funds;
}

// Score how well an MPFA fund name matches an etnet fund name
function matchScore(mpfaFundName: string, etnetFundName: string, sameScheme: boolean): number {
  let score = 0;
  const mpfaStripped = stripClass(mpfaFundName);
  
  for (const kw of FUND_KEYWORDS) {
    if (kw.en.test(mpfaStripped)) {
      for (const zh of kw.zh) {
        if (etnetFundName.includes(zh)) {
          score += kw.weight;
          break;
        }
      }
    }
  }
  
  // Bonus for same scheme
  if (sameScheme && score > 0) score += 5;
  
  // Class matching bonus/penalty
  const mpfaClass = getClassSuffix(mpfaFundName);
  const etnetClass = getClassSuffix(etnetFundName);
  if (mpfaClass && etnetClass) {
    if (mpfaClass === etnetClass) score += 10;
    else score -= 20; // strong penalty for class mismatch
  }
  
  return score;
}

interface EtnetFund {
  id: string;
  etnet_fund_id: string;
  name: string;
  trustee_name: string | null;
  scheme_name: string | null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  try {
    const url = 'https://mfp.mpfa.org.hk/mobile/eng/mpp_list.jsp';
    console.log(`Fetching MPFA: ${url}`);

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept-Language': 'en',
      },
    });

    if (!response.ok) throw new Error(`Failed to fetch MPFA: ${response.status}`);
    const html = await response.text();

    const mpfaFunds = parseMpfaHtml(html);
    console.log(`Parsed ${mpfaFunds.length} MPFA funds`);

    if (mpfaFunds.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'No funds parsed', htmlLen: html.length }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch all existing etnet funds from DB
    const { data: etnetFunds, error: fetchErr } = await supabase
      .from('mpf_funds')
      .select('id, etnet_fund_id, name, trustee_name, scheme_name')
      .like('etnet_fund_id', 'ETNSI%');

    if (fetchErr) throw new Error(`DB fetch error: ${fetchErr.message}`);
    console.log(`Loaded ${etnetFunds?.length || 0} etnet funds from DB`);

    // Group etnet funds by trustee and by trustee+scheme
    const etnetByTrustee = new Map<string, EtnetFund[]>();
    const etnetByScheme = new Map<string, EtnetFund[]>();
    for (const f of (etnetFunds || [])) {
      const t = f.trustee_name || '';
      if (!etnetByTrustee.has(t)) etnetByTrustee.set(t, []);
      etnetByTrustee.get(t)!.push(f as EtnetFund);
      const key = `${f.trustee_name}|${f.scheme_name}`;
      if (!etnetByScheme.has(key)) etnetByScheme.set(key, []);
      etnetByScheme.get(key)!.push(f as EtnetFund);
    }

    // Match MPFA funds to etnet funds
    let matched = 0;
    let unmatched = 0;
    const upsertRecords: Array<Record<string, unknown>> = [];
    const usedEtnetIds = new Set<string>();
    const matchDetails: string[] = [];

    for (const mpfa of mpfaFunds) {
      const schemeMapping = SCHEME_MAP[mpfa.scheme];
      const { category, subCategory } = mapFundType(mpfa.fund_type);
      
      let bestMatch: EtnetFund | null = null;
      let bestScore = 0;

      if (schemeMapping) {
        // Strategy 1: Match within same scheme (highest priority)
        const schemeKey = `${schemeMapping.trustee}|${schemeMapping.scheme}`;
        const schemeCandidates = etnetByScheme.get(schemeKey) || [];
        
        for (const candidate of schemeCandidates) {
          if (usedEtnetIds.has(candidate.etnet_fund_id)) continue;
          const score = matchScore(mpfa.fund_name, candidate.name, true);
          if (score > bestScore) {
            bestScore = score;
            bestMatch = candidate;
          }
        }
        
        // Strategy 2: Match within same trustee (broader search)
        if (bestScore < 15) {
          const trusteeCandidates = etnetByTrustee.get(schemeMapping.trustee) || [];
          for (const candidate of trusteeCandidates) {
            if (usedEtnetIds.has(candidate.etnet_fund_id)) continue;
            const score = matchScore(mpfa.fund_name, candidate.name, false);
            if (score > bestScore) {
              bestScore = score;
              bestMatch = candidate;
            }
          }
        }
      }

      const mpfaData: Record<string, unknown> = {
        category,
        sub_category: subCategory,
        fee_ratio: mpfa.fer,
        risk_level: mpfa.risk_class,
        return_5y: mpfa.return_5y_ann,
        return_10y: mpfa.return_10y_ann,
        return_2024: mpfa.return_2024,
        return_2023: mpfa.return_2023,
        return_2022: mpfa.return_2022,
        return_2021: mpfa.return_2021,
      };

      if (bestMatch && bestScore >= 10) {
        usedEtnetIds.add(bestMatch.etnet_fund_id);
        upsertRecords.push({
          etnet_fund_id: bestMatch.etnet_fund_id,
          name: bestMatch.name,
          trustee_name: bestMatch.trustee_name,
          scheme_name: bestMatch.scheme_name,
          ...mpfaData,
        });
        matched++;
        if (matched <= 20 || matched % 50 === 0) {
          matchDetails.push(`✓ "${mpfa.fund_name}" → "${bestMatch.name}" (score:${bestScore})`);
        }
      } else {
        const trusteeName = schemeMapping?.trustee || mpfa.trustee_abbr;
        const schemeName = schemeMapping?.scheme || mpfa.scheme;
        const fundId = `MPFA_${mpfa.scheme}_${mpfa.fund_name}`.replace(/[^a-zA-Z0-9_]/g, '_').substring(0, 100);
        
        upsertRecords.push({
          etnet_fund_id: fundId,
          name: mpfa.fund_name,
          trustee_name: trusteeName,
          scheme_name: schemeName,
          ...mpfaData,
        });
        unmatched++;
        if (unmatched <= 30) {
          matchDetails.push(`✗ "${mpfa.scheme}" / "${mpfa.fund_name}" (best:${bestScore})`);
        }
      }
    }

    // Log match details
    for (const d of matchDetails) console.log(d);
    console.log(`Matched: ${matched}, Unmatched: ${unmatched}`);

    // Batch upsert
    let upserted = 0;
    for (let i = 0; i < upsertRecords.length; i += 50) {
      const chunk = upsertRecords.slice(i, i + 50);
      const { error } = await supabase
        .from('mpf_funds')
        .upsert(chunk, { onConflict: 'etnet_fund_id' });
      if (!error) upserted += chunk.length;
      else console.error(`Upsert chunk ${i} error: ${error.message}`);
    }

    const result = {
      success: true,
      total_parsed: mpfaFunds.length,
      matched,
      unmatched,
      upserted,
      sample_matches: matchDetails.slice(0, 10),
    };

    console.log(`Done: ${JSON.stringify({ ...result, sample_matches: undefined })}`);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('MPFA scrape error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

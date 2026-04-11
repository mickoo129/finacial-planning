import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MpfaFund {
  scheme_zh: string;
  fund_name_zh: string;
  trustee_zh: string;
  fund_type_zh: string;
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
  if (!cleaned || cleaned === 'n.a.' || cleaned === '-' || cleaned === 'N/A' || cleaned === '不適用') return null;
  const val = parseFloat(cleaned);
  return isNaN(val) ? null : val;
}

// Chinese MPFA scheme → etnet trustee/scheme mapping
const SCHEME_MAP_ZH: Record<string, { trustee: string; scheme: string }> = {
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

// Map Chinese fund type string to category and sub_category
function mapFundTypeZh(type: string): { category: string; subCategory: string } {
  const t = type.trim();
  // DIS
  if (t.includes('預設投資策略')) {
    if (t.includes('核心累積')) return { category: '預設投資策略', subCategory: '預設投資-核心累積基金' };
    if (t.includes('65歲後')) return { category: '預設投資策略', subCategory: '預設投資-65歲後基金' };
    return { category: '預設投資策略', subCategory: '預設投資策略' };
  }
  if (t.includes('股票基金')) {
    if (t.includes('大中華')) return { category: '股票基金', subCategory: '股票基金-大中華' };
    if (t.includes('亞洲')) return { category: '股票基金', subCategory: '股票基金-亞洲' };
    if (t.includes('中國')) return { category: '股票基金', subCategory: '股票基金-中國' };
    if (t.includes('歐洲')) return { category: '股票基金', subCategory: '股票基金-歐洲' };
    if (t.includes('香港') && t.includes('指數')) return { category: '股票基金', subCategory: '股票基金-香港指數追蹤' };
    if (t.includes('香港')) return { category: '股票基金', subCategory: '股票基金-香港' };
    if (t.includes('日本')) return { category: '股票基金', subCategory: '股票基金-日本' };
    if (t.includes('美國') || t.includes('北美')) return { category: '股票基金', subCategory: '股票基金-美國' };
    if (t.includes('環球')) return { category: '股票基金', subCategory: '股票基金-環球' };
    return { category: '股票基金', subCategory: '股票基金-其他' };
  }
  if (t.includes('混合資產基金')) {
    if (t.includes('81%至100%')) return { category: '混合資產基金', subCategory: '混合資產基金-81%至100%股票' };
    if (t.includes('61%至80%')) return { category: '混合資產基金', subCategory: '混合資產基金-61%至80%股票' };
    if (t.includes('41%至60%')) return { category: '混合資產基金', subCategory: '混合資產基金-41%至60%股票' };
    if (t.includes('21%至40%')) return { category: '混合資產基金', subCategory: '混合資產基金-21%至40%股票' };
    return { category: '混合資產基金', subCategory: '混合資產基金-其他' };
  }
  if (t.includes('債券基金')) {
    if (t.includes('亞洲')) return { category: '債券基金', subCategory: '債券基金-亞洲' };
    if (t.includes('環球')) return { category: '債券基金', subCategory: '債券基金-環球' };
    if (t.includes('港元')) return { category: '債券基金', subCategory: '債券基金-港元' };
    if (t.includes('人民幣')) return { category: '債券基金', subCategory: '債券基金-人民幣' };
    return { category: '債券基金', subCategory: '債券基金-其他' };
  }
  if (t.includes('保證基金')) return { category: '保證基金', subCategory: '保證基金' };
  if (t.includes('強積金保守基金')) return { category: '強積金保守基金', subCategory: '強積金保守基金' };
  if (t.includes('貨幣市場基金')) return { category: '貨幣市場基金', subCategory: '貨幣市場基金' };
  return { category: '其他', subCategory: '其他' };
}

// Parse the desktop Chinese MPFA page
function parseMpfaDesktopZh(html: string): MpfaFund[] {
  const funds: MpfaFund[] = [];
  const rows = html.split(/<tr class="wr"/);

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];

    // Scheme name: <td ... class="txt">友邦強積金優選計劃</td>
    const schemeMatch = row.match(/class="txt">([^<]+)</);
    const scheme = schemeMatch ? schemeMatch[1].trim() : '';

    // Fund name and fund type: colspan="2" align="left" class="table">...
    const tdLeftMatches = [...row.matchAll(/colspan="2"\s+align="left"\s+class="table"[^>]*>([^<]*(?:<[^>]*>[^<]*)*?)<\/td>/g)];
    const fundName = tdLeftMatches.length >= 1 ? tdLeftMatches[0][1].replace(/<[^>]*>/g, '').trim() : '';
    const fundType = tdLeftMatches.length >= 2 ? tdLeftMatches[1][1].replace(/<[^>]*>/g, '').trim() : '';

    // Trustee: <div align="center" ...>友邦信託</div>
    const trusteeMatch = row.match(/<div\s+align="center"[^>]*>([^<]+)<\/div>/);
    const trustee = trusteeMatch ? trusteeMatch[1].trim() : '';

    // Launch date
    const launchMatch = row.match(/align="center"\s+class="table mpp_tab_green">\s*([^<]+?)\s*<\/td>/);
    const launchDate = launchMatch ? launchMatch[1].trim() : null;

    // Fund size & risk class from right-aligned green cells
    const rightGreenMatches = [...row.matchAll(/align="right"\s+class="table mpp_tab_green">\s*([^<]+?)\s*<\/td>/g)];
    const fundSize = rightGreenMatches.length >= 1 ? parseNum(rightGreenMatches[0][1]) : null;
    const risk = rightGreenMatches.length >= 2 ? rightGreenMatches[1][1].trim() : null;

    // FER
    const ferMatch = row.match(/colspan="2"\s+align="right"\s+class="table">\s*([\d.]+)\s*<\/td>/);
    const fer = ferMatch ? parseNum(ferMatch[1]) : null;

    // Annualized returns (1y, 5y, 10y, since launch) - hidden by default
    const arMatches = [...row.matchAll(/class="arCol\s+mpp_tab_green"[^>]*>\s*([^<]*?)\s*<\/td>/g)];
    const arValues = arMatches.map(m => m[1].trim());

    // Calendar year returns (2025, 2024, 2023, 2022, 2021)
    const cyrMatches = [...row.matchAll(/class="cyrCol\s+mpp_tab_green"[^>]*>\s*([^<]*?)\s*<\/td>/g)];
    const cyrValues = cyrMatches.map(m => m[1].trim());

    if (!fundName && !scheme) continue;

    funds.push({
      scheme_zh: scheme,
      fund_name_zh: fundName,
      trustee_zh: trustee,
      fund_type_zh: fundType,
      launch_date: launchDate,
      fund_size: fundSize,
      risk_class: risk,
      fer,
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

// Strip class suffix for matching (e.g., "基金 - A" → "基金")
function stripClass(name: string): string {
  return name
    .replace(/\s*[-–—]\s*[A-Z]\s*$/, '')
    .replace(/\s*[-–—]\s*(?:單位)?類別\s*[A-Z]\s*$/i, '')
    .trim();
}

function getClassSuffix(name: string): string | null {
  const m = name.match(/[-–—]\s*(?:單位)?(?:類別)?\s*([A-Z])\s*$/i);
  if (m) return m[1].toUpperCase();
  const m2 = name.match(/[-–—]\s*([A-Z])\s*$/);
  if (m2) return m2[1].toUpperCase();
  return null;
}

// Direct Chinese-to-Chinese matching score
function matchScoreZh(mpfaName: string, etnetName: string, sameScheme: boolean): number {
  let score = 0;
  const mpfa = stripClass(mpfaName);
  const etnet = stripClass(etnetName);

  // Exact match (ignoring class)
  if (mpfa === etnet) return 100;

  // Check if one contains the other
  if (etnet.includes(mpfa) || mpfa.includes(etnet)) {
    score += 50;
  }

  // Key term matching - split MPFA name into meaningful segments
  const keyTerms = [
    '核心累積', '65歲後', '強積金保守', '保證',
    '恒指', '恒生指數', '指數追蹤',
    '大中華', '香港', '中國', '日本', '韓國', '亞太', '亞洲', '歐洲', '北美', '美國', '環球', '全球', '國際', '亞歐',
    '股票', '債券', '固定收益', '貨幣', '人民幣', '港元',
    '增長', '進取', '均衡', '平衡', '穩定', '穩健', '平穩', '靈活', '動態', '動力',
    '綠色', 'ESG', '環保',
    '退休易', '自在退休', '收益',
    '安聯', '東方太平洋',
    'E30', 'E50', 'E70', 'E90',
    '目標', '精選',
  ];

  for (const term of keyTerms) {
    if (mpfa.includes(term) && etnet.includes(term)) {
      score += term.length >= 3 ? 8 : 5;
    }
  }

  // Same scheme bonus
  if (sameScheme && score > 0) score += 10;

  // Class matching bonus
  const mpfaClass = getClassSuffix(mpfaName);
  const etnetClass = getClassSuffix(etnetName);
  if (mpfaClass && etnetClass && mpfaClass === etnetClass) score += 10;

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
    // Fetch Chinese desktop MPFA page
    const url = 'https://mfp.mpfa.org.hk/tch/mpp_list.jsp';
    console.log(`Fetching MPFA (Chinese): ${url}`);

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept-Language': 'zh-TW,zh;q=0.9',
      },
    });

    if (!response.ok) throw new Error(`Failed to fetch MPFA: ${response.status}`);
    const html = await response.text();
    console.log(`Fetched ${html.length} chars`);

    const mpfaFunds = parseMpfaDesktopZh(html);
    console.log(`Parsed ${mpfaFunds.length} MPFA funds (Chinese)`);

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
      const schemeMapping = SCHEME_MAP_ZH[mpfa.scheme_zh];
      const { category, subCategory } = mapFundTypeZh(mpfa.fund_type_zh);

      let bestMatch: EtnetFund | null = null;
      let bestScore = 0;

      if (schemeMapping) {
        // Strategy 1: Match within same scheme
        const schemeKey = `${schemeMapping.trustee}|${schemeMapping.scheme}`;
        const schemeCandidates = etnetByScheme.get(schemeKey) || [];

        for (const candidate of schemeCandidates) {
          if (usedEtnetIds.has(candidate.etnet_fund_id)) continue;
          const score = matchScoreZh(mpfa.fund_name_zh, candidate.name, true);
          if (score > bestScore) {
            bestScore = score;
            bestMatch = candidate;
          }
        }

        // Strategy 2: Match within same trustee (broader search)
        if (bestScore < 20) {
          const trusteeCandidates = etnetByTrustee.get(schemeMapping.trustee) || [];
          for (const candidate of trusteeCandidates) {
            if (usedEtnetIds.has(candidate.etnet_fund_id)) continue;
            const score = matchScoreZh(mpfa.fund_name_zh, candidate.name, false);
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
        name_zh: mpfa.fund_name_zh,
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
          matchDetails.push(`✓ "${mpfa.fund_name_zh}" → "${bestMatch.name}" (score:${bestScore})`);
        }
      } else {
        const trusteeName = schemeMapping?.trustee || mpfa.trustee_zh;
        const schemeName = schemeMapping?.scheme || mpfa.scheme_zh;
        const fundId = `MPFA_${mpfa.scheme_zh}_${mpfa.fund_name_zh}`.replace(/[^a-zA-Z0-9_\u4e00-\u9fff]/g, '_').substring(0, 100);

        upsertRecords.push({
          etnet_fund_id: fundId,
          name: mpfa.fund_name_zh,
          trustee_name: trusteeName,
          scheme_name: schemeName,
          ...mpfaData,
        });
        unmatched++;
        if (unmatched <= 30) {
          matchDetails.push(`✗ "${mpfa.scheme_zh}" / "${mpfa.fund_name_zh}" (best:${bestScore})`);
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
      sample_matches: matchDetails.slice(0, 15),
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

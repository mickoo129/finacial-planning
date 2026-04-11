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
  fer: number | null;
  risk_class: string | null;
  return_1y_ann: number | null;
  return_5y_ann: number | null;
  return_10y_ann: number | null;
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

function mapFundTypeZh(type: string): { category: string; subCategory: string } {
  const t = type.trim();
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

function parseMpfaDesktopZh(html: string): MpfaFund[] {
  const funds: MpfaFund[] = [];
  const rows = html.split(/<tr class="wr"/);

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];

    // Scheme name: class="txt">...
    const schemeMatch = row.match(/class="txt">([^<]+)</);
    const scheme = schemeMatch ? schemeMatch[1].trim() : '';

    // Fund name and fund type from colspan="2" align="left" class="table"
    const tdLeftMatches = [...row.matchAll(/colspan="2"\s+align="left"\s+class="table"[^>]*>([^<]*(?:<[^>]*>[^<]*)*?)<\/td>/g)];
    const fundName = tdLeftMatches.length >= 1 ? tdLeftMatches[0][1].replace(/<[^>]*>/g, '').trim() : '';
    const fundType = tdLeftMatches.length >= 2 ? tdLeftMatches[1][1].replace(/<[^>]*>/g, '').trim() : '';

    // Trustee
    const trusteeMatch = row.match(/<div\s+align="center"[^>]*>([^<]+)<\/div>/);
    const trustee = trusteeMatch ? trusteeMatch[1].trim() : '';

    // Risk class
    const rightGreenMatches = [...row.matchAll(/align="right"\s+class="table mpp_tab_green">\s*([^<]+?)\s*<\/td>/g)];
    const risk = rightGreenMatches.length >= 2 ? rightGreenMatches[1][1].trim() : null;

    // FER
    const ferMatch = row.match(/colspan="2"\s+align="right"\s+class="table">\s*([\d.]+)\s*<\/td>/);
    const fer = ferMatch ? parseNum(ferMatch[1]) : null;

    // Annualized returns (1y, 5y, 10y, since launch)
    const arMatches = [...row.matchAll(/class="arCol\s+mpp_tab_green"[^>]*>\s*([^<]*?)\s*<\/td>/g)];
    const arValues = arMatches.map(m => m[1].trim());

    // Calendar year returns
    const cyrMatches = [...row.matchAll(/class="cyrCol\s+mpp_tab_green"[^>]*>\s*([^<]*?)\s*<\/td>/g)];
    const cyrValues = cyrMatches.map(m => m[1].trim());

    if (!fundName && !scheme) continue;

    funds.push({
      scheme_zh: scheme,
      fund_name_zh: fundName,
      trustee_zh: trustee,
      fund_type_zh: fundType,
      fer,
      risk_class: risk,
      return_1y_ann: arValues[0] ? parseNum(arValues[0]) : null,
      return_5y_ann: arValues[1] ? parseNum(arValues[1]) : null,
      return_10y_ann: arValues[2] ? parseNum(arValues[2]) : null,
      return_2025: cyrValues[0] ? parseNum(cyrValues[0]) : null,
      return_2024: cyrValues[1] ? parseNum(cyrValues[1]) : null,
      return_2023: cyrValues[2] ? parseNum(cyrValues[2]) : null,
      return_2022: cyrValues[3] ? parseNum(cyrValues[3]) : null,
      return_2021: cyrValues[4] ? parseNum(cyrValues[4]) : null,
    });
  }
  return funds;
}

// Normalize fund name for matching: remove trustee/scheme prefix and class suffix
function normalizeName(name: string): string {
  return name
    .replace(/^(友邦優選|友邦|恒生智選|滙豐智選|匯豐智選|宏利環球|宏利退休|宏利|富達|海通|永明彩虹|永明|萬通|信安|中銀保誠|中國人壽|東亞集成信託|東亞行業|東亞享惠|東亞|交通銀行愉盈|交通銀行|銀聯|BCT積金之選|BCT策略|BCT行業|BCT|AMTD\s*強積金|AMTD|新地|新鴻基|orientiertAMTD\s*強積金)/, '')
    .replace(/\s*[-–—]\s*(?:單位)?(?:類別)?\s*[A-Z]\s*$/i, '')
    .replace(/\s*[-–—]\s*[A-Z]\s*$/, '')
    .replace(/^[（(].*?[）)]/, '')
    .trim();
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

    const mpfaFunds = parseMpfaDesktopZh(html);
    console.log(`Parsed ${mpfaFunds.length} MPFA funds (Chinese)`);

    if (mpfaFunds.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'No funds parsed', htmlLen: html.length }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch all existing etnet funds
    const { data: etnetFunds, error: fetchErr } = await supabase
      .from('mpf_funds')
      .select('id, etnet_fund_id, name, trustee_name, scheme_name')
      .like('etnet_fund_id', 'ETNSI%');

    if (fetchErr) throw new Error(`DB fetch error: ${fetchErr.message}`);
    console.log(`Loaded ${etnetFunds?.length || 0} etnet funds from DB`);

    // Group etnet funds by trustee
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

    // === TWO-PASS OPTIMAL MATCHING ===
    // Pass 1: Collect all candidate matches with scores
    interface MatchCandidate {
      mpfaIdx: number;
      etnetFundId: string;
      score: number;
    }

    const allCandidates: MatchCandidate[] = [];

    for (let mi = 0; mi < mpfaFunds.length; mi++) {
      const mpfa = mpfaFunds[mi];
      const schemeMapping = SCHEME_MAP_ZH[mpfa.scheme_zh];
      if (!schemeMapping) continue;

      const mpfaNorm = normalizeName(mpfa.fund_name_zh);

      // Get candidates from same scheme first, then same trustee
      const schemeKey = `${schemeMapping.trustee}|${schemeMapping.scheme}`;
      const candidates = new Set<string>();
      for (const c of (etnetByScheme.get(schemeKey) || [])) candidates.add(c.etnet_fund_id);
      for (const c of (etnetByTrustee.get(schemeMapping.trustee) || [])) candidates.add(c.etnet_fund_id);

      for (const etFundId of candidates) {
        const etFund = (etnetFunds || []).find(f => f.etnet_fund_id === etFundId);
        if (!etFund) continue;

        const etNorm = normalizeName(etFund.name);
        const sameScheme = etFund.scheme_name === schemeMapping.scheme;
        let score = 0;

        // Exact normalized match
        if (mpfaNorm === etNorm) {
          score = 100;
        } else if (etNorm.includes(mpfaNorm) || mpfaNorm.includes(etNorm)) {
          // One contains the other
          score = 60;
        } else {
          // Character overlap scoring
          const mpfaChars = [...new Set(mpfaNorm.split(''))];
          const etChars = new Set(etNorm.split(''));
          let matchedChars = 0;
          for (const c of mpfaChars) {
            if (etChars.has(c)) matchedChars++;
          }
          const overlapRatio = mpfaChars.length > 0 ? matchedChars / mpfaChars.length : 0;
          if (overlapRatio >= 0.7) {
            score = Math.round(overlapRatio * 40);
          }
        }

        // Penalize region/asset type mismatches
        const regionTerms = ['北美', '歐洲', '亞洲', '香港', '中國', '日本', '環球', '大中華', '亞歐', '亞太'];
        const assetTerms = ['股票', '債券', '保守', '保證', '貨幣', '核心累積', '65歲後'];
        
        for (const term of regionTerms) {
          const inMpfa = mpfaNorm.includes(term);
          const inEtnet = etNorm.includes(term);
          if (inMpfa && !inEtnet) score -= 30;
          if (!inMpfa && inEtnet) score -= 15;
          if (inMpfa && inEtnet) score += 15;
        }
        for (const term of assetTerms) {
          const inMpfa = mpfaNorm.includes(term);
          const inEtnet = etNorm.includes(term);
          if (inMpfa && !inEtnet) score -= 30;
          if (!inMpfa && inEtnet) score -= 15;
          if (inMpfa && inEtnet) score += 15;
        }

        if (sameScheme) score += 5;
        if (score >= 15) {
          allCandidates.push({ mpfaIdx: mi, etnetFundId: etFundId, score });
        }
      }
    }

    // Pass 2: Assign matches optimally (highest score first, no duplicates)
    allCandidates.sort((a, b) => b.score - a.score);
    const assignedMpfa = new Set<number>();
    const assignedEtnet = new Set<string>();
    const matchMap = new Map<number, { etnetFund: EtnetFund; score: number }>();

    for (const c of allCandidates) {
      if (assignedMpfa.has(c.mpfaIdx) || assignedEtnet.has(c.etnetFundId)) continue;
      const etFund = (etnetFunds || []).find(f => f.etnet_fund_id === c.etnetFundId);
      if (!etFund) continue;
      assignedMpfa.add(c.mpfaIdx);
      assignedEtnet.add(c.etnetFundId);
      matchMap.set(c.mpfaIdx, { etnetFund: etFund as EtnetFund, score: c.score });
    }

    // Build upsert records
    let matched = 0;
    let unmatched = 0;
    const upsertRecords: Array<Record<string, unknown>> = [];
    const matchDetails: string[] = [];

    for (let mi = 0; mi < mpfaFunds.length; mi++) {
      const mpfa = mpfaFunds[mi];
      const schemeMapping = SCHEME_MAP_ZH[mpfa.scheme_zh];
      const { category, subCategory } = mapFundTypeZh(mpfa.fund_type_zh);

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

      const match = matchMap.get(mi);
      if (match) {
        upsertRecords.push({
          etnet_fund_id: match.etnetFund.etnet_fund_id,
          name: match.etnetFund.name,
          trustee_name: match.etnetFund.trustee_name,
          scheme_name: match.etnetFund.scheme_name,
          ...mpfaData,
        });
        matched++;
        if (matched <= 25 || matched % 50 === 0) {
          matchDetails.push(`✓ "${mpfa.fund_name_zh}" → "${match.etnetFund.name}" (score:${match.score})`);
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
        if (unmatched <= 15) {
          matchDetails.push(`✗ "${mpfa.scheme_zh}" / "${mpfa.fund_name_zh}" norm="${normalizeName(mpfa.fund_name_zh)}" (no match)`);
        }
      }
    }

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
      sample_matches: matchDetails.slice(0, 20),
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

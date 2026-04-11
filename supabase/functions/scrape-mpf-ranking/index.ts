import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FundData {
  etnet_fund_id: string;
  etnet_plan_id: string | null;
  etnet_provider_id: string | null;
  name: string;
  risk_level: string | null;
  category: string;
  return_ytd: number | null;
  return_3m: number | null;
  return_1y: number | null;
  return_3y: number | null;
  data_date: string | null;
}

function parseReturn(text: string): number | null {
  if (!text) return null;
  const cleaned = text.replace(/[+%\s]/g, '');
  if (cleaned === '-' || cleaned === 'N/A' || cleaned === '' || cleaned === '--') return null;
  const val = parseFloat(cleaned);
  return isNaN(val) ? null : val;
}

function parseRankingHtmlFallback(html: string, category: string): FundData[] {
  const funds: FundData[] = [];
  const linkRegex = /<a[^>]*href="[^"]*fund_detail\.php\?fund=([^&"]+)(?:&amp;plan=([^&"]+))?(?:&amp;provider=([^&"]+))?[^"]*"[^>]*class="MPFLink"[^>]*>([^<]+)<\/a>/g;

  let linkMatch;
  const allLinks: Array<{ fund: string; plan: string | null; provider: string | null; name: string; index: number }> = [];
  while ((linkMatch = linkRegex.exec(html)) !== null) {
    allLinks.push({
      fund: linkMatch[1],
      plan: linkMatch[2] || null,
      provider: linkMatch[3] || null,
      name: linkMatch[4].trim(),
      index: linkMatch.index,
    });
  }

  for (const link of allLinks) {
    const searchStart = link.index;
    const searchEnd = html.indexOf('</tr>', searchStart);
    if (searchEnd === -1) continue;

    const rowHtml = html.substring(searchStart, searchEnd);
    const spans: string[] = [];
    const localSpanRegex = /<span class="(?:up|down)">([^<]+)<\/span>/g;
    let spanMatch;
    while ((spanMatch = localSpanRegex.exec(rowHtml)) !== null) {
      spans.push(spanMatch[1]);
    }

    const riskMatch = rowHtml.match(/<td[^>]*align="center"[^>]*>([^<]*)<\/td>/);
    const risk = riskMatch ? riskMatch[1].trim() : null;

    const dateMatch = rowHtml.match(/(\d{4}\/\d{2}\/\d{2})/);
    const date = dateMatch ? dateMatch[1].replace(/\//g, '-') : null;

    if (spans.length >= 4) {
      funds.push({
        etnet_fund_id: link.fund,
        etnet_plan_id: link.plan,
        etnet_provider_id: link.provider,
        name: link.name,
        risk_level: risk,
        category,
        return_ytd: parseReturn(spans[0]),
        return_3m: parseReturn(spans[1]),
        return_1y: parseReturn(spans[2]),
        return_3y: parseReturn(spans[3]),
        data_date: date,
      });
    }
  }

  return funds;
}

const PLAN_TRUSTEE_MAP: Record<string, { trustee: string; scheme: string }> = {
  ETNSI1: { trustee: '銀聯信託', scheme: '積金之選' },
  ETNSI2: { trustee: '銀聯信託', scheme: '行業計劃' },
  ETNSI16: { trustee: '匯豐', scheme: '智選計劃' },
  ETNSI21: { trustee: '宏利', scheme: '環球精選' },
  ETNSI25: { trustee: '信安', scheme: '800系列' },
  ETNSI26: { trustee: '交通銀行', scheme: '愉盈退休' },
  ETNSI31: { trustee: '友邦', scheme: '優選計劃' },
  ETNSI33: { trustee: '永明', scheme: '彩虹計劃' },
  ETNSI34: { trustee: '中銀保誠', scheme: '簡易強積金' },
  ETNSI35: { trustee: '中銀保誠', scheme: '我的強積金' },
  ETNSI37: { trustee: '海通', scheme: 'MPF計劃' },
  ETNSI39: { trustee: '銀聯信託', scheme: '策略計劃' },
  ETNSI42: { trustee: '東亞', scheme: '集成信託' },
  ETNSI43: { trustee: '東亞', scheme: '行業計劃' },
  ETNSI44: { trustee: 'AMTD', scheme: '強積金計劃' },
  ETNSI45: { trustee: '中國人壽', scheme: '強積金計劃' },
  ETNSI47: { trustee: '恒生', scheme: '智選計劃' },
  ETNSI50: { trustee: '富達', scheme: '退休集成' },
  ETNSI52: { trustee: '宏利', scheme: '退休精選' },
  ETNSI53: { trustee: '萬通', scheme: '萬全計劃' },
  ETNSI60: { trustee: '東亞', scheme: '享惠計劃' },
  ETNSI65: { trustee: '信安', scheme: '明智之選' },
  ETNSI66: { trustee: '信安', scheme: '易富之選' },
};

// Infer trustee/scheme from fund name when plan_id is missing
const NAME_TRUSTEE_PATTERNS: Array<{ pattern: RegExp; trustee: string; scheme: string }> = [
  { pattern: /^友邦優選/, trustee: '友邦', scheme: '優選計劃' },
  { pattern: /^orientiertAMTD|^AMTD/, trustee: 'AMTD', scheme: '強積金計劃' },
  { pattern: /^交通銀行愉盈/, trustee: '交通銀行', scheme: '愉盈退休' },
  { pattern: /^銀聯積金之選|^BCT積金之選/, trustee: '銀聯信託', scheme: '積金之選' },
  { pattern: /^銀聯行業|^BCT行業|^BCT（行業）/, trustee: '銀聯信託', scheme: '行業計劃' },
  { pattern: /^銀聯策略|^BCT策略/, trustee: '銀聯信託', scheme: '策略計劃' },
  { pattern: /^東亞集成信託|^東亞（強積金）集成/, trustee: '東亞', scheme: '集成信託' },
  { pattern: /^東亞行業|^東亞（強積金）行業/, trustee: '東亞', scheme: '行業計劃' },
  { pattern: /^東亞享惠|^東亞（強積金）享惠/, trustee: '東亞', scheme: '享惠計劃' },
  { pattern: /^中銀保誠簡易/, trustee: '中銀保誠', scheme: '簡易強積金' },
  { pattern: /^中銀保誠我的/, trustee: '中銀保誠', scheme: '我的強積金' },
  { pattern: /^中國人壽/, trustee: '中國人壽', scheme: '強積金計劃' },
  { pattern: /^富達退休/, trustee: '富達', scheme: '退休集成' },
  { pattern: /^海通MPF/, trustee: '海通', scheme: 'MPF計劃' },
  { pattern: /^恒生智選|^恒生強積金/, trustee: '恒生', scheme: '智選計劃' },
  { pattern: /^滙豐智選|^匯豐智選|^滙豐強積金|^匯豐強積金/, trustee: '匯豐', scheme: '智選計劃' },
  { pattern: /^宏利環球/, trustee: '宏利', scheme: '環球精選' },
  { pattern: /^宏利退休/, trustee: '宏利', scheme: '退休精選' },
  { pattern: /^萬通萬全|^萬全/, trustee: '萬通', scheme: '萬全計劃' },
  { pattern: /^永明彩虹/, trustee: '永明', scheme: '彩虹計劃' },
  { pattern: /^信安800/, trustee: '信安', scheme: '800系列' },
  { pattern: /^信安明智/, trustee: '信安', scheme: '明智之選' },
  { pattern: /^信安易富/, trustee: '信安', scheme: '易富之選' },
  { pattern: /^新地強積金/, trustee: '新鴻基', scheme: '行業計劃' },
];

function inferTrusteeFromName(name: string): { trustee: string; scheme: string } | null {
  for (const p of NAME_TRUSTEE_PATTERNS) {
    if (p.pattern.test(name)) return { trustee: p.trustee, scheme: p.scheme };
  }
  return null;
}

const SUBTYPES = [
  { id: 'ETNSI19', name: '強積金保守' },
  { id: 'ETNSI18', name: '貨幣市場' },
  { id: 'ETNSI14', name: '保證' },
  { id: 'ETNSI12', name: '固定收益' },
  { id: 'ETNSI16', name: '混合資產-保守' },
  { id: 'ETNSI17', name: '混合資產-均衡' },
  { id: 'ETNSI15', name: '混合資產-進取' },
  { id: 'ETNSI10', name: '股票-亞太區' },
  { id: 'ETNSI7', name: '股票-大中華' },
  { id: 'ETNSI6', name: '股票-香港' },
  { id: 'ETNSI23', name: '股票-中國' },
  { id: 'ETNSI24', name: '股票-日本' },
  { id: 'ETNSI8', name: '股票-北美洲' },
  { id: 'ETNSI9', name: '股票-歐洲' },
  { id: 'ETNSI11', name: '股票-環球' },
  { id: 'ETNSI25', name: '股票-新興市場' },
  { id: 'ETNSI26', name: '其他' },
];

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

  const { data: logEntry } = await supabase
    .from('mpf_scrape_logs')
    .insert({ status: 'running' })
    .select()
    .single();

  try {
    const allFunds: FundData[] = [];
    const seenFundIds = new Set<string>();

    // Scrape the ALL ranking page
    const url = `https://www.etnet.com.hk/www/tc/mpf/ranking.php?subtype=ALL&sortby=1Y`;
    console.log(`Fetching: ${url}`);

    const response = await fetch(url, { headers: FETCH_HEADERS });
    if (!response.ok) throw new Error(`Failed to fetch ranking page: ${response.status}`);
    const html = await response.text();

    const funds = parseRankingHtmlFallback(html, '全部');
    console.log(`Parsed ${funds.length} funds from ALL ranking`);

    for (const fund of funds) {
      if (!seenFundIds.has(fund.etnet_fund_id)) {
        seenFundIds.add(fund.etnet_fund_id);
        allFunds.push(fund);
      }
    }

    // Scrape individual category pages
    for (const subtype of SUBTYPES) {
      try {
        const catUrl = `https://www.etnet.com.hk/www/tc/mpf/ranking.php?subtype=${subtype.id}&sortby=1Y`;
        const catResponse = await fetch(catUrl, { headers: FETCH_HEADERS });
        if (!catResponse.ok) continue;
        const catHtml = await catResponse.text();
        const catFunds = parseRankingHtmlFallback(catHtml, subtype.name);
        console.log(`  ${subtype.name}: ${catFunds.length} funds`);

        for (const fund of catFunds) {
          if (!seenFundIds.has(fund.etnet_fund_id)) {
            seenFundIds.add(fund.etnet_fund_id);
            fund.category = subtype.name;
            allFunds.push(fund);
          }
        }
        await new Promise(r => setTimeout(r, 200));
      } catch (e) {
        console.error(`Error scraping ${subtype.name}:`, e);
      }
    }

    console.log(`Total unique funds: ${allFunds.length}`);

    // Upsert all funds
    if (allFunds.length > 0) {
      const { error: upsertError } = await supabase
        .from('mpf_funds')
        .upsert(
          allFunds.map(f => {
            const planMapping = f.etnet_plan_id ? PLAN_TRUSTEE_MAP[f.etnet_plan_id] : null;
            return {
              etnet_fund_id: f.etnet_fund_id,
              etnet_plan_id: f.etnet_plan_id,
              etnet_provider_id: f.etnet_provider_id,
              name: f.name,
              risk_level: f.risk_level,
              category: f.category,
              return_ytd: f.return_ytd,
              return_3m: f.return_3m,
              return_1y: f.return_1y,
              return_3y: f.return_3y,
              data_date: f.data_date,
              trustee_name: planMapping?.trustee || null,
              scheme_name: planMapping?.scheme || null,
            };
          }),
          { onConflict: 'etnet_fund_id' }
        );

      if (upsertError) {
        throw new Error(`Upsert error: ${upsertError.message}`);
      }
    }

    if (logEntry) {
      await supabase
        .from('mpf_scrape_logs')
        .update({ status: 'success', funds_count: allFunds.length })
        .eq('id', logEntry.id);
    }

    return new Response(
      JSON.stringify({ success: true, funds_count: allFunds.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Scrape error:', error);

    if (logEntry) {
      await supabase
        .from('mpf_scrape_logs')
        .update({ status: 'error', error_message: error.message })
        .eq('id', logEntry.id);
    }

    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

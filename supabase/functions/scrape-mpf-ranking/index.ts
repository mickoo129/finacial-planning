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
  if (cleaned === '-' || cleaned === 'N/A' || cleaned === '') return null;
  const val = parseFloat(cleaned);
  return isNaN(val) ? null : val;
}

function extractFundIdFromUrl(url: string): { fund: string; plan: string | null; provider: string | null } {
  const fundMatch = url.match(/fund=([^&]+)/);
  const planMatch = url.match(/plan=([^&]+)/);
  const providerMatch = url.match(/provider=([^&]+)/);
  return {
    fund: fundMatch ? fundMatch[1] : '',
    plan: planMatch ? planMatch[1] : null,
    provider: providerMatch ? providerMatch[1] : null,
  };
}

function parseRankingHtml(html: string, category: string): FundData[] {
  const funds: FundData[] = [];
  
  // Match table rows with fund data
  const rowRegex = /<tr[^>]*>\s*<td[^>]*>.*?<\/td>\s*<td[^>]*><a[^>]*href="([^"]*)"[^>]*>([^<]+)<\/a><\/td>\s*<td[^>]*>([^<]*)<\/td>\s*<td[^>]*><span[^>]*>([^<]*)<\/span><\/td>\s*<td[^>]*><span[^>]*>([^<]*)<\/span><\/td>\s*<td[^>]*><span[^>]*>([^<]*)<\/span><\/td>\s*<td[^>]*><span[^>]*>([^<]*)<\/span><\/td>\s*<td[^>]*>([^<]*)<\/td>/g;
  
  let match;
  while ((match = rowRegex.exec(html)) !== null) {
    const url = match[1].replace(/&amp;/g, '&');
    const ids = extractFundIdFromUrl(url);
    if (!ids.fund) continue;
    
    funds.push({
      etnet_fund_id: ids.fund,
      etnet_plan_id: ids.plan,
      etnet_provider_id: ids.provider,
      name: match[2].trim(),
      risk_level: match[3].trim() || null,
      category,
      return_ytd: parseReturn(match[4]),
      return_3m: parseReturn(match[5]),
      return_1y: parseReturn(match[6]),
      return_3y: parseReturn(match[7]),
      data_date: match[8].trim().replace(/\//g, '-') || null,
    });
  }
  
  return funds;
}

// Fallback: simpler regex for different table structures
function parseRankingHtmlFallback(html: string, category: string): FundData[] {
  const funds: FundData[] = [];
  
  // Find all fund links
  const linkRegex = /<a[^>]*href="[^"]*fund_detail\.php\?fund=([^&"]+)(?:&amp;plan=([^&"]+))?(?:&amp;provider=([^&"]+))?[^"]*"[^>]*class="MPFLink"[^>]*>([^<]+)<\/a>/g;
  
  let linkMatch;
  const allLinks: Array<{fund: string; plan: string|null; provider: string|null; name: string; index: number}> = [];
  while ((linkMatch = linkRegex.exec(html)) !== null) {
    allLinks.push({
      fund: linkMatch[1],
      plan: linkMatch[2] || null,
      provider: linkMatch[3] || null,
      name: linkMatch[4].trim(),
      index: linkMatch.index,
    });
  }
  
  // For each found link, look for return values nearby
  const spanRegex = /<span class="(?:up|down)">([^<]+)<\/span>/g;
  
  for (const link of allLinks) {
    // Search for spans after this link
    const searchStart = link.index;
    const searchEnd = html.indexOf('</tr>', searchStart);
    if (searchEnd === -1) continue;
    
    const rowHtml = html.substring(searchStart, searchEnd);
    const spans: string[] = [];
    let spanMatch;
    const localSpanRegex = /<span class="(?:up|down)">([^<]+)<\/span>/g;
    while ((spanMatch = localSpanRegex.exec(rowHtml)) !== null) {
      spans.push(spanMatch[1]);
    }
    
    // Extract risk level
    const riskMatch = rowHtml.match(/<td[^>]*align="center"[^>]*>([^<]*)<\/td>/);
    const risk = riskMatch ? riskMatch[1].trim() : null;
    
    // Extract date
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

const SUBTYPES = [
  { id: 'ALL', name: '全部' },
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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  // Create log entry
  const { data: logEntry } = await supabase
    .from('mpf_scrape_logs')
    .insert({ status: 'running' })
    .select()
    .single();

  try {
    const allFunds: FundData[] = [];
    const seenFundIds = new Set<string>();

    // Scrape the ALL ranking page (contains top 10 + bottom 5)
    const url = `https://www.etnet.com.hk/www/tc/mpf/ranking.php?subtype=ALL&sortby=1Y`;
    console.log(`Fetching: ${url}`);
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept-Language': 'zh-TW,zh;q=0.9',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch ranking page: ${response.status}`);
    }

    const html = await response.text();
    console.log(`Fetched ${html.length} chars`);

    // Try primary parser first, fallback if needed
    let funds = parseRankingHtml(html, '全部');
    if (funds.length === 0) {
      console.log('Primary parser found 0, trying fallback...');
      funds = parseRankingHtmlFallback(html, '全部');
    }
    console.log(`Parsed ${funds.length} funds from ALL ranking`);

    for (const fund of funds) {
      if (!seenFundIds.has(fund.etnet_fund_id)) {
        seenFundIds.add(fund.etnet_fund_id);
        allFunds.push(fund);
      }
    }

    // Also scrape individual category pages for more comprehensive data
    for (const subtype of SUBTYPES) {
      if (subtype.id === 'ALL') continue;
      
      try {
        const catUrl = `https://www.etnet.com.hk/www/tc/mpf/ranking.php?subtype=${subtype.id}&sortby=1Y`;
        console.log(`Fetching category: ${subtype.name}`);
        
        const catResponse = await fetch(catUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept-Language': 'zh-TW,zh;q=0.9',
          },
        });
        
        if (!catResponse.ok) continue;
        const catHtml = await catResponse.text();
        
        let catFunds = parseRankingHtml(catHtml, subtype.name);
        if (catFunds.length === 0) {
          catFunds = parseRankingHtmlFallback(catHtml, subtype.name);
        }
        console.log(`  ${subtype.name}: ${catFunds.length} funds`);
        
        for (const fund of catFunds) {
          if (!seenFundIds.has(fund.etnet_fund_id)) {
            seenFundIds.add(fund.etnet_fund_id);
            fund.category = subtype.name;
            allFunds.push(fund);
          }
        }
        
        // Small delay to be polite
        await new Promise(r => setTimeout(r, 500));
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
          allFunds.map(f => ({
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
          })),
          { onConflict: 'etnet_fund_id' }
        );

      if (upsertError) {
        throw new Error(`Upsert error: ${upsertError.message}`);
      }
    }

    // Update log
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

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MpfaFund {
  scheme: string;
  fund_name: string;
  trustee: string;
  fund_type: string;
  launch_date: string | null;
  fund_size: number | null;
  risk_class: string | null;
  fer: number | null;
  return_1y_ann: number | null;
  return_5y_ann: number | null;
  return_10y_ann: number | null;
  return_launch_ann: number | null;
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

// Map MPFA trustee abbreviations to Chinese names
const TRUSTEE_MAP: Record<string, string> = {
  'AIAT': '友邦',
  'AIA': '友邦',
  'BCT': 'BCT',
  'BCOM': '交通銀行',
  'BEA': '東亞',
  'BOCIP': '中銀保誠',
  'BOCI': '中銀保誠',
  'HSBC': '匯豐',
  'Manulife': '宏利',
  'MAN': '宏利',
  'Principal': '信安',
  'PRIN': '信安',
  'StanChart': '渣打',
  'SCT': '渣打',
  'Sun Life': '永明',
  'SUN': '永明',
  'YF Life': '萬通',
  'YFL': '萬通',
  'China Life': '中國人壽',
  'CL': '中國人壽',
  'FIL': '富達',
  'Fidelity': '富達',
  'Haitong': '海通',
  'HT': '海通',
  'Hang Seng': '恒生',
  'HS': '恒生',
  'AMTD': 'AMTD',
  'SHKP': '新鴻基',
};

function mapTrustee(abbr: string): string {
  const trimmed = abbr.trim();
  return TRUSTEE_MAP[trimmed] || trimmed;
}

// Map MPFA fund types to MPFA-standard Chinese categories
function mapFundType(type: string): { category: string; subCategory: string } {
  const t = type.trim();
  
  if (t.includes('Equity Fund')) {
    let sub = '股票基金';
    if (t.includes('Asia')) sub = '股票基金-亞洲';
    else if (t.includes('China')) sub = '股票基金-中國';
    else if (t.includes('Europe')) sub = '股票基金-歐洲';
    else if (t.includes('Global')) sub = '股票基金-環球';
    else if (t.includes('Greater China')) sub = '股票基金-大中華';
    else if (t.includes('Hong Kong') && t.includes('Index')) sub = '股票基金-香港(指數追蹤)';
    else if (t.includes('Hong Kong')) sub = '股票基金-香港';
    else if (t.includes('Japan')) sub = '股票基金-日本';
    else if (t.includes('United States')) sub = '股票基金-美國';
    else sub = '股票基金-其他';
    return { category: '股票基金', subCategory: sub };
  }
  if (t.includes('Mixed Assets Fund')) {
    let sub = '混合資產基金';
    if (t.includes('Core Accumulation')) sub = '預設投資-核心累積基金';
    else if (t.includes('Age 65 Plus')) sub = '預設投資-65歲後基金';
    else if (t.includes('81% to 100%')) sub = '混合資產基金-81%至100%股票';
    else if (t.includes('61% to 80%')) sub = '混合資產基金-61%至80%股票';
    else if (t.includes('41% to 60%')) sub = '混合資產基金-41%至60%股票';
    else if (t.includes('21% to 40%')) sub = '混合資產基金-21%至40%股票';
    else sub = '混合資產基金-其他';
    
    if (t.includes('Default Investment Strategy') || t.includes('DIS')) {
      return { category: '預設投資策略', subCategory: sub };
    }
    return { category: '混合資產基金', subCategory: sub };
  }
  if (t.includes('Bond Fund')) {
    let sub = '債券基金';
    if (t.includes('Asia')) sub = '債券基金-亞洲';
    else if (t.includes('Global')) sub = '債券基金-環球';
    else if (t.includes('Hong Kong Dollar')) sub = '債券基金-港元';
    else if (t.includes('RMB')) sub = '債券基金-人民幣';
    else sub = '債券基金-其他';
    return { category: '債券基金', subCategory: sub };
  }
  if (t.includes('Guaranteed')) {
    return { category: '保證基金', subCategory: '保證基金' };
  }
  if (t.includes('Money Market') || t.includes('MPF Conservative')) {
    if (t.includes('MPF Conservative') || t.includes('Conservative')) {
      return { category: '強積金保守基金', subCategory: '強積金保守基金' };
    }
    return { category: '貨幣市場基金', subCategory: '貨幣市場基金' };
  }
  return { category: '其他', subCategory: '其他' };
}

function parseMpfaHtml(html: string): MpfaFund[] {
  const funds: MpfaFund[] = [];
  
  // Find all fund rows - they start with <tr class="wr"
  const rowRegex = /<tr class="wr"[^>]*>([\s\S]*?)<\/tr>/g;
  let rowMatch;
  
  while ((rowMatch = rowRegex.exec(html)) !== null) {
    const rowHtml = rowMatch[1];
    
    // Extract all td contents
    const tdRegex = /<td[^>]*>([\s\S]*?)<\/td>/g;
    const tds: string[] = [];
    let tdMatch;
    while ((tdMatch = tdRegex.exec(rowHtml)) !== null) {
      // Strip HTML tags and get text content
      tds.push(tdMatch[1].replace(/<[^>]*>/g, '').trim());
    }
    
    if (tds.length < 10) continue;
    
    // Extract scheme name from label
    const labelMatch = rowHtml.match(/<label[^>]*>([^<]+)<\/label>/);
    const scheme = labelMatch ? labelMatch[1].trim() : '';
    
    // Extract fund name
    const fundNameMatch = rowHtml.match(/border-left: solid 1px #FFFFFF;" colspan="2" align="left" class="table">([^<]+)</);
    const fundName = fundNameMatch ? fundNameMatch[1].trim() : '';
    
    // Extract trustee
    const trusteeMatch = rowHtml.match(/<div align="center">\s*([^<\s]+)\s*<\/div>/);
    const trustee = trusteeMatch ? trusteeMatch[1].trim() : '';
    
    // Extract fund type - second occurrence of colspan="2" align="left" class="table"
    const fundTypeMatches = rowHtml.match(/colspan="2" align="left" class="table">([^<]+)</g);
    const fundType = fundTypeMatches && fundTypeMatches.length >= 2 
      ? fundTypeMatches[1].replace('colspan="2" align="left" class="table">', '').trim() 
      : '';
    
    // Extract FER
    const ferMatch = rowHtml.match(/colspan="2" align="right" class="table">\s*([\d.]+)\s*<\/td>/);
    const fer = ferMatch ? parseNum(ferMatch[1]) : null;
    
    // Extract risk class
    const riskMatch = rowHtml.match(/colspan="2" align="right" class="table mpp_tab_green">(\d+)</);
    const risk = riskMatch ? riskMatch[1] : null;
    
    // Extract annualized returns (1y, 5y, 10y, since launch) - arCol cells
    const arMatches: string[] = [];
    const arRegex = /class="arCol mpp_tab_green"[^>]*>([^<]*(?:<[^>]*>[^<]*)*)<\/td>/g;
    let arMatch;
    while ((arMatch = arRegex.exec(rowHtml)) !== null) {
      const val = arMatch[1].replace(/<[^>]*>/g, '').trim();
      if (val) arMatches.push(val);
    }
    
    // Extract calendar year returns (2025, 2024, 2023, 2022, 2021) - cyrCol cells
    const cyrMatches: string[] = [];
    const cyrRegex = /class="cyrCol mpp_tab_green"[^>]*>([^<]*(?:<[^>]*>[^<]*)*)<\/td>/g;
    let cyrMatch;
    while ((cyrMatch = cyrRegex.exec(rowHtml)) !== null) {
      const val = cyrMatch[1].replace(/<[^>]*>/g, '').trim();
      if (val) cyrMatches.push(val);
    }
    
    if (!fundName && !scheme) continue;
    
    funds.push({
      scheme,
      fund_name: fundName || scheme,
      trustee,
      fund_type: fundType,
      launch_date: null,
      fund_size: null,
      risk_class: risk,
      fer,
      return_1y_ann: arMatches[0] ? parseNum(arMatches[0]) : null,
      return_5y_ann: arMatches[1] ? parseNum(arMatches[1]) : null,
      return_10y_ann: arMatches[2] ? parseNum(arMatches[2]) : null,
      return_launch_ann: arMatches[3] ? parseNum(arMatches[3]) : null,
      return_2025: cyrMatches[0] ? parseNum(cyrMatches[0]) : null,
      return_2024: cyrMatches[1] ? parseNum(cyrMatches[1]) : null,
      return_2023: cyrMatches[2] ? parseNum(cyrMatches[2]) : null,
      return_2022: cyrMatches[3] ? parseNum(cyrMatches[3]) : null,
      return_2021: cyrMatches[4] ? parseNum(cyrMatches[4]) : null,
    });
  }
  
  return funds;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  try {
    // Fetch MPFA Fund Information Table (English, server-rendered)
    const url = 'https://mfp.mpfa.org.hk/mobile/eng/mpp_list.jsp';
    console.log(`Fetching MPFA: ${url}`);

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept-Language': 'en',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch MPFA page: ${response.status}`);
    }

    const html = await response.text();
    console.log(`Fetched ${html.length} chars from MPFA`);

    const funds = parseMpfaHtml(html);
    console.log(`Parsed ${funds.length} funds from MPFA`);

    if (funds.length === 0) {
      // Try to find what went wrong
      const tableMatch = html.match(/id="tableContent"/);
      console.log(`Table found: ${!!tableMatch}`);
      const rowCount = (html.match(/<tr class="wr"/g) || []).length;
      console.log(`Row count: ${rowCount}`);
      
      return new Response(
        JSON.stringify({ success: false, error: 'No funds parsed from MPFA', debug: { htmlLength: html.length, tableFound: !!tableMatch, rowCount } }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Batch upsert all MPFA funds - use generated etnet_fund_id for new ones
    const upsertData = funds.map(mpfaFund => {
      const { category, subCategory } = mapFundType(mpfaFund.fund_type);
      const trusteeName = mapTrustee(mpfaFund.trustee);
      const fundId = `MPFA_${mpfaFund.scheme}_${mpfaFund.fund_name}`.replace(/[^a-zA-Z0-9_]/g, '_').substring(0, 100);
      
      return {
        etnet_fund_id: fundId,
        name: mpfaFund.fund_name,
        category,
        sub_category: subCategory,
        trustee_name: trusteeName !== '其他' ? trusteeName : null,
        scheme_name: mpfaFund.scheme,
        risk_level: mpfaFund.risk_class,
        fee_ratio: mpfaFund.fer,
        return_5y: mpfaFund.return_5y_ann,
        return_10y: mpfaFund.return_10y_ann,
        return_2024: mpfaFund.return_2024,
        return_2023: mpfaFund.return_2023,
        return_2022: mpfaFund.return_2022,
        return_2021: mpfaFund.return_2021,
      };
    });

    // Batch upsert in chunks of 50
    let upserted = 0;
    for (let i = 0; i < upsertData.length; i += 50) {
      const chunk = upsertData.slice(i, i + 50);
      const { error } = await supabase
        .from('mpf_funds')
        .upsert(chunk, { onConflict: 'etnet_fund_id' });
      if (error) {
        console.error(`Upsert chunk ${i} error:`, error.message);
      } else {
        upserted += chunk.length;
      }
    }

    console.log(`Upserted: ${upserted}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        total_parsed: funds.length, 
        upserted,
        sample: funds.slice(0, 3),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
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

/**
 * Real Stock Data Client
 * Fetches actual company data from multiple free APIs
 */

import { retryWithBackoff, makeApiCallWithRetry } from './utils/apiRetry'

export interface RealStockData {
  symbol: string
  name: string
  price: number
  change: number
  changePercent: number
  volume: number
  marketCap?: number
  exchange?: string
  country?: string
  currency?: string
}

/**
 * Fetch real stock data from Yahoo Finance (unofficial API)
 */
async function fetchFromYahooFinance(symbol: string): Promise<RealStockData | null> {
  try {
    return await makeApiCallWithRetry(
      async () => {
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1d`
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0',
            'Accept': 'application/json',
          },
        })

        if (!response.ok) {
          throw new Error(`Yahoo Finance API returned ${response.status}`)
        }

        const data = await response.json()
        const result = data.chart?.result?.[0]
        if (!result) {
          throw new Error('Invalid response structure from Yahoo Finance')
        }

        const meta = result.meta
        const quote = result.indicators?.quote?.[0]
        
        if (!meta || !quote) {
          throw new Error('Missing required data from Yahoo Finance')
        }

        const currentPrice = meta.regularMarketPrice || meta.previousClose || 0
        const previousClose = meta.previousClose || currentPrice
        const change = currentPrice - previousClose
        const changePercent = previousClose > 0 ? (change / previousClose) * 100 : 0
        const volume = meta.regularMarketVolume || quote.volume?.[quote.volume.length - 1] || 0
        const marketCap = meta.marketCap || undefined

        return {
          symbol: meta.symbol || symbol,
          name: meta.longName || meta.shortName || symbol,
          price: currentPrice,
          change,
          changePercent,
          volume,
          marketCap,
          exchange: meta.exchangeName,
          currency: meta.currency || 'USD',
        }
      },
      'yahoo-finance',
      { maxCalls: 100, windowMs: 60000 }, // 100 calls per minute
      { maxRetries: 2, initialDelay: 500 }
    )
  } catch (error) {
    console.error(`Yahoo Finance error for ${symbol}:`, error)
    return null
  }
}

/**
 * Fetch real stock data from Alpha Vantage (free tier: 5 calls/min, 500/day)
 */
async function fetchFromAlphaVantage(symbol: string): Promise<RealStockData | null> {
  try {
    const apiKey = process.env.ALPHA_VANTAGE_API_KEY
    if (!apiKey) return null

    return await makeApiCallWithRetry(
      async () => {
        const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${encodeURIComponent(symbol)}&apikey=${apiKey}`
        const response = await fetch(url)

        if (!response.ok) {
          throw new Error(`Alpha Vantage API returned ${response.status}`)
        }

        const data = await response.json()
        const quote = data['Global Quote']
        if (!quote) {
          throw new Error('Invalid response structure from Alpha Vantage')
        }

        const price = parseFloat(quote['05. price']) || 0
        const change = parseFloat(quote['09. change']) || 0
        const changePercent = parseFloat(quote['10. change percent']?.replace('%', '')) || 0
        const volume = parseInt(quote['06. volume']) || 0

        return {
          symbol: quote['01. symbol'] || symbol,
          name: quote['01. symbol'] || symbol, // Alpha Vantage doesn't provide company name in quote
          price,
          change,
          changePercent,
          volume,
          exchange: undefined,
          currency: 'USD',
        }
      },
      'alpha-vantage',
      { maxCalls: 5, windowMs: 60000 }, // 5 calls per minute (free tier)
      { maxRetries: 2, initialDelay: 1000 }
    )
  } catch (error) {
    console.error(`Alpha Vantage error for ${symbol}:`, error)
    return null
  }
}

/**
 * Fetch real stock data from Finnhub (free tier: 60 calls/min)
 */
async function fetchFromFinnhub(symbol: string): Promise<RealStockData | null> {
  try {
    const apiKey = process.env.FINNHUB_API_KEY
    if (!apiKey) return null

    return await makeApiCallWithRetry(
      async () => {
        const url = `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(symbol)}&token=${apiKey}`
        const response = await fetch(url)

        if (!response.ok) {
          throw new Error(`Finnhub API returned ${response.status}`)
        }

        const data = await response.json()
        if (data.c === 0) {
          throw new Error('Invalid symbol from Finnhub')
        }

        const currentPrice = data.c || 0
        const previousClose = data.pc || currentPrice
        const change = currentPrice - previousClose
        const changePercent = previousClose > 0 ? (change / previousClose) * 100 : 0

        // Get company profile for name and market cap
        const profileUrl = `https://finnhub.io/api/v1/stock/profile2?symbol=${encodeURIComponent(symbol)}&token=${apiKey}`
        const profileResponse = await fetch(profileUrl)
        let name = symbol
        let marketCap: number | undefined
        let exchange: string | undefined
        let country: string | undefined
        let currency: string | undefined

        if (profileResponse.ok) {
          const profile = await profileResponse.json()
          name = profile.name || symbol
          marketCap = profile.marketCapitalization
          exchange = profile.exchange
          country = profile.country
          currency = profile.currency
        }

        return {
          symbol,
          name,
          price: currentPrice,
          change,
          changePercent,
          volume: data.v || 0,
          marketCap,
          exchange,
          country,
          currency,
        }
      },
      'finnhub',
      { maxCalls: 60, windowMs: 60000 }, // 60 calls per minute (free tier)
      { maxRetries: 2, initialDelay: 500 }
    )
  } catch (error) {
    console.error(`Finnhub error for ${symbol}:`, error)
    return null
  }
}

/**
 * Fetch real stock data with fallback strategy
 */
export async function fetchRealStockData(symbol: string): Promise<RealStockData | null> {
  // Try Yahoo Finance first (no API key needed, most reliable)
  let data = await fetchFromYahooFinance(symbol)
  if (data) return data

  // Try Finnhub second (if API key available)
  data = await fetchFromFinnhub(symbol)
  if (data) return data

  // Try Alpha Vantage last (if API key available, rate limited)
  data = await fetchFromAlphaVantage(symbol)
  if (data) return data

  return null
}

/**
 * Get list of real stock symbols from major exchanges
 * This uses a combination of known major stocks and exchange listings
 */
export function getMajorStockSymbols(): string[] {
  const symbols: string[] = []

  // S&P 500 companies (expanded list - 200+ companies)
  const usStocks = [
    // Technology (50+)
    'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'META', 'TSLA', 'AVGO', 'ORCL', 'CRM',
    'ADBE', 'NFLX', 'AMD', 'INTC', 'CSCO', 'QCOM', 'TXN', 'AMAT', 'LRCX', 'KLAC',
    'CDNS', 'SNPS', 'ANSS', 'FTNT', 'NXPI', 'MCHP', 'MPWR', 'ON', 'OLED', 'CRUS',
    'SLAB', 'ALGM', 'DIOD', 'SWKS', 'QRVO', 'TER', 'GLW', 'KEYS', 'CDW', 'CTSH',
    'PAYX', 'FAST', 'INTU', 'NOW', 'WDAY', 'ZM', 'DOCN', 'NET', 'CRWD', 'ZS',
    // Finance (30+)
    'JPM', 'BAC', 'WFC', 'C', 'GS', 'MS', 'BLK', 'SCHW', 'AXP', 'COF',
    'V', 'MA', 'PYPL', 'FIS', 'FISV', 'ADP', 'SPGI', 'MCO', 'MSCI', 'NDAQ',
    'ICE', 'CME', 'TROW', 'BEN', 'ETFC', 'AMTD', 'STT', 'BK', 'PNC', 'USB',
    // Healthcare (40+)
    'JNJ', 'UNH', 'PFE', 'ABT', 'TMO', 'DHR', 'ISRG', 'SYK', 'BSX', 'ZTS',
    'REGN', 'VRTX', 'GILD', 'BIIB', 'AMGN', 'ILMN', 'ALXN', 'BMRN', 'INCY', 'EXAS',
    'HUM', 'CI', 'AET', 'ANTM', 'CVS', 'WBA', 'CAH', 'MCK', 'ABC', 'RAD',
    'BMY', 'LLY', 'MRK', 'NVS', 'SNY', 'GSK', 'TAK', 'TEVA', 'MYL', 'AGN',
    // Consumer (30+)
    'WMT', 'HD', 'LOW', 'TGT', 'COST', 'TJX', 'NKE', 'SBUX', 'MCD', 'YUM',
    'CMG', 'DPZ', 'WING', 'SHAK', 'CHUY', 'BLMN', 'DIN', 'CAKE', 'TXRH', 'BJRI',
    'DIS', 'NFLX', 'CMCSA', 'FOXA', 'FOX', 'NWSA', 'NWS', 'PARA', 'WBD', 'LYV',
    // Industrial (30+)
    'BA', 'CAT', 'DE', 'GE', 'HON', 'RTX', 'LMT', 'NOC', 'GD', 'TDG',
    'TXT', 'EMR', 'ETN', 'IR', 'PH', 'ROK', 'AME', 'GGG', 'ITW', 'DOV',
    'FAST', 'GWW', 'WWD', 'AOS', 'ATU', 'AXE', 'AYI', 'BGG', 'BWC', 'CBSH',
    // Energy (20+)
    'XOM', 'CVX', 'COP', 'SLB', 'EOG', 'MPC', 'VLO', 'PSX', 'HES', 'OVV',
    'FANG', 'CTRA', 'MRO', 'DVN', 'APA', 'NOV', 'HAL', 'BKR', 'FTI', 'LBRT',
    // Utilities (20+)
    'NEE', 'DUK', 'SO', 'D', 'AEP', 'SRE', 'EXC', 'XEL', 'WEC', 'ES',
    'PEG', 'EIX', 'ED', 'FE', 'AEE', 'CNP', 'ETR', 'CMS', 'LNT', 'ATO',
    // Materials (20+)
    'LIN', 'APD', 'ECL', 'SHW', 'PPG', 'DD', 'DOW', 'FCX', 'NEM', 'VALE',
    'RIO', 'BHP', 'SCCO', 'TECK', 'CENX', 'AA', 'X', 'STLD', 'NUE', 'CLF',
    // Real Estate (20+)
    'AMT', 'PLD', 'EQIX', 'PSA', 'WELL', 'VTR', 'PEAK', 'EXPI', 'RDFN', 'Z',
    'O', 'SPG', 'SLG', 'BXP', 'VICI', 'GLPI', 'MAC', 'REG', 'KIM', 'FR',
    // Communication (15+)
    'T', 'VZ', 'CMCSA', 'DIS', 'NFLX', 'FOXA', 'FOX', 'NWSA', 'NWS', 'PARA',
    'WBD', 'LYV', 'LIVE', 'MSG', 'MSGS', 'IHRT', 'SIRI',
    // Consumer Staples (20+)
    'PG', 'KO', 'PEP', 'WMT', 'COST', 'TGT', 'HD', 'LOW', 'NKE', 'SBUX',
    'MCD', 'YUM', 'CMG', 'DPZ', 'WING', 'SHAK', 'CHUY', 'BLMN', 'DIN', 'CAKE',
  ]

  // Nikkei 225 companies (expanded)
  const jpStocks = [
    // Major companies
    '7203.T', '6758.T', '9984.T', '9983.T', '7974.T', '6861.T', '9433.T', '9432.T',
    '8306.T', '8316.T', '8411.T', '6501.T', '6752.T', '3382.T', '4755.T', '6098.T',
    '4063.T', '4503.T', '4502.T', '8058.T', '8031.T', '2914.T', '8801.T', '8802.T',
    '7267.T', '7732.T', '4901.T', '4452.T', '3407.T', '3405.T', '3402.T', '3401.T',
    '2503.T', '2502.T', '2501.T', '1801.T', '1802.T', '1803.T', '1925.T', '1928.T',
    '2002.T', '2269.T', '2282.T', '2801.T', '2802.T', '2914.T', '3086.T', '3087.T',
    // Additional Nikkei 225 companies
    '8001.T', '8002.T', '8015.T', '8035.T', '8053.T', '8058.T', '8233.T', '8267.T',
    '8306.T', '8316.T', '8411.T', '8601.T', '8604.T', '8628.T', '8630.T', '8697.T',
    '9001.T', '9005.T', '9007.T', '9008.T', '9009.T', '9020.T', '9021.T', '9022.T',
    '9104.T', '9107.T', '9202.T', '9301.T', '9412.T', '9434.T', '9501.T', '9502.T',
    '9503.T', '9531.T', '9532.T', '9602.T', '9613.T', '9681.T', '9684.T', '9697.T',
    '9706.T', '9719.T', '9735.T', '9766.T', '9983.T', '9984.T', '9986.T', '9987.T',
  ]

  // European stocks (FTSE 100, DAX, CAC 40, etc.)
  const euStocks = [
    // Netherlands
    'ASML', 'INGA.AS', 'PHIA.AS', 'AD.AS', 'UNA.AS', 'RDSA.AS', 'RDSB.AS',
    // Germany (DAX)
    'SAP', 'SIEGY', 'BAYN.DE', 'ALV.DE', 'BMW.DE', 'DAI.DE', 'VOW3.DE', 'MUV2.DE',
    'DBK.DE', 'DTE.DE', 'FRE.DE', 'HEI.DE', 'IFX.DE', 'LIN.DE', 'MRK.DE', 'MUV2.DE',
    'RWE.DE', 'SAP.DE', 'SIE.DE', 'VNA.DE', 'VOW3.DE', '1COV.DE', 'ADS.DE', 'ALV.DE',
    // France (CAC 40)
    'LVMH', 'OR.PA', 'SAN.PA', 'BNP.PA', 'AIR.PA', 'MC.PA', 'TTE.PA', 'EL.PA', 'DG.PA',
    'ATO.PA', 'CS.PA', 'EN.PA', 'ENGI.PA', 'FP.PA', 'GLE.PA', 'KER.PA', 'ML.PA',
    'OR.PA', 'RI.PA', 'RMS.PA', 'SAF.PA', 'SGO.PA', 'STLA.PA', 'SU.PA', 'SW.PA',
    // UK (FTSE 100)
    'SHEL', 'BP', 'GSK', 'UL', 'AZN', 'HSBC', 'BARC', 'LLOY', 'RDS.A', 'RDS.B',
    'BT', 'VOD', 'TSCO', 'SBRY', 'MKS', 'NXT', 'JD', 'ASOS', 'AO', 'BOO',
    // Switzerland
    'NOVN.SW', 'ROG.SW', 'UBS', 'CSGN.SW', 'NESN.SW', 'ABBN.SW', 'GIVN.SW', 'LONN.SW',
    // Italy
    'ENEL.MI', 'ENI.MI', 'STM.MI', 'G.MI', 'ISP.MI', 'UCG.MI', 'INTES.MI', 'PMI.MI',
    // Spain
    'SAN.MC', 'BBVA.MC', 'ITX.MC', 'IBE.MC', 'REP.MC', 'FER.MC', 'ACS.MC', 'AENA.MC',
    // Denmark
    'NVO', 'DSV.CO', 'CARL-B.CO', 'ORSTED.CO', 'VWS.CO', 'GN.CO', 'CHR.CO', 'TRYG.CO',
  ]

  // Asian stocks (expanded)
  const asiaStocks = [
    // Taiwan
    '2330.TW', '2317.TW', '2454.TW', '2308.TW', '3008.TW', '2382.TW', '2412.TW',
    '1301.TW', '1303.TW', '1326.TW', '1402.TW', '2002.TW', '2207.TW', '2301.TW',
    '2303.TW', '2324.TW', '2344.TW', '2352.TW', '2353.TW', '2354.TW', '2355.TW',
    '2356.TW', '2357.TW', '2379.TW', '2383.TW', '2395.TW', '2408.TW', '2409.TW',
    // Hong Kong
    '0700.HK', '0941.HK', '1299.HK', '2318.HK', '0005.HK', '0011.HK', '0016.HK',
    '0027.HK', '0066.HK', '0083.HK', '0101.HK', '0135.HK', '0151.HK', '0175.HK',
    '0267.HK', '0288.HK', '0386.HK', '0388.HK', '0669.HK', '0688.HK', '0762.HK',
    '0857.HK', '0883.HK', '0939.HK', '0960.HK', '0992.HK', '1038.HK', '1109.HK',
    // South Korea (KOSPI)
    '005930.KS', '035420.KS', '000660.KS', '005380.KS', '051910.KS', '006400.KS',
    '028260.KS', '207940.KS', '035720.KS', '003550.KS', '003670.KS', '005490.KS',
    '005830.KS', '006360.KS', '006800.KS', '010130.KS', '010140.KS', '010950.KS',
    '011200.KS', '012330.KS', '015760.KS', '016360.KS', '017670.KS', '018260.KS',
    // Singapore
    'D05.SI', 'O39.SI', 'U11.SI', 'Z74.SI', 'C6L.SI', 'H78.SI', 'J36.SI', 'J37.SI',
    'C09.SI', 'C38U.SI', 'D01.SI', 'G13.SI', 'H17.SI', 'J69U.SI', 'M44U.SI', 'N21.SI',
    // China (A-shares via ADRs and H-shares)
    'BABA', 'JD', 'PDD', 'BIDU', 'NIO', 'XPEV', 'LI', 'BILI', 'TME', 'WB',
    'TAL', 'EDU', 'YMM', 'TIGR', 'FUTU', 'VIPS', 'MOMO', 'WB', 'WB', 'WB',
  ]

  symbols.push(...usStocks, ...jpStocks, ...euStocks, ...asiaStocks)
  return symbols
}

/**
 * Fetch multiple stock data in parallel (with rate limiting and timeout)
 */
export async function fetchMultipleStockData(
  symbols: string[],
  batchSize: number = 10,
  delayMs: number = 100,
  timeoutMs: number = 30000 // 30 second timeout
): Promise<RealStockData[]> {
  const results: RealStockData[] = []
  const startTime = Date.now()

  for (let i = 0; i < symbols.length; i += batchSize) {
    // Check timeout
    if (Date.now() - startTime > timeoutMs) {
      console.warn(`Timeout reached after ${i} symbols, returning partial results`)
      break
    }

    const batch = symbols.slice(i, i + batchSize)
    const batchPromises = batch.map(symbol => 
      Promise.race([
        fetchRealStockData(symbol),
        new Promise<null>((resolve) => 
          setTimeout(() => resolve(null), 5000) // 5s timeout per symbol
        )
      ])
    )
    
    try {
      const batchResults = await Promise.all(batchPromises)
      results.push(...batchResults.filter((r): r is RealStockData => r !== null))
    } catch (error) {
      console.error(`Error in batch ${i / batchSize}:`, error)
      // Continue with next batch
    }

    // Rate limiting: wait between batches
    if (i + batchSize < symbols.length) {
      await new Promise(resolve => setTimeout(resolve, delayMs))
    }
  }

  return results
}


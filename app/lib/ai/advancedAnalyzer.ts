/**
 * Advanced AI Analyzer
 * 
 * Uses GPT-4/Claude for deep analysis of news, trades, and market data
 */

export interface AdvancedAnalysisRequest {
  type: 'news' | 'trades' | 'portfolio' | 'stock'
  data: any
  context?: string
}

export interface AdvancedAnalysisResult {
  summary: string
  keyPoints: string[]
  risks: string[]
  opportunities: string[]
  contradictions?: string[]
  recommendations: string[]
  confidence: number
}

class AdvancedAnalyzer {
  private openaiApiKey: string
  private anthropicApiKey: string
  private useOpenAI: boolean

  constructor() {
    this.openaiApiKey = process.env.OPENAI_API_KEY || ''
    this.anthropicApiKey = process.env.ANTHROPIC_API_KEY || ''
    this.useOpenAI = !!this.openaiApiKey
  }

  /**
   * Analyze news articles with AI
   */
  async analyzeNews(news: Array<{ title: string; summary?: string; content?: string }>): Promise<AdvancedAnalysisResult> {
    const prompt = this.buildNewsAnalysisPrompt(news)
    return this.callAI(prompt, 'news')
  }

  /**
   * Analyze trade history with AI
   */
  async analyzeTrades(trades: any[]): Promise<AdvancedAnalysisResult> {
    const prompt = this.buildTradeAnalysisPrompt(trades)
    return this.callAI(prompt, 'trades')
  }

  /**
   * Analyze portfolio with AI
   */
  async analyzePortfolio(portfolio: any): Promise<AdvancedAnalysisResult> {
    const prompt = this.buildPortfolioAnalysisPrompt(portfolio)
    return this.callAI(prompt, 'portfolio')
  }

  /**
   * Analyze stock with AI
   */
  async analyzeStock(stockData: any): Promise<AdvancedAnalysisResult> {
    const prompt = this.buildStockAnalysisPrompt(stockData)
    return this.callAI(prompt, 'stock')
  }

  /**
   * Detect contradictions in data
   */
  async detectContradictions(data: {
    news?: any[]
    analystRatings?: any[]
    socialSentiment?: any[]
  }): Promise<string[]> {
    const prompt = this.buildContradictionDetectionPrompt(data)
    const result = await this.callAI(prompt, 'contradictions')
    return result.contradictions || []
  }

  private buildNewsAnalysisPrompt(news: Array<{ title: string; summary?: string }>): string {
    const newsText = news.map((n, i) => 
      `${i + 1}. ${n.title}\n   ${n.summary || ''}`
    ).join('\n\n')

    return `以下の株式関連ニュースを分析し、重要なポイント、リスク、機会を抽出してください。

ニュース:
${newsText}

以下の形式で分析結果を返してください:
- 要約: ニュースの全体的な内容を3-4文で要約
- 重要ポイント: 投資判断に影響する重要な情報を箇条書きで3-5点
- リスク: 株価にマイナスの影響を与える可能性のある要因を箇条書きで2-4点
- 機会: 株価にプラスの影響を与える可能性のある要因を箇条書きで2-4点
- 推奨事項: 投資家が取るべきアクションを箇条書きで2-3点`
  }

  private buildTradeAnalysisPrompt(trades: any[]): string {
    const tradesSummary = this.summarizeTrades(trades)
    
    return `以下の取引履歴を分析し、パターン、改善点、推奨事項を抽出してください。

取引履歴の概要:
${tradesSummary}

以下の形式で分析結果を返してください:
- 要約: 取引パターンの全体的な特徴を3-4文で要約
- 重要ポイント: 取引スタイルの特徴や傾向を箇条書きで3-5点
- リスク: 取引におけるリスク要因を箇条書きで2-4点
- 機会: 改善できる点や活用できる強みを箇条書きで2-4点
- 推奨事項: 取引戦略の改善提案を箇条書きで2-3点`
  }

  private buildPortfolioAnalysisPrompt(portfolio: any): string {
    return `以下のポートフォリオを分析し、リスク、分散状況、推奨事項を抽出してください。

ポートフォリオ:
${JSON.stringify(portfolio, null, 2)}

以下の形式で分析結果を返してください:
- 要約: ポートフォリオの全体的な特徴を3-4文で要約
- 重要ポイント: ポートフォリオの強みや特徴を箇条書きで3-5点
- リスク: ポートフォリオのリスク要因を箇条書きで2-4点
- 機会: ポートフォリオ改善の機会を箇条書きで2-4点
- 推奨事項: ポートフォリオ最適化の提案を箇条書きで2-3点`
  }

  private buildStockAnalysisPrompt(stockData: any): string {
    return `以下の銘柄データを分析し、投資判断に役立つ情報を抽出してください。

銘柄データ:
${JSON.stringify(stockData, null, 2)}

以下の形式で分析結果を返してください:
- 要約: 銘柄の全体的な評価を3-4文で要約
- 重要ポイント: 投資判断に重要な情報を箇条書きで3-5点
- リスク: 投資リスクを箇条書きで2-4点
- 機会: 投資機会を箇条書きで2-4点
- 推奨事項: 投資判断の推奨事項を箇条書きで2-3点`
  }

  private buildContradictionDetectionPrompt(data: {
    news?: any[]
    analystRatings?: any[]
    socialSentiment?: any[]
  }): string {
    let prompt = '以下の情報源から矛盾や不一致を検出してください:\n\n'

    if (data.news && data.news.length > 0) {
      prompt += `ニュース:\n${data.news.map(n => `- ${n.title}`).join('\n')}\n\n`
    }

    if (data.analystRatings && data.analystRatings.length > 0) {
      prompt += `アナリスト評価:\n${data.analystRatings.map(r => `- ${r.rating}: ${r.reason || ''}`).join('\n')}\n\n`
    }

    if (data.socialSentiment && data.socialSentiment.length > 0) {
      prompt += `ソーシャルセンチメント:\n${data.socialSentiment.map(s => `- ${s.sentiment}: ${s.description}`).join('\n')}\n\n`
    }

    prompt += '矛盾や不一致があれば、具体的に指摘してください。'

    return prompt
  }

  private summarizeTrades(trades: any[]): string {
    const total = trades.length
    const buyCount = trades.filter(t => t.side === 'BUY').length
    const sellCount = trades.filter(t => t.side === 'SELL').length
    const symbols = [...new Set(trades.map(t => t.symbol))]
    
    return `総取引数: ${total}件
買い: ${buyCount}件、売り: ${sellCount}件
取引銘柄数: ${symbols.length}件
銘柄: ${symbols.join(', ')}`
  }

  private async callAI(prompt: string, type: string): Promise<AdvancedAnalysisResult> {
    // Try OpenAI first, then Anthropic, then fallback
    if (this.useOpenAI && this.openaiApiKey) {
      try {
        return await this.callOpenAI(prompt, type)
      } catch (error) {
        console.error('OpenAI API error:', error)
      }
    }

    if (this.anthropicApiKey) {
      try {
        return await this.callAnthropic(prompt, type)
      } catch (error) {
        console.error('Anthropic API error:', error)
      }
    }

    // Fallback to rule-based analysis
    return this.fallbackAnalysis(prompt, type)
  }

  private async callOpenAI(prompt: string, type: string): Promise<AdvancedAnalysisResult> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.openaiApiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'あなたは経験豊富な投資アナリストです。株式投資に関する情報を分析し、投資判断に役立つ洞察を提供してください。',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`)
    }

    const data = await response.json()
    const content = data.choices[0]?.message?.content || ''

    return this.parseAIResponse(content)
  }

  private async callAnthropic(prompt: string, type: string): Promise<AdvancedAnalysisResult> {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.anthropicApiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-opus-20240229',
        max_tokens: 1000,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    })

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.statusText}`)
    }

    const data = await response.json()
    const content = data.content[0]?.text || ''

    return this.parseAIResponse(content)
  }

  private parseAIResponse(content: string): AdvancedAnalysisResult {
    // Parse AI response (simplified - would need more robust parsing)
    const summaryMatch = content.match(/要約[：:]\s*([\s\S]+?)(?=\n|重要ポイント|$)/)
    const keyPointsMatch = content.match(/重要ポイント[：:]\s*([\s\S]+?)(?=\nリスク|$)/)
    const risksMatch = content.match(/リスク[：:]\s*([\s\S]+?)(?=\n機会|$)/)
    const opportunitiesMatch = content.match(/機会[：:]\s*([\s\S]+?)(?=\n推奨事項|$)/)
    const recommendationsMatch = content.match(/推奨事項[：:]\s*([\s\S]+?)$/)

    const extractList = (text: string): string[] => {
      return text
        .split(/[-•・]/)
        .map(item => item.trim())
        .filter(item => item.length > 0)
    }

    return {
      summary: summaryMatch ? summaryMatch[1].trim() : content.substring(0, 200),
      keyPoints: keyPointsMatch ? extractList(keyPointsMatch[1]) : [],
      risks: risksMatch ? extractList(risksMatch[1]) : [],
      opportunities: opportunitiesMatch ? extractList(opportunitiesMatch[1]) : [],
      recommendations: recommendationsMatch ? extractList(recommendationsMatch[1]) : [],
      confidence: 75,
    }
  }

  private fallbackAnalysis(prompt: string, type: string): AdvancedAnalysisResult {
    // Rule-based fallback analysis
    return {
      summary: 'AI分析機能を使用するには、OpenAI APIキーまたはAnthropic APIキーの設定が必要です。',
      keyPoints: [
        'AI分析機能を有効にするには、環境変数にAPIキーを設定してください',
        '現在は基本的な分析のみが利用可能です',
      ],
      risks: [
        'AI分析が利用できないため、詳細な分析ができません',
      ],
      opportunities: [
        'APIキーを設定することで、より高度な分析が可能になります',
      ],
      recommendations: [
        'OPENAI_API_KEYまたはANTHROPIC_API_KEYを環境変数に設定してください',
      ],
      confidence: 30,
    }
  }
}

// Singleton instance
let analyzerInstance: AdvancedAnalyzer | null = null

export function getAdvancedAnalyzer(): AdvancedAnalyzer {
  if (!analyzerInstance) {
    analyzerInstance = new AdvancedAnalyzer()
  }
  return analyzerInstance
}


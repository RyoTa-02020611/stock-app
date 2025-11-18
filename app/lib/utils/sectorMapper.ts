/**
 * 銘柄シンボルからセクターを判定するユーティリティ
 */

export type Sector =
  | 'テクノロジー'
  | '金融'
  | 'ヘルスケア'
  | '消費財'
  | 'エネルギー'
  | '不動産'
  | '素材'
  | '公益事業'
  | '通信'
  | '工業'
  | 'その他'

/**
 * 主要銘柄のセクターマッピング
 */
const SECTOR_MAP: Record<string, Sector> = {
  // テクノロジー
  AAPL: 'テクノロジー',
  MSFT: 'テクノロジー',
  GOOGL: 'テクノロジー',
  GOOG: 'テクノロジー',
  AMZN: 'テクノロジー',
  META: 'テクノロジー',
  NVDA: 'テクノロジー',
  TSLA: 'テクノロジー',
  INTC: 'テクノロジー',
  AMD: 'テクノロジー',
  CRM: 'テクノロジー',
  ORCL: 'テクノロジー',
  ADBE: 'テクノロジー',
  '7203.T': 'テクノロジー', // トヨタ（自動車もテクノロジー寄り）
  '6758.T': 'テクノロジー', // ソニー
  '9984.T': 'テクノロジー', // ソフトバンクG

  // 金融
  JPM: '金融',
  BAC: '金融',
  WFC: '金融',
  GS: '金融',
  MS: '金融',
  C: '金融',
  '8306.T': '金融', // 三菱UFJ
  '8316.T': '金融', // 三井住友
  '8411.T': '金融', // みずほ

  // ヘルスケア
  JNJ: 'ヘルスケア',
  PFE: 'ヘルスケア',
  UNH: 'ヘルスケア',
  ABBV: 'ヘルスケア',
  TMO: 'ヘルスケア',
  '4503.T': 'ヘルスケア', // アステラス製薬
  '4519.T': 'ヘルスケア', // 中外製薬

  // 消費財
  KO: '消費財',
  PEP: '消費財',
  PG: '消費財',
  WMT: '消費財',
  HD: '消費財',
  MCD: '消費財',
  SBUX: '消費財',
  NKE: '消費財',

  // エネルギー
  XOM: 'エネルギー',
  CVX: 'エネルギー',
  COP: 'エネルギー',
  SLB: 'エネルギー',

  // 不動産
  AMT: '不動産',
  PLD: '不動産',
  EQIX: '不動産',
  '8801.T': '不動産', // 三井不動産
  '8802.T': '不動産', // 三菱地所

  // 素材
  LIN: '素材',
  APD: '素材',
  SHW: '素材',
  '5401.T': '素材', // 日本製鉄

  // 公益事業
  NEE: '公益事業',
  DUK: '公益事業',
  SO: '公益事業',
  '9501.T': '公益事業', // 東京電力
  '9502.T': '公益事業', // 中部電力

  // 通信
  VZ: '通信',
  T: '通信',
  TMUS: '通信',
  '9432.T': '通信', // NTT
  '9434.T': '通信', // ソフトバンク

  // 工業
  BA: '工業',
  CAT: '工業',
  GE: '工業',
  '7011.T': '工業', // 三菱重工
}

/**
 * 銘柄シンボルからセクターを取得
 */
export function getSectorFromSymbol(symbol: string): Sector {
  // 直接マッピングがある場合
  if (SECTOR_MAP[symbol]) {
    return SECTOR_MAP[symbol]
  }

  // 日本株の判定（.Tで終わる）
  if (symbol.endsWith('.T')) {
    // 日本株のセクター判定ロジック（簡易版）
    const code = symbol.replace('.T', '')
    const numCode = parseInt(code, 10)

    if (numCode >= 1000 && numCode < 2000) {
      return '金融'
    } else if (numCode >= 2000 && numCode < 3000) {
      return '素材'
    } else if (numCode >= 3000 && numCode < 4000) {
      return '消費財'
    } else if (numCode >= 4000 && numCode < 5000) {
      return 'ヘルスケア'
    } else if (numCode >= 5000 && numCode < 6000) {
      return '消費財'
    } else if (numCode >= 6000 && numCode < 7000) {
      return '消費財'
    } else if (numCode >= 7000 && numCode < 8000) {
      return '工業'
    } else if (numCode >= 8000 && numCode < 9000) {
      return '消費財'
    } else if (numCode >= 9000 && numCode < 10000) {
      return '公益事業'
    }
  }

  // デフォルト
  return 'その他'
}

/**
 * セクターの色を取得（チャート表示用）
 */
export function getSectorColor(sector: Sector): string {
  const colors: Record<Sector, string> = {
    テクノロジー: '#3B82F6',
    金融: '#EF4444',
    ヘルスケア: '#10B981',
    消費財: '#F59E0B',
    エネルギー: '#8B5CF6',
    不動産: '#EC4899',
    素材: '#06B6D4',
    公益事業: '#84CC16',
    通信: '#14B8A6',
    工業: '#F97316',
    その他: '#6B7280',
  }
  return colors[sector] || '#6B7280'
}


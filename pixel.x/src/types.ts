export type TradeResult = "win" | "loss" | "breakeven";

export interface JournalEntry {
  id: string;
  date: string; // ISO 8601 string
  instrument: string; // e.g. "XAUUSD", "EURUSD"
  account: string; // e.g. "FTMO Challenge", "Personal Live"
  entryPrice: number;
  exitPrice: number;
  lotSize: number;
  stopLoss: number | null;
  takeProfit: number | null;
  result: TradeResult;
  profitLoss: number; // custom dollar value, can be positive/negative
  screenshot?: string; // base64 URL of screenshot
  notes: string; // strategy reasoning or outcome notes
}

export interface NotepadContent {
  text: string;
  updatedAt: string;
}

export interface NewsEvent {
  id: string;
  title: string;
  timestamp: string;
  source: string;
  impact: "HIGH" | "MEDIUM" | "LOW";
  currency: string;
  forecast?: string;
  previous?: string;
  details?: string;
}

export interface UserProfile {
  username: string;
  avatarInitial: string;
  defaultAccount: string;
  email: string;
  tradingGoal: string;
  avgRiskPerTrade: number;
}

export interface BrokerConnection {
  id: string;
  alias: string; // e.g. "Pepperstone Live", "My FTMO Master"
  brokerName: string; // e.g. "FTMO", "IC Markets", "OANDA"
  accountId: string; // e.g. "849204"
  server: string; // e.g. "FTMO-Live3"
  platform: "MT4" | "MT5" | "cTrader" | "DXTrade" | "PineScript Hook";
  status: "connected" | "pending" | "offline";
  investorPassword?: string;
  lastSync: string;
}

export interface PropFirmPayout {
  id: string;
  brokerConnectionId: string; // Associated dynamic broker alias/id
  propFirmName: string; // e.g. "FTMO", "Funding Pips"
  amount: number;
  date: string; // ISO 8601 string
  status: "pending" | "disbursed" | "rejected";
  invoiceId: string;
  notes: string;
}

export type ActiveTab = "dashboard" | "journal" | "notepad" | "ai-analysis" | "calculators" | "calendar" | "screenshots" | "tradingview" | "settings" | "broker-payouts" | "other";

// Instrument configurations for our calculators
export interface InstrumentConfig {
  symbol: string;
  name: string;
  type: "forex" | "metal" | "crypto" | "indices";
  pipSize: number; // e.g. 0.0001 for EURUSD, 0.1 for Gold
  contractSize: number; // e.g. 100000 for standard forex lot, 100 for Gold
}

export const SUPPORTED_INSTRUMENTS: InstrumentConfig[] = [
  { symbol: "EURUSD", name: "EUR/USD", type: "forex", pipSize: 0.0001, contractSize: 100000 },
  { symbol: "GBPUSD", name: "GBP/USD", type: "forex", pipSize: 0.0001, contractSize: 100000 },
  { symbol: "USDJPY", name: "USD/JPY", type: "forex", pipSize: 0.01, contractSize: 100000 },
  { symbol: "AUDUSD", name: "AUD/USD", type: "forex", pipSize: 0.0001, contractSize: 100000 },
  { symbol: "USDCAD", name: "USD/CAD", type: "forex", pipSize: 0.0001, contractSize: 100000 },
  { symbol: "XAUUSD", name: "Gold / USD", type: "metal", pipSize: 0.1, contractSize: 100 },
  { symbol: "XAGUSD", name: "Silver / USD", type: "metal", pipSize: 0.01, contractSize: 5000 },
  { symbol: "BTCUSD", name: "Bitcoin / USD", type: "crypto", pipSize: 1.0, contractSize: 1 },
  { symbol: "ETHUSD", name: "Ethereum / USD", type: "crypto", pipSize: 0.1, contractSize: 1 },
  { symbol: "US30", name: "DOW 30 Index", type: "indices", pipSize: 1.0, contractSize: 10 },
  { symbol: "NAS100", name: "Nasdaq 100", type: "indices", pipSize: 1.0, contractSize: 10 },
  { symbol: "GER40", name: "DAX 40 Index", type: "indices", pipSize: 1.0, contractSize: 25 },
];

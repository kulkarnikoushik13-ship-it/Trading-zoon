import React, { useState } from "react";
import {
  TrendingUp,
  LayoutGrid,
  Square,
  Columns,
  RefreshCw,
  Clock,
  Compass,
  ArrowRight,
  Info,
} from "lucide-react";

interface TradingViewSymbol {
  symbolName: string;
  querySymbol: string;
  category: "metals" | "forex" | "crypto" | "indices";
  desc: string;
}

const PRESET_SYMBOLS: TradingViewSymbol[] = [
  { symbolName: "Gold (XAUUSD)", querySymbol: "OANDA:XAUUSD", category: "metals", desc: "Spot Gold vs US Dollar" },
  { symbolName: "Silver (XAGUSD)", querySymbol: "OANDA:XAGUSD", category: "metals", desc: "Spot Silver vs US Dollar" },
  { symbolName: "EURUSD", querySymbol: "FX:EURUSD", category: "forex", desc: "Euro vs US Dollar" },
  { symbolName: "GBPUSD", querySymbol: "FX:GBPUSD", category: "forex", desc: "British Pound vs US Dollar" },
  { symbolName: "USDJPY", querySymbol: "FX:USDJPY", category: "forex", desc: "US Dollar vs Japanese Yen" },
  { symbolName: "Bitcoin (BTCUSD)", querySymbol: "BINANCE:BTCUSDT", category: "crypto", desc: "Bitcoin / Tether USD" },
  { symbolName: "Ethereum (ETHUSD)", querySymbol: "BINANCE:ETHUSDT", category: "crypto", desc: "Ethereum / Tether USD" },
  { symbolName: "Nasdaq 100", querySymbol: "FOREXCOM:NAS100", category: "indices", desc: "Nasdaq Composite CFD" },
  { symbolName: "Dow Jones 30", querySymbol: "FOREXCOM:US30", category: "indices", desc: "DOW 30 Index CFD" },
  { symbolName: "S&P 500", querySymbol: "FOREXCOM:SPX500", category: "indices", desc: "S&P 500 Composite Index" },
];

const INTERVAL_OPTIONS = [
  { label: "1 Min", value: "1" },
  { label: "5 Min", value: "5" },
  { label: "15 Min", value: "15" },
  { label: "1 Hr", value: "60" },
  { label: "4 Hr", value: "240" },
  { label: "Daily", value: "D" },
  { label: "Weekly", value: "W" },
];

export default function TradingViewTab() {
  const [activeSymbol, setActiveSymbol] = useState<TradingViewSymbol>(PRESET_SYMBOLS[0]);
  const [activeInterval, setActiveInterval] = useState("15");
  const [layoutMode, setLayoutMode] = useState<"single" | "split">("single");

  // Secondary symbol and interval for the split dual-screen perspective
  const [splitSymbol, setSplitSymbol] = useState<TradingViewSymbol>(PRESET_SYMBOLS[2]);
  const [splitInterval, setSplitInterval] = useState("60");

  const buildTradingViewUrl = (sym: string, tf: string) => {
    return `https://s.tradingview.com/widgetembed/?frameElementId=tradingview_chart&symbol=${encodeURIComponent(
      sym
    )}&interval=${tf}&theme=dark&style=1&timezone=exchange&studies=%5B%5D`;
  };

  return (
    <div className="space-y-6">
      {/* Tab Header with Layout Toggles */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-brand-card border border-brand-border p-6 rounded-lg">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-brand-text font-sans sm:text-2xl flex items-center gap-2">
            <TrendingUp size={24} className="text-brand-teal stroke-[2]" />
            TradingView Live Workspaces
          </h2>
          <p className="text-sm text-brand-text-muted">
            High-performance live streaming charts with complete indicator frameworks and technical overlay toolboxes.
          </p>
        </div>

        {/* Layout Select Buttons */}
        <div className="flex items-center gap-2 bg-[#0B0E11] p-1 rounded border border-brand-border">
          <button
            onClick={() => setLayoutMode("single")}
            className={`px-3 py-1.5 rounded text-xs font-medium cursor-pointer transition flex items-center gap-1.5 ${
              layoutMode === "single"
                ? "bg-[#2B3139] text-brand-teal font-bold"
                : "text-brand-text-muted hover:text-brand-text"
            }`}
          >
            <Square size={13} />
            Single Chart
          </button>
          <button
            onClick={() => setLayoutMode("split")}
            className={`px-3 py-1.5 rounded text-xs font-medium cursor-pointer transition flex items-center gap-1.5 ${
              layoutMode === "split"
                ? "bg-[#2B3139] text-brand-teal font-bold"
                : "text-brand-text-muted hover:text-brand-text"
            }`}
          >
            <Columns size={13} />
            Dual Split Screen
          </button>
        </div>
      </div>

      {/* CORE CONTROL ROW & WORKSPACE CANVAS */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Presets and selector sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-brand-card border border-brand-border p-5 rounded space-y-4">
            <div>
              <h3 className="font-sans font-medium text-brand-text text-xs uppercase tracking-wider text-brand-teal">
                Primary Asset Select
              </h3>
              <p className="text-[11px] text-brand-text-muted mt-1">
                Choose symbol to load into the primary workspace viewport.
              </p>
            </div>

            <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1">
              {PRESET_SYMBOLS.map((symObj) => {
                const isSelected = activeSymbol.querySymbol === symObj.querySymbol;
                return (
                  <button
                    key={symObj.querySymbol}
                    onClick={() => setActiveSymbol(symObj)}
                    className={`w-full text-left px-3.5 py-3 rounded text-xs transition cursor-pointer flex justify-between items-center ${
                      isSelected
                        ? "bg-[#2B3139] border-l-2 border-brand-teal font-medium text-brand-teal"
                        : "bg-brand-nested hover:bg-[#0B0E11]/30 text-brand-text hover:text-brand-text"
                    }`}
                  >
                    <div>
                      <span className="font-bold block text-xs">{symObj.symbolName}</span>
                      <span className="text-[10px] text-brand-text-muted mt-0.5 block">{symObj.desc}</span>
                    </div>
                    <span className="text-[9px] uppercase font-mono px-1.5 py-0.5 rounded bg-brand-bg text-[#848E9C]">
                      {symObj.category}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* If dual mode is active, append side-bar for secondary selection */}
          {layoutMode === "split" && (
            <div className="bg-brand-card border border-brand-teal/20 p-5 rounded space-y-4 animate-in slide-in-from-bottom duration-200">
              <div>
                <h3 className="font-sans font-medium text-brand-yellow text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <LayoutGrid size={13} />
                  Secondary Dual Asset
                </h3>
                <p className="text-[11px] text-brand-text-muted mt-1">
                  Adjust asset loaded in the secondary viewport channel.
                </p>
              </div>

              <div className="space-y-1 w-full text-xs">
                {INTERVAL_OPTIONS.map((int) => {
                  const isSel = splitInterval === int.value;
                  return (
                    <button
                      key={int.value}
                      onClick={() => setSplitInterval(int.value)}
                      className={`inline-block mr-1 mb-1 px-2.5 py-1 text-[11px] rounded border transition cursor-pointer ${
                        isSel
                          ? "bg-brand-yellow/10 text-brand-yellow border-brand-yellow/30"
                          : "bg-[#0B0E11] border-brand-border text-brand-text-muted hover:text-brand-text"
                      }`}
                    >
                      {int.label}
                    </button>
                  );
                })}
              </div>

              <select
                value={JSON.stringify(splitSymbol)}
                onChange={(e) => setSplitSymbol(JSON.parse(e.target.value))}
                className="w-full bg-[#0B0E11] border border-brand-border rounded p-2 text-xs text-brand-text focus:outline-none focus:border-brand-teal"
              >
                {PRESET_SYMBOLS.map((symObj) => (
                  <option key={symObj.querySymbol} value={JSON.stringify(symObj)}>
                    {symObj.symbolName}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Analytical Checklist Widget */}
          <div className="bg-brand-card border border-brand-border p-5 rounded space-y-3">
            <h4 className="text-xs font-sans font-semibold text-brand-text uppercase tracking-widest flex items-center gap-1">
              <Info size={12} className="text-brand-teal" />
              Chart Analysis Checklist
            </h4>
            <ul className="text-[11px] text-brand-text-muted space-y-2 leading-relaxed">
              <li className="flex items-start gap-1.5">
                <span className="text-brand-teal font-extrabold mt-0.5">•</span>
                <span>Determine high timeframe structure (trend lines / swings).</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-brand-teal font-extrabold mt-0.5">•</span>
                <span>Mark key support/demand and resistance/supply zones.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-brand-teal font-extrabold mt-0.5">•</span>
                <span>Identify liquidity pools, sweep possibilities and order blocks.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-brand-teal font-extrabold mt-0.5">•</span>
                <span>Consult the **Economic Calendar** for impending releases.</span>
              </li>
            </ul>
          </div>
        </div>

        {/* WORKSPACE ELEMENT WINDOWS (Col span 3) */}
        <div className="lg:col-span-3 space-y-6">
          {/* Main workspace controller block (interval selectors etc) */}
          <div className="bg-brand-card border border-brand-border p-4 rounded-lg flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-mono text-brand-text-muted uppercase tracking-wider">
                Primary Interval:
              </span>
              <div className="flex bg-[#0B0E11] p-0.5 rounded border border-brand-border">
                {INTERVAL_OPTIONS.map((interval) => {
                  const isSelected = activeInterval === interval.value;
                  return (
                    <button
                      key={interval.value}
                      onClick={() => setActiveInterval(interval.value)}
                      className={`px-3 py-1 rounded text-xs font-semibold cursor-pointer transition ${
                        isSelected
                          ? "bg-brand-teal text-[#0B0E11] font-bold shadow-sm"
                          : "text-brand-text-muted hover:text-brand-text"
                      }`}
                    >
                      {interval.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="text-xs text-brand-text-muted flex items-center gap-1 font-mono">
              <Clock size={12} />
              <span>
                Target: <span className="text-brand-text font-bold">{activeSymbol.querySymbol}</span> ({activeInterval}m Chart)
              </span>
            </div>
          </div>

          {/* IFRAME CHART RENDER CANVAS */}
          {layoutMode === "single" ? (
            <div className="bg-brand-card border border-brand-border rounded overflow-hidden aspect-video min-h-[500px] shadow-lg relative">
              <iframe
                id="tradingview_primary_frame"
                title={`TradingView - ${activeSymbol.symbolName}`}
                src={buildTradingViewUrl(activeSymbol.querySymbol, activeInterval)}
                className="w-full h-full border-none"
                style={{ minHeight: "500px" }}
                allowFullScreen
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
              {/* PRIMARY DUEL PORTIONAL */}
              <div className="bg-brand-card border border-brand-border rounded overflow-hidden flex flex-col shadow h-[500px]">
                <div className="px-3 py-2 bg-[#0B0E11]/80 border-b border-brand-border flex justify-between items-center text-xs font-mono">
                  <span className="font-bold text-brand-teal">Ch. 1: {activeSymbol.symbolName}</span>
                  <span className="text-[10px] text-brand-text-muted">TF: {activeInterval} interval</span>
                </div>
                <div className="flex-1 bg-black">
                  <iframe
                    title="TradingView Dual 1"
                    src={buildTradingViewUrl(activeSymbol.querySymbol, activeInterval)}
                    className="w-full h-full border-none"
                    allowFullScreen
                  />
                </div>
              </div>

              {/* SECONDARY DUEL PORTIONAL */}
              <div className="bg-brand-card border border-brand-border rounded overflow-hidden flex flex-col shadow h-[500px]">
                <div className="px-3 py-2 bg-[#0B0E11]/80 border-b border-brand-border flex justify-between items-center text-xs font-mono">
                  <span className="font-bold text-brand-yellow">Ch. 2: {splitSymbol.symbolName}</span>
                  <span className="text-[10px] text-brand-text-muted">TF: {splitInterval} interval</span>
                </div>
                <div className="flex-1 bg-black">
                  <iframe
                    title="TradingView Dual 2"
                    src={buildTradingViewUrl(splitSymbol.querySymbol, splitInterval)}
                    className="w-full h-full border-none"
                    allowFullScreen
                  />
                </div>
              </div>
            </div>
          )}

          {/* Instructions disclaimer info */}
          <div className="bg-[#0B0E11] border border-brand-border p-4 rounded text-xs text-brand-text-muted leading-relaxed">
            <h5 className="font-mono text-xs text-brand-text font-semibold uppercase tracking-wider mb-1 flex items-center gap-1">
              <Compass size={13} className="text-brand-teal" />
              INTEGRATION NOTICE
            </h5>
            <p>
              These charts run utilizing TradingView&apos;s embedded interactive interface widget library. Click the indicators icon at the top of the viewport frame to access hundreds of calculations including moving averages, RSI, MACD, and Bollinger Bands. Grab snapshots to upload directly inside the **Screenshot Vault** tab!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

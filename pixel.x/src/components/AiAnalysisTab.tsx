import React, { useState } from "react";
import { JournalEntry, TradeResult } from "../types";
import {
  Brain,
  CheckCircle,
  AlertTriangle,
  BookOpen,
  Sparkles,
  TrendingUp,
  RotateCcw,
  Clock,
  ExternalLink,
  DollarSign,
  Layers,
} from "lucide-react";

interface AiAnalysisTabProps {
  entries: JournalEntry[];
}

interface AnalysisResult {
  pros: string[];
  cons: string[];
  feedback: string;
}

export default function AiAnalysisTab({ entries }: AiAnalysisTabProps) {
  // Option to select from journal entries or input manually
  const [selectedEntryId, setSelectedEntryId] = useState<string>("manual");

  // Form Field States
  const [instrument, setInstrument] = useState("XAUUSD");
  const [account, setAccount] = useState("Personal Live");
  const [entryPrice, setEntryPrice] = useState("");
  const [exitPrice, setExitPrice] = useState("");
  const [stopLoss, setStopLoss] = useState("");
  const [takeProfit, setTakeProfit] = useState("");
  const [lotSize, setLotSize] = useState("1.0");
  const [result, setResult] = useState<TradeResult>("win");
  const [profitLoss, setProfitLoss] = useState("");
  const [strategyReasoning, setStrategyReasoning] = useState("");

  // AI responses & states
  const [isLoading, setIsLoading] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [serviceError, setServiceError] = useState<string | null>(null);

  // When a user selects an existing trade to clone, fill form fields
  const handleSelectEntry = (id: string) => {
    setSelectedEntryId(id);
    if (id === "manual") {
      // Clear or reset fields
      setInstrument("XAUUSD");
      setAccount("Personal Live");
      setEntryPrice("");
      setExitPrice("");
      setStopLoss("");
      setTakeProfit("");
      setLotSize("1.0");
      setResult("win");
      setProfitLoss("");
      setStrategyReasoning("");
      return;
    }

    const matched = entries.find((e) => e.id === id);
    if (matched) {
      setInstrument(matched.instrument);
      setAccount(matched.account);
      setEntryPrice(matched.entryPrice.toString());
      setExitPrice(matched.exitPrice.toString());
      setStopLoss(matched.stopLoss ? matched.stopLoss.toString() : "");
      setTakeProfit(matched.takeProfit ? matched.takeProfit.toString() : "");
      setLotSize(matched.lotSize.toString());
      setResult(matched.result);
      setProfitLoss(matched.profitLoss.toString());
      setStrategyReasoning(matched.notes);
    }
  };

  const handleRunAnalysis = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setServiceError(null);
    setAnalysis(null);

    try {
      const response = await fetch("/api/analyze-trade", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          instrument,
          account,
          entryPrice: parseFloat(entryPrice),
          exitPrice: parseFloat(exitPrice),
          stopLoss: stopLoss ? parseFloat(stopLoss) : null,
          takeProfit: takeProfit ? parseFloat(takeProfit) : null,
          lotSize: parseFloat(lotSize),
          result,
          profitLoss: parseFloat(profitLoss),
          strategyReasoning,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      setAnalysis(data);
    } catch (err: any) {
      console.error(err);
      setServiceError(
        err.message || "Failed to make a successful connection to the GenAI network endpoint."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Tab Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-brand-card border border-brand-border p-6 rounded-lg">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-brand-text font-sans sm:text-2xl flex items-center gap-2">
            <Brain className="text-brand-teal stroke-[2]" size={24} />
            AI Trade Analysis Coach
          </h2>
          <p className="text-sm text-brand-text-muted">
            Secure client-to-server analysis of your trading patterns and psychological habits.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left Form Selection / Input Panel (2 columns of grid) */}
        <div className="lg:col-span-2 bg-brand-card border border-brand-border p-5 rounded space-y-6">
          <div>
            <h3 className="font-sans font-medium text-brand-text text-sm">Clone Trade Details</h3>
            <p className="text-[11px] text-brand-text-muted mt-1">
              Select an entry from your database to auto-populate the details below.
            </p>
          </div>

          <div>
            <label className="block text-xs font-mono text-brand-text-muted uppercase mb-1">
              Journal Reference Files
            </label>
            <select
              value={selectedEntryId}
              onChange={(e) => handleSelectEntry(e.target.value)}
              className="w-full bg-[#0B0E11] border border-brand-border rounded p-2.5 text-[#EAECEF] text-xs focus:outline-none focus:border-brand-teal cursor-pointer"
            >
              <option value="manual">-- Create Manual Input Profile --</option>
              {entries.map((entry) => (
                <option key={entry.id} value={entry.id}>
                  {entry.instrument} ({entry.result.toUpperCase()} | ${entry.profitLoss}) -{" "}
                  {new Date(entry.date).toLocaleDateString()}
                </option>
              ))}
            </select>
          </div>

          <form onSubmit={handleRunAnalysis} className="space-y-4 pt-4 border-t border-brand-border">
            {/* Input fields grid */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-mono text-brand-text-muted uppercase mb-1">Symbol</label>
                <input
                  type="text"
                  required
                  value={instrument}
                  onChange={(e) => setInstrument(e.target.value)}
                  className="w-full bg-brand-nested border border-brand-border rounded p-2 text-xs text-brand-text focus:outline-none focus:border-brand-teal uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-brand-text-muted uppercase mb-1">Lot Size</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={lotSize}
                  onChange={(e) => setLotSize(e.target.value)}
                  className="w-full bg-brand-nested border border-brand-border rounded p-2 text-xs text-brand-green font-mono focus:outline-none focus:border-brand-teal"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-mono text-brand-text-muted uppercase mb-1">Entry Price</label>
                <input
                  type="number"
                  step="any"
                  required
                  value={entryPrice}
                  onChange={(e) => setEntryPrice(e.target.value)}
                  className="w-full bg-brand-nested border border-brand-border rounded p-2 text-xs text-brand-text font-mono focus:outline-none focus:border-brand-teal"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-brand-text-muted uppercase mb-1">Exit Price</label>
                <input
                  type="number"
                  step="any"
                  required
                  value={exitPrice}
                  onChange={(e) => setExitPrice(e.target.value)}
                  className="w-full bg-brand-nested border border-brand-border rounded p-2 text-xs text-brand-text font-mono focus:outline-none focus:border-brand-teal"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-mono text-brand-text-muted uppercase mb-1">Stop Loss</label>
                <input
                  type="number"
                  step="any"
                  placeholder="N/A"
                  value={stopLoss}
                  onChange={(e) => setStopLoss(e.target.value)}
                  className="w-full bg-brand-nested border border-brand-border rounded p-2 text-xs text-brand-red font-mono focus:outline-none focus:border-brand-teal"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-brand-text-muted uppercase mb-1">Take Profit</label>
                <input
                  type="number"
                  step="any"
                  placeholder="N/A"
                  value={takeProfit}
                  onChange={(e) => setTakeProfit(e.target.value)}
                  className="w-full bg-brand-nested border border-brand-border rounded p-2 text-xs text-brand-green font-mono focus:outline-none focus:border-brand-teal"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-mono text-brand-text-muted uppercase mb-1">Result</label>
                <select
                  value={result}
                  onChange={(e) => setResult(e.target.value as TradeResult)}
                  className="w-full bg-brand-nested border border-brand-border rounded p-2 text-[#EAECEF] text-xs focus:outline-none focus:border-brand-teal cursor-pointer"
                >
                  <option value="win">Win</option>
                  <option value="loss">Loss</option>
                  <option value="breakeven">Breakeven</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono text-brand-text-muted uppercase mb-1">Profit/Loss ($)</label>
                <input
                  type="number"
                  step="any"
                  required
                  value={profitLoss}
                  onChange={(e) => setProfitLoss(e.target.value)}
                  className="w-full bg-brand-nested border border-brand-border rounded p-2 text-xs text-brand-text focus:outline-none focus:border-brand-teal"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono text-brand-text-muted uppercase mb-1">
                Strategy & Psychological State Notes *
              </label>
              <textarea
                required
                rows={4}
                placeholder="Describe your reasoning. Did you follow your rules? Was this a FOMO trade? Did you exit early out of anxiety?"
                value={strategyReasoning}
                onChange={(e) => setStrategyReasoning(e.target.value)}
                className="w-full bg-brand-nested border border-brand-border rounded p-2.5 text-xs text-brand-text focus:outline-none focus:border-brand-teal"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-3.5 px-4 rounded font-sans font-semibold text-xs transition duration-200 shadow-md ${
                isLoading
                  ? "bg-brand-nested text-brand-text-muted cursor-not-allowed"
                  : "bg-[#02C076] hover:bg-[#02C076]/90 text-[#0B0E11] cursor-pointer"
              } flex items-center justify-center gap-2`}
            >
              <Brain size={18} />
              {isLoading ? "Consulting AI Coach..." : "Request AI Performance Audit"}
            </button>
          </form>
        </div>

        {/* Right Output Panel (3 columns of grid) */}
        <div className="lg:col-span-3 bg-brand-card border border-brand-border p-6 rounded flex flex-col justify-start">
          {/* Waiting/Empty state */}
          {!isLoading && !analysis && !serviceError && (
            <div className="h-full flex flex-col items-center justify-center text-center p-8">
              <Brain className="h-14 w-14 text-brand-text-muted/20 mb-4 animate-pulse stroke-[1.2]" />
              <h4 className="font-semibold text-brand-text text-sm">Psychological Audit Awaiting</h4>
              <p className="text-xs text-brand-text-muted max-w-sm mt-1">
                Provide details or choose a logged trade, expand on your mental discipline, and trigger the performance analysis audit.
              </p>
            </div>
          )}

          {/* Loading state with animations */}
          {isLoading && (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4">
              <Clock size={40} className="text-brand-teal animate-spin" />
              <div>
                <h4 className="font-semibold text-brand-text text-sm">Auditing Execution Log</h4>
                <p className="text-xs text-brand-text-muted mt-1 max-w-sm">
                  Gemini is calculating risk metrics, inspecting stop-loss structures, and summarizing emotional trading habits...
                </p>
              </div>
            </div>
          )}

          {/* Network/API Error display */}
          {serviceError && (
            <div className="bg-[#CF304A]/5 p-5 rounded border border-[#CF304A]/20 space-y-2">
              <div className="flex items-center gap-2 text-brand-red font-bold text-sm">
                <AlertTriangle size={16} />
                <span>API Handshake Interrupted</span>
              </div>
              <p className="text-xs text-brand-red font-mono leading-relaxed">
                {serviceError}
              </p>
              <div className="text-[10px] text-brand-text-muted pt-2 border-t border-brand-border">
                Ensure that <span className="font-mono bg-[#0B0E11] p-[2px] rounded text-brand-text">GEMINI_API_KEY</span> is active and matches parameters inside the local Secrets manager.
              </div>
            </div>
          )}

          {/* Real AI Result Display */}
          {analysis && (
            <div className="space-y-6 animate-in fade-in duration-300">
              {/* Output Header */}
              <div className="border-b border-brand-border pb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-brand-green/10 rounded text-brand-green">
                    <Sparkles size={16} />
                  </div>
                  <div>
                    <h3 className="font-sans font-semibold text-brand-text text-base">Trade Audit Report</h3>
                    <p className="text-xs text-brand-text-muted uppercase font-mono">Gemini Analyst Verdict</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setAnalysis(null);
                  }}
                  className="text-brand-text-muted hover:text-brand-text p-1 text-xs font-mono font-medium flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw size={12} />
                  Reset
                </button>
              </div>

              {/* Pros & Cons split layout */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Pros Green Box */}
                <div className="bg-brand-green/5 border border-brand-green/20 rounded p-4 space-y-3">
                  <div className="flex items-center gap-2 text-brand-green font-semibold text-xs font-mono uppercase tracking-wider">
                    <CheckCircle size={15} />
                    <span>Confluences / Pros</span>
                  </div>
                  {analysis.pros.length === 0 ? (
                    <p className="text-brand-text-muted text-xs italic">No clear system positives detected.</p>
                  ) : (
                    <ul className="space-y-2 text-xs text-brand-text list-disc list-inside col-span-1">
                      {analysis.pros.map((pro, index) => (
                        <li key={index} className="leading-relaxed pl-1 marker:text-brand-green">
                          {pro}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Cons Red Box */}
                <div className="bg-brand-red/5 border border-brand-red/20 rounded p-4 space-y-3">
                  <div className="flex items-center gap-2 text-brand-red font-semibold text-xs font-mono uppercase tracking-wider">
                    <AlertTriangle size={15} />
                    <span>Fatal Risks / Cons</span>
                  </div>
                  {analysis.cons.length === 0 ? (
                    <p className="text-brand-text-muted text-xs italic">No clear system negatives detected.</p>
                  ) : (
                    <ul className="space-y-2 text-xs text-brand-text list-disc list-inside col-span-1">
                      {analysis.cons.map((con, idx) => (
                        <li key={idx} className="leading-relaxed pl-1 marker:text-brand-red">
                          {con}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              {/* Coaching/Psychology narrative summary card */}
              <div className="bg-brand-nested p-5 rounded border border-brand-border space-y-3">
                <h4 className="text-xs font-mono text-brand-text-muted uppercase tracking-widest">
                  Coaching Narrative & Risk Protocol
                </h4>
                <div className="text-xs text-brand-text leading-relaxed font-sans whitespace-pre-wrap">
                  {analysis.feedback}
                </div>
              </div>

              {/* Educational Disclaimer */}
              <div className="bg-[#0B0E11]/30 text-[10px] text-brand-text-muted/50 font-mono p-3 rounded border border-brand-border">
                PIXEL AI ADVISORY: AI model recommendations are generated automatically based on system configurations. Standard risk models apply. Trading financial instruments carries high risks of permanent impairment.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import React, { useState, useMemo } from "react";
import { JournalEntry, TradeResult } from "../types";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { DollarSign, Percent, TrendingUp, BarChart2, Edit2, Check, Calendar, Filter, Trash2, Eye } from "lucide-react";

interface DashboardTabProps {
  entries: JournalEntry[];
  startingBalance: number;
  setStartingBalance: (bal: number) => void;
  manualBalance: number;
  setManualBalance: (bal: number) => void;
  onDeleteEntry: (id: string) => void;
}

export default function DashboardTab({
  entries,
  startingBalance,
  setStartingBalance,
  manualBalance,
  setManualBalance,
  onDeleteEntry,
}: DashboardTabProps) {
  // Filters state
  const [selectedAccount, setSelectedAccount] = useState<string>("all-accounts");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Edit states for balance overrides
  const [isEditingStarting, setIsEditingStarting] = useState(false);
  const [isEditingManual, setIsEditingManual] = useState(false);
  const [startingVal, setStartingVal] = useState(startingBalance.toString());
  const [manualVal, setManualVal] = useState(manualBalance.toString());

  // Get list of unique accounts for filtering list
  const uniqueAccounts = useMemo(() => {
    const list = entries.map((e) => e.account.trim()).filter((acc) => acc !== "");
    return ["all-accounts", ...Array.from(new Set(list))];
  }, [entries]);

  // Filter entries chronologically
  const sortedEntriesAsc = useMemo(() => {
    return [...entries].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [entries]);

  // Filtered entries for the stats & table
  const filteredEntries = useMemo(() => {
    return sortedEntriesAsc.filter((entry) => {
      // 1. Account Filter
      if (selectedAccount !== "all-accounts" && entry.account !== selectedAccount) {
        return false;
      }
      // 2. Start Date Filter
      if (startDate && new Date(entry.date) < new Date(startDate)) {
        return false;
      }
      // 3. End Date Filter
      if (endDate) {
        const eDate = new Date(endDate);
        eDate.setHours(23, 59, 59, 999); // include the whole day
        if (new Date(entry.date) > eDate) {
          return false;
        }
      }
      // 4. Search Filter (Instrument or Notes)
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesInstrument = entry.instrument.toLowerCase().includes(query);
        const matchesNotes = entry.notes.toLowerCase().includes(query);
        const matchesAccount = entry.account.toLowerCase().includes(query);
        if (!matchesInstrument && !matchesNotes && !matchesAccount) {
          return false;
        }
      }
      return true;
    });
  }, [sortedEntriesAsc, selectedAccount, startDate, endDate, searchQuery]);

  // Calculate stats based on filtered entries
  const stats = useMemo(() => {
    const totalTrades = filteredEntries.length;
    const wins = filteredEntries.filter((e) => e.result === "win");
    const losses = filteredEntries.filter((e) => e.result === "loss");
    const breakevens = filteredEntries.filter((e) => e.result === "breakeven");

    const totalProfitLoss = filteredEntries.reduce((sum, e) => sum + e.profitLoss, 0);

    // Win rate percentage (wins / non-breakeven trades, or total trades depending on preference)
    // Professional traders usually count winrate as wins / total trades or wins / (wins+losses).
    // Let's use standard wins / totalTrades for clarity
    const winRate = totalTrades > 0 ? Math.round((wins.length / totalTrades) * 100) : 0;

    return {
      totalTrades,
      winsCount: wins.length,
      lossesCount: losses.length,
      breakevensCount: breakevens.length,
      winRate,
      totalProfitLoss,
    };
  }, [filteredEntries]);

  // Generate Equity Curve data
  const equityGrowthData = useMemo(() => {
    const data = [{ name: "Start", balance: startingBalance, profitLoss: 0, date: "" }];
    let runningBalance = startingBalance;

    sortedEntriesAsc.forEach((entry) => {
      // Apply filters if we want the line chart to respond, but usually the line chart
      // tracks full historical context. Let's make it track FILTERED history for maximum control!
      const isFilteredIn = filteredEntries.some((fe) => fe.id === entry.id);
      if (isFilteredIn) {
        runningBalance += entry.profitLoss;
        const formattedDate = new Date(entry.date).toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
        });
        data.push({
          name: entry.instrument,
          balance: runningBalance,
          profitLoss: entry.profitLoss,
          date: formattedDate,
        });
      }
    });

    return data;
  }, [sortedEntriesAsc, filteredEntries, startingBalance]);

  // Generate Pie Chart data
  const pieChartData = useMemo(() => {
    return [
      { name: "Wins", value: stats.winsCount, color: "#02C076" }, // Brand Green
      { name: "Losses", value: stats.lossesCount, color: "#F6465D" }, // Brand Red
      { name: "Breakeven", value: stats.breakevensCount, color: "#848E9C" }, // Brand Text Muted
    ].filter((item) => item.value > 0);
  }, [stats]);

  // Handle setting starting balance
  const saveStartingBalance = () => {
    const parsed = parseFloat(startingVal);
    if (!isNaN(parsed) && parsed >= 0) {
      setStartingBalance(parsed);
      setIsEditingStarting(false);
    }
  };

  // Handle setting manual balance override
  const saveManualBalance = () => {
    const parsed = parseFloat(manualVal);
    if (!isNaN(parsed) && parsed >= 0) {
      setManualBalance(parsed);
      setIsEditingManual(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Manual Balance Control Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-brand-card border border-brand-border p-6 rounded-lg">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-brand-text font-sans sm:text-2xl">
            Overview Performance
          </h2>
          <p className="text-sm text-brand-text-muted">
            Real-time trade intelligence ledger and cumulative compounding.
          </p>
        </div>
        <div className="flex items-center gap-4">
          {/* Starting Balance Controller */}
          <div className="bg-[#0B0E11] p-3 rounded border border-brand-border flex items-center justify-between gap-5">
            <div>
              <div className="text-[10px] font-mono text-brand-text-muted uppercase tracking-widest">
                Starting Capital
              </div>
              {isEditingStarting ? (
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-brand-text-muted text-sm">$</span>
                  <input
                    type="number"
                    value={startingVal}
                    onChange={(e) => setStartingVal(e.target.value)}
                    className="w-24 bg-brand-nested border border-brand-border text-brand-text text-xs px-1.5 py-0.5 rounded focus:outline-none focus:border-brand-teal"
                  />
                  <button
                    onClick={saveStartingBalance}
                    className="text-brand-teal hover:text-brand-teal/85 p-0.5"
                  >
                    <Check size={14} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm font-bold text-brand-text font-mono">
                    ${startingBalance.toLocaleString()}
                  </span>
                  <button
                    onClick={() => {
                      setStartingVal(startingBalance.toString());
                      setIsEditingStarting(true);
                    }}
                    className="text-brand-text-muted hover:text-brand-teal cursor-pointer"
                  >
                    <Edit2 size={12} />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Actual current manual balance override indicator */}
          <div className="bg-brand-green/5 p-3 rounded border border-brand-green/20 flex items-center justify-between gap-5">
            <div>
              <div className="text-[10px] font-mono text-brand-green uppercase tracking-widest">
                Current Live Balance
              </div>
              {isEditingManual ? (
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-brand-green text-sm">$</span>
                  <input
                    type="number"
                    value={manualVal}
                    onChange={(e) => setManualVal(e.target.value)}
                    className="w-28 bg-brand-nested border border-brand-green text-brand-text text-sm px-1.5 py-0.5 rounded focus:outline-none focus:ring-1 focus:ring-brand-green"
                  />
                  <button
                    onClick={saveManualBalance}
                    className="text-brand-green hover:text-brand-green/85 p-0.5"
                  >
                    <Check size={16} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-lg font-bold text-brand-text font-mono leading-none">
                    ${manualBalance.toLocaleString()}
                  </span>
                  <button
                    onClick={() => {
                      setManualVal(manualBalance.toString());
                      setIsEditingManual(true);
                    }}
                    className="text-brand-text-muted hover:text-brand-green cursor-pointer"
                  >
                    <Edit2 size={14} />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* SUMMARY KANBAN CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Profit Loss */}
        <div className="bg-brand-card border border-brand-border p-5 rounded-lg flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs font-mono text-brand-text-muted uppercase">Total Profit/Loss</p>
            <h3
              className={`text-2xl font-bold tracking-tight font-mono mt-1 ${
                stats.totalProfitLoss >= 0 ? "text-brand-green" : "text-brand-red"
              }`}
            >
              {stats.totalProfitLoss >= 0 ? "+" : ""}
              ${stats.totalProfitLoss.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
            <p className="text-[10px] text-brand-text-muted mt-1">Net value across filtered trades</p>
          </div>
          <div
            className={`p-3 rounded ${
              stats.totalProfitLoss >= 0 ? "bg-brand-green/10 text-brand-green" : "bg-brand-red/10 text-brand-red"
            }`}
          >
            <TrendingUp size={20} />
          </div>
        </div>

        {/* Win Rate Card */}
        <div className="bg-brand-card border border-brand-border p-5 rounded-lg flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs font-mono text-brand-text-muted uppercase">Win Rate %</p>
            <h3 className="text-2xl font-bold tracking-tight text-brand-text font-mono mt-1">
              {stats.winRate}%
            </h3>
            <p className="text-[10px] text-brand-text-muted mt-1 flex items-center gap-1">
              <span className="text-brand-green">{stats.winsCount} Wins</span>
              <span className="text-brand-border">|</span>
              <span className="text-brand-red">{stats.lossesCount} Losses</span>
            </p>
          </div>
          <div className="p-3 bg-brand-teal/10 text-brand-teal rounded">
            <Percent size={20} />
          </div>
        </div>

        {/* Total Trades Card */}
        <div className="bg-brand-card border border-brand-border p-5 rounded-lg flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs font-mono text-brand-text-muted uppercase">Total Trades</p>
            <h3 className="text-2xl font-bold tracking-tight text-brand-text font-mono mt-1">
              {stats.totalTrades}
            </h3>
            <p className="text-[10px] text-brand-text-muted mt-1">
              {stats.breakevensCount} breakeven results filtered
            </p>
          </div>
          <div className="p-3 bg-[#2B3139] text-brand-text-muted rounded">
            <BarChart2 size={20} />
          </div>
        </div>

        {/* Compound Equity Card */}
        <div className="bg-brand-card border border-brand-border p-5 rounded-lg flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs font-mono text-brand-text-muted uppercase">Compound Equity</p>
            <h3 className="text-2xl font-bold tracking-tight text-brand-text font-mono mt-1">
              ${(startingBalance + stats.totalProfitLoss).toLocaleString(undefined, { minimumFractionDigits: 1 })}
            </h3>
            <p className="text-[10px] text-brand-text-muted mt-1">Initial funding + current accrued PnL</p>
          </div>
          <div className="p-3 bg-brand-yellow/10 text-brand-yellow rounded">
            <DollarSign size={20} />
          </div>
        </div>
      </div>

      {/* PERFORMANCE VISUALIZERS (CHARTS) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Balance Growth Timeline */}
        <div className="bg-brand-card border border-brand-border p-5 rounded-lg lg:col-span-2 flex flex-col justify-between">
          <div>
            <h3 className="font-sans font-medium text-brand-text text-base">Equity Compounding Growth</h3>
            <p className="text-xs text-brand-text-muted mb-4">
              Real-time progression tracking starting from selected capital bases.
            </p>
          </div>
          <div className="h-72 w-full pr-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={equityGrowthData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2B3139" vertical={false} />
                <XAxis dataKey="name" stroke="#848E9C" fontSize={11} tickLine={false} />
                <YAxis
                  stroke="#848E9C"
                  fontSize={11}
                  tickLine={false}
                  domain={["auto", "auto"]}
                  tickFormatter={(val) => `$${val}`}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: "#161A1E", borderColor: "#2B3139", borderRadius: "4px" }}
                  labelStyle={{ color: "#EAECEF", fontWeight: "bold" }}
                  itemStyle={{ color: "#2EBDD3" }}
                  formatter={(value: any) => [`$${parseFloat(value).toLocaleString()}`, "Balance"]}
                />
                <Line
                  type="monotone"
                  dataKey="balance"
                  stroke="#2EBDD3"
                  strokeWidth={2}
                  dot={{ r: 4, strokeWidth: 1, fill: "#0B0E11" }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Win/Loss Pie Chart */}
        <div className="bg-brand-card border border-brand-border p-5 rounded-lg flex flex-col justify-between">
          <div>
            <h3 className="font-sans font-medium text-brand-text text-base">Win/Loss Distribution</h3>
            <p className="text-xs text-brand-text-muted mb-4">Percentage allocation of outcomes.</p>
          </div>
          <div className="h-56 w-full flex items-center justify-center relative">
            {pieChartData.length === 0 ? (
              <div className="text-brand-text-muted text-sm font-mono italic">No trade data to display</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: "#161A1E", borderColor: "#2B3139", borderRadius: "4px" }}
                    formatter={(val) => [`${val} Trades`, "Count"]}
                  />
                  <Legend verticalAlign="bottom" height={24} />
                </PieChart>
              </ResponsiveContainer>
            )}
            {pieChartData.length > 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center pt-8">
                <span className="text-2xl font-bold font-mono text-brand-text">{stats.winRate}%</span>
                <span className="text-[10px] font-mono text-brand-green uppercase tracking-widest">
                  WIN RATE
                </span>
              </div>
            )}
          </div>
          <div className="mt-4 pt-3 border-t border-brand-border text-center">
            <p className="text-xs text-brand-text-muted">
              Total Recorded Profit:{" "}
              <span className="text-brand-green font-mono font-medium">
                ${entries.filter((e) => e.profitLoss > 0).reduce((agg, c) => agg + c.profitLoss, 0).toLocaleString()}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* FILTER & ADVANCED QUERY TOOLBAR */}
      <div className="bg-brand-card border border-brand-border p-5 rounded-lg space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-brand-border">
          <Filter size={16} className="text-brand-teal" />
          <h3 className="font-sans font-medium text-brand-text text-sm">Ledger Filters</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {/* Account selector */}
          <div>
            <label className="block text-xs font-mono text-brand-text-muted uppercase mb-1">Account Channel</label>
            <select
              value={selectedAccount}
              onChange={(e) => setSelectedAccount(e.target.value)}
              className="w-full bg-brand-nested border border-brand-border rounded p-2 text-brand-text text-xs focus:outline-none focus:border-brand-teal select-none cursor-pointer"
            >
              <option value="all-accounts">All Accounts / Channels</option>
              {uniqueAccounts
                .filter((acc) => acc !== "all-accounts")
                .map((acc) => (
                  <option key={acc} value={acc}>
                    {acc}
                  </option>
                ))}
            </select>
          </div>

          {/* Date range start */}
          <div>
            <label className="block text-xs font-mono text-brand-text-muted uppercase mb-1">From Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-brand-nested border border-brand-border rounded p-2 text-brand-text text-xs focus:outline-none focus:border-brand-teal cursor-pointer"
            />
          </div>

          {/* Date range end */}
          <div>
            <label className="block text-xs font-mono text-brand-text-muted uppercase mb-1">To Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full bg-brand-nested border border-brand-border rounded p-2 text-brand-text text-xs focus:outline-none focus:border-brand-teal cursor-pointer"
            />
          </div>

          {/* Text/Search query */}
          <div>
            <label className="block text-xs font-mono text-brand-text-muted uppercase mb-1">Search Keywords</label>
            <input
              type="text"
              placeholder="e.g. XAUUSD, Fomo, Breakout..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-brand-nested border border-brand-border rounded p-2 text-brand-text text-xs focus:outline-none focus:border-brand-teal"
            />
          </div>
        </div>

        {/* Clear filters button if active */}
        {(selectedAccount !== "all-accounts" || startDate || endDate || searchQuery) && (
          <div className="flex justify-end pt-1">
            <button
              onClick={() => {
                setSelectedAccount("all-accounts");
                setStartDate("");
                setEndDate("");
                setSearchQuery("");
               }}
              className="text-xs text-brand-red hover:text-brand-red/80 font-mono font-medium hover:underline flex items-center gap-1 cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* TRANSACTION JOURNAL HISTORY TABLE */}
      <div className="bg-brand-card border border-brand-border rounded-lg overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-brand-border flex justify-between items-center bg-brand-card">
          <div>
            <h3 className="font-sans font-medium text-brand-text text-sm">Ledger Executions</h3>
            <p className="text-xs text-brand-text-muted">Live feed of transactions loaded in channel.</p>
          </div>
          <span className="text-xs font-mono text-brand-teal bg-brand-teal/10 px-2.5 py-1 rounded">
            {filteredEntries.length} Records
          </span>
        </div>

        <div className="overflow-x-auto">
          {filteredEntries.length === 0 ? (
            <div className="p-8 text-center text-brand-text-muted font-mono italic text-xs">
              No matching trades found on the ledger. Add entries in the Trade Journal tab or adjust filters.
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-brand-border bg-brand-nested text-[10px] font-mono text-brand-text-muted uppercase tracking-wider">
                  <th className="px-5 py-3">Exec Time</th>
                  <th className="px-5 py-3">Instrument</th>
                  <th className="px-5 py-3">Account Channel</th>
                  <th className="px-5 py-3">Lot Size</th>
                  <th className="px-5 py-3 text-center">Outcome</th>
                  <th className="px-5 py-3 text-right">PnL Amount</th>
                  <th className="px-5 py-3">Outcome Notes</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border text-xs">
                {filteredEntries.map((trade) => {
                  return (
                    <tr key={trade.id} className="hover:bg-brand-nested/50 transition-colors">
                      <td className="px-5 py-3 text-brand-text-muted font-mono">
                        {new Date(trade.date).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="px-5 py-3 font-semibold text-brand-text font-mono">
                        {trade.instrument}
                      </td>
                      <td className="px-5 py-3 text-brand-text-muted">{trade.account}</td>
                      <td className="px-5 py-3 font-mono text-brand-text-muted">{trade.lotSize} Lots</td>
                      <td className="px-5 py-3 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider font-sans ${
                            trade.result === "win"
                              ? "bg-brand-green/20 text-brand-green"
                              : trade.result === "loss"
                              ? "bg-brand-red/20 text-brand-red"
                              : "bg-[#2B3139] text-[#848E9C]"
                          }`}
                        >
                          {trade.result}
                        </span>
                      </td>
                      <td
                        className={`px-5 py-3 text-right font-mono font-medium ${
                          trade.profitLoss >= 0 ? "text-brand-green" : "text-brand-red"
                        }`}
                      >
                        {trade.profitLoss >= 0 ? "+" : ""}
                        ${trade.profitLoss.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-5 py-3 text-brand-text-muted max-w-xs truncate">
                        {trade.notes}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex gap-2 justify-end">
                          <button
                            title="Delete entry"
                            onClick={() => {
                              if (confirm("Are you sure you want to permanently delete this trade record? This resets associated summaries.")) {
                                onDeleteEntry(trade.id);
                              }
                            }}
                            className="bg-brand-nested p-1.5 rounded text-brand-text-muted hover:text-brand-red hover:bg-brand-red/10 border border-brand-border hover:border-brand-red/20 cursor-pointer"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

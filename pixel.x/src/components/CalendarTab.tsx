import React, { useState, useMemo } from "react";
import { JournalEntry } from "../types";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Info,
  DollarSign,
  Briefcase,
  Layers,
  ArrowRight,
  Sparkles,
  PlusCircle,
  X,
  Maximize2,
} from "lucide-react";

interface CalendarTabProps {
  entries: JournalEntry[];
  onAddEntry: (entry: Omit<JournalEntry, "id">) => void;
}

export default function CalendarTab({ entries, onAddEntry }: CalendarTabProps) {
  // We can default the calendar views to September 2026 (matching user's query), 
  // or allow navigation to any month of any year easily.
  const [currentDate, setCurrentDate] = useState<Date>(() => {
    // If there is any trade in September 2026, or if the current date is chosen, let's default to September 2026
    // to instantly show the user's requested date, otherwise standard live month!
    const hasSepTrades = entries.some(e => {
      const d = new Date(e.date);
      return d.getFullYear() === 2026 && d.getMonth() === 8; // September is 8
    });
    return hasSepTrades ? new Date("2026-09-01") : new Date("2026-06-12");
  });

  const [selectedDayOption, setSelectedDayOption] = useState<string | null>(null); // YYYY-MM-DD format

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  // Helper date utility
  const getLocalDateKey = (dateStr: string) => {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "";
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  // Group entries by date key YYYY-MM-DD
  const tradesByDate = useMemo(() => {
    const map: Record<string, JournalEntry[]> = {};
    entries.forEach((entry) => {
      const key = getLocalDateKey(entry.date);
      if (key) {
        if (!map[key]) {
          map[key] = [];
        }
        map[key].push(entry);
      }
    });
    return map;
  }, [entries]);

  // Handle month iteration
  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
    setSelectedDayOption(null);
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
    setSelectedDayOption(null);
  };

  // Skip to specific Sep 2026
  const jumpToSeptember2026 = () => {
    setCurrentDate(new Date(2026, 8, 1));
    setSelectedDayOption(null);
  };

  // Check how many days are in the current month
  const daysInMonth = useMemo(() => {
    return new Date(year, month + 1, 0).getDate();
  }, [year, month]);

  // First weekday of month (0 = Sun, 1 = Mon...)
  const firstDayIndex = useMemo(() => {
    return new Date(year, month, 1).getDay();
  }, [year, month]);

  // Generate calendar cells (grid consists of padding cells + active days + trailing pads)
  const calendarCells = useMemo(() => {
    const cells: { dateKey: string; dayNum: number; isPadding: boolean; trades: JournalEntry[]; dailyPnl: number }[] = [];

    // Prior Month trailing days
    const prevMonthDays = new Date(year, month, 0).getDate();
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const dayNum = prevMonthDays - i;
      const prevY = month === 0 ? year - 1 : year;
      const prevM = month === 0 ? 11 : month - 1;
      const key = `${prevY}-${String(prevM + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
      cells.push({
        dateKey: key,
        dayNum,
        isPadding: true,
        trades: tradesByDate[key] || [],
        dailyPnl: (tradesByDate[key] || []).reduce((sum, e) => sum + e.profitLoss, 0),
      });
    }

    // Current Month active days
    for (let d = 1; d <= daysInMonth; d++) {
      const key = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      cells.push({
        dateKey: key,
        dayNum: d,
        isPadding: false,
        trades: tradesByDate[key] || [],
        dailyPnl: (tradesByDate[key] || []).reduce((sum, e) => sum + e.profitLoss, 0),
      });
    }

    // Next Month leading days to fill grid (6 rows of 7 = 42 total slots standard)
    const remainingSlots = 42 - cells.length;
    for (let d = 1; d <= remainingSlots; d++) {
      const nextY = month === 11 ? year + 1 : year;
      const nextM = month === 11 ? 0 : month + 1;
      const key = `${nextY}-${String(nextM + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      cells.push({
        dateKey: key,
        dayNum: d,
        isPadding: true,
        trades: tradesByDate[key] || [],
        dailyPnl: (tradesByDate[key] || []).reduce((sum, e) => sum + e.profitLoss, 0),
      });
    }

    return cells;
  }, [year, month, daysInMonth, firstDayIndex, tradesByDate]);

  // Aggregate monthly performance statistics of currently viewed month
  const monthStats = useMemo(() => {
    let grossProfit = 0;
    let grossLoss = 0;
    let winCount = 0;
    let lossCount = 0;
    let totalTrades = 0;

    let greenDays = 0;
    let redDays = 0;
    
    // Check main active days inside this month (ignore padding cells from previous/next months)
    for (let d = 1; d <= daysInMonth; d++) {
      const key = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const dayTrades = tradesByDate[key] || [];
      const dailySum = dayTrades.reduce((sum, e) => sum + e.profitLoss, 0);

      if (dailySum > 0) {
        greenDays++;
      } else if (dailySum < 0) {
        redDays++;
      }

      dayTrades.forEach(t => {
        totalTrades++;
        if (t.profitLoss >= 0) {
          grossProfit += t.profitLoss;
          winCount++;
        } else {
          grossLoss += Math.abs(t.profitLoss);
          lossCount++;
        }
      });
    }

    const netPnl = grossProfit - grossLoss;
    const winRate = totalTrades > 0 ? (winCount / totalTrades) * 100 : 0;
    const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? 99.9 : 0;

    return {
      netPnl,
      grossProfit,
      grossLoss,
      totalTrades,
      winRate,
      profitFactor,
      greenDays,
      redDays,
    };
  }, [year, month, daysInMonth, tradesByDate]);

  // Select day handler
  const handleDayClick = (dateKey: string) => {
    setSelectedDayOption(dateKey === selectedDayOption ? null : dateKey);
  };

  // Helper template injector for user's explicit request
  // September 4th: $500 Profit
  // September 5th: $100 Loss
  const injectSeptDemoTrades = () => {
    // September 4th, 2026 trade
    onAddEntry({
      date: "2026-09-04T12:00:00-07:00",
      instrument: "XAUUSD",
      account: "Personal Live",
      entryPrice: 2360.0,
      exitPrice: 2365.0,
      lotSize: 1.0,
      stopLoss: 2355.0,
      takeProfit: 2370.0,
      result: "win",
      profitLoss: 500.0,
      notes: "Demo Trade: Gold breakout retest on Sep 4th. Reaching user's specified profit of $500.",
    });

    // September 5th, 2026 trade
    onAddEntry({
      date: "2026-09-05T14:15:00-07:00",
      instrument: "EURUSD",
      account: "Personal Live",
      entryPrice: 1.0950,
      exitPrice: 1.0940,
      lotSize: 1.0,
      stopLoss: 1.0970,
      takeProfit: 1.0910,
      result: "loss",
      profitLoss: -100.0,
      notes: "Demo Trade: Swing trade slippage on Sep 5th. Reaching user's specified loss of -$100.",
    });

    // Automatically navigate view port to September 2026
    setCurrentDate(new Date(2026, 8, 1));
    setSelectedDayOption(null);
  };

  // Selected Day's Trades readout
  const selectedDayTrades = selectedDayOption ? tradesByDate[selectedDayOption] || [] : [];
  const selectedDateObject = selectedDayOption ? new Date(`${selectedDayOption}T12:00:00`) : null;

  return (
    <div className="space-y-6">
      {/* Header Container */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-brand-card border border-brand-border p-6 rounded-lg">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-brand-text font-sans sm:text-2xl flex items-center gap-2">
            <CalendarIcon size={24} className="text-brand-teal stroke-[2]" />
            Trading P&amp;L Calendar
          </h2>
          <p className="text-sm text-brand-text-muted">
            Visualize your daily profits and losses formatted cleanly onto calendar cells. Track consecutive green streaks.
          </p>
        </div>

        {/* Rapid September Demo Injector */}
        <button
          onClick={injectSeptDemoTrades}
          className="bg-brand-teal hover:bg-brand-teal/90 transition text-brand-bg font-sans font-semibold text-xs px-4.5 py-2.5 rounded flex items-center gap-2 cursor-pointer shadow-lg shadow-brand-teal/10 animate-pulse hover:animate-none"
          title="Instantly adds Sep 4th ($500 Win) and Sep 5th (-$100 Loss) to verify calendar"
        >
          <PlusCircle size={16} />
          Inject Sept 4th &amp; 5th Demo
        </button>
      </div>

      {/* MONTH STATS HIGHLIGHTS GRID */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {/* Metric 1 */}
        <div className="bg-brand-card border border-brand-border p-4 rounded-lg flex flex-col justify-between">
          <span className="text-[10px] font-mono font-bold text-brand-text-muted uppercase tracking-wider block">
            Net Monthly P&amp;L
          </span>
          <p className={`text-xl font-bold font-mono mt-2 ${
            monthStats.netPnl >= 0 ? "text-brand-green" : "text-brand-red"
          }`}>
            {monthStats.netPnl >= 0 ? "+" : "-"}
            ${Math.abs(monthStats.netPnl).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <span className="text-[10px] text-brand-text-muted font-mono mt-1 block">
            {monthNames[month]} {year}
          </span>
        </div>

        {/* Metric 2 */}
        <div className="bg-brand-card border border-brand-border p-4 rounded-lg flex flex-col justify-between">
          <span className="text-[10px] font-mono font-bold text-brand-text-muted uppercase tracking-wider block">
            Calendar Win Rate
          </span>
          <p className="text-xl font-bold font-mono mt-2 text-brand-text">
            {monthStats.winRate.toFixed(1)}%
          </p>
          <span className="text-[10px] text-brand-text-muted font-mono mt-1 block">
            {monthStats.totalTrades} Executions
          </span>
        </div>

        {/* Metric 3 */}
        <div className="bg-brand-card border border-brand-border p-4 rounded-lg flex flex-col justify-between">
          <span className="text-[10px] font-mono font-bold text-brand-text-muted uppercase tracking-wider block">
            Green Days / Red Days
          </span>
          <p className="text-xl font-bold font-mono mt-2 flex items-center gap-2">
            <span className="text-brand-green">{monthStats.greenDays}G</span>
            <span className="text-brand-text-muted">/</span>
            <span className="text-brand-red">{monthStats.redDays}R</span>
          </p>
          <span className="text-[10px] text-brand-text-muted font-mono mt-1 block">
            Profitable daily totals
          </span>
        </div>

        {/* Metric 4 */}
        <div className="bg-brand-card border border-brand-border p-4 rounded-lg flex flex-col justify-between">
          <span className="text-[10px] font-mono font-bold text-brand-text-muted uppercase tracking-wider block">
            Profit Factor
          </span>
          <p className="text-xl font-bold font-mono mt-2 text-brand-teal">
            {monthStats.profitFactor.toFixed(2)}x
          </p>
          <span className="text-[10px] text-brand-text-muted font-mono mt-1 block">
            Gross Prof / Gross Loss
          </span>
        </div>

        {/* Metric 5 */}
        <div className="bg-[#12161A] border border-brand-teal/20 p-4 rounded-lg col-span-2 md:col-span-1 flex flex-col justify-between">
          <span className="text-[10px] font-mono font-bold text-brand-teal uppercase tracking-wider block">
            Jump to Sep 2026
          </span>
          <button
            onClick={jumpToSeptember2026}
            className="text-left py-1 text-xs text-[#EAECEF] hover:text-brand-teal mt-1 border-b border-brand-border font-sans font-semibold flex items-center justify-between cursor-pointer group"
          >
            <span>Sept Test Month</span>
            <ArrowRight size={13} className="text-brand-teal group-hover:translate-x-1 transition duration-200" />
          </button>
          <span className="text-[9px] text-[#848E9C] font-mono mt-1 block">
            See user demo sandbox
          </span>
        </div>
      </div>

      {/* CORE CALENDAR GRID FRAMEWORK */}
      <div className="bg-brand-card border border-brand-border rounded-lg overflow-hidden flex flex-col">
        {/* Calendar Nav bar header */}
        <div className="flex justify-between items-center px-6 py-4 bg-[#0B0E11]/80 border-b border-brand-border">
          <div className="flex items-center gap-3">
            <h3 className="font-sans font-bold text-[#EAECEF] text-base">
              {monthNames[month]} {year}
            </h3>
            <span className="text-[10px] font-mono bg-brand-nested border border-brand-border px-2 py-0.5 rounded text-brand-text-muted">
              {monthStats.totalTrades} trades logged
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={prevMonth}
              className="p-1.5 rounded border border-brand-border bg-[#0B0E11] hover:bg-brand-nested hover:text-brand-text text-brand-text-muted transition cursor-pointer"
              title="Previous Month"
            >
              <ChevronLeft size={16} />
            </button>

            <button
              onClick={() => {
                const today = new Date();
                setCurrentDate(new Date(today.getFullYear(), today.getMonth(), 1));
                setSelectedDayOption(null);
              }}
              className="px-3 py-1.5 text-xs font-mono font-bold border border-brand-border bg-[#0B0E11] hover:bg-brand-nested text-[#EAECEF] rounded transition cursor-pointer"
            >
              Today
            </button>

            <button
              onClick={nextMonth}
              className="p-1.5 rounded border border-brand-border bg-[#0B0E11] hover:bg-brand-nested hover:text-brand-text text-brand-text-muted transition cursor-pointer"
              title="Next Month"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* 7 Days of the Week Headers */}
        <div className="grid grid-cols-7 border-b border-brand-border bg-brand-nested/50 text-center py-2 text-[10px] font-mono font-bold uppercase tracking-wider text-brand-text-muted">
          <div>Sun</div>
          <div>Mon</div>
          <div>Tue</div>
          <div>Wed</div>
          <div>Thu</div>
          <div>Fri</div>
          <div>Sat</div>
        </div>

        {/* Day Cells Grid */}
        <div className="grid grid-cols-7 bg-[#0B0E11]/40">
          {calendarCells.map((cell, index) => {
            const isSelected = selectedDayOption === cell.dateKey;
            const hasTradesObj = cell.trades.length > 0;
            const isProfit = cell.dailyPnl > 0;
            const isLoss = cell.dailyPnl < 0;

            // Highlight border if active day of currently selected visual tab
            const cellBorder = isSelected
              ? "ring-2 ring-brand-teal/80 z-10"
              : "border-r border-b border-brand-border/40";

            return (
              <div
                key={`${cell.dateKey}-${index}`}
                onClick={() => handleDayClick(cell.dateKey)}
                className={`min-h-[92px] p-2 flex flex-col justify-between transition-all duration-150 cursor-pointer relative group ${cellBorder} ${
                  cell.isPadding ? "bg-[#06080A]/20 opacity-45" : "bg-brand-card hover:bg-[#12161A]/50"
                }`}
              >
                {/* Micro Header: Cell Day Number */}
                <div className="flex justify-between items-center">
                  <span
                    className={`text-xs font-mono font-bold ${
                      cell.isPadding ? "text-brand-text-muted/60" : "text-[#848E9C] group-hover:text-brand-text"
                    }`}
                  >
                    {cell.dayNum}
                  </span>
                  
                  {/* Indicators of transactions volume count */}
                  {hasTradesObj && (
                    <span className="text-[8px] font-mono uppercase bg-brand-nested text-[#848E9C] px-1 py-0.5 rounded border border-brand-border scale-90">
                      {cell.trades.length}T
                    </span>
                  )}
                </div>

                {/* Profit Loss Daily Readout indicator */}
                {hasTradesObj ? (
                  <div className="space-y-1 text-right mt-1.5">
                    <p
                      className={`font-mono text-[11px] font-black leading-none ${
                        isProfit
                          ? "text-brand-green"
                          : isLoss
                          ? "text-brand-red"
                          : "text-brand-text-muted"
                      }`}
                    >
                      {cell.dailyPnl >= 0 ? "+" : "-"}
                      ${Math.abs(cell.dailyPnl).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </p>

                    {/* Miniature list of instrument pills */}
                    <div className="flex flex-wrap gap-0.5 justify-end max-h-10 overflow-hidden">
                      {Array.from(new Set(cell.trades.map((t) => t.instrument))).map((inst) => (
                        <span
                          key={inst}
                          className={`text-[8px] font-mono px-1 py-0.5 rounded font-medium ${
                            isProfit 
                              ? "bg-brand-green/10 text-brand-green border border-brand-green/15" 
                              : isLoss
                              ? "bg-brand-red/10 text-brand-red border border-brand-red/15"
                              : "bg-brand-nested text-brand-text-muted border border-brand-border"
                          }`}
                        >
                          {inst}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex-1" /> // empty fill spacers
                )}

                {/* Small indicator dots for pending or visual accent */}
                {isSelected && (
                  <div className="absolute top-1 right-1.5 h-1.5 w-1.5 rounded-full bg-brand-teal animate-ping" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* SELECTED DATE DRILLDOWN DETAIL TRANSACTION LIST */}
      {selectedDayOption && (
        <div className="bg-brand-card border border-brand-border p-6 rounded-lg space-y-4 animate-in slide-in-from-bottom duration-200">
          <div className="flex justify-between items-center border-b border-brand-border pb-3">
            <div>
              <h4 className="font-sans font-bold text-brand-text text-sm flex items-center gap-2">
                <CalendarIcon size={16} className="text-brand-teal" />
                Individual Logged Trades on / {selectedDateObject ? selectedDateObject.toLocaleDateString(undefined, {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                }) : selectedDayOption}
              </h4>
              <p className="text-xs text-brand-text-muted">
                Inspect details of the trades that composite this calendar date's profit/loss calculation.
              </p>
            </div>

            <button
              onClick={() => setSelectedDayOption(null)}
              className="text-brand-text-muted hover:text-brand-text p-1.5 rounded bg-brand-nested border border-brand-border cursor-pointer transition"
            >
              <X size={14} />
            </button>
          </div>

          {selectedDayTrades.length === 0 ? (
            <div className="p-8 text-center text-xs text-brand-text-muted bg-brand-nested rounded border border-dashed border-brand-border leading-relaxed">
              No executions or journal transactions found on this date.
              <p className="text-[11px] mt-1 text-slate-500">
                Tip: You can add new trades to this date in the <span className="font-semibold text-brand-teal">Trade Journal</span> tab!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {selectedDayTrades.map((trade) => {
                const isTrProfit = trade.profitLoss >= 0;
                return (
                  <div
                    key={trade.id}
                    className={`bg-brand-nested border p-4.5 rounded flex flex-col justify-between space-y-3 hover:border-brand-teal/30 transition ${
                      isTrProfit ? "border-brand-green/20" : "border-brand-red/20"
                    }`}
                  >
                    <div>
                      <div className="flex justify-between items-center flex-wrap gap-2">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-brand-text text-sm">{trade.instrument}</span>
                          <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-brand-bg text-[#848E9C]">
                            {trade.account}
                          </span>
                        </div>
                        <span
                          className={`font-mono text-sm font-bold ${
                            isTrProfit ? "text-brand-green" : "text-brand-red"
                          }`}
                        >
                          {isTrProfit ? "+" : "-"}
                          ${Math.abs(trade.profitLoss).toFixed(2)}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-[10px] font-mono text-brand-text-muted mt-2 border-b border-t border-brand-border/40 py-2">
                        <div>
                          <span>Lots: {trade.lotSize}</span>
                        </div>
                        <div>
                          <span>Entry: {trade.entryPrice}</span>
                        </div>
                        <div>
                          <span>Exit: {trade.exitPrice}</span>
                        </div>
                      </div>

                      <p className="text-xs text-brand-text italic mt-2.5 leading-relaxed pr-1">
                        &quot;{trade.notes.replace(/\[Chart Annotation\].*/s, "").trim()}&quot;
                      </p>

                      {trade.screenshot && (
                        <div className="mt-3 relative h-20 w-36 rounded overflow-hidden border border-brand-border object-cover">
                          <img
                            src={trade.screenshot}
                            alt="Attached chart screengrab thumbnail"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition duration-150">
                            <span className="text-[9px] text-brand-teal font-medium uppercase font-mono px-1 bg-brand-bg rounded border border-brand-border">
                              Attached Chart
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="text-[10px] text-brand-text-muted flex justify-between items-center pt-2 border-t border-[#2B3139]/30">
                      <span>Ref ID: #{trade.id.slice(0, 10)}</span>
                      <span>Result: <span className={isTrProfit ? "text-brand-green uppercase font-bold" : "text-brand-red uppercase font-bold"}>{trade.result}</span></span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

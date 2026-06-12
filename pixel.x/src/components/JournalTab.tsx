import React, { useState, useRef } from "react";
import { JournalEntry, TradeResult } from "../types";
import {
  Plus,
  BookOpen,
  Image as ImageIcon,
  DollarSign,
  TrendingDown,
  TrendingUp,
  X,
  PlusCircle,
  FileSpreadsheet,
  Upload,
  Calendar,
  Layers,
  Sparkles,
  Search,
  Check,
  Percent,
} from "lucide-react";

interface JournalTabProps {
  entries: JournalEntry[];
  onAddEntry: (entry: Omit<JournalEntry, "id">) => void;
  onEditEntry: (entry: JournalEntry) => void;
  onDeleteEntry: (id: string) => void;
}

export default function JournalTab({
  entries,
  onAddEntry,
  onEditEntry,
  onDeleteEntry,
}: JournalTabProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);

  // Form Field States
  const [date, setDate] = useState("");
  const [instrument, setInstrument] = useState("XAUUSD");
  const [account, setAccount] = useState("Personal Live");
  const [entryPrice, setEntryPrice] = useState("");
  const [exitPrice, setExitPrice] = useState("");
  const [lotSize, setLotSize] = useState("1.0");
  const [stopLoss, setStopLoss] = useState("");
  const [takeProfit, setTakeProfit] = useState("");
  const [result, setResult] = useState<TradeResult>("win");
  const [profitLoss, setProfitLoss] = useState("");
  const [notes, setNotes] = useState("");
  const [screenshot, setScreenshot] = useState<string>("");

  // Usability state (file drag/drop feedback)
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sort entries descending raw-time for the feed view
  const chronologicalEntries = [...entries].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  // Instrument presets for quick click filling
  const popularInstruments = ["XAUUSD", "EURUSD", "GBPUSD", "USDJPY", "BTCUSD", "US30", "NAS100"];

  // Open form in Create mode
  const handleOpenCreate = () => {
    // default to current system datetime local
    const tzoffset = new Date("2026-06-12T11:16:25-07:00").getTimezoneOffset() * 60000;
    const localISOTime = new Date(new Date("2026-06-12T11:16:25-07:00").getTime() - tzoffset)
      .toISOString()
      .slice(0, 16);

    setEditingEntry(null);
    setDate(localISOTime);
    setInstrument("XAUUSD");
    setAccount("Personal Live");
    setEntryPrice("");
    setExitPrice("");
    setLotSize("1.0");
    setStopLoss("");
    setTakeProfit("");
    setResult("win");
    setProfitLoss("");
    setNotes("");
    setScreenshot("");
    setIsFormOpen(true);
  };

  // Open form in Edit mode
  const handleOpenEdit = (entry: JournalEntry) => {
    setEditingEntry(entry);
    setDate(entry.date);
    setInstrument(entry.instrument);
    setAccount(entry.account);
    setEntryPrice(entry.entryPrice.toString());
    setExitPrice(entry.exitPrice.toString());
    setLotSize(entry.lotSize.toString());
    setStopLoss(entry.stopLoss ? entry.stopLoss.toString() : "");
    setTakeProfit(entry.takeProfit ? entry.takeProfit.toString() : "");
    setResult(entry.result);
    setProfitLoss(entry.profitLoss.toString());
    setNotes(entry.notes);
    setScreenshot(entry.screenshot || "");
    setIsFormOpen(true);
  };

  // Convert uploaded image to base64
  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Please upload an image file (PNG, JPG, WEBP).");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64Str = e.target?.result as string;
      setScreenshot(base64Str);
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!instrument || !date || !entryPrice || !exitPrice || !profitLoss) {
      alert("Please fill in all core fields (Instrument, Date, Prices, and Profit/Loss).");
      return;
    }

    const entryData = {
      date,
      instrument: instrument.toUpperCase().trim(),
      account: account.trim() || "Live Account",
      entryPrice: parseFloat(entryPrice),
      exitPrice: parseFloat(exitPrice),
      lotSize: parseFloat(lotSize) || 1.0,
      stopLoss: stopLoss ? parseFloat(stopLoss) : null,
      takeProfit: takeProfit ? parseFloat(takeProfit) : null,
      result,
      profitLoss: parseFloat(profitLoss),
      notes: notes.trim(),
      screenshot: screenshot || undefined,
    };

    if (editingEntry) {
      onEditEntry({
        ...entryData,
        id: editingEntry.id,
      });
    } else {
      onAddEntry(entryData);
    }
    setIsFormOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-brand-card border border-brand-border p-6 rounded-lg">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-brand-text font-sans sm:text-2xl">
            Trade Journal Ledger
          </h2>
          <p className="text-sm text-brand-text-muted">
            Chronological documentation of transactions, screenshots, and rationalizations.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          id="btn-journal-add-entry"
          className="bg-[#02C076] hover:bg-[#02C076]/90 transition text-[#0B0E11] font-sans font-medium text-xs px-4 py-2.5 rounded flex items-center gap-2 cursor-pointer"
        >
          <Plus size={16} />
          New Journal Entry
        </button>
      </div>

      {/* COLLAPSIBLE JOURNAL FORM DRAWER / CARD */}
      {isFormOpen && (
        <div className="bg-brand-card border border-brand-green/30 rounded p-6 shadow-xl">
          <div className="flex justify-between items-center border-b border-brand-border pb-3 mb-5">
            <h3 className="font-sans font-semibold text-brand-text text-base">
              {editingEntry ? `Modify Record: #${editingEntry.id.slice(0, 8)}` : "Create New Journal File"}
            </h3>
            <button
              onClick={() => setIsFormOpen(false)}
              className="text-brand-text-muted hover:text-brand-text p-1 rounded bg-[#0B0E11]/40 border border-brand-border cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Quick Fill Instrument Presets */}
            {!editingEntry && (
              <div className="bg-[#0B0E11] p-3 rounded border border-brand-border">
                <span className="text-[10px] font-mono text-brand-text-muted uppercase block mb-2">
                  Quick Instrument Presets:
                </span>
                <div className="flex flex-wrap gap-2">
                  {popularInstruments.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setInstrument(preset)}
                      className={`px-3 py-1 text-xs rounded-full border transition-all cursor-pointer ${
                        instrument === preset
                          ? "bg-brand-green/10 text-brand-green border-brand-green/30"
                          : "bg-brand-card text-brand-text-muted border-brand-border hover:border-brand-text-muted"
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* PRIMARY DETAILS METRICS */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-mono text-brand-text-muted uppercase mb-1">
                    Date & Execution Time *
                  </label>
                  <input
                    type="datetime-local"
                    value={date}
                    required
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-brand-nested border border-brand-border rounded p-2.5 text-xs text-brand-text focus:outline-none focus:border-brand-teal"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-brand-text-muted uppercase mb-1">
                    Instrument Symbol *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. XAUUSD, EURUSD"
                    value={instrument}
                    onChange={(e) => setInstrument(e.target.value)}
                    className="w-full bg-brand-nested border border-brand-border rounded p-2.5 text-xs text-brand-text focus:outline-none focus:border-brand-teal uppercase"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-brand-text-muted uppercase mb-1">
                    Account Channel *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Personal Live, FTMO 200k"
                    value={account}
                    onChange={(e) => setAccount(e.target.value)}
                    className="w-full bg-brand-nested border border-brand-border rounded p-2.5 text-xs text-brand-text focus:outline-none focus:border-brand-teal"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-brand-text-muted uppercase mb-1">
                    Lot Size *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={lotSize}
                    onChange={(e) => setLotSize(e.target.value)}
                    className="w-full bg-brand-nested border border-brand-border rounded p-2.5 text-xs text-brand-green font-mono focus:outline-none focus:border-brand-teal"
                  />
                </div>
              </div>

              {/* TECHNICAL EXECUTION SETTINGS (PRICES, SL/TP) */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-mono text-brand-text-muted uppercase mb-1">
                      Entry Price *
                    </label>
                    <input
                      type="number"
                      step="any"
                      required
                      placeholder="e.g. 2355.40"
                      value={entryPrice}
                      onChange={(e) => setEntryPrice(e.target.value)}
                      className="w-full bg-brand-nested border border-brand-border rounded p-2.5 text-xs text-brand-text font-mono focus:outline-none focus:border-brand-teal"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-brand-text-muted uppercase mb-1">
                      Exit Price *
                    </label>
                    <input
                      type="number"
                      step="any"
                      required
                      placeholder="e.g. 2368.10"
                      value={exitPrice}
                      onChange={(e) => setExitPrice(e.target.value)}
                      className="w-full bg-brand-nested border border-brand-border rounded p-2.5 text-xs text-brand-text font-mono focus:outline-none focus:border-brand-teal"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-mono text-brand-text-muted uppercase mb-1">
                      Stop Loss (Optional)
                    </label>
                    <input
                      type="number"
                      step="any"
                      placeholder="SL level"
                      value={stopLoss}
                      onChange={(e) => setStopLoss(e.target.value)}
                      className="w-full bg-brand-nested border border-brand-border rounded p-2.5 text-xs text-brand-red font-mono focus:outline-none focus:border-brand-teal"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-brand-text-muted uppercase mb-1">
                      Take Profit (Optional)
                    </label>
                    <input
                      type="number"
                      step="any"
                      placeholder="TP level"
                      value={takeProfit}
                      onChange={(e) => setTakeProfit(e.target.value)}
                      className="w-full bg-brand-nested border border-brand-border rounded p-2.5 text-xs text-brand-green font-mono focus:outline-none focus:border-brand-teal"
                    />
                  </div>
                </div>

                {/* RESULT SELECTION (WIN / LOSS / BREAKEVEN) */}
                <div>
                  <label className="block text-xs font-mono text-brand-text-muted uppercase mb-1">
                    Trade Result Group *
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(["win", "loss", "breakeven"] as TradeResult[]).map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => {
                          setResult(r);
                          if (r === "breakeven") setProfitLoss("0");
                        }}
                        className={`py-2 rounded text-xs font-bold font-sans uppercase border transition-all cursor-pointer ${
                          result === r
                            ? r === "win"
                              ? "bg-brand-green/20 text-brand-green border-brand-green/50"
                              : r === "loss"
                              ? "bg-brand-red/20 text-brand-red border-brand-red/50"
                              : "bg-[#2B3139] text-brand-text border-brand-border"
                            : "bg-[#0B0E11] text-brand-text-muted border-brand-border hover:text-brand-text"
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>

                {/* PROFIT LIMITS ENTRY */}
                <div>
                  <label className="block text-xs font-mono text-brand-text-muted uppercase mb-1">
                    Profit / Loss ($ Amount) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-3 text-brand-text-muted text-xs font-mono">$</span>
                    <input
                      type="number"
                      step="any"
                      required
                      placeholder="Use negative sign (-) for losses"
                      value={profitLoss}
                      onChange={(e) => setProfitLoss(e.target.value)}
                      className={`w-full bg-brand-nested border border-brand-border rounded py-2.5 pl-7 pr-3 text-xs font-mono focus:outline-none focus:border-brand-teal ${
                        parseFloat(profitLoss) > 0
                          ? "text-brand-green"
                          : parseFloat(profitLoss) < 0
                          ? "text-brand-red"
                          : "text-brand-text"
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* RATIONALIZATION & ATTACHMENT */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-mono text-brand-text-muted uppercase mb-1">
                    Rationals & Strategy Notes *
                  </label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Enter confluence checklist, patterns (Double Top, Order block), or emotional state feedback..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full bg-brand-nested border border-brand-border rounded p-2.5 text-xs text-brand-text focus:outline-none focus:border-brand-teal"
                  />
                </div>

                {/* ATTACHMENT DRAG & DROP ZONE (MANDATORY PATTERN RULE) */}
                <div>
                  <span className="block text-xs font-mono text-brand-text-muted uppercase mb-1">
                    Analytic Chart Attachment
                  </span>
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border rounded p-4 text-center cursor-pointer transition-all ${
                      isDragging
                        ? "border-brand-green bg-brand-green/5"
                        : screenshot
                        ? "border-brand-border bg-brand-nested"
                        : "border-brand-border bg-brand-nested hover:border-brand-text-muted/20"
                    }`}
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileSelect}
                      accept="image/*"
                      className="hidden"
                    />
                    {screenshot ? (
                      <div className="space-y-2">
                        <img
                          src={screenshot}
                          alt="Chart Preview"
                          className="mx-auto max-h-24 rounded border border-brand-border"
                        />
                        <div className="flex items-center justify-center gap-2">
                          <span className="text-[10px] font-mono text-brand-text-muted truncate max-w-xs">
                            Base64 Image Loaded
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setScreenshot("");
                            }}
                            className="text-brand-red hover:text-brand-red/80 text-[10px] underline cursor-pointer"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center gap-1">
                        <Upload size={20} className="text-brand-text-muted/60 mb-1" />
                        <p className="text-[11px] text-brand-text-muted font-medium">
                          Drag & drop chart file, or <span className="text-brand-teal font-semibold">browse</span>
                        </p>
                        <p className="text-[9px] text-brand-text-muted/40">PNG, JPG, or WEBP formats supported</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-brand-border">
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="bg-brand-nested hover:bg-brand-card border border-brand-border text-brand-text-muted text-xs font-medium px-4 py-2.5 rounded cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-[#02C076] hover:bg-[#02C076]/90 text-[#0B0E11] text-xs font-sans font-semibold px-5 py-2.5 rounded flex items-center gap-2 cursor-pointer"
              >
                <Check size={16} />
                {editingEntry ? "Update Journal File" : "Commit to Journal"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* CHRONOLOGICAL ENTRIES GRAPHICS LIST */}
      <div className="space-y-4">
        {chronologicalEntries.length === 0 ? (
          <div className="bg-brand-card border border-brand-border rounded p-12 text-center">
            <BookOpen size={40} className="mx-auto text-brand-text-muted/50 mb-3" />
            <p className="text-sm font-semibold text-brand-text">No journal files active</p>
            <p className="text-xs text-brand-text-muted max-w-md mx-auto mt-1">
              Your trading log is currently empty. Click &quot;New Journal Entry&quot; above to commit your very first execution.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {chronologicalEntries.map((entry) => {
              const profitLossVal = entry.profitLoss;
              const isProfit = profitLossVal > 0;
              const isLoss = profitLossVal < 0;

              return (
                <div
                  key={entry.id}
                  className="bg-brand-card border border-brand-border rounded overflow-hidden hover:border-brand-teal/40 transition-all duration-200 shadow-sm flex flex-col justify-between"
                >
                  {/* Top Bar Header */}
                  <div className="p-4 border-b border-brand-border bg-[#0B0E11]/30 flex justify-between items-center">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-brand-text font-sans">
                          {entry.instrument}
                        </span>
                        <span className="text-[10px] bg-[#2B3139] text-[#848E9C] px-1.5 py-0.5 rounded font-mono uppercase">
                          {entry.account}
                        </span>
                      </div>
                      <p className="text-[10px] text-brand-text-muted font-mono mt-1">
                        {new Date(entry.date).toLocaleString(undefined, {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <span
                        className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded ${
                          entry.result === "win"
                            ? "bg-brand-green/20 text-brand-green"
                            : entry.result === "loss"
                            ? "bg-brand-red/20 text-brand-red"
                            : "bg-[#2B3139] text-[#848E9C]"
                        }`}
                      >
                        {entry.result}
                      </span>
                      <h4
                        className={`font-semibold font-mono text-sm ${
                          isProfit ? "text-brand-green" : isLoss ? "text-brand-red" : "text-brand-text-muted"
                        }`}
                      >
                        {isProfit ? "+" : ""}
                        ${profitLossVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </h4>
                    </div>
                  </div>

                  {/* Body Confluences */}
                  <div className="p-5 space-y-4">
                    {/* Execution details strip */}
                    <div className="grid grid-cols-4 gap-2 bg-brand-nested p-2.5 rounded border border-brand-border text-center text-[11px] font-mono">
                      <div>
                        <span className="block text-brand-text-muted/65 text-[9px] uppercase font-bold">Lot Size</span>
                        <span className="text-brand-text font-semibold">{entry.lotSize}</span>
                      </div>
                      <div>
                        <span className="block text-brand-text-muted/65 text-[9px] uppercase font-bold font-mono">Entry</span>
                        <span className="text-brand-text font-semibold">{entry.entryPrice}</span>
                      </div>
                      <div>
                        <span className="block text-brand-text-muted/65 text-[9px] uppercase font-bold font-mono">Exit</span>
                        <span className="text-brand-text font-semibold">{entry.exitPrice}</span>
                      </div>
                      <div>
                        <span className="block text-brand-text-muted/65 text-[9px] uppercase font-bold font-mono">Ratio</span>
                        <span className="text-brand-text font-semibold">
                          {entry.stopLoss && entry.takeProfit
                            ? `1:${Math.abs(
                                (entry.takeProfit - entry.entryPrice) / (entry.stopLoss - entry.entryPrice)
                              ).toFixed(1)}`
                            : "N/A"}
                        </span>
                      </div>
                    </div>

                    {/* SL/TP Details Banner if registered */}
                    {(entry.stopLoss || entry.takeProfit) && (
                      <div className="flex justify-between items-center text-[10px] font-mono px-3 py-1 bg-[#0B0E11]/40 rounded border border-brand-border/30">
                        {entry.stopLoss && (
                          <span className="text-brand-red/90">SL Threshold: {entry.stopLoss}</span>
                        )}
                        {entry.takeProfit && (
                          <span className="text-brand-green/90">TP Target: {entry.takeProfit}</span>
                        )}
                      </div>
                    )}

                    {/* Screenshot visual rendering inline if provided */}
                    {entry.screenshot && (
                      <div className="relative rounded overflow-hidden border border-brand-border group hover:border-[#2EBDD3]/40 transition duration-200">
                        <img
                          referrerPolicy="no-referrer"
                          src={entry.screenshot}
                          alt={`${entry.instrument} analytical graph`}
                          className="w-full object-cover max-h-40"
                        />
                      </div>
                    )}

                    <div>
                      <span className="block text-[10px] font-mono text-brand-text-muted uppercase mb-1">
                        Rationalization & Notes
                      </span>
                      <p className="text-xs text-brand-text leading-relaxed font-sans line-clamp-3">
                        {entry.notes}
                      </p>
                    </div>
                  </div>

                  {/* Actions Section footer */}
                  <div className="px-4 py-3 border-t border-brand-border bg-[#0B0E11]/25 flex justify-between items-center">
                    <span className="text-[9px] text-[#848E9C] font-mono uppercase">
                      ID: {entry.id.slice(0, 10)}
                    </span>
                    <div className="flex gap-2 font-mono">
                      <button
                        onClick={() => handleOpenEdit(entry)}
                        className="bg-[#2B3139] hover:bg-[#2B3139]/80 transition border border-brand-border text-brand-text text-[10px] py-1 px-2.5 rounded cursor-pointer"
                      >
                        Modify File
                      </button>
                      <button
                        onClick={() => {
                          if (confirm("Are you sure you want to permanently delete this trade record? This resets associated summaries.")) {
                            onDeleteEntry(entry.id);
                          }
                        }}
                        className="bg-brand-nested border border-brand-border hover:border-brand-red/20 text-brand-text-muted hover:text-brand-red text-[10px] py-1 px-2.5 rounded hover:bg-brand-red/10 transition cursor-pointer"
                      >
                        Delete Record
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

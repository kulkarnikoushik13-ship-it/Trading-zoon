import React, { useState, useRef } from "react";
import { JournalEntry } from "../types";
import {
  Image as ImageIcon,
  Upload,
  Search,
  Filter,
  Trash2,
  Maximize2,
  Calendar,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Camera,
  X,
  Check,
  Plus,
  BookOpen,
} from "lucide-react";

interface ScreenshotsTabProps {
  entries: JournalEntry[];
  onEditEntry: (entry: JournalEntry) => void;
}

export default function ScreenshotsTab({ entries, onEditEntry }: ScreenshotsTabProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedEntryDetail, setSelectedEntryDetail] = useState<JournalEntry | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [resultFilter, setResultFilter] = useState<"ALL" | "WIN" | "LOSS">("ALL");
  const [instrumentFilter, setInstrumentFilter] = useState("ALL");

  // Form states for quick screenshot link
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [targetEntryId, setTargetEntryId] = useState("");
  const [screenshotBase64, setScreenshotBase64] = useState("");
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Extract unique instruments for filter dropdown
  const uniqueInstruments = Array.from(
    new Set(entries.map((e) => e.instrument.toUpperCase()))
  ).filter(Boolean);

  // Filter entries that have screenshots
  const screenshotEntries = entries.filter((entry) => {
    if (!entry.screenshot) return false;

    // Search query
    const matchesSearch =
      entry.instrument.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.notes.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.account.toLowerCase().includes(searchQuery.toLowerCase());

    // Result filter
    const matchesResult =
      resultFilter === "ALL" ||
      (resultFilter === "WIN" && entry.result === "win") ||
      (resultFilter === "LOSS" && entry.result === "loss");

    // Instrument filter
    const matchesInstrument =
      instrumentFilter === "ALL" || entry.instrument.toUpperCase() === instrumentFilter.toUpperCase();

    return matchesSearch && matchesResult && matchesInstrument;
  });

  // Collect entries that *do not* have screenshots yet for linking
  const entriesWithoutScreenshots = entries.filter((e) => !e.screenshot);

  // File parsing helpers
  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Please upload a valid image file.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setScreenshotBase64(e.target.result as string);
      }
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

  // Associate screenshot with the selected journal entry
  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetEntryId || !screenshotBase64) {
      alert("Please select a target trade and upload an image.");
      return;
    }

    const matchedEntry = entries.find((entry) => entry.id === targetEntryId);
    if (!matchedEntry) {
      alert("Selected trade entry could not be found.");
      return;
    }

    // Append notes if any specified, or preserve previous notes
    const updatedNotes = additionalNotes
      ? `${matchedEntry.notes}\n\n[Chart Annotation]: ${additionalNotes}`
      : matchedEntry.notes;

    const updatedEntry: JournalEntry = {
      ...matchedEntry,
      screenshot: screenshotBase64,
      notes: updatedNotes,
    };

    onEditEntry(updatedEntry);

    // Reset states
    setIsUploadOpen(false);
    setTargetEntryId("");
    setScreenshotBase64("");
    setAdditionalNotes("");
  };

  // Remove screenshot from journal entry
  const handleRemoveScreenshot = (entry: JournalEntry) => {
    if (confirm("Are you sure you want to decouple the chart screenshot from this trade?")) {
      const updatedEntry: JournalEntry = {
        ...entry,
        screenshot: undefined,
      };
      onEditEntry(updatedEntry);
      if (selectedEntryDetail?.id === entry.id) {
        setSelectedEntryDetail(null);
        setSelectedImage(null);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Tab Header with Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-brand-card border border-brand-border p-6 rounded-lg">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-brand-text font-sans sm:text-2xl flex items-center gap-2">
            <Camera size={24} className="text-brand-teal stroke-[2]" />
            Trade Screenshot Vault
          </h2>
          <p className="text-sm text-brand-text-muted">
            Interactive analytical gallery of chart screengrabs linked to recorded journal transactions.
          </p>
        </div>

        <button
          onClick={() => {
            setIsUploadOpen(true);
            // Default to first entry in unlinked list if available
            if (entriesWithoutScreenshots.length > 0) {
              setTargetEntryId(entriesWithoutScreenshots[0].id);
            }
          }}
          className="bg-brand-teal hover:bg-brand-teal/90 transition text-brand-bg font-sans font-semibold text-xs px-4 py-2.5 rounded flex items-center gap-2 cursor-pointer ml-auto sm:ml-0"
        >
          <Plus size={16} />
          Attach Chart Screengrab
        </button>
      </div>

      {/* DETACHED UPLOAD DIALOGUE ACCORDION */}
      {isUploadOpen && (
        <div className="bg-brand-card border border-brand-teal/30 p-6 rounded shadow-xl animate-in fade-in zoom-in-95 duration-200">
          <div className="flex justify-between items-center border-b border-brand-border pb-3 mb-5">
            <h3 className="font-sans font-semibold text-brand-text text-sm flex items-center gap-2">
              <Upload size={16} className="text-brand-teal" />
              Link Graphic Screenshot to Particular Trade
            </h3>
            <button
              onClick={() => setIsUploadOpen(false)}
              className="text-brand-text-muted hover:text-brand-text p-1 rounded bg-[#0B0E11]/40 border border-brand-border cursor-pointer animate-none"
            >
              <X size={14} />
            </button>
          </div>

          {entriesWithoutScreenshots.length === 0 ? (
            <div className="p-6 text-center border border-dashed border-brand-border bg-brand-nested rounded">
              <BookOpen size={32} className="mx-auto text-brand-text-muted/40 mb-2" />
              <p className="text-xs text-brand-text font-medium">All active trades in journal already have screenshots!</p>
              <p className="text-[10px] text-brand-text-muted mt-1">
                To replace a screenshot, expand that particular card below in the vault, or modify the entry in the Trade Journal tab.
              </p>
            </div>
          ) : (
            <form onSubmit={handleUploadSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-mono text-brand-text-muted uppercase mb-1">
                    Select Target Particular Trade *
                  </label>
                  <select
                    value={targetEntryId}
                    onChange={(e) => setTargetEntryId(e.target.value)}
                    className="w-full bg-[#0B0E11] border border-brand-border rounded p-2.5 text-xs text-brand-text focus:outline-none focus:border-brand-teal"
                  >
                    {entriesWithoutScreenshots.map((item) => {
                      const dt = new Date(item.date).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                      });
                      const dir = item.profitLoss >= 0 ? "Win" : "Loss";
                      return (
                        <option key={item.id} value={item.id}>
                          {dt} - {item.instrument} [{dir}: ${Math.abs(item.profitLoss).toFixed(0)}] ({item.account})
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono text-brand-text-muted uppercase mb-1">
                    Chart Annotations / Key Learnings (Optional)
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Enter trend confluences studied on this screenshot, pattern setup triggers, indicators, or error reflections..."
                    value={additionalNotes}
                    onChange={(e) => setAdditionalNotes(e.target.value)}
                    className="w-full bg-brand-nested border border-brand-border rounded p-2.5 text-xs text-brand-text focus:outline-none focus:border-brand-teal"
                  />
                </div>
              </div>

              {/* Document Drag & Drop */}
              <div className="space-y-4">
                <label className="block text-xs font-mono text-brand-text-muted uppercase mb-1">
                  Upload screenshot jpeg, png, webp *
                </label>
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border rounded p-6 text-center cursor-pointer transition-all ${
                    isDragging
                      ? "border-brand-teal bg-brand-teal/5 animate-pulse"
                      : screenshotBase64
                      ? "border-brand-border bg-brand-nested"
                      : "border-brand-border bg-brand-nested hover:border-brand-teal/30"
                  }`}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    accept="image/*"
                    className="hidden"
                  />
                  {screenshotBase64 ? (
                    <div className="space-y-3">
                      <img
                        src={screenshotBase64}
                        alt="Preview upload"
                        className="mx-auto max-h-32 rounded border border-brand-border shadow"
                      />
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-[10px] font-mono text-brand-text-muted truncate max-w-[200px]">
                          Chart screenshot ready
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setScreenshotBase64("");
                          }}
                          className="text-brand-red hover:text-brand-red/80 text-[10px] underline"
                        >
                          Clear
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-1.5 py-4">
                      <Upload size={24} className="text-brand-text-muted/50 mb-1" />
                      <p className="text-xs text-brand-text font-medium">
                        Drag & drop screenshot chart, or <span className="text-brand-teal">browse</span>
                      </p>
                      <p className="text-[10px] text-brand-text-muted/50">PNG, JPG or WEBP from trading view or MT4/5</p>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => {
                      setIsUploadOpen(false);
                      setScreenshotBase64("");
                      setAdditionalNotes("");
                    }}
                    className="bg-[#0B0E11] hover:bg-brand-nested transition border border-brand-border text-brand-text-muted text-xs font-medium px-4 py-2 rounded cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!screenshotBase64 || !targetEntryId}
                    className={`text-xs font-sans font-semibold px-4 py-2 rounded flex items-center gap-1.5 transition ${
                      screenshotBase64 && targetEntryId
                        ? "bg-brand-teal hover:bg-brand-teal/90 text-brand-bg cursor-pointer"
                        : "bg-brand-nested text-brand-text-muted border border-brand-border cursor-not-allowed"
                    }`}
                  >
                    <Check size={14} />
                    Attach to Trade
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      )}

      {/* FILTER & SEARCH ROW */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-brand-card border border-brand-border p-4 rounded-lg">
        {/* Search Input */}
        <div className="relative w-full sm:max-w-xs">
          <span className="absolute left-3 top-2.5 text-brand-text-muted">
            <Search size={14} />
          </span>
          <input
            type="text"
            placeholder="Search by symbol or annotations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-brand-nested border border-brand-border placeholder-brand-text-muted text-brand-text rounded pl-9 pr-3 py-2 text-xs focus:outline-none focus:border-brand-teal"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-2.5 text-brand-text-muted hover:text-brand-text cursor-pointer"
            >
              <X size={12} />
            </button>
          )}
        </div>

        {/* Action Filters Row */}
        <div className="flex gap-3 items-center flex-wrap w-full sm:w-auto sm:justify-end">
          {/* Instrument select dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-brand-text-muted uppercase tracking-wider hidden md:inline">
              Symbol:
            </span>
            <select
              value={instrumentFilter}
              onChange={(e) => setInstrumentFilter(e.target.value)}
              className="bg-[#0B0E11] border border-brand-border text-brand-text text-xs rounded px-2.5 py-1.5 focus:outline-none focus:border-brand-teal cursor-pointer"
            >
              <option value="ALL">All Symbols</option>
              {uniqueInstruments.map((inst) => (
                <option key={inst} value={inst}>
                  {inst}
                </option>
              ))}
            </select>
          </div>

          {/* Result quick checkboxes/buttons */}
          <div className="flex bg-[#0B0E11] p-1 rounded border border-brand-border">
            {(["ALL", "WIN", "LOSS"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setResultFilter(mode)}
                className={`px-3 py-1 text-[10px] font-sans font-semibold rounded cursor-pointer transition ${
                  resultFilter === mode
                    ? mode === "WIN"
                      ? "bg-brand-green/20 text-brand-green"
                      : mode === "LOSS"
                      ? "bg-brand-red/20 text-brand-red"
                      : "bg-[#2B3139] text-brand-teal font-bold"
                    : "text-brand-text-muted hover:text-brand-text"
                }`}
              >
                {mode === "ALL" ? "All Grid" : mode === "WIN" ? "Wins Only" : "Losses Only"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* DETAILED SCREENSHOT GALLERY GRID */}
      {screenshotEntries.length === 0 ? (
        <div className="bg-brand-card border border-brand-border rounded p-16 text-center">
          <ImageIcon size={44} className="mx-auto text-brand-text-muted/40 mb-3" />
          <p className="text-sm font-semibold text-brand-text text-sans">No analytical screengrabs matching</p>
          <p className="text-xs text-brand-text-muted max-w-sm mx-auto mt-2 leading-relaxed">
            {entries.length === 0
              ? 'Your Trade Journal is currently empty. Make sure you log a trade with a screenshot image first, or click "Attach Chart Screengrab" above!'
              : "No screenshots match your selected filters. Try broadening your criteria or reset the search query."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {screenshotEntries.map((entry) => {
            const isProfit = entry.profitLoss >= 0;
            const entryDate = new Date(entry.date).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
              year: "numeric",
            });

            return (
              <div
                key={entry.id}
                className={`bg-brand-card border rounded overflow-hidden flex flex-col justify-between hover:border-brand-teal/40 hover:-translate-y-0.5 transition duration-200 group relative ${
                  isProfit ? "border-brand-green/15" : "border-brand-red/15"
                }`}
              >
                {/* Image Wrap */}
                <div className="relative aspect-video overflow-hidden bg-[#0B0E11] border-b border-brand-border">
                  <img
                    referrerPolicy="no-referrer"
                    src={entry.screenshot}
                    alt={`${entry.instrument} trading chart`}
                    className="w-full h-full object-cover group-hover:scale-102 transition duration-300"
                  />
                  {/* Overlay badge on hover or absolute */}
                  <div className="absolute top-3 left-3 flex gap-2">
                    <span className="text-[9px] uppercase font-bold tracking-widest px-2 py-0.5 rounded bg-brand-bg/85 font-mono text-brand-text border border-brand-border">
                      {entry.instrument}
                    </span>
                    <span
                      className={`text-[9px] uppercase font-bold tracking-widest px-2 py-0.5 rounded ${
                        entry.result === "win"
                          ? "bg-brand-green text-[#0B0E11]"
                          : entry.result === "loss"
                          ? "bg-brand-red text-white"
                          : "bg-brand-nested text-brand-text"
                      }`}
                    >
                      {entry.result.toUpperCase()}
                    </span>
                  </div>

                  {/* Profit overlay badge */}
                  <div className="absolute bottom-3 right-3 bg-brand-bg/90 px-2 py-1 rounded border border-brand-border font-mono text-xs font-semibold">
                    <span className={isProfit ? "text-brand-green" : "text-brand-red"}>
                      {isProfit ? "+" : "-"}
                      ${Math.abs(entry.profitLoss).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedImage(entry.screenshot || null);
                      setSelectedEntryDetail(entry);
                    }}
                    className="absolute inset-0 bg-brand-bg/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all duration-200 cursor-pointer text-white"
                  >
                    <div className="bg-[#0B0E11]/80 hover:bg-[#0B0E11] p-2.5 rounded-full border border-brand-border transform scale-90 group-hover:scale-100 transition duration-200">
                      <Maximize2 size={16} className="text-brand-teal" />
                    </div>
                  </button>
                </div>

                {/* Annotation Text */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex justify-between items-center text-[10px] font-mono text-brand-text-muted">
                      <span>{entryDate}</span>
                      <span>{entry.account}</span>
                    </div>

                    <p className="text-xs text-brand-text line-clamp-3 mt-2 leading-relaxed italic pr-1">
                      &quot;{entry.notes.replace(/\[Chart Annotation\]:?.*/s, "").trim() || "No core trade notes logged."}&quot;
                    </p>

                    {entry.notes.includes("[Chart Annotation]") && (
                      <div className="mt-2.5 border-t border-brand-border/40 pt-2 bg-brand-nested/50 p-2 rounded">
                        <span className="text-[9px] font-mono font-bold text-brand-teal block uppercase tracking-wider">
                          Chart Annotation
                        </span>
                        <p className="text-[11px] text-[#EAECEF] mt-0.5 line-clamp-2">
                          {entry.notes.substring(entry.notes.indexOf("[Chart Annotation]") + 18).replace(/^:\s*/, "").trim()}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Actions Column footer */}
                  <div className="flex justify-between items-center pt-3 border-t border-brand-border/60">
                    <div className="text-[10px] text-brand-text-muted font-mono">
                      Entry: <span className="text-[#EAECEF]">{entry.entryPrice}</span> | Exit:{" "}
                      <span className="text-[#EAECEF]">{entry.exitPrice}</span>
                    </div>

                    <div className="flex gap-1.5">
                      <button
                        onClick={() => {
                          setSelectedImage(entry.screenshot || null);
                          setSelectedEntryDetail(entry);
                        }}
                        className="text-brand-teal hover:text-brand-teal/80 text-[11px] font-medium hover:underline cursor-pointer flex items-center gap-1 font-sans"
                      >
                        Enlarge Chart
                      </button>
                      <span className="text-brand-border">|</span>
                      <button
                        onClick={() => handleRemoveScreenshot(entry)}
                        className="text-brand-red/70 hover:text-brand-red text-[11px] font-medium cursor-pointer"
                        title="Decouple image from trade log"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* DETAILED ENLARGED LIGHTBOX MODAL WITH GRID SPECS */}
      {selectedImage && selectedEntryDetail && (
        <div className="fixed inset-0 bg-[#0B0E11]/95 z-55 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-brand-card border border-brand-border rounded-lg max-w-5xl w-full max-h-[92vh] flex flex-col md:flex-row overflow-hidden shadow-2xl relative">
            <button
              onClick={() => {
                setSelectedImage(null);
                setSelectedEntryDetail(null);
              }}
              className="absolute top-4 right-4 text-brand-text-muted hover:text-white p-1.5 rounded-full bg-brand-bg/80 border border-brand-border hover:border-brand-teal transition z-10 cursor-pointer"
            >
              <X size={18} />
            </button>

            {/* Graphic Container (Span Left) */}
            <div className="flex-1 bg-[#06080A] flex items-center justify-center p-6 border-b md:border-b-0 md:border-r border-brand-border">
              <img
                src={selectedImage}
                alt="Enlarged chart view"
                className="max-h-[50vh] md:max-h-[80vh] max-w-full object-contain rounded border border-brand-border/20"
              />
            </div>

            {/* Ledger Particular Spec details column (Span Right) */}
            <div className="w-full md:w-80 p-6 flex flex-col justify-between bg-brand-card overflow-y-auto max-h-[40vh] md:max-h-[82vh]">
              <div className="space-y-6">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-brand-text font-sans">
                      {selectedEntryDetail.instrument}
                    </span>
                    <span className="text-xs bg-[#2B3139] text-[#848E9C] px-2 py-0.5 rounded font-mono uppercase">
                      {selectedEntryDetail.account}
                    </span>
                  </div>
                  <p className="text-xs text-brand-text-muted font-mono mt-1">
                    Executed: {new Date(selectedEntryDetail.date).toLocaleString()}
                  </p>
                </div>

                {/* Main outcome status card */}
                <div className={`p-4 rounded border text-center ${
                  selectedEntryDetail.profitLoss >= 0
                    ? "bg-brand-green/5 border-brand-green/20"
                    : "bg-brand-red/5 border-brand-red/20"
                }`}>
                  <span className="text-[10px] text-brand-text-muted font-mono tracking-widest uppercase block">
                    Trade Net Yield
                  </span>
                  <p className={`text-2xl font-bold font-mono mt-1 ${
                    selectedEntryDetail.profitLoss >= 0 ? "text-brand-green" : "text-brand-red"
                  }`}>
                    {selectedEntryDetail.profitLoss >= 0 ? "+" : "-"}
                    ${Math.abs(selectedEntryDetail.profitLoss).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                  <span className="text-[10px] text-[#848E9C] font-mono mt-1 block">
                    Result Status: {selectedEntryDetail.result.toUpperCase()}
                  </span>
                </div>

                {/* Math execution specifics */}
                <div className="space-y-2 border-t border-b border-brand-border py-4 font-mono text-xs">
                  <div className="flex justify-between">
                    <span className="text-brand-text-muted">Lot Size:</span>
                    <span className="text-brand-text font-semibold">{selectedEntryDetail.lotSize}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-brand-text-muted">Entry Price:</span>
                    <span className="text-brand-text font-semibold">{selectedEntryDetail.entryPrice}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-brand-text-muted">Exit Price:</span>
                    <span className="text-brand-text font-semibold">{selectedEntryDetail.exitPrice}</span>
                  </div>
                  {selectedEntryDetail.stopLoss && (
                    <div className="flex justify-between">
                      <span className="text-brand-text-muted">Stop Loss:</span>
                      <span className="text-brand-red font-semibold">{selectedEntryDetail.stopLoss}</span>
                    </div>
                  )}
                  {selectedEntryDetail.takeProfit && (
                    <div className="flex justify-between">
                      <span className="text-brand-text-muted">Take Profit:</span>
                      <span className="text-brand-green font-semibold">{selectedEntryDetail.takeProfit}</span>
                    </div>
                  )}
                </div>

                {/* Notes readout */}
                <div className="space-y-2">
                  <span className="text-xs font-mono text-brand-text-muted uppercase tracking-wider block">
                    Journal Notes
                  </span>
                  <div className="text-xs text-brand-text bg-brand-nested p-3 rounded border border-brand-border/60 max-h-48 overflow-y-auto leading-relaxed">
                    <p className="whitespace-pre-wrap">
                      {selectedEntryDetail.notes.replace(/\[Chart Annotation\]:?.*/s, "").trim() || "No core notes logged for this entry."}
                    </p>

                    {selectedEntryDetail.notes.includes("[Chart Annotation]") && (
                      <div className="mt-4 border-t border-brand-border/50 pt-3">
                        <span className="text-[10px] font-mono font-bold text-brand-teal block uppercase tracking-wider mb-1">
                          Chart Annotation
                        </span>
                        <p className="text-brand-text-muted italic">
                          {selectedEntryDetail.notes.substring(selectedEntryDetail.notes.indexOf("[Chart Annotation]") + 18).replace(/^:\s*/, "").trim()}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-6 mt-6 border-t border-brand-border">
                <button
                  onClick={() => {
                    setSelectedImage(null);
                    setSelectedEntryDetail(null);
                  }}
                  className="w-full text-center bg-[#0B0E11] hover:bg-brand-nested transition border border-brand-border text-brand-text font-sans font-medium text-xs py-2 rounded focus:outline-none cursor-pointer"
                >
                  Close Inspect Drawer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

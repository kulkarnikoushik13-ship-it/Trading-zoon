import React, { useState } from "react";
import { UserProfile, JournalEntry, InstrumentConfig, SUPPORTED_INSTRUMENTS, BrokerConnection, PropFirmPayout } from "../types";
import {
  User,
  Settings,
  Plus,
  Trash2,
  Download,
  Send,
  FileSpreadsheet,
  FileJson,
  Mail,
  CheckCircle,
  HelpCircle,
  Sparkles,
  Terminal,
  ShieldCheck,
  RefreshCw,
  Sliders,
  DollarSign,
  Briefcase,
  Layers,
  ArrowRight,
  Globe,
  PlusCircle,
  RotateCcw,
  Cloud,
  Lock,
  CloudLightning,
  Database,
  Copy,
  Check,
  Key,
  LogOut,
} from "lucide-react";
import { supabase, SUPABASE_SQL_SETUP_INSTRUCTIONS } from "../supabase";

interface SettingsTabProps {
  profile: UserProfile;
  setProfile: (profile: UserProfile) => void;
  instruments: InstrumentConfig[];
  setInstruments: (instruments: InstrumentConfig[]) => void;
  entries: JournalEntry[];
  triggerStaticToast: (title: string, details: string, type: "info" | "success" | "warning") => void;
  sessionUser: any;
  setSessionUser: (user: any) => void;
  autoSync: boolean;
  setAutoSync: (val: boolean) => void;
  isSyncingCloud: boolean;
  triggerPushCloud: (userId?: string) => Promise<void>;
  triggerPullCloud: (userId?: string) => Promise<void>;
  notepadText: string;
}

export default function SettingsTab({
  profile,
  setProfile,
  instruments,
  setInstruments,
  entries,
  triggerStaticToast,
  sessionUser,
  setSessionUser,
  autoSync,
  setAutoSync,
  isSyncingCloud,
  triggerPushCloud,
  triggerPullCloud,
  notepadText,
}: SettingsTabProps) {
  // Local Profile edit states
  const [username, setUsername] = useState(profile.username);
  const [avatarInitial, setAvatarInitial] = useState(profile.avatarInitial);
  const [defaultAccount, setDefaultAccount] = useState(profile.defaultAccount);
  const [email, setEmail] = useState(profile.email);
  const [tradingGoal, setTradingGoal] = useState(profile.tradingGoal);
  const [avgRiskPerTrade, setAvgRiskPerTrade] = useState(profile.avgRiskPerTrade);

  // Supabase Authentication Form states
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [showSqlSetup, setShowSqlSetup] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authEmail.trim() || !authPassword.trim()) {
      alert("Please enter both email and password!");
      return;
    }
    if (authPassword.length < 6) {
      alert("Password must be at least 6 characters.");
      return;
    }

    setAuthLoading(true);
    try {
      if (authMode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email: authEmail.trim(),
          password: authPassword.trim(),
        });
        if (error) throw error;
        
        triggerStaticToast(
          "Account Initialized",
          `Created account successfully! If emails need verification, check your inbox.`,
          "success"
        );

        if (data.session?.user) {
          setSessionUser(data.session.user);
          await triggerPushCloud(data.session.user.id);
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: authEmail.trim(),
          password: authPassword.trim(),
        });
        if (error) throw error;

        triggerStaticToast(
          "Cloud Connected",
          `Logged in successfully as ${data.user?.email}. Pulling data...`,
          "success"
        );
        
        if (data.user) {
          setSessionUser(data.user);
          await triggerPullCloud(data.user.id);
        }
      }
    } catch (err: any) {
      console.error("Supabase Auth error:", err);
      alert(err.message || "Authentication rejected. Double-check your network or keys.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setSessionUser(null);
      triggerStaticToast("Session Closed", "Safely unlinked from Supabase Cloud.", "info");
    } catch (err: any) {
      alert(err.message || "Failed to disconnect.");
    }
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SETUP_INSTRUCTIONS);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  // New custom instrument states
  const [newSymbol, setNewSymbol] = useState("");
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState<"forex" | "metal" | "crypto" | "indices">("forex");
  const [newPipSize, setNewPipSize] = useState("0.0001");
  const [newContractSize, setNewContractSize] = useState("100000");

  // Export & Dispatch state indicators
  const [isDispatching, setIsDispatching] = useState(false);
  const [dispatchLogs, setDispatchLogs] = useState<string[]>([]);
  const [destinationEmail, setDestinationEmail] = useState(profile.email || "investor@firm.com");
  const [customSubject, setCustomSubject] = useState("Pixel.X High-Frequency Trading Log Export");
  const [exportFormat, setExportFormat] = useState<"JSON" | "CSV">("CSV");

  // Handle Profile Update
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !avatarInitial.trim()) {
      alert("Username and Initials are required.");
      return;
    }
    
    const updatedProfile: UserProfile = {
      username: username.trim(),
      avatarInitial: avatarInitial.trim().toUpperCase().substring(0, 2),
      defaultAccount: defaultAccount.trim(),
      email: email.trim(),
      tradingGoal: tradingGoal.trim(),
      avgRiskPerTrade: Number(avgRiskPerTrade) || 1.0,
    };

    setProfile(updatedProfile);
    triggerStaticToast(
      "Profile Synchronized",
      `System changes saved for ${updatedProfile.username}. Avatar set to ${updatedProfile.avatarInitial}`,
      "success"
    );
  };

  // Add custom instrument
  const handleAddInstrument = (e: React.FormEvent) => {
    e.preventDefault();
    
    const cleanSymObj = newSymbol.toUpperCase().replace(/\s/g, "").trim();
    if (!cleanSymObj || !newName.trim()) {
      alert("Instrument Symbol and Descriptor Name are required!");
      return;
    }

    // Check duplicate
    if (instruments.some((inst) => inst.symbol === cleanSymObj)) {
      alert(`An instrument with symbol "${cleanSymObj}" already exists under configurations!`);
      return;
    }

    const pipVal = parseFloat(newPipSize);
    const contractVal = parseFloat(newContractSize);

    if (isNaN(pipVal) || pipVal <= 0 || isNaN(contractVal) || contractVal <= 0) {
      alert("Pip Size and Contract Size must be standard positive numerical integers!");
      return;
    }

    const newInst: InstrumentConfig = {
      symbol: cleanSymObj,
      name: newName.trim(),
      type: newType,
      pipSize: pipVal,
      contractSize: contractVal,
    };

    setInstruments([...instruments, newInst]);
    triggerStaticToast(
      "Instrument Created",
      `Newly loaded asset pair "${cleanSymObj}" is now available in trade size calculations and dropdown systems.`,
      "success"
    );

    // Clear form
    setNewSymbol("");
    setNewName("");
    setNewPipSize("0.0001");
    setNewContractSize("100000");
  };

  // Delete dynamic instrument
  const handleDeleteInstrument = (sym: string) => {
    if (instruments.length <= 1) {
      alert("At least one instrument configuration is required to maintain core ledger calculations.");
      return;
    }
    const filtered = instruments.filter((inst) => inst.symbol !== sym);
    setInstruments(filtered);
    triggerStaticToast(
      "Specification Removed",
      `Deleted trading specifications and default pip values for ${sym}.`,
      "info"
    );
  };

  // Reset to static defaults
  const handleResetInstruments = () => {
    if (confirm("Are you sure you want to restore the platform default instruments? Any added custom tickers will be deleted.")) {
      setInstruments(SUPPORTED_INSTRUMENTS);
      triggerStaticToast(
        "Instruments Restored",
        "Wiped custom listings and restored default specifications parameters successfully.",
        "info"
      );
    }
  };

  // Convert Entries to CSV String
  const convertEntriesToCSV = (entriesList: JournalEntry[]) => {
    if (entriesList.length === 0) return "";
    const headers = [
      "ID",
      "Date",
      "Instrument",
      "Account",
      "EntryPrice",
      "ExitPrice",
      "LotSize",
      "StopLoss",
      "TakeProfit",
      "Result",
      "ProfitLossValue",
      "Notes",
    ];

    const rows = entriesList.map((e) => [
      e.id,
      e.date,
      e.instrument,
      e.account,
      e.entryPrice,
      e.exitPrice,
      e.lotSize,
      e.stopLoss || "N/A",
      e.takeProfit || "N/A",
      e.result,
      e.profitLoss,
      `"${e.notes.replace(/"/g, '""').replace(/\n/g, " ")}"` // escape quotes and newlines safely
    ]);

    return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  };

  // Standard downloader trigger
  const triggerDownload = (format: "JSON" | "CSV") => {
    let dataStr = "";
    let mimeType = "text/plain";
    let filename = `PIXEL_EXPORT_${new Date().toISOString().substring(0, 10)}`;

    if (format === "JSON") {
      dataStr = JSON.stringify({
        profile: {
          username,
          email,
          defaultAccount,
          avgRiskPerTrade,
          tradingGoal
        },
        instrumentsCount: instruments.length,
        entriesCount: entries.length,
        timeDispatched: new Date().toISOString(),
        entries: entries,
      }, null, 2);
      mimeType = "application/json";
      filename += ".json";
    } else {
      dataStr = convertEntriesToCSV(entries);
      if (!dataStr) {
        alert("Your journal contains zero trade entries to compile into CSV!");
        return;
      }
      mimeType = "text/csv";
      filename += ".csv";
    }

    const blob = new Blob([dataStr], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    triggerStaticToast(
      `File Exported: ${format}`,
      `Successfully compiled and downloaded local file: ${filename}`,
      "success"
    );
  };

  // Fake network transmit engine simulator
  const runSendLogsDemo = (format: "JSON" | "CSV") => {
    if (entries.length === 0) {
      alert("No trade transaction logs exist to compile and send!");
      return;
    }

    setIsDispatching(true);
    setDispatchLogs([]);

    const payloadSize = format === "JSON" 
      ? (JSON.stringify(entries).length / 1024).toFixed(2)
      : (convertEntriesToCSV(entries).length / 1024).toFixed(2);

    const logSteps = [
      `Initializing Pixel.X Secure Transmit protocol...`,
      `Validating credential hash for profile ID ${profile.username}...`,
      `Encoding data ledger size of ${entries.length} entries into ${format} stream (${payloadSize} KB)...`,
      `Establishing outbound TLS v1.3 stream to SMTP proxy on smtp.pixel.io:465`,
      `Handshake accepted by mail server with cipher security keys ECDHE-RSA...`,
      `Bundling dynamic payload attachment: PIXEL_EXPORT_${new Date().toISOString().substring(0, 10)}.${format.toLowerCase()}`,
      `Authenticating secure sender signature for verified account [${profile.username}]...`,
      `Transmitting package mail header: "${customSubject}" to destination [${destinationEmail}]`,
      `Outbound queue processed: 100% of packets transmitted successfully!`,
      `Dispatch completed. Server response: 250 OK Message accepted for delivery.`,
    ];

    let currentLogIndex = 0;
    const interval = setInterval(() => {
      if (currentLogIndex < logSteps.length) {
        const nextLogStr = `[${new Date().toLocaleTimeString()}] ${logSteps[currentLogIndex]}`;
        setDispatchLogs((prev) => [...prev, nextLogStr]);
        currentLogIndex++;
      } else {
        clearInterval(interval);
        setIsDispatching(false);
        triggerStaticToast(
          "Ledger Dispatched",
          `Full trade ledger successfully exported as ${format} and transmitted to ${destinationEmail}.`,
          "success"
        );
      }
    }, 450); // delay step releases
  };

  return (
    <div className="space-y-6">
      {/* Tab Header with Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-brand-card border border-brand-border p-6 rounded-lg">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-brand-text font-sans sm:text-2xl flex items-center gap-2">
            <Settings size={24} className="text-brand-teal stroke-[2]" />
            Terminal Settings Desk
          </h2>
          <p className="text-sm text-brand-text-muted">
            Customize trading profiles, introduce custom assets values, and dispatch high-frequency journal transcripts securely.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Profile Card & Customizer (Col Span 2) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Section 1: User Profile Customizer */}
          <div className="bg-brand-card border border-brand-border p-6 rounded-lg space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-brand-text flex items-center gap-2 font-mono">
              <User size={16} className="text-brand-teal" />
              1. Profile Settings
            </h3>
            <p className="text-xs text-brand-text-muted">
              Configure your terminal identities, default prop trading margins, and metadata.
            </p>

            <form onSubmit={handleSaveProfile} className="space-y-4 pt-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-brand-text-muted uppercase mb-1">
                    Trader Handle (Username) *
                  </label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-brand-nested border border-brand-border rounded p-2.5 text-xs text-brand-text focus:outline-none focus:border-brand-teal font-medium"
                    placeholder="e.g. Bullish_Wolf"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-mono text-brand-text-muted uppercase mb-1">
                      Initials (Avatar) *
                    </label>
                    <input
                      type="text"
                      maxLength={2}
                      required
                      value={avatarInitial}
                      onChange={(e) => setAvatarInitial(e.target.value)}
                      className="w-full bg-brand-nested border border-brand-border rounded p-2.5 text-xs text-brand-teal focus:outline-none focus:border-brand-teal font-sans uppercase font-black text-center"
                      placeholder="TR"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-brand-text-muted uppercase mb-1">
                      Avg Risk % / Trade
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      required
                      value={avgRiskPerTrade}
                      onChange={(e) => setAvgRiskPerTrade(parseFloat(e.target.value) || 1.0)}
                      className="w-full bg-brand-nested border border-brand-border rounded p-2.5 text-xs text-brand-text font-mono focus:outline-none focus:border-brand-teal"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-brand-text-muted uppercase mb-1">
                    Verified Security Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-brand-nested border border-brand-border rounded p-2.5 text-xs text-brand-text focus:outline-none focus:border-brand-teal"
                    placeholder="email@partner-prop.com"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-brand-text-muted uppercase mb-1">
                    Default Active Trading Account
                  </label>
                  <input
                    type="text"
                    value={defaultAccount}
                    onChange={(e) => setDefaultAccount(e.target.value)}
                    className="w-full bg-brand-nested border border-brand-border rounded p-2.5 text-xs text-brand-text focus:outline-none focus:border-brand-teal"
                    placeholder="e.g. My Live FTMO, personal challenge"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-brand-text-muted uppercase mb-1">
                  Active Trading Target or Philosophical Slogan
                </label>
                <input
                  type="text"
                  value={tradingGoal}
                  onChange={(e) => setTradingGoal(e.target.value)}
                  className="w-full bg-brand-nested border border-brand-border rounded p-2.5 text-xs text-brand-text focus:outline-none focus:border-brand-teal"
                  placeholder="e.g. Steady compounding. Let the trade unfold. No rushing out."
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="bg-[#02C076] hover:bg-[#02C076]/90 font-sans font-medium text-xs text-[#0B0E11] px-4.5 py-2.5 rounded transition cursor-pointer flex items-center gap-2"
                >
                  <ShieldCheck size={14} />
                  Save Profile Credentials
                </button>
              </div>
            </form>
          </div>

          {/* Section 2: Instrument Customizer Manager */}
          <div className="bg-brand-card border border-brand-border p-6 rounded-lg space-y-4">
            <div className="flex justify-between items-center flex-wrap gap-2">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-brand-text flex items-center gap-2 font-mono">
                  <Sliders size={16} className="text-brand-teal" />
                  2. Customize Trading Instruments
                </h3>
                <p className="text-xs text-brand-text-muted mt-1">
                  Define symbols, pip structures, and contract sizes to drive accuracy during positions sizing calculations.
                </p>
              </div>

              <button
                type="button"
                onClick={handleResetInstruments}
                className="px-3 py-1.5 text-[10px] uppercase font-mono border border-brand-border hover:border-brand-teal bg-[#0B0E11] text-brand-text-muted hover:text-brand-text rounded transition flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw size={12} />
                Reset Defaults
              </button>
            </div>

            {/* Sub-form: Add Custom Symbol */}
            <form onSubmit={handleAddInstrument} className="bg-brand-nested border border-brand-border p-4 rounded-lg space-y-4">
              <span className="text-[10px] font-mono font-bold text-[#EAECEF] uppercase tracking-wider block">
                + Provision New Asset Pair specifications
              </span>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-[9px] font-mono text-brand-text-muted uppercase mb-1">
                    Symbol (e.g. USOIL) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Symbol"
                    value={newSymbol}
                    onChange={(e) => setNewSymbol(e.target.value)}
                    className="w-full bg-brand-card border border-brand-border rounded p-2 text-xs text-[#EAECEF] uppercase font-mono tracking-wide focus:outline-none focus:border-brand-teal"
                  />
                </div>

                <div className="col-span-2 md:col-span-1">
                  <label className="block text-[9px] font-mono text-brand-text-muted uppercase mb-1">
                    Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="USD Crude Oil"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full bg-brand-card border border-brand-border rounded p-2 text-xs text-brand-text focus:outline-none focus:border-brand-teal"
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-mono text-brand-text-muted uppercase mb-1">
                    Type
                  </label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as any)}
                    className="w-full bg-brand-card border border-brand-border rounded p-1.5 text-xs text-brand-text focus:outline-none focus:border-brand-teal cursor-pointer"
                  >
                    <option value="forex">Forex</option>
                    <option value="metal">Metal</option>
                    <option value="crypto">Crypto</option>
                    <option value="indices">Indices</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[9px] font-mono text-brand-text-muted uppercase mb-1" title="Size representing 1 pip gain/loss">
                    Pip Size (Decimal) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="0.01"
                    value={newPipSize}
                    onChange={(e) => setNewPipSize(e.target.value)}
                    className="w-full bg-brand-card border border-brand-border rounded p-2 text-xs text-brand-text font-mono focus:outline-none focus:border-brand-teal"
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-mono text-brand-text-muted uppercase mb-1">
                    Contract Lot Unit Size *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="1000"
                    value={newContractSize}
                    onChange={(e) => setNewContractSize(e.target.value)}
                    className="w-full bg-brand-card border border-brand-border rounded p-2 text-xs text-brand-text font-mono focus:outline-none focus:border-brand-teal"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  className="bg-brand-teal text-[#0B0E11] hover:bg-brand-teal/90 transition px-3.5 py-1.5 rounded text-xs font-semibold cursor-pointer flex items-center gap-1.5"
                >
                  <Plus size={14} />
                  Authorize Custom Symbol
                </button>
              </div>
            </form>

            {/* List Table of Instrument Configurations */}
            <div className="border border-brand-border rounded-lg overflow-hidden bg-[#06080A]/45">
              <div className="grid grid-cols-5 bg-brand-nested text-[10px] font-mono font-bold text-brand-text-muted uppercase tracking-wider py-2.5 px-4 text-center">
                <div className="text-left">Symbol</div>
                <div className="text-left">Instrument Name</div>
                <div>Category</div>
                <div>Contract / Pip Size</div>
                <div>Actions</div>
              </div>

              <div className="divide-y divide-brand-border max-h-72 overflow-y-auto">
                {instruments.map((inst) => {
                  const isDeletableCustom = !SUPPORTED_INSTRUMENTS.some((si) => si.symbol === inst.symbol);

                  return (
                    <div
                      key={inst.symbol}
                      className="grid grid-cols-5 text-center text-xs py-2.5 px-4 items-center hover:bg-brand-nested/50"
                    >
                      <div className="text-left font-mono font-bold text-[#EAECEF]">{inst.symbol}</div>
                      <div className="text-left text-brand-text-muted truncate pr-2">{inst.name}</div>
                      <div>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                          inst.type === "metal" 
                            ? "bg-brand-yellow/10 text-brand-yellow"
                            : inst.type === "crypto"
                            ? "bg-brand-blue/10 text-brand-blue"
                            : inst.type === "indices"
                            ? "bg-brand-red/10 text-brand-red"
                            : "bg-[#02C076]/10 text-brand-teal"
                        }`}>
                          {inst.type}
                        </span>
                      </div>
                      <div className="font-mono text-brand-text-muted text-[10px]">
                        {inst.contractSize.toLocaleString()} lots / size ({inst.pipSize})
                      </div>
                      <div className="flex justify-center">
                        <button
                          type="button"
                          onClick={() => handleDeleteInstrument(inst.symbol)}
                          className={`p-1.5 rounded transition ${
                            isDeletableCustom
                              ? "text-brand-red hover:bg-brand-red/15 cursor-pointer"
                              : "text-zinc-600 cursor-not-allowed"
                          }`}
                          disabled={!isDeletableCustom}
                          title={isDeletableCustom ? "Delete dynamic Symbol specifications" : "Cannot delete core asset default"}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Export Data Desk & Send Simulator */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Supabase Core Sync Desk Card */}
          <div className="bg-brand-card border border-brand-green/30 p-6 rounded-lg space-y-4 relative overflow-hidden">
            {/* Ambient accent pulse */}
            {sessionUser && <div className="absolute top-0 right-0 w-32 h-32 bg-brand-green/5 rounded-full blur-2xl animate-pulse pointer-events-none" />}
            
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-brand-text flex items-center gap-2 font-mono">
                  <Database size={16} className={sessionUser ? "text-brand-green animate-pulse" : "text-brand-teal"} />
                  Supabase Backend Bridge
                </h3>
                <p className="text-xs text-brand-text-muted mt-1">
                  Connect and synchronize trade entries, notepad content, configurations, and payout streams to your database.
                </p>
              </div>
            </div>

            {sessionUser ? (
              // AUTHENTICATED LIVE MONITOR CONTROL
              <div className="space-y-4 pt-1 animate-in fade-in duration-200">
                <div className="p-3 bg-brand-green/5 border border-brand-green/20 rounded-lg space-y-1 text-xs font-sans">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-brand-green uppercase font-mono tracking-wider text-[10px] flex items-center gap-1.5">
                      <Cloud size={12} className="shrink-0" />
                      Live Database Sync Active
                    </span>
                    <span className="text-[9px] px-1.5 bg-brand-green/10 text-brand-green rounded font-mono font-bold shrink-0">CONNECTED</span>
                  </div>
                  <p className="text-brand-text font-medium truncate mt-1 text-[11px] select-all font-mono">
                    User: {sessionUser.email}
                  </p>
                </div>

                {/* Auto Sync Toggle and Controls */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center bg-[#0B0E11]/45 p-2 px-3 border border-brand-border/40 rounded">
                    <span className="text-[11px] font-mono font-semibold text-brand-text-muted">Auto-Sync on Changes</span>
                    <label className="relative inline-flex items-center cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={autoSync}
                        onChange={(e) => setAutoSync(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-neutral-400 after:border-gray-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-brand-green peer-checked:after:bg-black" />
                    </label>
                  </div>
                </div>

                {/* Manual Force Buttons */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    onClick={() => triggerPushCloud()}
                    disabled={isSyncingCloud}
                    className="w-full bg-brand-teal text-[#0B0E11] hover:bg-brand-teal/90 transition text-center font-bold py-2 px-2.5 rounded disabled:opacity-40 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {isSyncingCloud ? (
                      <RefreshCw size={12} className="animate-spin" />
                    ) : (
                      <Cloud size={13} />
                    )}
                    Push State
                  </button>
                  <button
                    onClick={() => triggerPullCloud()}
                    disabled={isSyncingCloud}
                    className="w-full bg-brand-nested border border-brand-border hover:border-brand-teal transition text-[#EAECEF] text-center font-semibold py-2 px-2.5 rounded disabled:opacity-40 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {isSyncingCloud ? (
                      <RefreshCw size={12} className="animate-spin" />
                    ) : (
                      <RefreshCw size={12} />
                    )}
                    Pull State
                  </button>
                </div>

                <div className="border-t border-brand-border/45 pt-3.5 flex justify-end">
                  <button
                    onClick={handleSignOut}
                    className="text-[10px] text-brand-red hover:bg-brand-red/10 border border-brand-red/20 px-2.5 py-1.5 rounded transition uppercase font-mono flex items-center gap-1 shrink-0 cursor-pointer"
                  >
                    <LogOut size={11} />
                    Disconnect Session
                  </button>
                </div>
              </div>
            ) : (
              // AUTHENTICATION SCREEN FOR SIGNUP / LOGIN
              <div className="space-y-4 pt-1">
                {/* Navigation Tab Headers */}
                <div className="flex border-b border-brand-border/40">
                  <button
                    type="button"
                    onClick={() => setAuthMode("login")}
                    className={`flex-1 pb-2 text-xs font-bold font-mono uppercase transition rounded-t ${
                      authMode === "login"
                        ? "text-brand-teal border-b-2 border-brand-teal"
                        : "text-brand-text-muted hover:text-brand-text"
                    }`}
                  >
                    Log In
                  </button>
                  <button
                    type="button"
                    onClick={() => setAuthMode("signup")}
                    className={`flex-1 pb-2 text-xs font-bold font-mono uppercase transition rounded-t ${
                      authMode === "signup"
                        ? "text-brand-teal border-b-2 border-brand-teal"
                        : "text-brand-text-muted hover:text-brand-text"
                    }`}
                  >
                    Create Account
                  </button>
                </div>

                {/* Credentials input elements */}
                <form onSubmit={handleAuthSubmit} className="space-y-3 font-sans">
                  <div>
                    <label className="block text-[10px] font-mono text-brand-text-muted uppercase mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. name@tradingfield.com"
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                      className="w-full bg-brand-nested border border-brand-border rounded p-2 text-xs text-brand-text focus:outline-none focus:border-brand-teal"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono text-brand-text-muted uppercase mb-1">
                      Secure Account Password
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="Min 6 characters"
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      className="w-full bg-brand-nested border border-brand-border rounded p-2 text-xs text-brand-text focus:outline-none focus:border-brand-teal"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={authLoading}
                    className="w-full py-2 bg-brand-teal hover:bg-brand-teal/90 text-[#0B0E11] font-bold text-xs rounded transition flex justify-center items-center gap-2 cursor-pointer disabled:opacity-40"
                  >
                    {authLoading ? (
                      <RefreshCw size={13} className="animate-spin" />
                    ) : (
                      <Lock size={13} />
                    )}
                    {authMode === "login" ? "Verify & Link Session" : "Create Cloud Vault Account"}
                  </button>
                </form>
              </div>
            )}

            {/* DYNAMIC SQL TABLE CONTEXT TRIGGER */}
            <div className="border-t border-brand-border/40 pt-3 flex flex-col gap-2.5">
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-brand-text-muted font-medium flex items-center gap-1 font-sans">
                  <Database size={12} className="text-brand-border-alt" />
                  Supabase DB Table Config
                </span>
                <button
                  type="button"
                  onClick={() => setShowSqlSetup((p) => !p)}
                  className="text-brand-teal hover:underline font-bold text-[10px] uppercase tracking-wider font-mono cursor-pointer"
                >
                  {showSqlSetup ? "Hide SQL Setup" : "Show SQL Setup"}
                </button>
              </div>

              {showSqlSetup && (
                <div className="bg-[#040608] border border-brand-border p-3 rounded space-y-2 select-text animate-in fade-in slide-in-from-top-2 duration-200">
                  <span className="text-[9px] text-[#848E9C] font-mono block">
                    Copy and run this schema code in your Supabase SQL Editor:
                  </span>
                  <div className="relative font-mono text-[9px] max-h-44 overflow-auto scrollbar-thin text-[#AEC3D1] border border-brand-border/20 p-2 bg-[#020304] rounded break-all whitespace-pre-wrap leading-relaxed">
                    {SUPABASE_SQL_SETUP_INSTRUCTIONS}
                    
                    <button
                      type="button"
                      onClick={handleCopySql}
                      className="absolute top-2 right-2 p-1.5 bg-brand-card hover:bg-zinc-800 text-brand-teal text-[9px] border border-brand-border rounded transition font-sans cursor-pointer flex items-center gap-1 uppercase font-bold"
                    >
                      {copiedSql ? (
                        <>
                          <Check size={11} className="text-brand-green" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy size={11} />
                          Copy
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Export Deck Block */}
          <div className="bg-brand-card border border-brand-border p-6 rounded-lg space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-brand-text flex items-center gap-2 font-mono">
              <Download size={16} className="text-brand-teal" />
              3. Compile &amp; Export
            </h3>
            <p className="text-xs text-brand-text-muted">
              Download your offline data. No cookies or server tracking. Keep your journal logs private.
            </p>

            <div className="p-3.5 bg-brand-nested border border-brand-border/80 rounded-lg space-y-2">
              <span className="text-[10px] uppercase font-mono text-slate-500 font-bold block">
                Logged Data Volume
              </span>
              <div className="flex justify-between items-center">
                <span className="text-xs text-brand-text">Trade Entries:</span>
                <span className="text-sm font-mono font-bold text-brand-teal">{entries.length} Entries</span>
              </div>
              <div className="flex justify-between items-center border-t border-brand-border/40 pt-1.5 select-none">
                <span className="text-xs text-brand-text">Configured Assets:</span>
                <span className="text-xs font-mono font-bold text-brand-text-muted">{instruments.length} Symbols</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => triggerDownload("CSV")}
                className="p-3 bg-[#0B0E11]/80 hover:bg-brand-nested border border-brand-border rounded flex flex-col items-center justify-center gap-2 cursor-pointer transition text-center hover:border-brand-teal"
              >
                <FileSpreadsheet className="text-[#02C076]" size={20} />
                <span className="text-[11px] font-sans font-bold text-[#EAECEF]">Download CSV</span>
                <span className="text-[9px] font-mono text-brand-text-muted">Spreadsheet</span>
              </button>

              <button
                onClick={() => triggerDownload("JSON")}
                className="p-3 bg-[#0B0E11]/80 hover:bg-brand-nested border border-brand-border rounded flex flex-col items-center justify-center gap-2 cursor-pointer transition text-center hover:border-brand-teal"
              >
                <FileJson className="text-brand-blue" size={20} />
                <span className="text-[11px] font-sans font-bold text-[#EAECEF]">Download JSON</span>
                <span className="text-[9px] font-mono text-brand-text-muted">Backup Profile</span>
              </button>
            </div>
          </div>

          {/* Secure Transmission Desk (Send Option) */}
          <div className="bg-brand-card border border-brand-border p-6 rounded-lg space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-brand-text flex items-center gap-2 font-mono">
              <Send size={16} className="text-brand-teal" />
              4. Transmit Ledger File
            </h3>
            <p className="text-xs text-brand-text-muted">
              Instantly compile and send your ledger reports to financial backup partners, audit emails, or prop test boards.
            </p>

            <div className="space-y-3 pt-2">
              <div>
                <label className="block text-[10px] font-mono text-brand-text-muted uppercase mb-1">
                  Recipient Destination Email / Channel Address
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={destinationEmail}
                    onChange={(e) => setDestinationEmail(e.target.value)}
                    className="w-full bg-brand-nested border border-brand-border rounded p-2 text-xs text-[#EAECEF] focus:outline-none focus:border-brand-teal pl-7"
                    placeholder="investor@firm.com"
                  />
                  <Mail size={12} className="absolute left-2.5 top-2.5 text-slate-500" />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono text-brand-text-muted uppercase mb-1">
                  Subject Heading
                </label>
                <input
                  type="text"
                  value={customSubject}
                  onChange={(e) => setCustomSubject(e.target.value)}
                  className="w-full bg-brand-nested border border-brand-border rounded p-2 text-xs text-brand-text focus:outline-none focus:border-brand-teal"
                  placeholder="Subject Header"
                />
              </div>

              <div className="flex items-center justify-between py-1 bg-brand-nested/40 rounded px-2 border border-brand-border/40">
                <span className="text-[10px] text-brand-text-muted font-mono uppercase">Attached Format:</span>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => setExportFormat("CSV")}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition cursor-pointer ${
                      exportFormat === "CSV" ? "bg-brand-teal text-[#0B0E11]" : "bg-black/40 text-brand-text-muted hover:text-[#EAECEF]"
                    }`}
                  >
                    CSV File
                  </button>
                  <button
                    onClick={() => setExportFormat("JSON")}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition cursor-pointer ${
                      exportFormat === "JSON" ? "bg-brand-teal text-[#0B0E11]" : "bg-black/40 text-brand-text-muted hover:text-[#EAECEF]"
                    }`}
                  >
                    JSON Ledger
                  </button>
                </div>
              </div>

              <button
                onClick={() => runSendLogsDemo(exportFormat)}
                disabled={isDispatching}
                className="w-full py-2.5 text-xs font-semibold text-[#0B0E11] bg-brand-teal hover:bg-brand-teal/90 disabled:bg-[#0B0E11]/40 disabled:text-zinc-650 cursor-pointer disabled:cursor-not-allowed text-center transition tracking-wider flex items-center justify-center gap-1.5 rounded"
              >
                {isDispatching ? (
                  <>
                    <RefreshCw size={13} className="animate-spin" />
                    Transmitting Packets...
                  </>
                ) : (
                  <>
                    <Send size={13} />
                    Transmit Full Trade Logs
                  </>
                )}
              </button>
            </div>

            {/* Simulated Live Logging screen */}
            {(isDispatching || dispatchLogs.length > 0) && (
              <div className="bg-[#040608] border border-brand-border p-4.5 rounded font-mono text-[10px] space-y-1 text-brand-teal animate-in fade-in duration-200">
                <div className="flex justify-between items-center text-brand-text-muted border-b border-brand-borderpb-1.5 mb-2">
                  <span className="flex items-center gap-1.5 text-brand-text text-[9px] uppercase font-bold tracking-widest">
                    <Terminal size={11} className="text-brand-teal animate-pulse" />
                    TLS Outbound Log Desk
                  </span>
                  {isDispatching ? (
                    <span className="text-[8px] px-1 bg-brand-teal/20 text-brand-teal rounded animate-pulse">TRANSMITTING</span>
                  ) : (
                    <span className="text-[8px] px-1 bg-brand-green/20 text-brand-green rounded font-sans font-bold">250 OK</span>
                  )}
                </div>
                <div className="space-y-1.5 leading-normal max-h-48 overflow-y-auto">
                  {dispatchLogs.map((log, idx) => (
                    <div key={idx} className="flex gap-1.5 items-start">
                      <span className="text-zinc-600 shrink-0 select-none">$&gt;</span>
                      <p className={idx === dispatchLogs.length - 1 && isDispatching ? "text-[#EAECEF]" : "text-brand-teal/85"}>{log}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Informational Help Desk */}
            <div className="p-3 rounded-lg border border-brand-border/40 bg-[#0B0E11]/50 text-[10px] text-brand-text-muted leading-relaxed flex gap-2">
              <HelpCircle size={14} className="text-brand-teal shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-[#EAECEF] block">Secure TLS Cryptography</span>
                Your offline logs are processed safely. This data stays local to your browser unless you explicitly initiate the simulated transmit to your dispatch emails!
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

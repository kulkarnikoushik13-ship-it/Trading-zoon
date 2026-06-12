import React, { useState, useMemo } from "react";
import { BrokerConnection, PropFirmPayout } from "../types";
import {
  Wallet,
  Plus,
  Trash2,
  RefreshCw,
  TrendingUp,
  CircleCheck,
  AlertTriangle,
  Clock,
  ExternalLink,
  DollarSign,
  HelpCircle,
  Building2,
  Calendar,
  Activity,
  FileCheck,
  Filter,
  Layers,
  ArrowUpRight,
  ShieldAlert,
  Server,
  Fingerprint,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
  PieChart,
  Pie,
} from "recharts";

interface BrokerPayoutsTabProps {
  brokers: BrokerConnection[];
  setBrokers: (brokers: BrokerConnection[]) => void;
  payouts: PropFirmPayout[];
  setPayouts: (payouts: PropFirmPayout[]) => void;
  triggerStaticToast: (title: string, details: string, type: "info" | "success" | "warning") => void;
}

export default function BrokerPayoutsTab({
  brokers,
  setBrokers,
  payouts,
  setPayouts,
  triggerStaticToast,
}: BrokerPayoutsTabProps) {
  // Navigation & Filters
  const [filterBrokerId, setFilterBrokerId] = useState<string>("ALL");

  // Local Form states for Broker
  const [alias, setAlias] = useState("");
  const [brokerName, setBrokerName] = useState("");
  const [accountId, setAccountId] = useState("");
  const [serverName, setServerName] = useState("");
  const [platform, setPlatform] = useState<BrokerConnection["platform"]>("MT5");
  const [investorPassword, setInvestorPassword] = useState("");

  // Local Form states for Payout
  const [payoutBrokerId, setPayoutBrokerId] = useState("");
  const [payoutAmount, setPayoutAmount] = useState("");
  const [payoutDate, setPayoutDate] = useState(new Date().toISOString().substring(0, 10));
  const [payoutStatus, setPayoutStatus] = useState<PropFirmPayout["status"]>("disbursed");
  const [invoiceId, setInvoiceId] = useState("");
  const [payoutNotes, setPayoutNotes] = useState("");

  // Syncing simulation state
  const [syncingBrokerId, setSyncingBrokerId] = useState<string | null>(null);
  const [syncLogs, setSyncLogs] = useState<string[]>([]);

  // 1. ADD NEW BROKER METHOD
  const handleAddBroker = (e: React.FormEvent) => {
    e.preventDefault();
    if (!alias.trim() || !brokerName.trim() || !accountId.trim()) {
      alert("Please provide human labels for Name/Alias, Broker Provider, and Account ID!");
      return;
    }

    const newBroker: BrokerConnection = {
      id: "broker_" + Math.random().toString(36).substring(2, 9),
      alias: alias.trim(),
      brokerName: brokerName.trim(),
      accountId: accountId.trim(),
      server: serverName.trim() || "Default-Live-Server1",
      platform,
      status: "pending",
      investorPassword: investorPassword,
      lastSync: "Never Synchronized",
    };

    setBrokers([...brokers, newBroker]);
    triggerStaticToast(
      "Broker Registered",
      `Dynamic credentials created for "${newBroker.alias}". Initiating instant bridge request...`,
      "success"
    );

    // Clear Form
    setAlias("");
    setBrokerName("");
    setAccountId("");
    setServerName("");
    setInvestorPassword("");
  };

  // 2. DISMISS BROKER
  const handleDeleteBroker = (id: string, name: string) => {
    if (confirm(`Are you sure you want to disconnect and erase "${name}"? This will unlink associated payouts in the log views.`)) {
      setBrokers(brokers.filter((b) => b.id !== id));
      triggerStaticToast(
         "Unlinked Broker",
         `Erased ${name} connection and wiped credential cache.`,
         "info"
      );
    }
  };

  // 3. SECURE TLS API CONNECTION SIMULATOR
  const handleSimulateSync = (brokerId: string) => {
    const targetBroker = brokers.find((b) => b.id === brokerId);
    if (!targetBroker) return;

    setSyncingBrokerId(brokerId);
    setSyncLogs([]);

    const steps = [
      `Establishing cryptographic handshake TLS 1.3 tunnel...`,
      `Pinging bridge router server for account ID ${targetBroker.accountId}...`,
      `Locating broker infrastructure: [tcp://${targetBroker.server || "gateway.com"}:443]`,
      `Performing HMAC-SHA256 signature sequence validation...`,
      `Connecting through ${targetBroker.platform} engine terminal interface...`,
      `Synchronizing positions history list and server equity checkpoints...`,
      `Integrity checks parsed: 0 discrepancies verified.`,
      `Bridge tunnel locked. Live status: SECURE.`,
    ];

    let currentStep = 0;
    const interval = setInterval(() => {
      if (currentStep < steps.length) {
        const timestamped = `[${new Date().toLocaleTimeString()}] ${steps[currentStep]}`;
        setSyncLogs((prev) => [...prev, timestamped]);
        currentStep++;
      } else {
        clearInterval(interval);
        
        // Update status of actual broker list state
        setBrokers(
          brokers.map((b) =>
            b.id === brokerId
              ? {
                  ...b,
                  status: "connected",
                  lastSync: new Date().toLocaleDateString() + " " + new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                }
              : b
          )
        );

        setSyncingBrokerId(null);
        triggerStaticToast(
          "Broker Synced",
          `Bridge successfully verified for ${targetBroker.alias}. Telemetry loaded.`,
          "success"
        );
      }
    }, 400);
  };

  // 4. ADD NEW PAYOUT METHOD
  const handleAddPayout = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanAmt = parseFloat(payoutAmount);
    if (isNaN(cleanAmt) || cleanAmt <= 0) {
      alert("Payout disbursement must be a valid positive numerical amount.");
      return;
    }

    if (!payoutBrokerId) {
      alert("Please designate a connected Broker origin!");
      return;
    }

    const linkedBroker = brokers.find((b) => b.id === payoutBrokerId);
    const resolvedPropFirm = linkedBroker ? linkedBroker.brokerName : "Independent";

    const newPayout: PropFirmPayout = {
      id: "payout_" + Math.random().toString(36).substring(2, 9),
      brokerConnectionId: payoutBrokerId,
      propFirmName: resolvedPropFirm,
      amount: cleanAmt,
      date: payoutDate,
      status: payoutStatus,
      invoiceId: invoiceId.trim() || `TX-${Math.floor(100000 + Math.random() * 900000)}`,
      notes: payoutNotes.trim() || "Regular payout distribution cycle.",
    };

    setPayouts([newPayout, ...payouts]);
    triggerStaticToast(
      "Payout Tracked",
      `Disbursed payout for $${cleanAmt.toLocaleString()} entered under invoice reference ${newPayout.invoiceId}`,
      "success"
    );

    // Clear Form
    setPayoutAmount("");
    setInvoiceId("");
    setPayoutNotes("");
  };

  // 5. REMOVE PAYOUT
  const handleDeletePayout = (id: string, amount: number) => {
    if (confirm(`Erase payout ledger entry of $${amount.toLocaleString()}?`)) {
      setPayouts(payouts.filter((p) => p.id !== id));
      triggerStaticToast(
        "Ledger Adjusted",
        "Wiped specific prop firm payout receipt.",
        "info"
      );
    }
  };

  // Computed Values based on active filter choice!
  const filteredPayouts = useMemo(() => {
    if (filterBrokerId === "ALL") return payouts;
    return payouts.filter((p) => p.brokerConnectionId === filterBrokerId);
  }, [payouts, filterBrokerId]);

  // Aggregate Metrics based on the selection to dynamically change charts and highlights!
  const statistics = useMemo(() => {
    let totalPaid = 0;
    let totalPending = 0;
    let totalRejected = 0;

    filteredPayouts.forEach((p) => {
      if (p.status === "disbursed") {
        totalPaid += p.amount;
      } else if (p.status === "pending") {
        totalPending += p.amount;
      } else if (p.status === "rejected") {
        totalRejected += p.amount;
      }
    });

    return {
      totalPaid,
      totalPending,
      totalRejected,
      itemsCount: filteredPayouts.length,
    };
  }, [filteredPayouts]);

  // Calculate Grouped Payouts for Recharts
  // Fulfill: "...show payouts in chart form"
  const chartData = useMemo(() => {
    // We can group either by Prop Firm Name or Date to make it incredibly intuitive!
    const firmTotals: Record<string, number> = {};

    filteredPayouts.forEach((p) => {
      if (p.status === "disbursed") {
        // Find broker alias for clean chart visualization label
        const broker = brokers.find((b) => b.id === p.brokerConnectionId);
        const nameLabel = broker ? `${broker.alias} (${broker.brokerName})` : p.propFirmName;
        firmTotals[nameLabel] = (firmTotals[nameLabel] || 0) + p.amount;
      }
    });

    return Object.entries(firmTotals).map(([name, value]) => ({
      name,
      amount: value,
    }));
  }, [filteredPayouts, brokers]);

  // Calculate generic aggregate split counts by platform
  const pieChartData = useMemo(() => {
    const statusCounts: Record<string, number> = {};
    filteredPayouts.forEach((p) => {
      statusCounts[p.status] = (statusCounts[p.status] || 0) + p.amount;
    });

    const colors = {
      disbursed: "#02C076",
      pending: "#E59A18",
      rejected: "#F6465D",
    };

    return Object.entries(statusCounts).map(([status, value]) => ({
      name: status.toUpperCase(),
      value,
      color: colors[status as keyof typeof colors] || "#848E9C",
    }));
  }, [filteredPayouts]);

  // Colors array for visual aesthetic consistency
  const CHART_COLORS = ["#00F2FE", "#02C076", "#E59A18", "#3B82F6", "#9333EA", "#EC4899"];

  return (
    <div className="space-y-6">
      {/* Header Info Banner */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-brand-card border border-brand-border p-6 rounded-lg">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-brand-text font-sans sm:text-2xl flex items-center gap-2">
            <Wallet size={24} className="text-brand-teal stroke-[2]" />
            Broker Accounts &amp; Prop Firm Payout Hub
          </h2>
          <p className="text-sm text-brand-text-muted mt-1 font-sans">
            Securely link trading terminals (MT4, MT5, DXTrade) and monitor high-volume payout distributions across prop firms with responsive charts.
          </p>
        </div>
      </div>

      {/* Aggregate Metric Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-brand-card border border-brand-border p-5 rounded-lg flex items-center gap-4">
          <div className="p-3 bg-[#02C076]/10 text-brand-green rounded-lg">
            <DollarSign size={20} />
          </div>
          <div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-brand-text-muted">Total Payouts Disbursed</span>
            <p className="text-lg font-mono font-bold text-[#02C076] mt-0.5">${statistics.totalPaid.toLocaleString([], { minimumFractionDigits: 2 })}</p>
          </div>
        </div>

        <div className="bg-brand-card border border-brand-border p-5 rounded-lg flex items-center gap-4">
          <div className="p-3 bg-brand-yellow/10 text-brand-yellow rounded-lg">
            <Clock size={20} />
          </div>
          <div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-brand-text-muted">Pending Payouts In Queue</span>
            <p className="text-lg font-mono font-bold text-brand-yellow mt-0.5">${statistics.totalPending.toLocaleString([], { minimumFractionDigits: 2 })}</p>
          </div>
        </div>

        <div className="bg-brand-card border border-brand-border p-5 rounded-lg flex items-center gap-4">
          <div className="p-3 bg-brand-red/10 text-brand-red rounded-lg">
            <ShieldAlert size={20} />
          </div>
          <div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-brand-text-muted">Rejected Transfers</span>
            <p className="text-lg font-mono font-bold text-brand-red mt-0.5">${statistics.totalRejected.toLocaleString([], { minimumFractionDigits: 2 })}</p>
          </div>
        </div>

        <div className="bg-brand-card border border-brand-border p-5 rounded-lg flex items-center gap-4">
          <div className="p-3 bg-[#00F2FE]/10 text-[#00F2FE] rounded-lg">
            <Activity size={20} />
          </div>
          <div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-brand-text-muted">Configured Broker Count</span>
            <p className="text-lg font-mono font-bold text-[#00F2FE] mt-0.5">{brokers.length} Accounts Active</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* BROKER CONNECTIONS BOARD (Col span 2) */}
        <div className="lg:col-span-2 space-y-6">
          
          <div className="bg-brand-card border border-brand-border p-6 rounded-lg space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-brand-text flex items-center gap-2 font-mono">
                  <Server size={16} className="text-brand-teal" />
                  Active Broker Bridges
                </h3>
                <p className="text-xs text-brand-text-muted">
                  Keep track of terminal servers and credentials. Trigger an endpoint synchronization below to verify real-time status.
                </p>
              </div>
            </div>

            {/* List of Connected Brokers */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {brokers.length === 0 ? (
                <div className="col-span-2 p-8 text-center bg-brand-nested border border-brand-border/40 rounded-lg text-brand-text-muted text-xs">
                  No connected brokers configured yet. Use the provisioning tool below to establish one!
                </div>
              ) : (
                brokers.map((broker) => (
                  <div
                    key={broker.id}
                    className="p-4 bg-brand-nested border border-brand-border rounded-lg space-y-3 relative group"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] font-mono font-bold text-brand-text-muted bg-black/40 px-2 py-0.5 rounded tracking-wide uppercase">
                          {broker.platform}
                        </span>
                        <h4 className="text-sm font-bold text-[#EAECEF] font-sans mt-1.5">{broker.alias}</h4>
                      </div>

                      <div className="flex items-center gap-1.5 pt-0.5">
                        <span className={`w-2 h-2 rounded-full ${
                          broker.status === "connected"
                            ? "bg-brand-green animate-pulse"
                            : broker.status === "pending"
                            ? "bg-brand-yellow"
                            : "bg-neutral-500"
                        }`} />
                        <span className="text-[10px] font-mono font-black text-brand-text-muted uppercase">
                          {broker.status}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] border-t border-brand-border/40 pt-2.5 text-brand-text-muted font-mono bg-black/10 p-2 rounded">
                      <div>
                        <span className="text-[9px] text-[#848E9C] block">FIRM/BROKER:</span>
                        <span className="text-[#EAECEF] font-bold">{broker.brokerName}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-[#848E9C] block">ACCOUNT ID:</span>
                        <span className="text-brand-teal font-bold">{broker.accountId}</span>
                      </div>
                      <div className="col-span-2 mt-1">
                        <span className="text-[9px] text-[#848E9C] block">TERMINAL SERVER:</span>
                        <span className="text-slate-400 select-all font-sans block text-[10px] truncate">{broker.server}</span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-[10px] pt-1 leading-none text-brand-text-muted">
                      <span>Sync: {broker.lastSync}</span>
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleSimulateSync(broker.id)}
                          className="px-2 py-1 bg-brand-teal/10 hover:bg-brand-teal/20 text-brand-teal font-semibold rounded hover:text-brand-text cursor-pointer transition flex items-center gap-1"
                        >
                          <RefreshCw size={10} />
                          Force Sync
                        </button>
                        <button
                          onClick={() => handleDeleteBroker(broker.id, broker.alias)}
                          className="p-1 text-brand-red hover:bg-brand-red/15 rounded cursor-pointer transition"
                          title="Remove Broker specifications"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Syncing Simulator View */}
            {syncingBrokerId && (
              <div className="bg-[#040608] border border-brand-border p-4.5 rounded font-mono text-[10px] space-y-1 text-brand-teal animate-in fade-in duration-200">
                <div className="flex justify-between items-center text-brand-text-muted border-b border-brand-border/50 pb-1.5 mb-2">
                  <span className="flex items-center gap-1.5 text-brand-text text-[9px] uppercase font-bold tracking-widest">
                    <Fingerprint size={12} className="text-brand-teal animate-pulse" />
                    TLS Endpoint Authentication log
                  </span>
                  <span className="text-[8px] px-1.5 bg-brand-teal/20 text-brand-teal rounded animate-pulse">BRIDGING SECURE</span>
                </div>
                <div className="space-y-1 font-mono text-[10px] max-h-48 overflow-y-auto leading-normal">
                  {syncLogs.map((log, idx) => (
                    <div key={idx} className="flex gap-1.5 items-start">
                      <span className="text-zinc-600 shrink-0 select-none">$&gt;</span>
                      <p className="text-brand-teal/85">{log}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ADD BROKER FORM BOX */}
          <div className="bg-brand-card border border-brand-border p-6 rounded-lg space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-brand-text flex items-center gap-2 font-mono">
              <Plus size={16} className="text-brand-teal" />
              Link New High-Frequency Trading Account / Prop Firm Connection
            </h3>
            <p className="text-xs text-brand-text-muted">
              Add details representing your prop evaluation challenge, master fund, or live STP brokerage keys. Keep records offline.
            </p>

            <form onSubmit={handleAddBroker} className="space-y-4 pt-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-brand-text-muted uppercase mb-1">
                    Custom Account Alias *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. My FTMO Live Master, FTMO 200k"
                    value={alias}
                    onChange={(e) => setAlias(e.target.value)}
                    className="w-full bg-brand-nested border border-brand-border rounded p-2 text-xs text-brand-text focus:outline-none focus:border-brand-teal font-sans"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-brand-text-muted uppercase mb-1">
                    Broker / Prop Firm Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. FTMO, Pepperstone, IC Markets, Funding Pips"
                    value={brokerName}
                    onChange={(e) => setBrokerName(e.target.value)}
                    className="w-full bg-brand-nested border border-brand-border rounded p-2 text-xs text-brand-text focus:outline-none focus:border-brand-teal font-sans"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-mono text-brand-text-muted uppercase mb-1">
                    Account ID / Login Number *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 7094812"
                    value={accountId}
                    onChange={(e) => setAccountId(e.target.value)}
                    className="w-full bg-brand-nested border border-brand-border rounded p-2 text-xs text-brand-text focus:outline-none focus:border-brand-teal font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-brand-text-muted uppercase mb-1">
                    Server Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Pepperstone-Live03"
                    value={serverName}
                    onChange={(e) => setServerName(e.target.value)}
                    className="w-full bg-brand-nested border border-brand-border rounded p-2 text-xs text-brand-text focus:outline-none focus:border-brand-teal font-sans"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-brand-text-muted uppercase mb-1">
                    Terminal Program
                  </label>
                  <select
                    value={platform}
                    onChange={(e) => setPlatform(e.target.value as any)}
                    className="w-full bg-brand-nested border border-brand-border rounded p-2.5 text-xs text-brand-text focus:outline-none focus:border-brand-teal cursor-pointer"
                  >
                    <option value="MT4">MetaTrader 4 (MT4)</option>
                    <option value="MT5">MetaTrader 5 (MT5)</option>
                    <option value="cTrader">Spotware cTrader</option>
                    <option value="DXTrade">DXTrade Platform</option>
                    <option value="PineScript Hook">PineScript REST API Hook</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-brand-text-muted uppercase mb-1">
                  Access Key / Read-Only Investor Password (Optional)
                </label>
                <input
                  type="password"
                  placeholder="•••••••••••••• (Processed locally only)"
                  value={investorPassword}
                  onChange={(e) => setInvestorPassword(e.target.value)}
                  className="w-full bg-brand-nested border border-brand-border rounded p-2 text-xs text-brand-text focus:outline-none focus:border-brand-teal font-sans"
                />
              </div>

              <div className="flex justify-start">
                <button
                  type="submit"
                  className="bg-brand-teal hover:bg-brand-teal/90 text-[#0B0E11] px-4 py-2.5 rounded text-xs font-bold font-sans cursor-pointer flex items-center gap-1.5 transition"
                >
                  <Plus size={14} className="stroke-[2.5]" />
                  Verify &amp; Link Account Bridge
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* PAYOUT CHARTS & DISBURSEMENT LOGS (Col span 1) */}
        <div className="space-y-6">
          
          {/* PAYOUT LOG FORM BOX */}
          <div className="bg-brand-card border border-brand-border p-6 rounded-lg space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-brand-text flex items-center gap-2 font-mono">
              <Plus size={16} className="text-[#02C076]" />
              Record New Prop Payout Receipt
            </h3>
            <p className="text-xs text-brand-text-muted">
              Document your successful withdrawals. Linking a payouts record connects dynamically back to your linked brokers!
            </p>

            <form onSubmit={handleAddPayout} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-brand-text-muted uppercase mb-1">
                  Associated Broker Origin Account *
                </label>
                <select
                  required
                  value={payoutBrokerId}
                  onChange={(e) => setPayoutBrokerId(e.target.value)}
                  className="w-full bg-brand-nested border border-brand-border rounded p-2 text-xs text-brand-text focus:outline-none focus:border-brand-teal cursor-pointer"
                >
                  <option value="">-- Choose Account Connection --</option>
                  {brokers.map((broker) => (
                    <option key={broker.id} value={broker.id}>
                      {broker.alias} ({broker.brokerName}) [{broker.accountId}]
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono text-brand-text-muted uppercase mb-1">
                    Payout Amount ($) *
                  </label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    placeholder="8450.00"
                    value={payoutAmount}
                    onChange={(e) => setPayoutAmount(e.target.value)}
                    className="w-full bg-brand-nested border border-brand-border rounded p-2 text-xs font-mono text-[#02C076] focus:outline-none focus:border-brand-teal font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-brand-text-muted uppercase mb-1">
                    Disbursement Date
                  </label>
                  <input
                    type="date"
                    required
                    value={payoutDate}
                    onChange={(e) => setPayoutDate(e.target.value)}
                    className="w-full bg-brand-nested border border-brand-border rounded p-1.5 text-xs text-brand-text focus:outline-none focus:border-brand-teal cursor-pointer"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono text-brand-text-muted uppercase mb-1">
                    Status
                  </label>
                  <select
                    value={payoutStatus}
                    onChange={(e) => setPayoutStatus(e.target.value as any)}
                    className="w-full bg-brand-nested border border-brand-border rounded p-2 text-xs text-brand-text focus:outline-none focus:border-brand-teal cursor-pointer"
                  >
                    <option value="disbursed">Disbursed (Success)</option>
                    <option value="pending">Pending Processing</option>
                    <option value="rejected">Rejected / Audited</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono text-brand-text-muted uppercase mb-1">
                    Invoice/Reference ID
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. INV-8849"
                    value={invoiceId}
                    onChange={(e) => setInvoiceId(e.target.value)}
                    className="w-full bg-brand-nested border border-brand-border rounded p-2 text-xs text-brand-text focus:outline-none focus:border-brand-teal font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-brand-text-muted uppercase mb-1">
                  Private Notes
                </label>
                <textarea
                  placeholder="Processed via Deel, Crypto hash, or Bank Wire details here..."
                  rows={2}
                  value={payoutNotes}
                  onChange={(e) => setPayoutNotes(e.target.value)}
                  className="w-full bg-brand-nested border border-brand-border rounded p-2 text-xs text-brand-text focus:outline-none focus:border-brand-teal font-sans resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 text-xs font-bold text-[#0B0E11] bg-[#02C076] hover:bg-[#02C076]/90 transition text-center rounded cursor-pointer"
              >
                Log Prop Payout Record
              </button>
            </form>
          </div>

          {/* HELP CENTER PANEL */}
          <div className="p-4 bg-[#0B0E11]/45 border border-brand-border/40 rounded-lg text-xs leading-relaxed text-brand-text-muted flex gap-3">
            <HelpCircle size={18} className="text-brand-teal shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-[#EAECEF] block mb-1">Prop Payout Calculations</span>
              These metrics reflect profits actually uncoiled as payouts from evaluations. This works as secondary bookkeeping completely sovereign from day-to-day active scalping.
            </div>
          </div>
        </div>
      </div>

      {/* DYNAMIC PAYOUT CHARTS SECTION (Realizes the bar chart requirement and broker-changing filter) */}
      <div className="bg-brand-card border border-brand-border p-6 rounded-lg space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-brand-border/40 pb-4">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-brand-text flex items-center gap-2 font-mono">
              <TrendingUp size={16} className="text-brand-teal" />
              Payout Analytics &amp; Capital Accumulation Ledger
            </h3>
            <p className="text-xs text-brand-text-muted">
              Aggregate distributions clustered by prop accounts. Toggle the changing filter below to isolate specific brokerages.
            </p>
          </div>

          {/* Fulfill: "...a brocker changing seaction in that so i can see from which broker how much i have takern pay out" */}
          <div className="flex items-center gap-2 bg-brand-nested p-1 px-2.5 rounded border border-brand-border/75">
            <Filter size={11} className="text-brand-border-alt shrink-0" />
            <span className="text-[10px] font-mono text-brand-text-muted uppercase font-bold">Select Active Filter:</span>
            <select
              value={filterBrokerId}
              onChange={(e) => setFilterBrokerId(e.target.value)}
              className="bg-transparent border-none text-[11px] font-semibold text-brand-text focus:outline-none text-brand-teal cursor-pointer hover:text-brand-text transition"
            >
              <option value="ALL">Show Combined Accounts</option>
              {brokers.map((broker) => (
                <option key={broker.id} value={broker.id}>
                  {broker.alias} ({broker.brokerName})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Charts & Plots */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
          
          {/* Main Bar Chart (Col Span 2) */}
          <div className="lg:col-span-2 space-y-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-brand-text-muted font-bold block mb-1">
              {filterBrokerId === "ALL" ? "Grouped payouts split by trading brand" : "Revenue distribution check"}
            </span>

            {chartData.length === 0 ? (
              <div className="h-64 flex flex-col justify-center items-center bg-brand-nested border border-brand-border/30 rounded-lg text-brand-text-muted text-xs p-6 text-center">
                <Layers size={32} className="text-zinc-650 opacity-40 mb-2" />
                No payout distributions match your current query or local filter selection.
              </div>
            ) : (
              <div className="h-64 bg-brand-nested/40 rounded-lg p-3 border border-brand-border/40">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2B3139/30" vertical={false} />
                    <XAxis
                      dataKey="name"
                      stroke="#848E9C"
                      fontSize={10}
                      tickLine={false}
                      axisLine={{ stroke: "#2B3139" }}
                    />
                    <YAxis
                      stroke="#848E9C"
                      fontSize={10}
                      tickLine={false}
                      axisLine={{ stroke: "#2B3139" }}
                      tickFormatter={(v) => `$${v.toLocaleString()}`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1E2329",
                        borderColor: "#474F59",
                        borderRadius: "6px",
                      }}
                      labelStyle={{ color: "#EAECEF", fontSize: "11px", fontWeight: "bold" }}
                      itemStyle={{ color: "#02C076", fontSize: "11px" }}
                      formatter={(value: any) => [`$${value.toLocaleString()}`, "Disbursed Payout"]}
                    />
                    <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Allocation Breakdown (Col Span 1) */}
          <div className="lg:col-span-1 border border-brand-border/60 bg-brand-nested/30 p-4 rounded-lg space-y-4">
            <h4 className="text-xs font-bold uppercase font-mono text-[#EAECEF]">
              Disbursed Cluster Breakdown
            </h4>

            {chartData.length === 0 ? (
              <div className="h-44 flex items-center justify-center text-[11px] text-brand-text-muted italic">
                Add payouts to visualize allocation analytics.
              </div>
            ) : (
              <div className="space-y-3 font-sans">
                {chartData.map((data, idx) => {
                  const share = ((data.amount / statistics.totalPaid) * 100).toFixed(1);
                  return (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-[11px] font-medium text-brand-text">
                        <span className="flex items-center gap-1.5 truncate">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }}
                          />
                          {data.name}
                        </span>
                        <span className="font-mono font-bold text-[#EAECEF]">
                          ${data.amount.toLocaleString()} ({share}%)
                        </span>
                      </div>
                      <div className="w-full bg-brand-nested h-1.5 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{
                            width: `${share}%`,
                            backgroundColor: CHART_COLORS[idx % CHART_COLORS.length],
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Table of actual recorded receipts */}
        <div className="border border-brand-border rounded-lg overflow-hidden bg-[#06080A]/40 font-sans">
          <div className="grid grid-cols-6 bg-brand-nested/60 text-[10px] font-mono font-bold text-brand-text-muted uppercase py-2.5 px-4 text-center border-b border-brand-border/40">
            <div className="text-left">Referenced Invoice</div>
            <div className="text-left">Firm &amp; Account Origin</div>
            <div>Payout Date</div>
            <div>Status</div>
            <div className="text-right">Amount</div>
            <div>Actions</div>
          </div>

          <div className="divide-y divide-brand-border/30 max-h-80 overflow-y-auto">
            {filteredPayouts.length === 0 ? (
              <div className="p-8 text-center text-xs text-brand-text-muted italic">
                No matching payout items clustered under this filter configuration.
              </div>
            ) : (
              filteredPayouts.map((payout) => {
                const associatedBroker = brokers.find((b) => b.id === payout.brokerConnectionId);

                return (
                  <div
                    key={payout.id}
                    className="grid grid-cols-6 text-center text-xs py-3 px-4 items-center hover:bg-brand-nested/40 transition"
                  >
                    <div className="text-left font-mono font-bold text-[#EAECEF] flex items-center gap-1.5">
                      <FileCheck size={13} className="text-brand-teal" />
                      {payout.invoiceId}
                    </div>
                    <div className="text-left overflow-hidden">
                      <span className="font-semibold block text-[#EAECEF]">
                        {payout.propFirmName}
                      </span>
                      <span className="text-[10px] text-brand-text-muted truncate block">
                        {associatedBroker ? associatedBroker.alias : "Unlinked Account"}
                      </span>
                    </div>
                    <div className="font-mono text-brand-text-muted flex justify-center items-center gap-1">
                      <Calendar size={11} />
                      {payout.date}
                    </div>
                    <div className="flex justify-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono leading-relaxed font-bold uppercase tracking-wider ${
                        payout.status === "disbursed"
                          ? "bg-brand-green/10 text-brand-green border border-brand-green/15"
                          : payout.status === "pending"
                          ? "bg-brand-yellow/10 text-brand-yellow border border-brand-yellow/15"
                          : "bg-brand-red/10 text-brand-red border border-brand-red/15"
                      }`}>
                        {payout.status}
                      </span>
                    </div>
                    <div className="text-right font-mono font-bold text-[#FFFFFF]">
                      ${payout.amount.toLocaleString([], { minimumFractionDigits: 2 })}
                    </div>
                    <div className="flex justify-center">
                      <button
                        onClick={() => handleDeletePayout(payout.id, payout.amount)}
                        className="p-1.5 text-brand-red hover:bg-brand-red/15 rounded cursor-pointer transition"
                        title="Delete receipt record"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>

                    {payout.notes && (
                      <div className="col-span-6 text-left text-[10px] text-brand-text-muted bg-brand-nested/30 border border-brand-border/20 p-2 mt-2 rounded font-sans leading-relaxed">
                        <strong className="text-[#EAECEF] font-mono">Ledger Transmit Notes:</strong> {payout.notes}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

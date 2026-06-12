import React, { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import DashboardTab from "./components/DashboardTab";
import JournalTab from "./components/JournalTab";
import TradingViewTab from "./components/TradingViewTab";
import NotepadTab from "./components/NotepadTab";
import AiAnalysisTab from "./components/AiAnalysisTab";
import OtherTab, { OtherSubTab } from "./components/OtherTab";
import { JournalEntry, NotepadContent, NewsEvent, ActiveTab, UserProfile, InstrumentConfig, SUPPORTED_INSTRUMENTS, BrokerConnection, PropFirmPayout } from "./types";
import { Bell, X, Info, ShieldAlert, Sparkles } from "lucide-react";
import { supabase, syncDataToSupabase, pullDataFromSupabase } from "./supabase";


// Realistic default brokers for demonstrate stats immediately on first load
const SEED_BROKERS: BrokerConnection[] = [
  {
    id: "broker_seed1",
    alias: "Pepperstone Pro Live",
    brokerName: "Pepperstone",
    accountId: "7029511",
    server: "Pepperstone-Live03",
    platform: "MT5",
    status: "connected",
    lastSync: "2026-06-12 11:30 AM",
  },
  {
    id: "broker_seed2",
    alias: "My FTMO Master 100K",
    brokerName: "FTMO",
    accountId: "4091550",
    server: "FTMO-Server3",
    platform: "MT4",
    status: "connected",
    lastSync: "2026-06-11 05:45 PM",
  },
  {
    id: "broker_seed3",
    alias: "Funding Pips Live Challenge",
    brokerName: "Funding Pips",
    accountId: "120934",
    server: "FundingPips-Live",
    platform: "DXTrade",
    status: "offline",
    lastSync: "2026-06-10 09:12 AM",
  }
];

// Realistic default payouts for demonstrate stats immediately on first load
const SEED_PAYOUTS: PropFirmPayout[] = [
  {
    id: "payout_seed1",
    brokerConnectionId: "broker_seed2",
    propFirmName: "FTMO",
    amount: 8450.00,
    date: "2026-05-15",
    status: "disbursed",
    invoiceId: "INV-FTMO-88491",
    notes: "80% profit split processed on second cycle. Transferred via Deel.",
  },
  {
    id: "payout_seed2",
    brokerConnectionId: "broker_seed2",
    propFirmName: "FTMO",
    amount: 11200.00,
    date: "2026-06-01",
    status: "disbursed",
    invoiceId: "INV-FTMO-90234",
    notes: "Met 100k account milestone split. Transferred successfully.",
  },
  {
    id: "payout_seed3",
    brokerConnectionId: "broker_seed3",
    propFirmName: "Funding Pips",
    amount: 3450.00,
    date: "2026-06-10",
    status: "disbursed",
    invoiceId: "FP-9284-A",
    notes: "First payout cycle completed. Seamless cryptocoin disbursement.",
  },
  {
    id: "payout_seed4",
    brokerConnectionId: "broker_seed1",
    propFirmName: "Pepperstone",
    amount: 5120.00,
    date: "2026-06-11",
    status: "pending",
    invoiceId: "PEP-TX-49219",
    notes: "Initiated bank wire transfer from live personal equity account.",
  }
];

// 3 Realistic initial seed files to demonstrate stats immediately on first load
const SEED_ENTRIES: JournalEntry[] = [
  {
    id: "seed_1",
    date: "2026-06-11T14:30:00-07:00",
    instrument: "XAUUSD",
    account: "Personal Live",
    entryPrice: 2345.5,
    exitPrice: 2355.2,
    lotSize: 1.0,
    stopLoss: 2339.0,
    takeProfit: 2360.0,
    result: "win",
    profitLoss: 970.0,
    notes: "Perfect retest of structural order block on 15m. Conjoined with psychological level 2345. Price rallied straight to targets without sliding stop losses.",
  },
  {
    id: "seed_2",
    date: "2026-06-12T08:15:00-07:00",
    instrument: "EURUSD",
    account: "Personal Live",
    entryPrice: 1.0895,
    exitPrice: 1.0855,
    lotSize: 2.0,
    stopLoss: 1.092,
    takeProfit: 1.081,
    result: "loss",
    profitLoss: -800.0,
    notes: "Attempted swing short, but failed to notice early London session liquidity sweep. Stop Loss was hit cleanly. Need to watch high-timeframe order flows better.",
  },
  {
    id: "seed_3",
    date: "2026-06-12T10:00:00-07:00",
    instrument: "GBPUSD",
    account: "Personal Live",
    entryPrice: 1.251,
    exitPrice: 1.2545,
    lotSize: 1.5,
    stopLoss: 1.248,
    takeProfit: 1.258,
    result: "win",
    profitLoss: 525.0,
    notes: "Engaged short-term scalp following bounce on high-timeframe demand lines. Exited position manually prior to upcoming high impact releases.",
  }
];

interface ToastAlert {
  id: string;
  title: string;
  details?: string;
  type: "info" | "success" | "warning";
}

export default function App() {
  const [activeTab, setActiveTabInternal] = useState<ActiveTab>("dashboard");
  const [otherSubTab, setOtherSubTab] = useState<OtherSubTab>("calendar");

  const setActiveTab = (tab: ActiveTab, subTab?: OtherSubTab) => {
    setActiveTabInternal(tab);
    if (subTab) {
      setOtherSubTab(subTab);
    }
  };

  // Multi-Profile Workspace Tracker States
  const [profilesList, setProfilesList] = useState<Array<{ id: string; username: string; avatarInitial: string; }>>(() => {
    const raw = localStorage.getItem("pixel_profiles_list");
    return raw ? JSON.parse(raw) : [
      { id: "default", username: "Aegis_Trader", avatarInitial: "AT" }
    ];
  });

  const [activeProfileId, setActiveProfileId] = useState<string>(() => {
    return localStorage.getItem("pixel_active_profile_id") || "default";
  });

  // Supabase Sync States
  const [sessionUser, setSessionUser] = useState<any>(null);
  const [isSyncingCloud, setIsSyncingCloud] = useState<boolean>(false);
  const [autoSync, setAutoSync] = useState<boolean>(() => {
    const raw = localStorage.getItem("pixel_auto_sync") || localStorage.getItem("nexus_auto_sync");
    return raw === "true";
  });

  // 1. Core Data States with Local Cache fallback
  const [entries, setEntries] = useState<JournalEntry[]>(() => {
    const profileId = localStorage.getItem("pixel_active_profile_id") || "default";
    const prefix = `pixel_${profileId}_`;
    const raw = localStorage.getItem(prefix + "journal_entries");
    if (raw) return JSON.parse(raw);
    
    if (profileId === "default") {
      const legacy = localStorage.getItem("pixel_journal_entries") || localStorage.getItem("nexus_journal_entries");
      if (legacy) return JSON.parse(legacy);
    }
    return profileId === "default" ? SEED_ENTRIES : [];
  });

  const [profile, setProfile] = useState<UserProfile>(() => {
    const profileId = localStorage.getItem("pixel_active_profile_id") || "default";
    const prefix = `pixel_${profileId}_`;
    const raw = localStorage.getItem(prefix + "profile");
    if (raw) return JSON.parse(raw);

    if (profileId === "default") {
      const legacy = localStorage.getItem("pixel_profile") || localStorage.getItem("nexus_profile");
      if (legacy) return JSON.parse(legacy);
    }

    const rawList = localStorage.getItem("pixel_profiles_list");
    const pList = rawList ? JSON.parse(rawList) : [{ id: "default", username: "Aegis_Trader" }];
    const match = pList.find((p: any) => p.id === profileId);

    return {
      username: match?.username || "Aegis_Trader",
      avatarInitial: match?.avatarInitial || (match?.username ? match.username.substring(0, 2).toUpperCase() : "AT"),
      defaultAccount: "Personal Live",
      email: `${(match?.username || "Aegis_Trader").toLowerCase().replace(/\s+/g, "")}@terminal.io`,
      tradingGoal: "Risk limits at 1% per slot. Maintain consistent setups.",
      avgRiskPerTrade: 1.5
    };
  });

  const [instruments, setInstruments] = useState<InstrumentConfig[]>(() => {
    const profileId = localStorage.getItem("pixel_active_profile_id") || "default";
    const prefix = `pixel_${profileId}_`;
    const raw = localStorage.getItem(prefix + "instruments");
    if (raw) return JSON.parse(raw);

    if (profileId === "default") {
      const legacy = localStorage.getItem("pixel_instruments") || localStorage.getItem("nexus_instruments");
      if (legacy) return JSON.parse(legacy);
    }
    return SUPPORTED_INSTRUMENTS;
  });

  const [brokers, setBrokers] = useState<BrokerConnection[]>(() => {
    const profileId = localStorage.getItem("pixel_active_profile_id") || "default";
    const prefix = `pixel_${profileId}_`;
    const raw = localStorage.getItem(prefix + "brokers");
    if (raw) return JSON.parse(raw);

    if (profileId === "default") {
      const legacy = localStorage.getItem("pixel_brokers") || localStorage.getItem("nexus_brokers");
      if (legacy) return JSON.parse(legacy);
    }
    return profileId === "default" ? SEED_BROKERS : [];
  });

  const [payouts, setPayouts] = useState<PropFirmPayout[]>(() => {
    const profileId = localStorage.getItem("pixel_active_profile_id") || "default";
    const prefix = `pixel_${profileId}_`;
    const raw = localStorage.getItem(prefix + "payouts");
    if (raw) return JSON.parse(raw);

    if (profileId === "default") {
      const legacy = localStorage.getItem("pixel_payouts") || localStorage.getItem("nexus_payouts");
      if (legacy) return JSON.parse(legacy);
    }
    return profileId === "default" ? SEED_PAYOUTS : [];
  });

  const [startingBalance, setStartingBalance] = useState<number>(() => {
    const profileId = localStorage.getItem("pixel_active_profile_id") || "default";
    const prefix = `pixel_${profileId}_`;
    const raw = localStorage.getItem(prefix + "starting_balance");
    if (raw) return parseFloat(raw);

    if (profileId === "default") {
      const legacy = localStorage.getItem("pixel_starting_balance") || localStorage.getItem("nexus_starting_balance");
      if (legacy) return parseFloat(legacy);
    }
    return 10000;
  });

  const [manualBalance, setManualBalance] = useState<number>(() => {
    const profileId = localStorage.getItem("pixel_active_profile_id") || "default";
    const prefix = `pixel_${profileId}_`;
    const raw = localStorage.getItem(prefix + "manual_balance");
    if (raw) return parseFloat(raw);

    if (profileId === "default") {
      const legacy = localStorage.getItem("pixel_manual_balance") || localStorage.getItem("nexus_manual_balance");
      if (legacy) return parseFloat(legacy);
    }
    return 10000;
  });

  const [notepad, setNotepad] = useState<NotepadContent>(() => {
    const profileId = localStorage.getItem("pixel_active_profile_id") || "default";
    const prefix = `pixel_${profileId}_`;
    const raw = localStorage.getItem(prefix + "notepad");
    if (raw) return JSON.parse(raw);

    if (profileId === "default") {
      const legacy = localStorage.getItem("pixel_notepad") || localStorage.getItem("nexus_notepad");
      if (legacy) return JSON.parse(legacy);
    }
    
    const rawList = localStorage.getItem("pixel_profiles_list");
    const pList = rawList ? JSON.parse(rawList) : [{ id: "default", username: "Aegis_Trader" }];
    const match = pList.find((p: any) => p.id === profileId);
    const label = (match?.username || "PIXEL").toUpperCase();

    return {
      text: `## ${label} PERSONAL TRADING LAWS\n- Keep risk confined to 1% per transaction.\n- Prioritize sleep and clear mental checks before trading.\n- Document everything. Check weekly audits strictly.`,
      updatedAt: "12:00 PM",
    };
  });

  // 2. News Feed States
  const [newsList, setNewsList] = useState<NewsEvent[]>([]);
  const [isLoadingNews, setIsLoadingNews] = useState(false);
  const [newsAlertCount, setNewsAlertCount] = useState(0);

  // 3. Floating Toast Banner Queue State
  const [toasts, setToasts] = useState<ToastAlert[]>([]);

  // Function to spawn dynamic alerts inside the system visually
  const spawnToast = (title: string, details?: string, type: "info" | "success" | "warning" = "info") => {
    const toastId = Math.random().toString();
    setToasts((prev) => [...prev, { id: toastId, title, details, type }]);
    
    // Auto-destruct alerts after 6 seconds to avoid blocking the viewport
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== toastId));
    }, 6000);
  };

  const handleDismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Sync to localStorage whenever values morph for the active profile
  useEffect(() => {
    localStorage.setItem(`pixel_${activeProfileId}_journal_entries`, JSON.stringify(entries));
    if (activeProfileId === "default") {
      localStorage.setItem("pixel_journal_entries", JSON.stringify(entries));
    }
  }, [entries, activeProfileId]);

  useEffect(() => {
    localStorage.setItem(`pixel_${activeProfileId}_profile`, JSON.stringify(profile));
    if (activeProfileId === "default") {
      localStorage.setItem("pixel_profile", JSON.stringify(profile));
    }

    // Propagate username change back into profilesList live!
    setProfilesList((prev) => {
      const idx = prev.findIndex(p => p.id === activeProfileId);
      if (idx !== -1 && prev[idx].username !== profile.username) {
        const next = [...prev];
        next[idx] = {
          ...next[idx],
          username: profile.username,
          avatarInitial: profile.avatarInitial || (profile.username ? profile.username.substring(0, 2).toUpperCase() : "AT")
        };
        localStorage.setItem("pixel_profiles_list", JSON.stringify(next));
        return next;
      }
      return prev;
    });
  }, [profile, activeProfileId]);

  useEffect(() => {
    localStorage.setItem(`pixel_${activeProfileId}_instruments`, JSON.stringify(instruments));
    if (activeProfileId === "default") {
      localStorage.setItem("pixel_instruments", JSON.stringify(instruments));
    }
  }, [instruments, activeProfileId]);

  useEffect(() => {
    localStorage.setItem(`pixel_${activeProfileId}_brokers`, JSON.stringify(brokers));
    if (activeProfileId === "default") {
      localStorage.setItem("pixel_brokers", JSON.stringify(brokers));
    }
  }, [brokers, activeProfileId]);

  useEffect(() => {
    localStorage.setItem(`pixel_${activeProfileId}_payouts`, JSON.stringify(payouts));
    if (activeProfileId === "default") {
      localStorage.setItem("pixel_payouts", JSON.stringify(payouts));
    }
  }, [payouts, activeProfileId]);

  useEffect(() => {
    localStorage.setItem(`pixel_${activeProfileId}_starting_balance`, startingBalance.toString());
    if (activeProfileId === "default") {
      localStorage.setItem("pixel_starting_balance", startingBalance.toString());
    }
  }, [startingBalance, activeProfileId]);

  useEffect(() => {
    localStorage.setItem(`pixel_${activeProfileId}_manual_balance`, manualBalance.toString());
    if (activeProfileId === "default") {
      localStorage.setItem("pixel_manual_balance", manualBalance.toString());
    }
  }, [manualBalance, activeProfileId]);

  useEffect(() => {
    localStorage.setItem(`pixel_${activeProfileId}_notepad`, JSON.stringify(notepad));
    if (activeProfileId === "default") {
      localStorage.setItem("pixel_notepad", JSON.stringify(notepad));
    }
  }, [notepad, activeProfileId]);

  useEffect(() => {
    localStorage.setItem("pixel_auto_sync", autoSync.toString());
  }, [autoSync]);

  // Dynamic Workspace Loader: Triggered when user selects a different profile workspace
  useEffect(() => {
    const prefix = `pixel_${activeProfileId}_`;
    localStorage.setItem("pixel_active_profile_id", activeProfileId);

    // 1. Load Profile
    const rawProfile = localStorage.getItem(prefix + "profile");
    if (rawProfile) {
      setProfile(JSON.parse(rawProfile));
    } else {
      if (activeProfileId === "default") {
        const legacy = localStorage.getItem("pixel_profile") || localStorage.getItem("nexus_profile");
        if (legacy) setProfile(JSON.parse(legacy));
      } else {
        const match = profilesList.find(p => p.id === activeProfileId);
        setProfile({
          username: match?.username || "Aegis_Trader",
          avatarInitial: match?.avatarInitial || "AT",
          defaultAccount: "Personal Live",
          email: `${(match?.username || "Aegis_Trader").toLowerCase().replace(/\s+/g, "")}@terminal.io`,
          tradingGoal: "Risk limits at 1% per slot. Maintain consistent setups.",
          avgRiskPerTrade: 1.5
        });
      }
    }

    // 2. Load Entries
    const rawEntries = localStorage.getItem(prefix + "journal_entries");
    if (rawEntries) {
      setEntries(JSON.parse(rawEntries));
    } else {
      if (activeProfileId === "default") {
        const legacy = localStorage.getItem("pixel_journal_entries") || localStorage.getItem("nexus_journal_entries");
        if (legacy) setEntries(JSON.parse(legacy));
      } else {
        setEntries([]);
      }
    }

    // 3. Load Brokers
    const rawBrokers = localStorage.getItem(prefix + "brokers");
    if (rawBrokers) {
      setBrokers(JSON.parse(rawBrokers));
    } else {
      if (activeProfileId === "default") {
        const legacy = localStorage.getItem("pixel_brokers") || localStorage.getItem("nexus_brokers");
        if (legacy) setBrokers(JSON.parse(legacy));
      } else {
        setBrokers([]);
      }
    }

    // 4. Load Payouts
    const rawPayouts = localStorage.getItem(prefix + "payouts");
    if (rawPayouts) {
      setPayouts(JSON.parse(rawPayouts));
    } else {
      if (activeProfileId === "default") {
        const legacy = localStorage.getItem("pixel_payouts") || localStorage.getItem("nexus_payouts");
        if (legacy) setPayouts(JSON.parse(legacy));
      } else {
        setPayouts([]);
      }
    }

    // 5. Load starting balance
    const rawStart = localStorage.getItem(prefix + "starting_balance");
    if (rawStart) {
      setStartingBalance(parseFloat(rawStart));
    } else {
      if (activeProfileId === "default") {
        const legacy = localStorage.getItem("pixel_starting_balance") || localStorage.getItem("nexus_starting_balance");
        if (legacy) setStartingBalance(parseFloat(legacy));
      } else {
        setStartingBalance(10000);
      }
    }

    // 6. Load manual balance
    const rawManual = localStorage.getItem(prefix + "manual_balance");
    if (rawManual) {
      setManualBalance(parseFloat(rawManual));
    } else {
      if (activeProfileId === "default") {
        const legacy = localStorage.getItem("pixel_manual_balance") || localStorage.getItem("nexus_manual_balance");
        if (legacy) setManualBalance(parseFloat(legacy));
      } else {
        setManualBalance(10000);
      }
    }

    // 7. Load Notepad
    const rawNotepad = localStorage.getItem(prefix + "notepad");
    if (rawNotepad) {
      setNotepad(JSON.parse(rawNotepad));
    } else {
      if (activeProfileId === "default") {
        const legacy = localStorage.getItem("pixel_notepad") || localStorage.getItem("nexus_notepad");
        if (legacy) setNotepad(JSON.parse(legacy));
      } else {
        const match = profilesList.find(p => p.id === activeProfileId);
        const label = (match?.username || "PIXEL").toUpperCase();
        setNotepad({
          text: `## ${label} PERSONAL TRADING LAWS\n- Keep risk confined to 1% per transaction.\n- Prioritize sleep and clear mental checks before trading.\n- Document everything. Check weekly audits strictly.`,
          updatedAt: "12:00 PM",
        });
      }
    }
  }, [activeProfileId]);

  // Handlers for profile creation and deletion
  const handleCreateNewProfile = (username: string) => {
    const trimmed = username.trim();
    if (!trimmed) return;
    
    // Check duplicates
    if (profilesList.some(p => p.username.toLowerCase() === trimmed.toLowerCase())) {
      spawnToast("Profile Exists", `A profile named "${trimmed}" already exists.`, "warning");
      return;
    }

    const id = "profile_" + Date.now().toString(36);
    const initials = trimmed.substring(0, 2).toUpperCase();
    const newPr = { id, username: trimmed, avatarInitial: initials };

    const updated = [...profilesList, newPr];
    setProfilesList(updated);
    localStorage.setItem("pixel_profiles_list", JSON.stringify(updated));

    // Instantly switch values
    setActiveProfileId(id);
    spawnToast("Workspace Ready", `Profile for "${trimmed}" was crafted successfully. Switched active terminal workspace.`, "success");
  };

  const handleDeleteProfile = (id: string) => {
    if (id === "default") {
      spawnToast("Access Denied", "The baseline default profile cannot be removed.", "warning");
      return;
    }

    const matched = profilesList.find(p => p.id === id);
    if (!matched) return;

    if (window.confirm(`Are you absolutely sure you want to delete profile "${matched.username}" and wipe all associated trades and notepad records?`)) {
      const prefix = `pixel_${id}_`;
      localStorage.removeItem(prefix + "profile");
      localStorage.removeItem(prefix + "journal_entries");
      localStorage.removeItem(prefix + "brokers");
      localStorage.removeItem(prefix + "payouts");
      localStorage.removeItem(prefix + "starting_balance");
      localStorage.removeItem(prefix + "manual_balance");
      localStorage.removeItem(prefix + "notepad");

      const updated = profilesList.filter(p => p.id !== id);
      setProfilesList(updated);
      localStorage.setItem("pixel_profiles_list", JSON.stringify(updated));

      if (activeProfileId === id) {
        setActiveProfileId("default");
      }
      spawnToast("Clear Success", `Wiped tracking ledger and configuration records for "${matched.username}".`, "info");
    }
  };

  // Listen to Supabase authorization status shifts
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSessionUser(session?.user || null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSessionUser(session?.user || null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Automatic Background Cloud Sync effect
  useEffect(() => {
    if (!sessionUser || !autoSync) return;

    const timer = setTimeout(() => {
      syncDataToSupabase(sessionUser.id, profile, entries, brokers, payouts, notepad.text).then((res) => {
        if (res.success) {
          console.log("[Supabase] Auto-synced changes successfully.");
        } else {
          console.warn("[Supabase] Auto-sync background failed:", res.error);
        }
      });
    }, 4000); // 4 seconds delay to debounce multiple keystrokes or quick saves

    return () => clearTimeout(timer);
  }, [entries, profile, brokers, payouts, notepad.text, sessionUser, autoSync]);

  const triggerPushCloud = async (userIdToUse?: string) => {
    const uid = userIdToUse || sessionUser?.id;
    if (!uid) {
      spawnToast("Authentication Required", "Please log in to sync with Supabase Cloud.", "warning");
      return;
    }

    setIsSyncingCloud(true);
    const res = await syncDataToSupabase(uid, profile, entries, brokers, payouts, notepad.text);
    setIsSyncingCloud(false);

    if (res.success) {
      spawnToast(
        "Supabase Synced",
        "Your dynamic ledger values and configuration profiles were safely uploaded to Supabase.",
        "success"
      );
    } else {
      if (res.error === "table_missing" || (res.error && String(res.error).includes("relation")) || (res.details && String(res.details).includes("relation"))) {
        spawnToast(
          "Setup Required",
          "Supabase tables are not created. Please deploy the SQL script shown in settings.",
          "warning"
        );
      } else {
        spawnToast("Sync Failed", res.details || (typeof res.error === "string" ? res.error : "An error occurred during database transmission."), "warning");
      }
    }
  };

  const triggerPullCloud = async (userIdToUse?: string) => {
    const uid = userIdToUse || sessionUser?.id;
    if (!uid) {
      spawnToast("Authentication Required", "Please log in to pull from Supabase Cloud.", "warning");
      return;
    }

    setIsSyncingCloud(true);
    const res = await pullDataFromSupabase(uid);
    setIsSyncingCloud(false);

    if (res.success) {
      if (res.profile) setProfile(res.profile);
      if (res.entries) setEntries(res.entries);
      if (res.brokers) setBrokers(res.brokers);
      if (res.payouts) setPayouts(res.payouts);
      if (res.notepadText !== undefined) {
        setNotepad({
          text: res.notepadText,
          updatedAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        });
      }
      spawnToast(
        "Cloud Data Pulled",
        "Successfully pulled and synchronized state with active Supabase tables.",
        "success"
      );
    } else {
      if (res.errorType === "table_missing" || (res.error && String(res.error).includes("relation"))) {
        spawnToast(
          "Setup Required",
          "Supabase tables are not created. Please deploy the SQL script shown in settings.",
          "warning"
        );
      } else {
        spawnToast("Pull Failed", res.error || "An error occurred retrieving database tables.", "warning");
      }
    }
  };

  // Fetch News Feed from custom Express server
  const fetchNewsFeed = async () => {
    setIsLoadingNews(true);
    try {
      const res = await fetch("/api/news");
      if (!res.ok) throw new Error("CORS or network error");
      const data = await res.json();
      if (data.news && Array.isArray(data.news)) {
        setNewsList(data.news);
        // Identify upcoming high impact events to alert of
        const upcomingHighCount = data.news.filter(
          (item: NewsEvent) => item.impact === "HIGH"
        ).length;
        setNewsAlertCount(upcomingHighCount);

        // Spawn a banner toast for traders indicating a successful load
        spawnToast("Economic calendar loaded", `Parsed ${data.news.length} releases from server-side Desk.`, "success");
      }
    } catch (err) {
      console.error("Failed to query Express API news, utilizing local fallback:", err);
      // Fallback
      const fallbackNews: NewsEvent[] = [
        {
          id: "fb_1",
          title: "US Core CPI MoM releasing soon - Expect heavy gold whipsaw",
          timestamp: "2026-06-12T13:00:00-07:00",
          source: "Macro Desk Fallback",
          impact: "HIGH",
          currency: "USD",
        },
        {
          id: "fb_2",
          title: "UK GDP prints steady at 0.1%",
          timestamp: "2026-06-12T09:15:00-07:00",
          source: "Macro Desk Fallback",
          impact: "MEDIUM",
          currency: "GBP",
        }
      ];
      setNewsList(fallbackNews);
    } finally {
      setIsLoadingNews(false);
    }
  };

  useEffect(() => {
    fetchNewsFeed();
  }, []);

  // MUTUATORS/ACTIONS FOR ENTRIES

  const handleAddEntry = (entryData: Omit<JournalEntry, "id">) => {
    const newEntry: JournalEntry = {
      ...entryData,
      id: "entry_" + Math.random().toString(36).substring(2, 11),
    };

    setEntries((prev) => [...prev, newEntry]);
    // Automatically compounding pnl to physical manualBalance as well!
    setManualBalance((prev) => prev + entryData.profitLoss);
    spawnToast("Transaction Committed", `Successfully documented ${entryData.instrument} (${entryData.result.toUpperCase()}) to Journal.`, "success");
  };

  const handleEditEntry = (edited: JournalEntry) => {
    setEntries((prev) => {
      // Find previous profitLoss first to properly adjust physical manual balance compound safely!
      const lastRec = prev.find((e) => e.id === edited.id);
      const deltaProfitLoss = lastRec ? edited.profitLoss - lastRec.profitLoss : 0;
      setManualBalance((b) => b + deltaProfitLoss);
      return prev.map((item) => (item.id === edited.id ? edited : item));
    });
    spawnToast("Journal Updated", `Successfully saved changes to transaction record #${edited.id.slice(0,8)}.`, "success");
  };

  const handleDeleteEntry = (id: string) => {
    const matched = entries.find((e) => e.id === id);
    if (matched) {
      setManualBalance((prev) => prev - matched.profitLoss);
    }
    setEntries((prev) => prev.filter((item) => item.id !== id));
    spawnToast("Record Erased", "Successfully cleared the selected transaction log.", "info");
  };

  return (
    <div className="min-h-screen bg-brand-bg flex font-sans text-brand-text select-none">
      {/* 1. SIDEBAR NAVIGATION CONTROLLER */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        newsAlertCount={newsAlertCount}
        profile={profile}
        activeProfileId={activeProfileId}
        setActiveProfileId={setActiveProfileId}
        profilesList={profilesList}
        onCreateNewProfile={handleCreateNewProfile}
        onDeleteProfile={handleDeleteProfile}
      />

      {/* 2. MAIN APPLICATION CONTENT COLUMN */}
      <main className="flex-1 overflow-y-auto px-6 py-6 md:px-10 h-screen bg-brand-bg max-w-[1400px] mx-auto">
        <div id="content-tab-render" className="pb-24">
          {activeTab === "dashboard" && (
            <DashboardTab
              entries={entries}
              startingBalance={startingBalance}
              setStartingBalance={setStartingBalance}
              manualBalance={manualBalance}
              setManualBalance={setManualBalance}
              onDeleteEntry={handleDeleteEntry}
            />
          )}

          {activeTab === "journal" && (
            <JournalTab
              entries={entries}
              onAddEntry={handleAddEntry}
              onEditEntry={handleEditEntry}
              onDeleteEntry={handleDeleteEntry}
            />
          )}

          {activeTab === "tradingview" && (
            <TradingViewTab />
          )}

          {activeTab === "notepad" && (
            <NotepadTab notepad={notepad} setNotepad={setNotepad} />
          )}

          {activeTab === "ai-analysis" && <AiAnalysisTab entries={entries} />}

          {activeTab === "other" && (
            <OtherTab
              currentSubTab={otherSubTab}
              setCurrentSubTab={setOtherSubTab}
              entries={entries}
              onAddEntry={handleAddEntry}
              onEditEntry={handleEditEntry}
              instruments={instruments}
              setInstruments={setInstruments}
              brokers={brokers}
              setBrokers={setBrokers}
              payouts={payouts}
              setPayouts={setPayouts}
              triggerStaticToast={spawnToast}
              profile={profile}
              setProfile={setProfile}
              sessionUser={sessionUser}
              setSessionUser={setSessionUser}
              autoSync={autoSync}
              setAutoSync={setAutoSync}
              isSyncingCloud={isSyncingCloud}
              triggerPushCloud={triggerPushCloud}
              triggerPullCloud={triggerPullCloud}
              notepadText={notepad.text}
            />
          )}
        </div>
      </main>

      {/* FLOATING ABSOLUTE OVERLAY TOAST SYSTEM */}
      <div className="fixed bottom-6 right-6 z-55 max-w-sm space-y-3 pointer-events-none">
        {toasts.map((toast) => {
          return (
            <div
              key={toast.id}
              className={`p-4 rounded-lg border pointer-events-auto flex gap-3 shadow-2xl transform animate-in slide-in-from-bottom-5 duration-300 bg-brand-card ${
                toast.type === "success"
                  ? "border-brand-green/20 shadow-brand-green/5"
                  : toast.type === "warning"
                  ? "border-brand-red/20 shadow-brand-red/5"
                  : "border-brand-border shadow-black/80"
              }`}
            >
              <div
                className={`p-1.5 h-8 w-8 rounded flex items-center justify-center text-xs mt-0.5 ${
                  toast.type === "success"
                    ? "bg-brand-green/10 text-brand-green"
                    : toast.type === "warning"
                    ? "bg-brand-red/10 text-brand-red"
                    : "bg-brand-nested text-brand-teal"
                }`}
              >
                {toast.type === "success" ? (
                  <Sparkles size={16} />
                ) : toast.type === "warning" ? (
                  <ShieldAlert size={16} />
                ) : (
                  <Info size={16} />
                )}
              </div>

              <div className="flex-1 space-y-0.5">
                <h5 className="text-xs font-bold text-brand-text font-sans">{toast.title}</h5>
                {toast.details && (
                  <p className="text-[11px] text-brand-text-muted leading-normal font-sans">
                    {toast.details}
                  </p>
                )}
              </div>

              <button
                onClick={() => handleDismissToast(toast.id)}
                className="text-brand-text-muted hover:text-brand-text p-0.5 rounded focus:outline-none h-fit cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

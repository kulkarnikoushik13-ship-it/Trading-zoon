import React from "react";
import {
  Calendar as CalendarIcon,
  Image as ImageIcon,
  Calculator as CalculatorIcon,
  Wallet as WalletIcon,
  Settings as SettingsIcon,
} from "lucide-react";

import CalendarTab from "./CalendarTab";
import ScreenshotsTab from "./ScreenshotsTab";
import CalculatorsTab from "./CalculatorsTab";
import BrokerPayoutsTab from "./BrokerPayoutsTab";
import SettingsTab from "./SettingsTab";

import { JournalEntry, InstrumentConfig, UserProfile, BrokerConnection, PropFirmPayout } from "../types";

export type OtherSubTab = "calendar" | "screenshots" | "calculators" | "broker-payouts" | "settings";

interface OtherTabProps {
  currentSubTab: OtherSubTab;
  setCurrentSubTab: (tab: OtherSubTab) => void;
  entries: JournalEntry[];
  onAddEntry: (entry: Omit<JournalEntry, "id">) => void;
  onEditEntry: (entry: JournalEntry) => void;
  instruments: InstrumentConfig[];
  setInstruments: (instruments: InstrumentConfig[]) => void;
  brokers: BrokerConnection[];
  setBrokers: React.Dispatch<React.SetStateAction<BrokerConnection[]>>;
  payouts: PropFirmPayout[];
  setPayouts: React.Dispatch<React.SetStateAction<PropFirmPayout[]>>;
  triggerStaticToast: (title: string, details: string, type: "info" | "success" | "warning") => void;
  profile: UserProfile;
  setProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
  sessionUser: any;
  setSessionUser: (user: any) => void;
  autoSync: boolean;
  setAutoSync: (val: boolean) => void;
  isSyncingCloud: boolean;
  triggerPushCloud: (userId?: string) => Promise<void>;
  triggerPullCloud: (userId?: string) => Promise<void>;
  notepadText: string;
}

export default function OtherTab({
  currentSubTab,
  setCurrentSubTab,
  entries,
  onAddEntry,
  onEditEntry,
  instruments,
  setInstruments,
  brokers,
  setBrokers,
  payouts,
  setPayouts,
  triggerStaticToast,
  profile,
  setProfile,
  sessionUser,
  setSessionUser,
  autoSync,
  setAutoSync,
  isSyncingCloud,
  triggerPushCloud,
  triggerPullCloud,
  notepadText,
}: OtherTabProps) {
  const tabs = [
    {
      id: "calendar" as const,
      label: "Trading Calendar",
      desc: "Track daily wins & historical calendar views",
      icon: CalendarIcon,
    },
    {
      id: "screenshots" as const,
      label: "Screenshot Vault",
      desc: "Manage visual trade setups & execution proof",
      icon: ImageIcon,
    },
    {
      id: "calculators" as const,
      label: "Calculators",
      desc: "Risk, lot sizing, and pip value calculators",
      icon: CalculatorIcon,
    },
    {
      id: "broker-payouts" as const,
      label: "Brokers & Payouts",
      desc: "Configure broker feeds and prop firm payouts",
      icon: WalletIcon,
    },
    {
      id: "settings" as const,
      label: "Profile & Settings",
      desc: "Update dynamic profiles & cloud sync parameters",
      icon: SettingsIcon,
    },
  ];

  return (
    <div className="space-y-6" id="other-tools-container">
      {/* 1. Header Hub */}
      <div>
        <h2 className="text-xl font-sans font-bold tracking-tight text-brand-text">Other Terminal Tools</h2>
        <p className="text-xs text-brand-text-muted mt-1">
          Access high-performance utilities, configuration layers, calculators, and system settings.
        </p>
      </div>

      {/* 2. Visual Selector Grid (Simple & Quick Navigation Card deck) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3" id="other-tools-selector-grid">
        {tabs.map((tab) => {
          const IconComponent = tab.icon;
          const isActive = currentSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setCurrentSubTab(tab.id)}
              className={`text-left p-4 rounded-lg border transition-all relative overflow-hidden group cursor-pointer ${
                isActive
                  ? "bg-brand-card border-brand-teal shadow-lg shadow-brand-teal/5"
                  : "bg-brand-card/50 border-brand-border/60 hover:border-brand-teal/50 hover:bg-brand-card"
              }`}
            >
              {isActive && (
                <div className="absolute top-0 left-0 right-0 h-1 bg-brand-teal animate-in fade-in duration-200" />
              )}
              <div className="flex items-center gap-2 mb-2">
                <div
                  className={`p-1.5 rounded ${
                    isActive ? "bg-brand-teal/10 text-brand-teal" : "bg-[#1E222A] text-brand-text-muted"
                  }`}
                >
                  <IconComponent size={16} />
                </div>
                <span
                  className={`text-xs font-bold leading-none font-mono tracking-wide ${
                    isActive ? "text-brand-text" : "text-brand-text-muted group-hover:text-brand-text"
                  }`}
                >
                  {tab.label}
                </span>
              </div>
              <p className="text-[10px] text-brand-text-muted leading-relaxed line-clamp-2">
                {tab.desc}
              </p>
            </button>
          );
        })}
      </div>

      {/* 3. Render the active sub-tab component with a beautiful separating line */}
      <div className="border-t border-brand-border/40 pt-6" id="other-active-subtab-viewer">
        {currentSubTab === "calendar" && (
          <CalendarTab entries={entries} onAddEntry={onAddEntry} />
        )}

        {currentSubTab === "screenshots" && (
          <ScreenshotsTab entries={entries} onEditEntry={onEditEntry} />
        )}

        {currentSubTab === "calculators" && (
          <CalculatorsTab instruments={instruments} />
        )}

        {currentSubTab === "broker-payouts" && (
          <BrokerPayoutsTab
            brokers={brokers}
            setBrokers={setBrokers}
            payouts={payouts}
            setPayouts={setPayouts}
            triggerStaticToast={triggerStaticToast}
          />
        )}

        {currentSubTab === "settings" && (
          <SettingsTab
            profile={profile}
            setProfile={setProfile}
            instruments={instruments}
            setInstruments={setInstruments}
            entries={entries}
            triggerStaticToast={triggerStaticToast}
            sessionUser={sessionUser}
            setSessionUser={setSessionUser}
            autoSync={autoSync}
            setAutoSync={setAutoSync}
            isSyncingCloud={isSyncingCloud}
            triggerPushCloud={triggerPushCloud}
            triggerPullCloud={triggerPullCloud}
            notepadText={notepadText}
          />
        )}
      </div>
    </div>
  );
}

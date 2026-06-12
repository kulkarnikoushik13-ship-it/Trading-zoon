import React, { useState } from "react";
import {
  LayoutDashboard,
  BookOpen,
  FileText,
  Brain,
  Calculator,
  Calendar,
  TrendingUp,
  CircleAlert,
  Image,
  Settings,
  User,
  Wallet,
  Trash2,
  ChevronUp,
} from "lucide-react";
import { ActiveTab, UserProfile } from "../types";

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab, subTab?: any) => void;
  newsAlertCount: number;
  profile: UserProfile;
  activeProfileId: string;
  setActiveProfileId: (id: string) => void;
  profilesList: Array<{ id: string; username: string; avatarInitial: string; }>;
  onCreateNewProfile: (username: string) => void;
  onDeleteProfile: (id: string) => void;
}

export default function Sidebar({
  activeTab,
  setActiveTab,
  newsAlertCount,
  profile,
  activeProfileId,
  setActiveProfileId,
  profilesList,
  onCreateNewProfile,
  onDeleteProfile,
}: SidebarProps) {
  const [showProfileSelector, setShowProfileSelector] = useState(false);
  const [newProfileName, setNewProfileName] = useState("");

  const navItems = [
    { id: "dashboard" as const, label: "Dashboard", icon: LayoutDashboard },
    { id: "journal" as const, label: "Trade Journal", icon: BookOpen },
    { id: "tradingview" as const, label: "TradingView Charts", icon: TrendingUp },
    { id: "notepad" as const, label: "Notepad", icon: FileText },
    { id: "ai-analysis" as const, label: "AI Analysis", icon: Brain },
    { id: "other" as const, label: "Other Tools", icon: Settings },
  ];

  return (
    <aside
      id="side-bar-navigation"
      className="w-64 bg-brand-card border-r border-brand-border flex flex-col justify-between h-screen sticky top-0 text-brand-text"
    >
      <div>
        {/* Trading Dashboard Branding Header */}
        <div className="p-6 border-b border-brand-border flex items-center gap-3">
          <div className="w-8 h-8 bg-brand-teal rounded flex items-center justify-center font-extrabold text-brand-bg font-sans">
            P
          </div>
          <div>
            <h1 className="font-sans font-bold tracking-tight text-brand-text text-base">
              Pixel<span className="text-brand-teal">.X</span>
            </h1>
            <p className="text-[10px] font-mono text-brand-text-muted tracking-widest">PRIVATE TERMINAL</p>
          </div>
        </div>

        {/* Navigation lists */}
        <nav className="py-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`sidebar-tab-${item.id}`}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-6 py-3 text-sm transition-colors group cursor-pointer ${
                  isActive
                    ? "bg-[#2B3139] text-brand-teal border-l-4 border-brand-teal font-medium"
                    : "text-brand-text-muted hover:text-brand-text hover:bg-brand-nested"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    size={16}
                    className={`transition-colors ${
                      isActive ? "text-brand-teal" : "text-brand-text-muted group-hover:text-brand-text"
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer credits / status details matching Design HTML */}
      <div className="p-5 border-t border-brand-border mt-auto text-xs text-brand-text-muted bg-brand-card/30 space-y-3 relative" id="sidebar-footer-container">
        
        {/* Dropup Multi-Profile Selector Menu */}
        {showProfileSelector && (
          <div className="absolute bottom-[105%] left-3 right-3 bg-[#11141A] border border-brand-border rounded-lg p-3 shadow-2xl z-55 space-y-2.5 font-sans animate-in fade-in slide-in-from-bottom-2 duration-150" id="profile-dropup-menu">
            <div className="flex items-center justify-between text-[10px] text-[#848E9C] font-bold pb-1.5 border-b border-brand-border/40 font-mono tracking-wider">
              <span>TRADER WORKSPACE</span>
              <button 
                type="button"
                onClick={(e) => { e.stopPropagation(); setShowProfileSelector(false); }}
                className="text-brand-teal hover:text-brand-text font-normal font-mono cursor-pointer text-[10px]"
              >
                [CLOSE]
              </button>
            </div>
            
            {/* List of profiles */}
            <div className="space-y-1 max-h-36 overflow-y-auto pr-0.5 custom-scrollbar" id="profiles-picker-list">
              {profilesList.map((p) => {
                const isActive = p.id === activeProfileId;
                return (
                  <div 
                    key={p.id}
                    className={`flex items-center justify-between p-1.5 rounded transition cursor-pointer text-xs ${
                      isActive 
                        ? "bg-brand-teal/10 border border-brand-teal/30 text-brand-text" 
                        : "hover:bg-[#2B3139]/40 text-brand-text-muted hover:text-brand-text"
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveProfileId(p.id);
                      setShowProfileSelector(false);
                    }}
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <span className="w-5 h-5 rounded-full bg-brand-bg text-brand-teal font-extrabold flex items-center justify-center text-[9px] uppercase border border-brand-border shrink-0">
                        {p.avatarInitial}
                      </span>
                      <span className="truncate font-semibold text-[11px]">{p.username}</span>
                    </div>
                    
                    <div className="flex items-center gap-1.5 shrink-0">
                      {isActive && (
                        <span className="text-[8px] bg-brand-teal/20 text-brand-teal border border-brand-teal/30 px-1 py-0.5 rounded font-mono font-bold">
                          ACTIVE
                        </span>
                      )}
                      {p.id !== "default" && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteProfile(p.id);
                          }}
                          className="text-brand-text-muted hover:text-brand-red opacity-60 hover:opacity-100 transition p-0.5 rounded cursor-pointer"
                          title="Delete profile"
                        >
                          <Trash2 size={11} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Create new profile inline field */}
            <div className="border-t border-brand-border/30 pt-2 bg-[#11141A]" id="new-profile-form-area">
              <div className="text-[9px] text-[#848E9C] mb-1 font-mono uppercase tracking-wider">Add Profile / Brother</div>
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  const qInput = e.currentTarget.elements.namedItem("profileName") as HTMLInputElement;
                  const val = qInput?.value;
                  if (val && val.trim()) {
                    onCreateNewProfile(val);
                    if (qInput) qInput.value = "";
                  }
                }}
                className="flex gap-1"
                onClick={(e) => e.stopPropagation()}
              >
                <input 
                  type="text"
                  name="profileName"
                  placeholder="e.g. Brother..."
                  required
                  maxLength={15}
                  className="bg-brand-bg border border-brand-border rounded px-1.5 py-1 text-[11px] text-brand-text placeholder-brand-text-muted/40 focus:outline-none focus:border-brand-teal/60 flex-1 font-sans"
                />
                <button 
                  type="submit"
                  className="bg-brand-teal text-brand-bg px-2 rounded font-mono font-bold text-[10px] hover:bg-opacity-90 active:scale-95 transition cursor-pointer"
                >
                  ADD
                </button>
              </form>
            </div>

            {/* Link to settings */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowProfileSelector(false);
                setActiveTab("other", "settings");
              }}
              className="w-full text-center py-1 text-[10px] text-brand-teal hover:underline mt-1 font-mono uppercase tracking-wider flex items-center justify-center gap-1 border-t border-brand-border/20 pt-1.5 cursor-pointer"
            >
              Edit Details & Settings →
            </button>
          </div>
        )}

        {/* User Profile Summary Card */}
        <div 
          onClick={() => setShowProfileSelector(!showProfileSelector)}
          className="flex items-center justify-between p-1.5 rounded-lg hover:bg-[#2B3139]/40 hover:text-brand-text cursor-pointer transition select-none"
          title="Switch workspace / profiles"
        >
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-brand-teal/15 text-brand-teal border border-brand-teal/25 flex items-center justify-center font-black tracking-wider font-sans shrink-0 uppercase text-xs">
              {profile.avatarInitial || "TR"}
            </div>
            <div className="overflow-hidden">
              <h4 className="text-xs font-bold text-[#EAECEF] truncate font-sans leading-tight animate-fade-in">
                {profile.username || "Trader"}
              </h4>
              <span className="text-[9px] text-[#848E9C] select-none truncate block mt-0.5">
                {profile.email || "pixel@terminal.io"}
              </span>
            </div>
          </div>
          <ChevronUp size={14} className={`text-[#848E9C] transition-transform duration-200 shrink-0 ${showProfileSelector ? "rotate-180" : ""}`} />
        </div>

        <div className="border-t border-brand-border/30 pt-2">
          <div className="flex items-center justify-between mb-2">
            <span>Status:</span>
            <span className="text-brand-green flex items-center font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-green mr-2 animate-pulse"></span>
              Connected
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span>Quant Engine:</span>
            <span className="font-mono text-brand-text text-[10px]">Gemini Pro 2.5</span>
          </div>
        </div>
      </div>
    </aside>
  );
}

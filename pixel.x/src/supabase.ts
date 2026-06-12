import { createClient } from "@supabase/supabase-js";
import { JournalEntry, UserProfile, BrokerConnection, PropFirmPayout } from "./types";

// Dynamic env or fallback to user credentials provided directly for immediate connection
const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL || "https://ohpcsnomhrmokidpedui.supabase.co";
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || "sb_publishable_CPmSpBfi_sRxIXkSubnKQA_QQcvuRdU";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * SQL instructions schema to help the user set up tables in their Supabase SQL editor.
 */
export const SUPABASE_SQL_SETUP_INSTRUCTIONS = `-- PIXEL TERMINAL - SUPABASE TABLE SCHEMAS
-- Copy and run this script in your Supabase SQL Editor to support instant full-stack persistence.

-- 1. Create Profiles table
CREATE TABLE IF NOT EXISTS public.pixel_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  avatar_initial TEXT,
  default_account TEXT,
  email TEXT,
  trading_goal TEXT,
  avg_risk_per_trade NUMERIC DEFAULT 1.0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable RLS & Policies
ALTER TABLE public.pixel_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can fully manage their own profiles" ON public.pixel_profiles 
  FOR ALL USING (auth.uid() = id);

-- 2. Create Trading Journal Entries Table
CREATE TABLE IF NOT EXISTS public.pixel_journal_entries (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  instrument TEXT NOT NULL,
  account TEXT,
  entry_price NUMERIC,
  exit_price NUMERIC,
  lot_size NUMERIC,
  stop_loss NUMERIC,
  take_profit NUMERIC,
  result TEXT,
  profit_loss NUMERIC,
  notes TEXT,
  screenshot TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.pixel_journal_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users managed their journal data" ON public.pixel_journal_entries 
  FOR ALL USING (auth.uid() = user_id);

-- 3. Create Brokers Configuration Table 
CREATE TABLE IF NOT EXISTS public.pixel_brokers (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  alias TEXT NOT NULL,
  broker_name TEXT NOT NULL,
  account_id TEXT NOT NULL,
  server TEXT,
  platform TEXT,
  status TEXT,
  investor_password TEXT,
  last_sync TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.pixel_brokers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users managed their brokers count" ON public.pixel_brokers 
  FOR ALL USING (auth.uid() = user_id);

-- 4. Create Prop Firm Payouts Table
CREATE TABLE IF NOT EXISTS public.pixel_payouts (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  broker_connection_id TEXT NOT NULL,
  prop_firm_name TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  date DATE NOT NULL,
  status TEXT NOT NULL,
  invoice_id TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.pixel_payouts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users managed their payouts records" ON public.pixel_payouts 
  FOR ALL USING (auth.uid() = user_id);

-- 5. Create Notepad sync table
CREATE TABLE IF NOT EXISTS public.pixel_notepad (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  text TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.pixel_notepad ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users managed their notepad synced text" ON public.pixel_notepad 
  FOR ALL USING (auth.uid() = user_id);
`;

/**
 * Sync entire local data model up to Supabase
 */
export async function syncDataToSupabase(
  userId: string,
  profile: UserProfile,
  entries: JournalEntry[],
  brokers: BrokerConnection[],
  payouts: PropFirmPayout[],
  notepadText: string
): Promise<{ success: boolean; error?: string; details?: string }> {
  try {
    // 1. Sync Profile
    const { error: profileError } = await supabase
      .from("pixel_profiles")
      .upsert({
        id: userId,
        username: profile.username,
        avatar_initial: profile.avatarInitial,
        default_account: profile.defaultAccount,
        email: profile.email,
        trading_goal: profile.tradingGoal,
        avg_risk_per_trade: profile.avgRiskPerTrade,
        updated_at: new Date().toISOString(),
      });

    if (profileError) {
      if (profileError.code === "PGRST116" || profileError.message?.includes("relation")) {
        return { success: false, error: "table_missing", details: "pixel_profiles table is missing. Run the DDL setup script in your Supabase dashboard." };
      }
      throw profileError;
    }

    // 2. Sync Notepad
    const { error: noteError } = await supabase
      .from("pixel_notepad")
      .upsert({
        user_id: userId,
        text: notepadText,
        updated_at: new Date().toISOString(),
      });
    if (noteError) throw noteError;

    // 3. Sync Journal Entries (Delete and Reinsert or Bulk Upsert)
    if (entries.length > 0) {
      const dbEntries = entries.map((e) => ({
        id: e.id,
        user_id: userId,
        date: e.date,
        instrument: e.instrument,
        account: e.account,
        entry_price: e.entryPrice,
        exit_price: e.exitPrice,
        lot_size: e.lotSize,
        stop_loss: e.stopLoss,
        take_profit: e.takeProfit,
        result: e.result,
        profit_loss: e.profitLoss,
        notes: e.notes,
        screenshot: e.screenshot || null,
      }));

      const { error: entriesError } = await supabase
        .from("pixel_journal_entries")
        .upsert(dbEntries);
      if (entriesError) throw entriesError;
    }

    // 4. Sync Brokers (Bulk Upsert)
    if (brokers.length > 0) {
      const dbBrokers = brokers.map((b) => ({
        id: b.id,
        user_id: userId,
        alias: b.alias,
        broker_name: b.brokerName,
        account_id: b.accountId,
        server: b.server,
        platform: b.platform,
        status: b.status,
        investor_password: b.investorPassword || null,
        last_sync: b.lastSync,
      }));

      const { error: brokersError } = await supabase
        .from("pixel_brokers")
        .upsert(dbBrokers);
      if (brokersError) throw brokersError;
    }

    // 5. Sync Payouts (Bulk Upsert)
    if (payouts.length > 0) {
      const dbPayouts = payouts.map((p) => ({
        id: p.id,
        user_id: userId,
        broker_connection_id: p.brokerConnectionId,
        prop_firm_name: p.propFirmName,
        amount: p.amount,
        date: p.date,
        status: p.status,
        invoice_id: p.invoiceId,
        notes: p.notes,
      }));

      const { error: payoutsError } = await supabase
        .from("pixel_payouts")
        .upsert(dbPayouts);
      if (payoutsError) throw payoutsError;
    }

    return { success: true };
  } catch (err: any) {
    console.error("Supabase syncDataToSupabase error:", err);
    return {
      success: false,
      error: err.message || "Unknown error",
    };
  }
}

/**
 * Fetch entire user's synced database structure from Supabase tables
 */
export async function pullDataFromSupabase(userId: string): Promise<{
  success: boolean;
  profile?: UserProfile;
  entries?: JournalEntry[];
  brokers?: BrokerConnection[];
  payouts?: PropFirmPayout[];
  notepadText?: string;
  error?: string;
  errorType?: string;
}> {
  try {
    // 1. Get profile
    const { data: profData, error: profErr } = await supabase
      .from("pixel_profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (profErr) {
      if (profErr.message?.includes("relation") || profErr.code === "PGRST116") {
        return { success: false, errorType: "table_missing", error: "Required tables are not configured on Supabase yet. Open settings to view setup SQL script." };
      }
      throw profErr;
    }

    let profile: UserProfile | undefined = undefined;
    if (profData) {
      profile = {
        username: profData.username,
        avatarInitial: profData.avatar_initial || "TR",
        defaultAccount: profData.default_account || "Personal Live",
        email: profData.email || "",
        tradingGoal: profData.trading_goal || "",
        avgRiskPerTrade: Number(profData.avg_risk_per_trade) || 1.0,
      };
    }

    // 2. Get notepad
    const { data: noteData } = await supabase
      .from("pixel_notepad")
      .select("text")
      .eq("user_id", userId)
      .maybeSingle();

    const notepadText = noteData?.text || "";

    // 3. Get journal entries
    const { data: entryData } = await supabase
      .from("pixel_journal_entries")
      .select("*")
      .eq("user_id", userId);

    const entries: JournalEntry[] = (entryData || []).map((e: any) => ({
      id: e.id,
      date: e.date,
      instrument: e.instrument,
      account: e.account || "",
      entryPrice: Number(e.entry_price),
      exitPrice: Number(e.exit_price),
      lotSize: Number(e.lot_size),
      stopLoss: e.stop_loss ? Number(e.stop_loss) : null,
      takeProfit: e.take_profit ? Number(e.take_profit) : null,
      result: e.result as any,
      profitLoss: Number(e.profit_loss),
      screenshot: e.screenshot,
      notes: e.notes || "",
    }));

    // 4. Get brokers
    const { data: brokData } = await supabase
      .from("pixel_brokers")
      .select("*")
      .eq("user_id", userId);

    const brokers: BrokerConnection[] = (brokData || []).map((b: any) => ({
      id: b.id,
      alias: b.alias,
      brokerName: b.broker_name,
      accountId: b.account_id,
      server: b.server || "",
      platform: b.platform as any,
      status: b.status as any,
      investorPassword: b.investor_password,
      lastSync: b.last_sync || "Never",
    }));

    // 5. Get payouts
    const { data: payData } = await supabase
      .from("pixel_payouts")
      .select("*")
      .eq("user_id", userId);

    const payouts: PropFirmPayout[] = (payData || []).map((p: any) => ({
      id: p.id,
      brokerConnectionId: p.broker_connection_id,
      propFirmName: p.prop_firm_name,
      amount: Number(p.amount),
      date: p.date,
      status: p.status as any,
      invoiceId: p.invoice_id || "",
      notes: p.notes || "",
    }));

    return {
      success: true,
      profile,
      notepadText,
      entries,
      brokers,
      payouts,
    };
  } catch (err: any) {
    console.error("Supabase pullDataFromSupabase error:", err);
    return {
      success: false,
      error: err.message || "Unknown error occurred pulling database tables.",
    };
  }
}

import React, { useState, useEffect, useRef } from "react";
import { NotepadContent } from "../types";
import {
  FileText,
  Save,
  CheckCircle,
  Clock,
  Sparkles,
  List,
  Bold,
  Italic,
  Code,
  FileCheck2,
  BookOpenCheck,
  AlertOctagon,
} from "lucide-react";

interface NotepadTabProps {
  notepad: NotepadContent;
  setNotepad: (content: NotepadContent) => void;
}

export default function NotepadTab({ notepad, setNotepad }: NotepadTabProps) {
  const [editorText, setEditorText] = useState(notepad.text);
  const [saveStatus, setSaveStatus] = useState<"synced" | "saving">("synced");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-save typing effect after some idle ms
  useEffect(() => {
    setEditorText(notepad.text);
  }, [notepad.text]);

  const saveContent = (text: string) => {
    setSaveStatus("saving");
    const updatedContent: NotepadContent = {
      text,
      updatedAt: new Date("2026-06-12T11:16:25-07:00").toLocaleTimeString(undefined, {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }),
    };
    setNotepad(updatedContent);
    // Mimic database sync delay for visual feedback, then sync
    setTimeout(() => {
      setSaveStatus("synced");
    }, 400);
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setEditorText(val);
    saveContent(val);
  };

  // Helper formatting injections
  const injectFormat = (prefix: string, suffix: string = "") => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;

    const selected = text.substring(start, end);
    const replacement = prefix + (selected || "text") + suffix;

    const updatedText = text.substring(0, start) + replacement + text.substring(end);
    setEditorText(updatedText);
    saveContent(updatedText);

    // Focus back on text area & adjust carret positions
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + (selected || "text").length);
    }, 50);
  };

  // Preset Template Injecors
  const injectTemplate = (type: "rules" | "checklist" | "review") => {
    let template = "";
    if (type === "rules") {
      template = `
## PERSONAL TRADING LAWS & LEVERAGE PRINCIPLES
1. **Never risk more than 1.5%** of physical capital per trade.
2. **Accept Loss Will Occur**: If stop loss is hit, close position immediately. Never slide stop losses lower out of fear.
3. **No Over-trading**: Max 3 entries completed per daily session. If daily profit target (+3%) or daily loss limit (-2.5%) is reached, close the terminal immediately.
4. **Clean Confluences Only**: Do not execute unless at least 3 indicators/structural factors line up (e.g., Higher Time Frame Bias + Key Support + LTF MSS).
`;
    } else if (type === "checklist") {
      template = `
## PRE-EXECUTION TRANSACTION CHECKLIST
- [ ] HTF (Higher Timeframe Breakdown) structure analyzed (Bias: bullish/bearish)
- [ ] Major economic news checked on Calendar timeline (No trading within +/- 30 minutes of High Impact releases)
- [ ] Logical Stop Loss defined before setting position size (Invalidation zone is clear)
- [ ] Lot size calculated correctly in Pip Calculator (Risk respects total loss thresholds)
- [ ] Emotional check complete (Executing on rules, NOT out of FOMO, anger, or urgency)
`;
    } else if (type === "review") {
      template = `
## WEEKLY PERFORMANCE RETROSPECTIVE REVIEW
- **Gross Profit/Loss**: $
- **Win Rate Achieved**: %
- **Discipline Rating**: /10
- **What worked well**: 
- **Core mistakes identified**:
- **Key psychological focus for next week**:
`;
    }

    const doubleSpacer = editorText ? "\n\n" : "";
    const updated = editorText + doubleSpacer + template.trim();
    setEditorText(updated);
    saveContent(updated);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-brand-card border border-brand-border p-6 rounded-lg">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-brand-text font-sans sm:text-2xl">
            Distraction-Free Journal Notes
          </h2>
          <p className="text-sm text-brand-text-muted">
            A permanent local directory for strategy drafts, psychological rules, and system rules.
          </p>
        </div>
        <div className="flex items-center gap-3 bg-[#0B0E11] px-3 py-1.5 rounded border border-brand-border">
          {saveStatus === "saving" ? (
            <div className="flex items-center gap-1.5 text-xs font-mono text-brand-yellow">
              <Clock size={14} className="animate-spin" />
              <span>Saving draft...</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-xs font-mono text-brand-green">
              <CheckCircle size={14} />
              <span>Synced locally at {notepad.updatedAt || "N/A"}</span>
            </div>
          )}
        </div>
      </div>

      {/* TEXT EDITOR WORKSPACE CONTROLLER */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Helper Rules/Templates Panel (Left Column) */}
        <div className="lg:col-span-1 bg-brand-card border border-brand-border rounded p-5 space-y-4">
          <div>
            <h3 className="font-sans font-medium text-brand-text text-sm flex items-center gap-2">
              <Sparkles size={15} className="text-brand-teal" />
              Quick Rules Generators
            </h3>
            <p className="text-[11px] text-brand-text-muted mt-1">
              Click template presets to automatically prepend them to your notepad list.
            </p>
          </div>

          <div className="space-y-2 pt-2 border-t border-brand-border">
            <button
              onClick={() => injectTemplate("rules")}
              className="w-full text-left bg-[#0B0E11] hover:bg-[#0B0E11]/80 border border-brand-border rounded p-3 text-xs flex items-start gap-3 text-brand-text-muted hover:text-brand-text transition group cursor-pointer"
            >
              <AlertOctagon size={16} className="text-brand-red mt-0.5" />
              <div>
                <span className="font-semibold block text-[11px] font-sans">System Rules Draft</span>
                <span className="text-[10px] text-brand-text-muted mt-0.5 block">Risk boundaries, loss mitigation laws.</span>
              </div>
            </button>

            <button
              onClick={() => injectTemplate("checklist")}
              className="w-full text-left bg-[#0B0E11] hover:bg-[#0B0E11]/80 border border-brand-border rounded p-3 text-xs flex items-start gap-3 text-brand-text-muted hover:text-brand-text transition group cursor-pointer"
            >
              <FileCheck2 size={16} className="text-brand-green mt-0.5" />
              <div>
                <span className="font-semibold block text-[11px] font-sans">Confluence Checklist</span>
                <span className="text-[10px] text-brand-text-muted mt-0.5 block">Execution prerequisites.</span>
              </div>
            </button>

            <button
              onClick={() => injectTemplate("review")}
              className="w-full text-left bg-[#0B0E11] hover:bg-[#0B0E11]/80 border border-brand-border rounded p-3 text-xs flex items-start gap-3 text-brand-text-muted hover:text-brand-text transition group cursor-pointer"
            >
              <BookOpenCheck size={16} className="text-brand-teal mt-0.5" />
              <div>
                <span className="font-semibold block text-[11px] font-sans">Weekly Review Template</span>
                <span className="text-[10px] text-brand-text-muted mt-0.5 block">Metric tracking Retrospective.</span>
              </div>
            </button>
          </div>

          <div className="bg-[#0B0E11]/60 p-3 rounded border border-brand-border">
            <h4 className="text-[10px] font-mono text-brand-text-muted uppercase tracking-wider mb-1">
              Storage Note
            </h4>
            <p className="text-[10px] text-brand-text-muted leading-relaxed font-sans">
              Data persists entirely in browser Local Storage. No server or remote ledger copies exist. Offline capability active.
            </p>
          </div>
        </div>

        {/* DISTRACTION FREE CENTRAL TEXTBOARD */}
        <div className="lg:col-span-3 bg-brand-card border border-brand-border rounded overflow-hidden shadow-sm flex flex-col">
          {/* Format Helper Toolbar */}
          <div className="bg-[#0B0E11]/60 border-b border-brand-border px-4 py-2 flex items-center justify-between gap-4 flex-wrap text-mono">
            <div className="flex items-center gap-1 border-r border-brand-border pr-4">
              <button
                type="button"
                onClick={() => injectFormat("**", "**")}
                className="p-1 px-2 rounded hover:bg-brand-nested text-brand-text-muted hover:text-brand-text text-xs font-bold cursor-pointer"
                title="Bold Content"
              >
                <Bold size={14} />
              </button>
              <button
                type="button"
                onClick={() => injectFormat("*", "*")}
                className="p-1 px-2 rounded hover:bg-brand-nested text-brand-text-muted hover:text-brand-text text-xs italic cursor-pointer"
                title="Italicize Content"
              >
                <Italic size={14} />
              </button>
              <button
                type="button"
                onClick={() => injectFormat("`", "`")}
                className="p-1 px-2 rounded hover:bg-brand-nested text-brand-text-muted hover:text-brand-text text-xs font-mono cursor-pointer"
                title="Embed Code inline"
              >
                <Code size={14} />
              </button>
              <button
                type="button"
                onClick={() => injectFormat("\n- ")}
                className="p-1 px-2 rounded hover:bg-brand-nested text-brand-text-muted hover:text-brand-text cursor-pointer"
                title="Create List"
              >
                <List size={14} />
              </button>
            </div>

            <div className="flex items-center gap-1 text-[11px] text-brand-text-muted font-mono">
              <span>Supports Markdown headings (e.g. ## Title)</span>
            </div>
          </div>

          {/* Central Workspace Canvas */}
          <div className="p-1 bg-brand-card font-sans">
            <textarea
              ref={textareaRef}
              rows={24}
              value={editorText}
              onChange={handleTextChange}
              placeholder="Start drafting your strategies, psychology tips, or daily triggers here..."
              className="w-full bg-brand-card text-brand-text placeholder-[#848E9C]/40 text-sm font-sans p-6 leading-relaxed border-0 focus:ring-0 focus:outline-none resize-y outline-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

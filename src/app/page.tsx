"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Sun, Moon, CheckSquare, Square, Trash2, Copy, Check, Zap, Hash, AlignLeft } from 'lucide-react';
import { diffChars } from 'diff';

export default function ProofreaderPage() {
  const [inputText, setInputText] = useState("");
  const [outputText, setOutputText] = useState("");
  const [copied, setCopied] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true); // 初期値をダークに
  const [isMounted, setIsMounted] = useState(false);
  
  const [rules, setRules] = useState({
    indent: false,
    noPeriodInQuote: false,
    kotoToKoto: false,
    tokiToToki: false,
    hoToHo: false,
    atoToAto: false,
  });

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const outputRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedDarkMode = localStorage.getItem("darkMode");
    if (savedDarkMode !== null) setIsDarkMode(JSON.parse(savedDarkMode));
    const savedRules = localStorage.getItem("rules");
    if (savedRules !== null) setRules(JSON.parse(savedRules));
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted) localStorage.setItem("darkMode", JSON.stringify(isDarkMode));
  }, [isDarkMode, isMounted]);

  useEffect(() => {
    if (isMounted) localStorage.setItem("rules", JSON.stringify(rules));
  }, [rules, isMounted]);

  const handleScroll = (e: React.UIEvent<HTMLElement>) => {
    const { scrollTop } = e.currentTarget;
    if (e.currentTarget === inputRef.current && outputRef.current) {
      outputRef.current.scrollTop = scrollTop;
    } else if (e.currentTarget === outputRef.current && inputRef.current) {
      inputRef.current.scrollTop = scrollTop;
    }
  };

  const getStats = (text: string) => {
    if (!text) return { total: 0, noSpace: 0, lines: 0 };
    return {
      total: text.length,
      noSpace: text.replace(/\s/g, "").length,
      lines: text.split("\n").length,
    };
  };

  const inputStats = getStats(inputText);
  const outputStats = getStats(outputText);

  const handleCopy = async () => {
    if (!outputText) return;
    await navigator.clipboard.writeText(outputText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    if (window.confirm("全ての文章をリセットしますか？")) {
      setInputText("");
      setOutputText("");
    }
  };

  const handleProofread = async () => {
    if (!inputText) return;
    try {
      const response = await fetch("https://kousei-api.onrender.com/proofread", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: inputText, rules: rules }),
      });
      if (!response.ok) throw new Error("Server Error");
      const data = await response.json();
      setOutputText(data.result);
    } catch (error) {
      alert("通信エラーが発生しました。");
    }
  };

  const renderDiff = () => {
    if (!outputText) return <span className="opacity-20 italic">Awaiting input...</span>;
    const diff = diffChars(inputText, outputText);
    return diff.map((part, index) => {
      if (part.removed) return null;
      // スタイリッシュな青系のハイライトに変更
      const highlightClass = part.added 
        ? (isDarkMode ? 'bg-cyan-500/20 text-cyan-300 border-b border-cyan-500' : 'bg-blue-100 text-blue-700 font-bold border-b-2 border-blue-400') 
        : '';
      return <span key={index} className={highlightClass}>{part.value}</span>;
    });
  };

  if (!isMounted) return null;

  const Toggle = ({ label, enabled, onClick }: { label: string, enabled: boolean, onClick: () => void }) => (
    <button 
      onClick={onClick}
      className={`group flex items-center justify-between p-3 rounded-lg border transition-all ${
        enabled 
          ? (isDarkMode ? 'bg-blue-600/10 border-blue-500 text-blue-400' : 'bg-blue-50 border-blue-200 text-blue-600')
          : (isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-700' : 'bg-white border-gray-200 text-gray-400')
      }`}
    >
      <span className="text-xs font-bold tracking-tight">{label}</span>
      <div className={`w-2 h-2 rounded-full transition-all ${enabled ? 'bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]' : 'bg-slate-700'}`} />
    </button>
  );

  return (
    <main className={`min-h-screen p-4 md:p-8 transition-colors duration-500 ${isDarkMode ? 'bg-slate-950 text-slate-200' : 'bg-slate-50 text-slate-900'}`}>
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <header className="flex justify-between items-center pb-6 border-b border-slate-800/50">
          <div>
            <h1 className="text-2xl font-black tracking-tighter uppercase italic flex items-center gap-2">
              <Zap className="text-cyan-400" fill="currentColor" size={24} />
              Proofreader <span className="text-cyan-500">2.0</span>
            </h1>
            <p className="text-[10px] text-slate-500 font-mono tracking-widest uppercase mt-1">High-Speed Text Optimization Engine</p>
          </div>
          <button onClick={() => setIsDarkMode(!isDarkMode)} className={`p-2.5 rounded-xl transition-all shadow-lg ${isDarkMode ? 'bg-slate-900 text-yellow-400 border border-slate-800' : 'bg-white text-slate-900 border border-slate-200'}`}>
            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </header>

        {/* Control Center */}
        <div className={`p-6 rounded-2xl border transition-all ${isDarkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200 shadow-xl shadow-slate-200/50'}`}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
              <section>
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                  <AlignLeft size={12} /> Standard Rules
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  <Toggle label="AUTO INDENT" enabled={rules.indent} onClick={() => setRules({...rules, indent: !rules.indent})} />
                  <Toggle label="SYMBOL FIX" enabled={rules.noPeriodInQuote} onClick={() => setRules({...rules, noPeriodInQuote: !rules.noPeriodInQuote})} />
                </div>
              </section>
              <section>
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                  <Zap size={12} /> Advanced Engine
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  <Toggle label="KOTO → こと" enabled={rules.kotoToKoto} onClick={() => setRules({...rules, kotoToKoto: !rules.kotoToKoto})} />
                  <Toggle label="TOKI → とき" enabled={rules.tokiToToki} onClick={() => setRules({...rules, tokiToToki: !rules.tokiToToki})} />
                  <Toggle label="HOU → ほう" enabled={rules.hoToHo} onClick={() => setRules({...rules, hoToHo: !rules.hoToHo})} />
                  <Toggle label="ATO → あと" enabled={rules.atoToAto} onClick={() => setRules({...rules, atoToAto: !rules.atoToAto})} />
                </div>
              </section>
            </div>

            <div className="flex flex-col gap-3 justify-end">
              <button onClick={handleProofread} className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-black py-4 rounded-xl transition-all active:scale-[0.97] shadow-lg shadow-cyan-500/20 uppercase tracking-widest text-sm italic">
                Analyze & Fix
              </button>
              <button onClick={handleReset} className={`flex items-center justify-center gap-2 font-bold py-3 rounded-xl transition-all ${isDarkMode ? 'bg-slate-800 text-slate-400 hover:bg-slate-700' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                <Trash2 size={16} /> <span className="text-[10px] uppercase tracking-wider">Reset Engine</span>
              </button>
            </div>
          </div>
        </div>

        {/* Console Area */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-auto md:h-[55vh]">
          <div className={`flex flex-col rounded-2xl border overflow-hidden transition-all ${isDarkMode ? 'bg-slate-900/30 border-slate-800' : 'bg-white border-slate-200 shadow-lg'}`}>
            <div className="px-4 py-2 border-b border-slate-800/50 flex items-center gap-2 bg-slate-800/20">
              <div className="w-2 h-2 rounded-full bg-red-500/50" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 font-mono">Source_Input</span>
            </div>
            <textarea
              ref={inputRef}
              onScroll={handleScroll}
              className="flex-1 p-6 bg-transparent resize-none focus:outline-none text-base font-medium leading-relaxed"
              placeholder="System awaiting data entry..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
            />
            <div className="px-6 py-4 flex justify-between font-mono text-[10px] text-slate-500 border-t border-slate-800/50">
              <span>CHARS: {inputStats.total}</span>
              <span>LINES: {inputStats.lines}</span>
            </div>
          </div>

          <div className={`flex flex-col rounded-2xl border overflow-hidden relative transition-all ${isDarkMode ? 'bg-slate-900/30 border-slate-800 shadow-[0_0_40px_rgba(0,0,0,0.3)]' : 'bg-slate-50 border-slate-200 shadow-lg'}`}>
            <div className="px-4 py-2 border-b border-slate-800/50 flex justify-between items-center bg-slate-800/20">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-500 font-mono">Optimized_Result</span>
              </div>
              {outputText && (
                <button onClick={handleCopy} className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black tracking-widest transition-all ${
                  copied ? 'bg-cyan-500 text-white shadow-[0_0_15px_rgba(34,211,238,0.5)]' : 'bg-slate-800 text-cyan-400 border border-slate-700'
                }`}>
                  {copied ? <Check size={12} /> : <Copy size={12} />}
                  {copied ? "SYNCED" : "EXPORT"}
                </button>
              )}
            </div>
            <div ref={outputRef} onScroll={handleScroll} className="flex-1 p-6 overflow-y-auto whitespace-pre-wrap text-base font-medium leading-relaxed">
              {renderDiff()}
            </div>
            <div className="px-6 py-4 flex justify-between font-mono text-[10px] text-cyan-500/50 border-t border-slate-800/50">
              <span>CHARS: {outputStats.total}</span>
              <span>LINES: {outputStats.lines}</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Sun, Moon, CheckSquare, Square, Trash2, Copy, Check, Play } from 'lucide-react';
import { diffChars } from 'diff';

export default function ProofreaderPage() {
  const [inputText, setInputText] = useState("");
  const [outputText, setOutputText] = useState("");
  const [copied, setCopied] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
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
    if (window.confirm("入力した文章を削除しますか？\nこの操作を行うと元に戻せません。")) {
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
      alert("Pythonサーバーを起動してください。");
    }
  };

  const renderDiff = () => {
    if (!outputText) return <span className={`${isDarkMode ? 'text-gray-600' : 'text-gray-300'} italic`}>結果がここに表示されます</span>;
    const diff = diffChars(inputText, outputText);
    return diff.map((part, index) => {
      if (part.removed) return null;
      const highlightClass = part.added 
        ? (isDarkMode ? 'bg-yellow-900/50 text-yellow-200 font-bold' : 'bg-yellow-200 text-yellow-900 font-bold') 
        : '';
      return <span key={index} className={highlightClass}>{part.value}</span>;
    });
  };

  if (!isMounted) return null;

  const Toggle = ({ label, enabled, onClick }: { label: string, enabled: boolean, onClick: () => void }) => (
    <div className={`flex items-center justify-between p-3 rounded-lg transition-colors ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
      <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>{label}</span>
      <button onClick={onClick} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${enabled ? 'bg-green-500' : 'bg-gray-400'}`}>
        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${enabled ? 'translate-x-6' : 'translate-x-1'}`} />
      </button>
    </div>
  );

  const SectionHeader = ({ title, onToggle, allSelected }: { title: string, onToggle: () => void, allSelected: boolean }) => (
    <div className="flex justify-between items-center mb-3">
      <h2 className={`text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>{title}</h2>
      <button onClick={onToggle} className={`flex items-center gap-1.5 px-2 py-1 rounded md text-xs font-semibold transition-colors ${isDarkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-800'}`}>
        {allSelected ? <CheckSquare size={14} /> : <Square size={14} />} 全選択
      </button>
    </div>
  );

  return (
    <main className={`min-h-screen p-4 md:p-8 transition-colors duration-300 ${isDarkMode ? 'bg-gray-950 text-white' : 'bg-gray-100 text-black'}`}>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className={`p-6 rounded-xl shadow-sm transition-colors ${isDarkMode ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-transparent'}`}>
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-xl md:text-2xl font-bold">文章校正ツール</h1>
            <button onClick={() => setIsDarkMode(!isDarkMode)} className={`p-2 rounded-full transition-colors ${isDarkMode ? 'bg-yellow-400 text-gray-900' : 'bg-gray-800 text-white'}`}>
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>
          <div className="space-y-6">
            <section>
              <SectionHeader title="基本ルール" onToggle={() => {
                const keys = ['indent', 'noPeriodInQuote'] as const;
                const active = keys.every(k => rules[k]);
                setRules({...rules, indent: !active, noPeriodInQuote: !active});
              }} allSelected={rules.indent && rules.noPeriodInQuote} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Toggle label="一字下げする" enabled={rules.indent} onClick={() => setRules({...rules, indent: !rules.indent})} />
                <Toggle label="「。」を修正" enabled={rules.noPeriodInQuote} onClick={() => setRules({...rules, noPeriodInQuote: !rules.noPeriodInQuote})} />
              </div>
            </section>
            <section>
              <SectionHeader title="表記揺れ（ひらく）" onToggle={() => {
                const keys = ['kotoToKoto', 'tokiToToki', 'hoToHo', 'atoToAto'] as const;
                const active = keys.every(k => rules[k]);
                const newState = {...rules};
                keys.forEach(k => newState[k] = !active);
                setRules(newState);
              }} allSelected={rules.kotoToKoto && rules.tokiToToki && rules.hoToHo && rules.atoToAto} />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Toggle label="事 → こと" enabled={rules.kotoToKoto} onClick={() => setRules({...rules, kotoToKoto: !rules.kotoToKoto})} />
                <Toggle label="時 → とき" enabled={rules.tokiToToki} onClick={() => setRules({...rules, tokiToToki: !rules.tokiToToki})} />
                <Toggle label="方 → ほう" enabled={rules.hoToHo} onClick={() => setRules({...rules, hoToHo: !rules.hoToHo})} />
                <Toggle label="後 → あと" enabled={rules.atoToAto} onClick={() => setRules({...rules, atoToAto: !rules.atoToAto})} />
              </div>
            </section>
          </div>
          <div className="flex flex-col md:flex-row gap-3 mt-8">
            <button onClick={handleProofread} className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-lg transition-all active:scale-[0.98] shadow-lg shadow-blue-500/20">
              <Play size={20} /> 校正を実行する
            </button>
            <button onClick={handleReset} className={`flex items-center justify-center gap-2 font-bold py-4 px-8 rounded-lg transition-all active:scale-[0.98] ${isDarkMode ? 'bg-gray-800 text-gray-400 hover:bg-gray-700' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}>
              <Trash2 size={20} /> 全て消去
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-auto md:h-[50vh]">
          <div className={`flex flex-col rounded-xl shadow-sm border overflow-hidden transition-colors ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white'}`}>
            <div className={`px-4 py-2 border-b text-xs font-bold ${isDarkMode ? 'bg-gray-800 border-gray-700 text-gray-400' : 'bg-gray-50 text-gray-500'}`}>校正したい文章</div>
            <textarea
              ref={inputRef}
              onScroll={handleScroll}
              className={`flex-1 p-4 min-h-[200px] md:min-h-0 resize-none focus:outline-none text-base md:text-lg transition-colors ${isDarkMode ? 'bg-gray-900 text-gray-100 placeholder-gray-500' : 'bg-white text-black placeholder-gray-400'}`}
              placeholder="文章を貼り付けてください..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
            />
          </div>
          <div className={`flex flex-col rounded-xl shadow-sm border overflow-hidden relative transition-colors ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white'}`}>
            <div className={`px-4 py-2 border-b text-xs font-bold flex justify-between items-center transition-colors ${isDarkMode ? 'bg-gray-800 border-gray-700 text-gray-400' : 'bg-gray-50 text-gray-500'}`}>
              校正後の文章
              {outputText && (
                <button onClick={handleCopy} className={`flex items-center gap-1 px-3 py-1 rounded-full border text-xs font-bold transition-all ${
                  copied ? 'bg-green-500 border-green-500 text-white' : (isDarkMode ? 'bg-gray-700 border-gray-600 text-blue-400' : 'bg-white border-blue-200 text-blue-600 shadow-sm')
                }`}>
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  {copied ? "コピー完了" : "結果をコピー"}
                </button>
              )}
            </div>
            <div ref={outputRef} onScroll={handleScroll} className={`flex-1 p-4 min-h-[200px] md:min-h-0 overflow-y-auto whitespace-pre-wrap text-base md:text-lg transition-colors ${isDarkMode ? 'bg-gray-950 text-gray-200' : 'bg-gray-50 text-gray-800'}`}>
              {renderDiff()}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
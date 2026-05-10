"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Sun, Moon, CheckSquare, Square } from 'lucide-react';

export default function ProofreaderPage() {
  const [inputText, setInputText] = useState("");
  const [outputText, setOutputText] = useState("");
  const [copied, setCopied] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isMounted, setIsMounted] = useState(false); // Hydration対策
  
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

  // --- 1. 初回読み込み (ブラウザ起動時) ---
  useEffect(() => {
    const savedDarkMode = localStorage.getItem("darkMode");
    if (savedDarkMode !== null) {
      setIsDarkMode(JSON.parse(savedDarkMode));
    }

    const savedRules = localStorage.getItem("rules");
    if (savedRules !== null) {
      setRules(JSON.parse(savedRules));
    }
    
    setIsMounted(true); // 読み込み完了
  }, []);

  // --- 2. 状態が変わるたびに保存 ---
  useEffect(() => {
    if (isMounted) {
      localStorage.setItem("darkMode", JSON.stringify(isDarkMode));
    }
  }, [isDarkMode, isMounted]);

  useEffect(() => {
    if (isMounted) {
      localStorage.setItem("rules", JSON.stringify(rules));
    }
  }, [rules, isMounted]);

  // スクロール同期
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

  const toggleBasicRules = () => {
    const basicKeys = ['indent', 'noPeriodInQuote'] as const;
    const allActive = basicKeys.every(key => rules[key]);
    const newState = { ...rules };
    basicKeys.forEach(key => { newState[key] = !allActive; });
    setRules(newState);
  };

  const toggleAdvancedRules = () => {
    const advKeys = ['kotoToKoto', 'tokiToToki', 'hoToHo', 'atoToAto'] as const;
    const allActive = advKeys.every(key => rules[key]);
    const newState = { ...rules };
    advKeys.forEach(key => { newState[key] = !allActive; });
    setRules(newState);
  };

  const handleCopy = async () => {
    if (!outputText) return;
    await navigator.clipboard.writeText(outputText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleProofread = async () => {
    if (!inputText) return;
    try {
      const response = await fetch("https://kousei-api.onrender.com", {
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

  // Hydration対策: マウントされるまで何も表示しないかローディングを出す
  if (!isMounted) return <div className="min-h-screen bg-gray-100 dark:bg-gray-950" />;

  const Toggle = ({ label, enabled, onClick }: { label: string, enabled: boolean, onClick: () => void }) => (
    <div className={`flex items-center justify-between p-3 rounded-lg transition-colors ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
      <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>{label}</span>
      <button
        onClick={onClick}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${enabled ? 'bg-green-500' : 'bg-gray-400'}`}
      >
        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${enabled ? 'translate-x-6' : 'translate-x-1'}`} />
      </button>
    </div>
  );

  const SectionHeader = ({ title, onToggle, allSelected }: { title: string, onToggle: () => void, allSelected: boolean }) => (
    <div className="flex justify-between items-center mb-3">
      <h2 className={`text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>{title}</h2>
      <button 
        onClick={onToggle}
        className={`flex items-center gap-1.5 px-2 py-1 rounded md text-xs font-semibold transition-colors ${
          isDarkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-800'
        }`}
      >
        {allSelected ? <CheckSquare size={14} /> : <Square size={14} />}
        全選択
      </button>
    </div>
  );

  return (
    <main className={`min-h-screen p-4 md:p-8 transition-colors duration-300 ${isDarkMode ? 'bg-gray-950 text-white' : 'bg-gray-100 text-black'}`}>
      <div className="max-w-6xl mx-auto space-y-6">
        
        <div className={`p-6 rounded-xl shadow-sm transition-colors ${isDarkMode ? 'bg-gray-900 border border-gray-800' : 'bg-white'}`}>
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-2xl font-bold">文章校正ツール</h1>
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`p-2 rounded-full transition-colors ${isDarkMode ? 'bg-yellow-400 text-gray-900' : 'bg-gray-800 text-white'}`}
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>
          
          <div className="space-y-8">
            <section>
              <SectionHeader title="Basic" onToggle={toggleBasicRules} allSelected={rules.indent && rules.noPeriodInQuote} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Toggle label="一字下げする" enabled={rules.indent} onClick={() => setRules({...rules, indent: !rules.indent})} />
                <Toggle label="「。」を修正" enabled={rules.noPeriodInQuote} onClick={() => setRules({...rules, noPeriodInQuote: !rules.noPeriodInQuote})} />
              </div>
            </section>

            <section>
              <SectionHeader title="Advanced" onToggle={toggleAdvancedRules} allSelected={rules.kotoToKoto && rules.tokiToToki && rules.hoToHo && rules.atoToAto} />
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Toggle label="事 → こと" enabled={rules.kotoToKoto} onClick={() => setRules({...rules, kotoToKoto: !rules.kotoToKoto})} />
                <Toggle label="時 → とき" enabled={rules.tokiToToki} onClick={() => setRules({...rules, tokiToToki: !rules.tokiToToki})} />
                <Toggle label="方 → ほう" enabled={rules.hoToHo} onClick={() => setRules({...rules, hoToHo: !rules.hoToHo})} />
                <Toggle label="後 → あと" enabled={rules.atoToAto} onClick={() => setRules({...rules, atoToAto: !rules.atoToAto})} />
              </div>
            </section>
          </div>

          <button onClick={handleProofread} className="w-full mt-8 bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-lg transition-all active:scale-[0.99] shadow-lg shadow-blue-500/20">
            校正を実行する
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-[55vh]">
          <div className={`flex flex-col rounded-xl shadow-sm border overflow-hidden transition-colors ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white'}`}>
            <div className={`px-4 py-1.5 border-b text-xs font-bold ${isDarkMode ? 'bg-gray-800 border-gray-700 text-gray-400' : 'bg-gray-100 text-gray-500'}`}>校正したい文章</div>
            <textarea
              ref={inputRef}
              onScroll={handleScroll}
              className={`flex-1 p-4 resize-none focus:outline-none transition-colors ${isDarkMode ? 'bg-gray-900 text-gray-100 placeholder-gray-500' : 'bg-white text-black placeholder-gray-400'}`}
              placeholder="文章を貼り付けてください..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
            />
            <div className={`px-4 py-3 border-t grid grid-cols-3 text-center text-xs transition-colors ${isDarkMode ? 'bg-gray-900 border-gray-800 text-gray-400' : 'bg-white text-gray-500'}`}>
              <div>全文字数: <span className={`block text-sm font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>{inputStats.total}</span></div>
              <div className={`border-x ${isDarkMode ? 'border-gray-800' : 'border-gray-100'}`}>空白除き: <span className={`block text-sm font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>{inputStats.noSpace}</span></div>
              <div>行数: <span className={`block text-sm font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>{inputStats.lines}</span></div>
            </div>
          </div>

          <div className={`flex flex-col rounded-xl shadow-sm border overflow-hidden relative transition-colors ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white'}`}>
            <div className={`px-4 py-1.5 border-b text-xs font-bold flex justify-between items-center transition-colors ${isDarkMode ? 'bg-gray-800 border-gray-700 text-gray-400' : 'bg-gray-100 text-gray-500'}`}>
              校正後の文章
              {outputText && (
                <button onClick={handleCopy} className={`px-2 py-0.5 rounded border text-[10px] transition-all ${isDarkMode ? 'bg-gray-700 border-gray-600 text-blue-400' : 'bg-white border-blue-200 text-blue-600'}`}>
                  {copied ? "コピー完了" : "コピーする"}
                </button>
              )}
            </div>
            <div ref={outputRef} onScroll={handleScroll} className={`flex-1 p-4 overflow-y-auto whitespace-pre-wrap transition-colors ${isDarkMode ? 'bg-gray-950 text-gray-200' : 'bg-gray-50 text-gray-800'}`}>
              {outputText || <span className={`${isDarkMode ? 'text-gray-600' : 'text-gray-300'} italic`}>結果がここに表示されます</span>}
            </div>
            <div className={`px-4 py-3 border-t grid grid-cols-3 text-center text-xs transition-colors ${isDarkMode ? 'bg-gray-900 border-gray-800 text-gray-400' : 'bg-white text-gray-500'}`}>
              <div>全文字数: <span className={`block text-sm font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>{outputStats.total}</span></div>
              <div className={`border-x ${isDarkMode ? 'border-gray-800' : 'border-gray-100'}`}>空白除き: <span className={`block text-sm font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>{outputStats.noSpace}</span></div>
              <div>行数: <span className={`block text-sm font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>{outputStats.lines}</span></div>
            </div>
          </div>
        </div>

      </div>
    </main>
  );
}
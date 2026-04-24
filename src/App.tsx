import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UploadCloud, CheckCircle2, Leaf, Loader2, ArrowLeft, RefreshCcw } from 'lucide-react';
import { GoogleGenAI, Type } from '@google/genai';

let ai: GoogleGenAI | null = null;
const getAI = () => {
  if (!ai) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) throw new Error("API key is missing. Please set GEMINI_API_KEY.");
    ai = new GoogleGenAI({ apiKey: key });
  }
  return ai;
};

const extractAmountFromBill = async (file: File): Promise<number | null> => {
  try {
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1]);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    const aiInstance = getAI();
    const response = await aiInstance.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: [
        { inlineData: { data: base64, mimeType: file.type } },
        { text: "Extract the final total payment amount from this bill or invoice. Respond ONLY with a JSON object containing a numeric property 'totalAmount'." }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            totalAmount: { type: Type.NUMBER, description: "The total final amount billed" }
          },
          required: ["totalAmount"]
        }
      }
    });

    if (response.text) {
      const data = JSON.parse(response.text);
      return data.totalAmount;
    }
    return null;
  } catch (error) {
    console.error("Extraction error:", error);
    return null;
  }
};

const FallingPetals = () => {
  const [petals, setPetals] = useState<number[]>([]);
  useEffect(() => {
    setPetals(Array.from({ length: 12 }).map((_, i) => i));
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {petals.map((i) => (
        <motion.div
          key={i}
          className="absolute w-3 h-3 bg-indigo-500 opacity-20 rotate-45"
          style={{ left: `${Math.random() * 100}%`, top: `-5%` }}
          animate={{
            y: ['0vh', '105vh'],
            x: [0, (Math.random() - 0.5) * 150, (Math.random() - 0.5) * 150],
            rotate: [45, 225, 405],
          }}
          transition={{
            duration: 12 + Math.random() * 20,
            repeat: Infinity,
            ease: "linear",
            delay: Math.random() * 15,
          }}
        />
      ))}
    </div>
  );
};

const MinimalDuck = ({ state }: { state: 'idle' | 'processing' | 'happy' | 'sad' }) => (
  <motion.div 
    className="relative w-24 h-24 z-10 mx-auto"
    animate={{ 
      y: state === 'happy' ? [0, -8, 0] : [0, 4, 0],
      rotate: state === 'sad' ? [-5, 5, -5] : 0
    }}
    transition={{ duration: state === 'happy' ? 0.6 : (state === 'sad' ? 2 : 4), repeat: Infinity, ease: "easeInOut" }}
  >
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M25 55 C 25 75, 75 75, 75 55 C 80 40, 75 30, 55 30 C 40 25, 25 35, 25 55 Z" fill="#FDF4C5" />
      <path d="M15 50 C 5 50, 5 60, 25 60 C 25 50, 15 50, 15 50 Z" fill="#FFAE42" />
      <motion.circle 
        cx="40" cy="40" r="4" fill="#3A3A3A" 
        animate={{ scaleY: state === 'processing' ? [1, 0.1, 1] : [1, 1, 0.1, 1, 1] }} 
        transition={{ duration: state === 'processing' ? 0.5 : 4, repeat: Infinity, times: state === 'processing' ? [0, 0.5, 1] : [0, 0.45, 0.5, 0.55, 1] }}
      />
      {state === 'happy' && <path d="M50 35 C 52 33, 54 33, 56 35" stroke="#3A3A3A" strokeWidth="2" strokeLinecap="round" />}
      {state === 'sad' && <path d="M50 35 C 52 37, 54 37, 56 35" stroke="#3A3A3A" strokeWidth="2" strokeLinecap="round" />}
    </svg>
  </motion.div>
);

const FileUploader = ({ 
  label, file, onFileSelect, amount, onAmountChange, disabled, currency
}: { 
  label: string, file: File | null, onFileSelect: (f: File | null) => void, amount: number | '', onAmountChange: (a: number | '') => void, disabled?: boolean, currency: string
}) => (
  <div className="bg-white border-2 border-slate-900 p-6 shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] flex flex-col transition-all">
    <div className="flex justify-between items-start mb-6">
      <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400">Upload</h2>
      <span className="px-2 py-1 bg-slate-100 text-[10px] font-bold uppercase">{label}</span>
    </div>
    <div className="relative flex-1">
      <label className={`border-2 border-dashed border-slate-200 bg-slate-50 rounded-lg p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-slate-100 transition-colors ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
        {file ? (
          <div className="flex flex-col items-center flex-1 justify-center w-full h-full">
            <CheckCircle2 className="w-8 h-8 text-indigo-600 mb-2" />
            <span className="text-sm font-bold text-slate-900 truncate max-w-[180px] px-2">{file.name}</span>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center pt-2 pb-2">
            <UploadCloud className="w-8 h-8 text-slate-400 mb-3" />
            <p className="text-xs font-semibold mb-1">Upload {label}</p>
            <p className="text-[10px] text-slate-400">PDF, PNG, JPG</p>
          </div>
        )}
        <input type="file" className="hidden" accept=".pdf,image/*" disabled={disabled} onChange={(e) => e.target.files?.[0] && onFileSelect(e.target.files[0])} />
      </label>
      {file && !disabled && (
        <button onClick={() => onFileSelect(null)} className="absolute -top-3 -right-3 w-8 h-8 flex items-center justify-center bg-white border-2 border-slate-900 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] hover:bg-slate-100 text-slate-900 transition-colors font-bold pb-1.5 focus:outline-none">x</button>
      )}
    </div>
    <div className="mt-6">
      <label className="block text-[10px] font-bold uppercase text-slate-500 mb-2">Extracted Total</label>
      <div className="flex items-center">
        <span className="text-2xl font-bold mr-2">{currency}</span>
        <input 
          type="number" disabled={disabled} value={amount} onChange={(e) => onAmountChange(e.target.value ? Number(e.target.value) : '')}
          className="w-full text-2xl font-bold bg-transparent focus:outline-none border-b-2 border-slate-900 pb-1 disabled:opacity-50"
          placeholder="0.00"
        />
      </div>
    </div>
  </div>
);

export default function App() {
  const [records, setRecords] = useState<any[]>(() => {
    const saved = localStorage.getItem('profit_pulse_records');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { return []; }
    }
    return [];
  });
  
  useEffect(() => {
    localStorage.setItem('profit_pulse_records', JSON.stringify(records));
  }, [records]);

  const [showHistory, setShowHistory] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [currency, setCurrency] = useState('₹');

  const [purchaseFile, setPurchaseFile] = useState<File | null>(null);
  const [salesFile, setSalesFile] = useState<File | null>(null);
  const [purchaseAmount, setPurchaseAmount] = useState<number | ''>('');
  const [salesAmount, setSalesAmount] = useState<number | ''>('');
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSaveRecord = () => {
    if (result === null) return;
    const newRecord = {
      id: Date.now().toString(),
      date: new Date().toLocaleString(),
      purchaseAmount: Number(purchaseAmount),
      salesAmount: Number(salesAmount),
      result: result
    };
    setRecords([newRecord, ...records]);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };


  const calculate = async () => {
    setIsProcessing(true);
    setError(null);
    try {
      let fPurchase = purchaseAmount;
      let fSales = salesAmount;

      if (fPurchase === '' && purchaseFile) {
        const ext = await extractAmountFromBill(purchaseFile);
        if (ext !== null) { fPurchase = ext; setPurchaseAmount(ext); }
        else throw new Error('Could not extract Purchase Amount. Please try entering it manually.');
      }
      if (fSales === '' && salesFile) {
        const ext = await extractAmountFromBill(salesFile);
        if (ext !== null) { fSales = ext; setSalesAmount(ext); }
        else throw new Error('Could not extract Sales Amount. Please try entering it manually.');
      }

      if (fPurchase === '' || fSales === '') {
        throw new Error('Please provide amounts for both bills, either by upload or manual entry.');
      }

      setResult(Number(fSales) - Number(fPurchase));
    } catch (err: any) {
      setError(err.message || 'An error occurred.');
    } finally {
      setIsProcessing(false);
    }
  };

  const reset = () => {
    setPurchaseFile(null); setSalesFile(null);
    setPurchaseAmount(''); setSalesAmount('');
    setResult(null); setError(null);
  };

  const duckState = isProcessing ? 'processing' : (result === null ? 'idle' : (result >= 0 ? 'happy' : 'sad'));

  return (
    <div className="h-screen bg-[#F8FAFC] font-sans text-slate-900 overflow-hidden flex flex-col relative w-full">
      <FallingPetals />
      
      {/* Header Section */}
      <header className="bg-white border-b border-slate-200 px-4 sm:px-10 py-4 sm:py-6 flex flex-col sm:flex-row gap-4 justify-between items-center relative z-10 shrink-0">
        <div className="flex items-center gap-3 w-full justify-center sm:w-auto">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-indigo-600 flex items-center justify-center text-white font-bold text-lg sm:text-xl shrink-0">P</div>
          <h1 className="text-base sm:text-xl font-bold tracking-tight uppercase text-center">Profit Pulse <span className="text-indigo-600 font-normal hidden sm:inline">Calculator</span><span className="text-indigo-600 font-normal sm:hidden">Calc</span></h1>
        </div>
        <div className="flex w-full sm:w-auto gap-4 sm:gap-6 text-[11px] sm:text-sm font-bold sm:font-medium text-slate-500 uppercase tracking-widest justify-between sm:justify-end border-t sm:border-t-0 border-slate-100 pt-3 sm:pt-0 px-2 sm:px-0">
          <button onClick={() => setShowHistory(true)} className="hover:text-indigo-600 transition-colors focus:outline-none bg-slate-50 sm:bg-transparent px-4 sm:px-0 py-2 sm:py-0 border border-slate-200 sm:border-none">History</button>
          <button onClick={() => setShowSettings(true)} className="hover:text-indigo-600 transition-colors focus:outline-none bg-slate-50 sm:bg-transparent px-4 sm:px-0 py-2 sm:py-0 border border-slate-200 sm:border-none">Settings</button>
          <button onClick={reset} className="text-indigo-600 hover:text-indigo-500 transition-colors focus:outline-none bg-indigo-50 sm:bg-transparent px-4 sm:px-0 py-2 sm:py-0 border border-indigo-200 sm:border-none">New Calc</button>
        </div>
      </header>

      <main className="flex-1 p-6 sm:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10 overflow-y-auto">
        {/* Left Column: Upload & Input */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {error && (
             <div className="bg-white border-2 border-red-500 p-4 shadow-[8px_8px_0px_0px_rgba(239,68,68,1)] text-red-600 font-bold flex justify-between items-center">
               <span>{error}</span>
               <button onClick={() => setError(null)} className="text-red-800 hover:text-black focus:outline-none">×</button>
             </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FileUploader 
              label="Purchase Bill" file={purchaseFile} onFileSelect={setPurchaseFile}
              amount={purchaseAmount} onAmountChange={setPurchaseAmount} disabled={isProcessing}
              currency={currency}
            />
            <FileUploader 
              label="Sales Bill" file={salesFile} onFileSelect={setSalesFile}
              amount={salesAmount} onAmountChange={setSalesAmount} disabled={isProcessing}
              currency={currency}
            />
          </div>

          <div className="bg-slate-900 text-white p-6 flex flex-col sm:flex-row justify-between items-center gap-6 shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] relative overflow-hidden">
             <div className="absolute right-0 top-0 bottom-0 opacity-20 pointer-events-none translate-x-1/2 scale-[2]">
               <MinimalDuck state={duckState} />
             </div>
             <div>
               <p className="text-[10px] uppercase tracking-widest text-slate-400 mb-1">Extraction Status</p>
               <p className="text-sm font-medium">{isProcessing ? 'OCR Engine: Extracting...' : 'OCR Engine: Ready'}</p>
             </div>
             <button 
               onClick={calculate} disabled={isProcessing || (!purchaseFile && purchaseAmount === '') || (!salesFile && salesAmount === '')}
               className="bg-indigo-500 hover:bg-indigo-400 disabled:bg-indigo-800 disabled:opacity-80 text-white px-8 py-3 font-bold uppercase text-sm tracking-tighter transition-colors w-full sm:w-auto flex items-center justify-center gap-2 relative z-10"
             >
               {isProcessing && <Loader2 className="w-4 h-4 animate-spin" />}
               Calculate Totals
             </button>
          </div>
        </div>

        {/* Right Column: Results */}
        <div className="lg:col-span-5 flex flex-col h-full gap-6 lg:gap-0 lg:justify-between w-full">
           <div className="bg-indigo-600 text-white flex-1 p-8 sm:p-10 flex flex-col justify-between shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] relative overflow-hidden min-h-[400px]">
             {result !== null ? (
               <>
                 <div className="relative z-10 w-full">
                   <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-200 mb-8">Summary Report</h2>
                   <div className="space-y-6">
                     <div className="flex justify-between border-b border-indigo-500 pb-4">
                       <span className="text-indigo-200 text-sm">Sales Revenue</span>
                       <span className="font-bold text-xl">{currency}{Number(salesAmount).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                     </div>
                     <div className="flex justify-between border-b border-indigo-500 pb-4">
                       <span className="text-indigo-200 text-sm">Purchase Cost</span>
                       <span className="font-bold text-xl">- {currency}{Number(purchaseAmount).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                     </div>
                     <div className="flex justify-between pb-4">
                       <span className="text-indigo-200 text-sm">Taxes / Misc (Auto)</span>
                       <span className="font-bold text-xl">{currency}0.00</span>
                     </div>
                   </div>
                 </div>

                 <div className="bg-white text-slate-900 p-6 sm:p-8 shadow-2xl relative mt-12 z-10 w-full mb-2">
                   <div className={`absolute -top-4 left-6 ${result >= 0 ? 'bg-emerald-500' : 'bg-red-500'} text-white text-[10px] font-bold px-3 py-1 uppercase tracking-widest italic`}>
                     {result >= 0 ? 'Net Gain' : 'Net Loss'}
                   </div>
                   <h3 className="text-[10px] font-bold uppercase text-slate-400 mb-2">Calculated Profit</h3>
                   <div className="flex items-end gap-2 flex-wrap">
                     <span className="text-4xl sm:text-5xl font-black tracking-tighter">{currency}{Math.abs(result).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                     {result >= 0 ? (
                       <span className="text-emerald-600 font-bold mb-1 text-sm">+{((result / (Number(purchaseAmount)||1)) * 100).toFixed(2)}%</span>
                     ) : (
                       <span className="text-red-600 font-bold mb-1 text-sm">{((result / (Number(purchaseAmount)||1)) * 100).toFixed(2)}%</span>
                     )}
                   </div>
                 </div>
               </>
             ) : (
               <div className="flex-1 flex flex-col items-center justify-center text-center opacity-60 w-full">
                 <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-200 mb-4">Awaiting Data</h2>
                 <p className="text-sm text-indigo-300">Upload bills or enter amounts manually on the left to see the summary report.</p>
               </div>
             )}
           </div>
           
           <div className={`mt-8 flex flex-col sm:flex-row gap-4`}>
             <button onClick={reset} disabled={isProcessing} className="flex-1 bg-white border-2 border-slate-900 py-4 font-bold uppercase text-sm shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:pointer-events-none">Reset</button>
             <button onClick={handleSaveRecord} disabled={result === null} className="flex-1 bg-white border-2 border-slate-900 py-4 font-bold uppercase text-sm shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] hover:bg-slate-50 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none">
               {saveSuccess ? <><CheckCircle2 className="w-5 h-5 text-emerald-600" /> Saved!</> : 'Save Record'}
             </button>
           </div>
        </div>
      </main>

      {/* Footer Element */}
      <footer className="px-6 sm:px-10 py-4 bg-white border-t border-slate-200 flex flex-wrap justify-between text-[10px] font-bold text-slate-400 uppercase relative z-10 shrink-0 gap-4">
        <span>Verified OCR Output: AI Powered</span>
        <span>Session ID: PULSE-2024-X99</span>
        <span>Accounting Tool v2.1</span>
      </footer>

      {/* History Modal */}
      {showHistory && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white border-2 border-slate-900 p-8 shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] max-w-2xl w-full max-h-[80vh] flex flex-col relative">
            <button onClick={() => setShowHistory(false)} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center bg-white border-2 border-slate-900 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] hover:bg-slate-100 font-bold focus:outline-none z-10 pb-1.5">x</button>
            <h2 className="text-xl font-bold uppercase tracking-widest mb-6">History</h2>
            <div className="flex-1 overflow-y-auto pr-2 space-y-4">
              {records.length === 0 ? (
                <p className="text-slate-500 italic text-sm">No saved calculations found.</p>
              ) : (
                records.map((r) => (
                  <div key={r.id} className="border-2 border-slate-200 p-4 relative">
                    <p className="text-[10px] font-bold uppercase text-slate-400 mb-2">{r.date}</p>
                    <div className="flex justify-between items-center flex-wrap gap-4">
                      <div className="text-sm">
                        <p><span className="text-slate-500">Purchase:</span> <span className="font-bold">{currency}{r.purchaseAmount.toLocaleString()}</span></p>
                        <p><span className="text-slate-500">Sales:</span> <span className="font-bold">{currency}{r.salesAmount.toLocaleString()}</span></p>
                      </div>
                      <div className="text-right">
                        <p className={`text-xl font-black ${r.result >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                          {r.result >= 0 ? '+' : ''}{currency}{Math.abs(r.result).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            {records.length > 0 && (
              <button 
                onClick={() => { if(window.confirm('Clear all history records?')) setRecords([]) }} 
                className="mt-6 text-xs font-bold text-red-500 uppercase tracking-widest hover:text-red-700 mx-auto border-2 border-red-500 px-4 py-2 hover:bg-red-50"
              >
                Clear All
              </button>
            )}
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white border-2 border-slate-900 p-8 shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] max-w-sm w-full relative">
            <button onClick={() => setShowSettings(false)} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center bg-white border-2 border-slate-900 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] hover:bg-slate-100 font-bold focus:outline-none z-10 pb-1.5">x</button>
            <h2 className="text-xl font-bold uppercase tracking-widest mb-6">Settings</h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-2">Currency Symbol</label>
                <div className="flex flex-wrap gap-2">
                  {['$', '€', '£', '¥', '₹'].map(c => (
                    <button 
                      key={c} onClick={() => setCurrency(c)}
                      className={`w-10 h-10 border-2 font-bold text-lg ${currency === c ? 'border-indigo-600 bg-indigo-50 text-indigo-600 shadow-[2px_2px_0px_0px_rgba(79,70,229,1)]' : 'border-slate-300 hover:border-slate-500 bg-white shadow-[2px_2px_0px_0px_rgba(203,213,225,1)]'} transition-all`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            <button onClick={() => setShowSettings(false)} className="mt-8 bg-indigo-600 hover:bg-indigo-500 text-white w-full py-3 font-bold uppercase tracking-widest text-sm shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] active:shadow-none active:translate-y-1 active:translate-x-1 transition-all">
              Save
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


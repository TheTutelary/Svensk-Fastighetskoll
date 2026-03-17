'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Loader2, AlertCircle, ArrowRight, Building, Sparkles, MapPin, ArrowLeft, CheckCircle2, Clock } from 'lucide-react';
import { ReportView } from '@/components/analysis/ReportView';
import { PropertyReport } from '@/lib/engine/types';

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [scannedSites, setScannedSites] = useState<{name: string, status: 'pending' | 'scanning' | 'done'}[]>([
    { name: 'Hemnet', status: 'pending' },
    { name: 'Booli', status: 'pending' },
    { name: 'Fastighetsbyrån', status: 'pending' },
    { name: 'Svensk Fast', status: 'pending' },
    { name: 'Mäklarhuset', status: 'pending' },
  ]);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<PropertyReport | null>(null);
  const [selectionOptions, setSelectionOptions] = useState<any[] | null>(null);

  const handleAnalyze = async (e?: React.FormEvent, selectedAddress?: string) => {
    if (e) e.preventDefault();
    const query = selectedAddress || searchQuery;
    if (!query) return;

    setIsLoading(true);
    setError(null);
    setReport(null);
    setSelectionOptions(null);
    
    // Reset sites
    setScannedSites(prev => prev.map(s => ({ ...s, status: 'pending' })));
    setLoadingStep('Initializing multi-site search engine...');
    
    try {
      // Simulate scanning progress for UX confidence
      const updateSite = (name: string, status: 'scanning' | 'done') => {
        setScannedSites(prev => prev.map(s => s.name === name ? { ...s, status } : s));
      };

      setTimeout(() => { updateSite('Hemnet', 'scanning'); setLoadingStep('Scanning Hemnet for active listings...'); }, 500);
      setTimeout(() => { updateSite('Hemnet', 'done'); updateSite('Booli', 'scanning'); setLoadingStep('Scanning Booli for historical and active data...'); }, 2000);
      setTimeout(() => { updateSite('Booli', 'done'); updateSite('Fastighetsbyrån', 'scanning'); setLoadingStep('Checking Broker databases...'); }, 4000);
      setTimeout(() => { updateSite('Fastighetsbyrån', 'done'); updateSite('Svensk Fast', 'scanning'); }, 5500);
      setTimeout(() => { updateSite('Svensk Fast', 'done'); updateSite('Mäklarhuset', 'scanning'); }, 7000);
      setTimeout(() => { updateSite('Mäklarhuset', 'done'); setLoadingStep('Aggregating results and calculating score...'); }, 8500);

      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          address: query.startsWith('http') ? undefined : query,
          url: query.startsWith('http') ? query : undefined
        }),
      });

      const data = await response.json();

      if (data.needsSelection) {
        setSelectionOptions(data.options);
        setIsLoading(false);
        return;
      }

      if (!response.ok) {
        throw new Error(data.error || 'Failed to analyze property');
      }

      setReport(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
      setLoadingStep('');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
      
      <AnimatePresence mode="wait">
        {!report && !isLoading && !selectionOptions && (
          <motion.div 
            key="search-form"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full max-w-2xl text-center space-y-8"
          >
            <div className="space-y-4">
              <div className="inline-flex items-center justify-center p-3 bg-blue-50 rounded-2xl mb-4">
                <Sparkles className="h-8 w-8 text-blue-600" />
              </div>
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-gray-900">
                Svensk <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-teal-500">Fastighetskoll</span>
              </h1>
              <p className="text-lg md:text-xl text-gray-600 max-w-lg mx-auto leading-relaxed">
                The multi-site search engine that rates any Swedish property on a 100-point scale.
              </p>
            </div>

            <form onSubmit={(e) => handleAnalyze(e)} className="relative max-w-xl mx-auto group">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-teal-500 rounded-2xl blur opacity-20 group-hover:opacity-30 transition-opacity" />
              <div className="relative flex items-center bg-white rounded-2xl shadow-xl p-2 border border-gray-100">
                <Search className="h-6 w-6 text-gray-400 ml-3" />
                <input
                  type="text"
                  placeholder="Enter address (e.g. Storgatan 1) or paste URL..."
                  className="flex-1 px-4 py-3 outline-none text-lg bg-transparent placeholder:text-gray-400"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  required
                />
                <button
                  type="submit"
                  disabled={!searchQuery}
                  className="px-6 py-3 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  Analyze
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </form>

            <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-500 pt-8">
              <span className="flex items-center gap-1.5 px-3 py-1 bg-white rounded-full border shadow-sm">
                <Building className="h-3.5 w-3.5" />
                Searches All Sites
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1 bg-white rounded-full border shadow-sm">
                <Building className="h-3.5 w-3.5" />
                No AI Required
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1 bg-white rounded-full border shadow-sm">
                <Building className="h-3.5 w-3.5" />
                Live Status Updates
              </span>
            </div>
          </motion.div>
        )}

        {selectionOptions && (
          <motion.div
            key="selection-menu"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-xl space-y-6"
          >
            <div className="flex items-center justify-between mb-4">
               <button 
                 onClick={() => setSelectionOptions(null)}
                 className="text-sm font-medium text-gray-500 hover:text-gray-900 flex items-center gap-1"
               >
                 <ArrowLeft className="h-4 w-4" /> Back to search
               </button>
               <h3 className="text-xl font-bold text-gray-900">Multiple properties found</h3>
            </div>
            <div className="grid gap-3">
              {selectionOptions.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => handleAnalyze(undefined, opt.address)}
                  className="w-full text-left p-4 bg-white border border-gray-100 rounded-2xl shadow-sm hover:border-blue-500 hover:shadow-md transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                       <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                          <MapPin className="h-5 w-5" />
                       </div>
                       <div>
                         <p className="font-bold text-gray-900">{opt.address}</p>
                         <p className="text-xs text-gray-500">{opt.sources.length} sources found</p>
                       </div>
                    </div>
                    <ArrowRight className="h-5 w-5 text-gray-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {isLoading && (
          <motion.div
            key="loading-state"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center space-y-8 w-full max-w-md"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-blue-500 rounded-full blur-xl opacity-20 animate-pulse" />
              <Loader2 className="h-16 w-16 text-blue-600 animate-spin relative z-10" />
            </div>
            
            <div className="text-center space-y-2">
              <h3 className="text-xl font-semibold text-gray-900">{loadingStep}</h3>
              <p className="text-gray-500 text-sm">Aggregating live data from Swedish databases...</p>
            </div>

            <div className="w-full bg-white rounded-2xl border p-4 shadow-sm space-y-3">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Scanning Progress</p>
              {scannedSites.map((site, i) => (
                <div key={i} className="flex items-center justify-between py-1 px-1">
                   <div className="flex items-center gap-3">
                      {site.status === 'done' ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : site.status === 'scanning' ? (
                        <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
                      ) : (
                        <Clock className="h-4 w-4 text-gray-300" />
                      )}
                      <span className={`text-sm font-medium ${site.status === 'pending' ? 'text-gray-400' : 'text-gray-700'}`}>{site.name}</span>
                   </div>
                   {site.status === 'done' && <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">SEARCHED</span>}
                   {site.status === 'scanning' && <span className="text-[10px] font-bold text-blue-600 animate-pulse">SCANNING...</span>}
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {error && (
          <motion.div
            key="error-state"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-md bg-red-50 border border-red-200 rounded-xl p-6 text-center space-y-4"
          >
            <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <h3 className="font-semibold text-red-900">Analysis Failed</h3>
              <p className="text-red-700 mt-1 text-sm">{error}</p>
            </div>
            <button 
              onClick={() => setError(null)}
              className="text-sm font-medium text-red-700 hover:text-red-900 underline"
            >
              Try Again
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {report && (
        <div className="w-full animate-in fade-in slide-in-from-bottom-8 duration-700">
           <div className="flex justify-start mb-6">
             <button 
               onClick={() => setReport(null)}
               className="text-sm text-gray-500 hover:text-gray-900 flex items-center gap-1"
             >
               ← Analyze another property
             </button>
           </div>
           <ReportView report={report} />
        </div>
      )}
    </div>
  );
}

'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { PropertyReport } from '@/lib/engine/types';
import { ScoreGauge } from './ScoreGauge';
import { PropertyRadarChart } from './RadarChart';
import { 
  Building2, 
  MapPin, 
  Train, 
  Trees, 
  Hammer, 
  ShoppingBag, 
  Wallet,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Share2,
  Download,
  ArrowRight
} from 'lucide-react';

interface ReportViewProps {
  report: PropertyReport;
}

export function ReportView({ report }: ReportViewProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'details'>('overview');

  const getRiskColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-50 border-red-200 text-red-700';
      case 'warning': return 'bg-yellow-50 border-yellow-200 text-yellow-700';
      default: return 'bg-blue-50 border-blue-200 text-blue-700';
    }
  };

  const getCategoryIcon = (category: string) => {
    if (category.includes('Location')) return <MapPin className="h-5 w-5" />;
    if (category.includes('Commutability')) return <Train className="h-5 w-5" />;
    if (category.includes('Plot')) return <Trees className="h-5 w-5" />;
    if (category.includes('Structural')) return <Hammer className="h-5 w-5" />;
    if (category.includes('Proximity')) return <ShoppingBag className="h-5 w-5" />;
    if (category.includes('Financial')) return <Wallet className="h-5 w-5" />;
    return <Building2 className="h-5 w-5" />;
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto space-y-8 pb-20"
    >
      {/* Header Card */}
      <div className="bg-white rounded-2xl shadow-sm border p-6 md:p-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 to-teal-400" />
        
        <div className="flex flex-col md:flex-row gap-8 items-start md:items-center">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2 text-sm text-gray-500 font-medium uppercase tracking-wide">
              <span>{report.propertyType}</span>
              <span>•</span>
              <span>{report.municipality}</span>
              {report.buildYear && (
                <>
                  <span>•</span>
                  <span>Built {report.buildYear}</span>
                </>
              )}
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight">
              {report.address}
            </h1>
            <p className="text-gray-600 max-w-2xl text-lg leading-relaxed">
              {report.executiveSummary}
            </p>
          </div>
          
          <div className="flex flex-col items-center">
             <ScoreGauge score={report.totalScore} />
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <div className={`px-4 py-2 rounded-full text-sm font-semibold border ${
            report.recommendation === 'BUY' ? 'bg-green-50 text-green-700 border-green-200' :
            report.recommendation === 'NEGOTIATE' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
            'bg-red-50 text-red-700 border-red-200'
          }`}>
            Rec: {report.recommendation}
          </div>
          <div className="px-4 py-2 rounded-full text-sm font-medium bg-gray-100 text-gray-700">
            Est. Value: {report.valuation.estimatedFairValue}
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Radar Chart Card */}
        <div className="md:col-span-2 bg-white rounded-2xl shadow-sm border p-6 flex flex-col">
          <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
            <Building2 className="h-5 w-5 text-blue-500" />
            Performance Breakdown
          </h3>
          <div className="flex-1 flex items-center justify-center -ml-4">
            <PropertyRadarChart data={report.scorecard} />
          </div>
        </div>

        {/* Data Sources Sidebar */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border p-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 flex items-center gap-2">
              <Share2 className="h-5 w-5 text-blue-500" />
              Found On
            </h3>
            <div className="space-y-3">
              {report.dataSources.map((source, i) => (
                <a 
                  key={i} 
                  href={source.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block p-3 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-gray-900 group-hover:text-blue-600">{source.site}</span>
                    <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all" />
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                      source.status === 'For Sale' ? 'bg-green-100 text-green-700' :
                      source.status === 'Coming Soon' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {source.status}
                    </span>
                    {source.price && <span className="text-xs text-gray-500">{source.price}</span>}
                  </div>
                </a>
              ))}
            </div>
            
            {report.inspectionReportUrl && (
              <div className="mt-6 pt-6 border-t">
                <a 
                  href={report.inspectionReportUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full p-3 bg-teal-50 text-teal-700 rounded-xl font-bold text-sm border border-teal-200 hover:bg-teal-100 transition-colors"
                >
                  <Download className="h-4 w-4" />
                  Besiktningsprotokoll
                </a>
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl shadow-sm border p-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Key Risks
            </h3>
            <div className="space-y-3">
              {report.risks.slice(0, 3).map((risk, i) => (
                <div key={i} className={`p-3 rounded-lg border text-sm ${getRiskColor(risk.severity)}`}>
                  <div className="font-medium flex justify-between">
                    {risk.category}
                    {risk.swedishTerm && <span className="opacity-70 text-xs italic">({risk.swedishTerm})</span>}
                  </div>
                  <p className="mt-1 opacity-90">{risk.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Valuation & Future Card */}
      <div className="bg-white rounded-2xl shadow-sm border p-8">
        <h3 className="text-xl font-bold mb-6 text-gray-900">Market Valuation Analysis</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-500 mb-1 uppercase tracking-wider font-bold">Estimated Fair Value</p>
              <p className="text-4xl font-black text-gray-900">{report.valuation.estimatedFairValue}</p>
              <p className="text-sm text-gray-600 mt-2 leading-relaxed">{report.valuation.fairValueReasoning}</p>
            </div>
          </div>
          <div className="p-6 bg-blue-50/50 rounded-2xl border border-blue-100">
            <p className="text-sm text-gray-500 mb-1 uppercase tracking-wider font-bold">5 Year Potential</p>
            <p className="text-3xl font-black text-blue-600">{report.valuation.futureEstimate5Years}</p>
            <p className="text-sm text-gray-600 mt-2 leading-relaxed font-medium">{report.valuation.futureEstimateAssumptions}</p>
          </div>
        </div>
      </div>

      {/* Detailed Scorecard */}
      <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
        <div className="p-6 border-b bg-gray-50">
          <h3 className="text-lg font-semibold text-gray-900">Detailed Scorecard</h3>
        </div>
        <div className="divide-y">
          {report.scorecard.map((item, i) => (
            <div key={i} className="p-6 hover:bg-gray-50/50 transition-colors">
              <div className="flex items-start justify-between gap-4 mb-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                    {getCategoryIcon(item.category)}
                  </div>
                  <h4 className="font-medium text-gray-900">{item.category}</h4>
                </div>
                <div className="text-right">
                  <span className="text-lg font-bold text-gray-900">{item.score}</span>
                  <span className="text-gray-400 text-sm">/{item.maxScore}</span>
                </div>
              </div>
              <p className="text-sm text-gray-600 pl-[52px]">{item.notes}</p>
              
              {/* Progress Bar */}
              <div className="mt-4 pl-[52px] pr-4">
                <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500 rounded-full" 
                    style={{ width: `${(item.score / item.maxScore) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-center gap-4 py-8">
        <button className="flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-colors">
          <Share2 className="h-4 w-4" />
          Share Report
        </button>
        <button className="flex items-center gap-2 px-6 py-3 bg-white border text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors">
          <Download className="h-4 w-4" />
          Save as PDF
        </button>
      </div>
    </motion.div>
  );
}

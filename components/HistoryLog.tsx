
import React, { useState } from 'react';
import { Task, CallLog, TaskStatus } from '../types';
import { 
  ShoppingCartIcon, 
  PhoneIcon, 
  ChevronDownIcon, 
  ChevronUpIcon,
  GlobeAltIcon,
  DocumentTextIcon,
  PlayIcon,
  MapPinIcon,
  ReceiptPercentIcon,
  CreditCardIcon,
  ClockIcon,
  ArrowTopRightOnSquareIcon,
  ListBulletIcon,
  ShieldCheckIcon,
  TagIcon
} from '@heroicons/react/24/solid';

interface Props {
  tasks: Task[];
  callLogs: CallLog[];
  onFeedback: (taskId: string, type: 'positive' | 'negative') => void;
  onInitiateCall: (recipient: string, message: string) => void;
}

const HistoryLog: React.FC<Props> = ({ tasks, callLogs, onFeedback, onInitiateCall }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [expandedCallId, setExpandedCallId] = useState<string | null>(null);
  const [playingCall, setPlayingCall] = useState<string | null>(null);

  const toggleExpand = (id: string) => setExpandedId(expandedId === id ? null : id);
  const toggleCallExpand = (id: string) => setExpandedCallId(expandedCallId === id ? null : id);

  const handleReplay = (callId: string) => {
    setPlayingCall(callId);
    setTimeout(() => setPlayingCall(null), 3000); 
  };

  return (
    <div className="p-3 sm:p-8 max-w-7xl mx-auto w-full h-full overflow-y-auto custom-scroll bg-[#020617]">
      <div className="mb-6 sm:mb-12 border-b border-slate-800 pb-6 sm:pb-10">
        <h1 className="text-2xl sm:text-5xl font-black text-white tracking-tighter uppercase leading-tight">History & Memory</h1>
        <p className="text-slate-500 mt-1 font-medium text-xs sm:text-lg">Archived actions, receipts, and transcripts.</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 sm:gap-12">
        {/* Logistics Archives */}
        <section className="space-y-4 sm:space-y-8">
          <div className="flex items-center justify-between px-1 sm:px-4">
             <h2 className="text-[10px] sm:text-sm font-black text-slate-400 uppercase tracking-[0.2em] flex items-center space-x-2 sm:space-x-3">
               <ReceiptPercentIcon className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-500" />
               <span>Logistics Archives</span>
             </h2>
             <span className="text-[8px] sm:text-[10px] font-black text-slate-600 uppercase tracking-widest">{tasks.length} RECORDS</span>
          </div>
          
          <div className="space-y-3 sm:space-y-6">
            {tasks.length === 0 ? (
              <div className="p-8 sm:p-16 text-center bg-slate-900/10 border border-dashed border-slate-800 rounded-2xl sm:rounded-[3rem]">
                 <p className="text-slate-600 font-bold uppercase text-[10px] tracking-widest">Memory Empty</p>
              </div>
            ) : (
              tasks.slice().reverse().map(t => (
                <div key={t.id} className={`bg-[#0b0f1a] border rounded-2xl sm:rounded-[3rem] overflow-hidden transition-all duration-300 ${expandedId === t.id ? 'border-indigo-600 ring-2 sm:ring-8 ring-indigo-500/5' : 'border-slate-800'}`}>
                  {/* Summary Card Header */}
                  <div onClick={() => toggleExpand(t.id)} className="p-4 sm:p-8 flex items-center space-x-3 sm:space-x-6 cursor-pointer">
                    <div className="p-2 sm:p-4 rounded-lg sm:rounded-2xl bg-indigo-600/10 text-indigo-500 shrink-0">
                      <ShoppingCartIcon className="w-4 h-4 sm:w-6 sm:h-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-white text-[13px] sm:text-lg uppercase tracking-tight truncate">{t.description}</p>
                      <div className="flex items-center space-x-2 mt-0.5 overflow-hidden">
                        <p className="text-[8px] sm:text-[10px] text-slate-600 font-bold uppercase tracking-widest shrink-0">{new Date(t.timestamp).toLocaleDateString()}</p>
                        <span className="text-slate-800 shrink-0">•</span>
                        <p className="text-[8px] sm:text-[10px] text-indigo-500 font-black uppercase tracking-widest truncate">{t.platform || 'General'}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                       <p className="text-base sm:text-2xl font-black text-white">${t.price?.toFixed(2) || '0.00'}</p>
                       <p className={`text-[7px] sm:text-[10px] font-black uppercase tracking-widest ${t.status === TaskStatus.COMPLETED ? 'text-green-500' : 'text-slate-500'}`}>{t.status}</p>
                    </div>
                    <div className="text-slate-700 shrink-0">
                      {expandedId === t.id ? <ChevronUpIcon className="w-4 h-4 sm:w-6 sm:h-6" /> : <ChevronDownIcon className="w-4 h-4 sm:w-6 sm:h-6" />}
                    </div>
                  </div>

                  {/* Deep Detail Expansion */}
                  {expandedId === t.id && (
                    <div className="px-4 sm:px-8 pb-4 sm:pb-8 pt-1 border-t border-slate-800 bg-[#080b14] animate-in fade-in slide-in-from-top-2 duration-300">
                       <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-10 py-3">
                          
                          {/* Itemized Breakdown */}
                          <div className="space-y-3">
                             <div className="flex items-center space-x-2 mb-0.5 px-1">
                               <TagIcon className="w-3 h-3 text-indigo-500" />
                               <label className="text-[9px] sm:text-xs font-black text-slate-400 uppercase tracking-widest">Itemized Breakdown</label>
                             </div>
                             <div className="bg-slate-900/60 rounded-xl sm:rounded-[2rem] p-4 sm:p-6 border border-slate-800">
                                <div className="space-y-2 sm:space-y-4">
                                   {t.items && t.items.length > 0 ? t.items.map((item, i) => (
                                     <div key={i} className="flex justify-between items-start gap-2 text-[11px] sm:text-sm">
                                        <div className="flex flex-col min-w-0">
                                          <span className="text-slate-200 font-bold truncate">{item.name}</span>
                                          <span className="text-[8px] sm:text-[10px] text-slate-500 font-black uppercase tracking-widest">Qty: {item.quantity} × ${item.price.toFixed(2)}</span>
                                        </div>
                                        <span className="text-slate-100 font-black shrink-0">${(item.price * item.quantity).toFixed(2)}</span>
                                     </div>
                                   )) : (
                                     <p className="text-[10px] text-slate-600 italic">No item data archived.</p>
                                   )}
                                </div>
                                <div className="mt-4 pt-4 border-t border-slate-800 flex justify-between items-end">
                                   <div className="min-w-0">
                                      <p className="text-[8px] sm:text-[10px] font-black text-slate-500 uppercase tracking-widest">Total Settled</p>
                                      <p className="text-[9px] sm:text-sm font-bold text-indigo-400 truncate">via {t.paymentMethod || 'Wallet'}</p>
                                   </div>
                                   <p className="text-xl sm:text-3xl font-black text-white shrink-0">${t.price?.toFixed(2)}</p>
                                </div>
                             </div>
                          </div>

                          {/* Logistics & Summary */}
                          <div className="space-y-5 sm:space-y-8">
                             <div className="space-y-2">
                                <label className="text-[9px] sm:text-xs font-black text-slate-400 uppercase tracking-widest flex items-center space-x-2">
                                  <ShieldCheckIcon className="w-3 h-3 text-green-500" />
                                  <span>Summary</span>
                                </label>
                                <div className="bg-slate-900/40 border border-slate-800 p-3 sm:p-5 rounded-xl italic text-[10px] sm:text-sm text-slate-400 leading-snug">
                                   "{t.result || 'Autonomous path verified.'}"
                                </div>
                             </div>

                             <div className="grid grid-cols-1 gap-2 sm:gap-4">
                                <DetailRow icon={<MapPinIcon />} label="Location" value={t.deliveryAddress || 'Primary Hub'} />
                                <DetailRow icon={<DocumentTextIcon />} label="TXN ID" value={t.transactionId || 'TXN-GENERIC'} isMono />
                             </div>

                             <div className="pt-1 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                                <a 
                                  href={t.platformLink || '#'} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  className="flex items-center justify-center space-x-2 px-4 py-3 bg-indigo-600/10 border border-indigo-600/30 text-indigo-400 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all group"
                                >
                                   <span>Track on {t.platform || 'Web'}</span>
                                   <ArrowTopRightOnSquareIcon className="w-3 h-3" />
                                </a>
                                <div className="flex items-center justify-center space-x-2 px-2">
                                   <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                   <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Synced</span>
                                </div>
                             </div>
                          </div>
                       </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </section>

        {/* Voice Session Logs */}
        <section className="space-y-4 sm:space-y-8">
          <div className="flex items-center justify-between px-1 sm:px-4">
             <h2 className="text-[10px] sm:text-sm font-black text-slate-400 uppercase tracking-[0.2em] flex items-center space-x-2 sm:space-x-3">
               <PhoneIcon className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-500" />
               <span>Voice Sessions</span>
             </h2>
             <span className="text-[8px] sm:text-[10px] font-black text-slate-600 uppercase tracking-widest">{callLogs.length} LOGS</span>
          </div>
          
          <div className="space-y-3 sm:space-y-6">
            {callLogs.slice().reverse().map(log => (
              <div key={log.id} className={`bg-[#0b0f1a] border rounded-2xl sm:rounded-[3rem] overflow-hidden transition-all duration-300 ${expandedCallId === log.id ? 'border-indigo-600 ring-2 sm:ring-8 ring-indigo-500/5' : 'border-slate-800'}`}>
                <div onClick={() => toggleCallExpand(log.id)} className="p-4 sm:p-8 flex items-center space-x-3 sm:space-x-6 cursor-pointer">
                  <div className="p-2 sm:p-4 rounded-lg sm:rounded-2xl bg-indigo-600/10 text-indigo-500 shrink-0">
                    <PhoneIcon className="w-4 h-4 sm:w-6 sm:h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-white text-[13px] sm:text-lg uppercase tracking-tight truncate">{log.recipient}</p>
                    <div className="flex items-center space-x-2 mt-0.5 overflow-hidden">
                      <p className="text-[8px] sm:text-[10px] text-slate-600 font-bold uppercase tracking-widest shrink-0">{log.duration} • {new Date(log.timestamp).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleReplay(log.id); }}
                    className={`w-10 h-10 sm:w-14 sm:h-14 rounded-full transition-all flex items-center justify-center shrink-0 ${playingCall === log.id ? 'bg-indigo-600 text-white animate-pulse' : 'bg-slate-800 text-slate-500 hover:text-white shadow-lg'}`}
                  >
                    <PlayIcon className="w-4 h-4 sm:w-6 sm:h-6" />
                  </button>
                  <div className="text-slate-700 shrink-0">
                    {expandedCallId === log.id ? <ChevronUpIcon className="w-4 h-4 sm:w-6 sm:h-6" /> : <ChevronDownIcon className="w-4 h-4 sm:w-6 sm:h-6" />}
                  </div>
                </div>

                {expandedCallId === log.id && (
                  <div className="px-4 sm:px-8 pb-4 sm:pb-8 pt-1 border-t border-slate-800 bg-[#080b14] animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="space-y-3 mt-3">
                       <div className="flex items-center justify-between px-1">
                          <span className="text-[8px] sm:text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">Transcript</span>
                          <span className="px-1.5 py-0.5 bg-indigo-600/10 text-indigo-500 text-[7px] font-black uppercase rounded">Audio</span>
                       </div>
                       <div className="space-y-2 max-h-60 overflow-y-auto custom-scroll pr-1.5 p-2 sm:p-4 bg-black/20 rounded-xl sm:rounded-[2rem] border border-slate-800/50">
                          {log.transcript?.length === 0 ? (
                            <p className="text-center text-slate-700 text-[8px] py-6 font-black uppercase">No transcript recorded.</p>
                          ) : (
                            log.transcript?.map((entry, idx) => (
                              <div key={idx} className={`flex ${entry.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[90%] p-2.5 sm:p-4 rounded-xl text-[10px] sm:text-[12px] font-medium leading-relaxed ${entry.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-slate-800/60 text-slate-300 rounded-tl-none border border-slate-800'}`}>
                                   <div className="flex items-center space-x-1.5 mb-0.5 opacity-60">
                                      <span className="text-[7px] font-black uppercase tracking-widest">{entry.role === 'user' ? 'YOU' : 'AGENT'}</span>
                                   </div>
                                   {entry.content}
                                </div>
                              </div>
                            ))
                          )}
                       </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

const DetailRow: React.FC<{ icon: React.ReactNode, label: string, value: string, isMono?: boolean }> = ({ icon, label, value, isMono }) => (
  <div className="flex items-start space-x-2 sm:space-x-4">
    <div className="p-1.5 sm:p-2.5 rounded-lg bg-indigo-600/10 text-indigo-500 mt-0.5 shrink-0">
      {React.cloneElement(icon as React.ReactElement, { className: 'w-3 h-3 sm:w-4 sm:h-4' })}
    </div>
    <div className="flex-1 min-w-0">
       <label className="text-[8px] sm:text-[10px] font-black text-slate-600 uppercase tracking-widest block mb-0.5">{label}</label>
       <p className={`text-[11px] sm:text-sm text-slate-300 font-bold truncate ${isMono ? 'font-mono text-[9px] sm:text-[11px] text-indigo-300' : ''}`}>{value}</p>
    </div>
  </div>
);

export default HistoryLog;

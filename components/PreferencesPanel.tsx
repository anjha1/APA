
import React from 'react';
import { UserPreferences } from '../types';
import { 
  UserCircleIcon, 
  MapPinIcon, 
  CreditCardIcon, 
  ShieldCheckIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

interface Props {
  prefs: UserPreferences;
  setPrefs: (p: UserPreferences) => void;
}

const PreferencesPanel: React.FC<Props> = ({ prefs, setPrefs }) => {
  return (
    <div className="p-8 h-full overflow-y-auto custom-scroll">
      <div className="max-w-4xl mx-auto">
        <div className="mb-10">
          <h1 className="text-4xl font-black text-white tracking-tighter">Identity & Logic</h1>
          <p className="text-slate-400 mt-2">Configure the core memory and autonomous guardrails for your APA.</p>
        </div>

        <div className="space-y-8">
          <div className="grid md:grid-cols-2 gap-8">
            <ConfigSection title="Biometric Profile" icon={<UserCircleIcon />}>
              <div className="space-y-4">
                <DarkInput label="Full Identity" value={prefs.name} onChange={v => setPrefs({...prefs, name: v})} />
                <DarkInput label="Secure Line" value={prefs.phone} onChange={v => setPrefs({...prefs, phone: v})} />
              </div>
            </ConfigSection>

            <ConfigSection title="Saved Logistics" icon={<MapPinIcon />}>
              <textarea
                value={prefs.address}
                onChange={(e) => setPrefs({...prefs, address: e.target.value})}
                className="w-full bg-slate-800 border border-slate-700 rounded-2xl p-4 text-sm text-slate-100 focus:ring-2 focus:ring-indigo-600 h-[116px] resize-none"
                placeholder="Logistics destination..."
              />
            </ConfigSection>
          </div>

          <ConfigSection title="Financial Guardrails" icon={<CreditCardIcon />}>
            <div className="bg-gradient-to-br from-indigo-700 to-indigo-900 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden mb-8">
               <div className="relative z-10 flex flex-col justify-between h-32">
                  <div className="flex justify-between items-start">
                     <span className="font-mono text-xl tracking-widest opacity-80">•••• •••• •••• 4242</span>
                     <ShieldCheckIcon className="w-8 h-8 opacity-50" />
                  </div>
                  <div>
                     <p className="text-[10px] uppercase tracking-[0.3em] font-black opacity-60">AutoPay Active - Tokenized</p>
                     <p className="text-2xl font-black">{prefs.name}</p>
                  </div>
               </div>
               <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
            </div>
            
            <div className="grid md:grid-cols-2 gap-6 items-end">
               <DarkInput label="Monthly Spend Limit" type="number" value={prefs.spendingLimit.toString()} onChange={v => setPrefs({...prefs, spendingLimit: Number(v)})} />
               <div className="bg-slate-800/50 border border-slate-700 p-4 rounded-2xl flex items-center space-x-3">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-xs font-bold text-slate-400">Continuous Risk Assessment Enabled</span>
               </div>
            </div>
          </ConfigSection>

          <div className="bg-amber-900/20 border border-amber-900/50 p-6 rounded-[2rem] flex items-start space-x-4">
             <ExclamationTriangleIcon className="w-6 h-6 text-amber-500" />
             <div>
                <p className="font-black text-amber-500 uppercase tracking-widest text-xs">Autonomous Safety Protocol</p>
                <p className="text-sm text-amber-200/70 mt-1">
                   All transactions exceeding ${prefs.spendingLimit} or marked as HIGH-RISK (Medicine, Foreign Calls) will trigger a push notification for manual biometric override.
                </p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ConfigSection: React.FC<{ title: string; icon: any; children: React.ReactNode }> = ({ title, icon, children }) => (
  <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8">
    <div className="flex items-center space-x-4 mb-8">
       <div className="w-12 h-12 bg-indigo-600/10 text-indigo-500 rounded-2xl flex items-center justify-center">
          {React.cloneElement(icon as React.ReactElement, { className: 'w-6 h-6' })}
       </div>
       <h2 className="text-xl font-bold text-white">{title}</h2>
    </div>
    {children}
  </div>
);

const DarkInput: React.FC<{ label: string; value: string; type?: string; onChange: (v: string) => void }> = ({ label, value, type = 'text', onChange }) => (
  <div className="space-y-2">
    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">{label}</label>
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-5 py-3 text-sm text-white focus:ring-2 focus:ring-indigo-600 outline-none transition-all"
    />
  </div>
);

export default PreferencesPanel;

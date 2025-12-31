
import React, { useState } from 'react';
import { 
  ShieldCheckIcon, 
  RocketLaunchIcon, 
  CpuChipIcon, 
  SparklesIcon, 
  PhoneIcon, 
  ShoppingCartIcon, 
  GlobeAltIcon,
  FingerPrintIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';

interface Props {
  onGetStarted: () => void;
  onLogin: () => void;
}

const Landing: React.FC<Props> = ({ onGetStarted, onLogin }) => {
  const [activeView, setActiveView] = useState<'home' | 'features'>('home');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 overflow-x-hidden selection:bg-indigo-500/30">
      {/* Dynamic Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 rounded-full blur-[120px]" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
      </div>

      {/* Navigation */}
      <nav className="relative z-50 max-w-7xl mx-auto px-6 py-8 flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-[0_0_30px_rgba(79,70,229,0.4)] border border-indigo-400/30">
            <ShieldCheckIcon className="w-7 h-7" />
          </div>
          <span className="text-2xl font-black tracking-tighter uppercase">APA BRAIN</span>
        </div>
        
        <div className="hidden md:flex items-center bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl px-2 py-1.5">
          <button 
            onClick={() => setActiveView('home')}
            className={`px-6 py-2 rounded-xl text-sm font-black transition-all ${activeView === 'home' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
          >
            HOME
          </button>
          <button 
            onClick={() => setActiveView('features')}
            className={`px-6 py-2 rounded-xl text-sm font-black transition-all ${activeView === 'features' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
          >
            FEATURES
          </button>
        </div>

        <div className="flex items-center space-x-6">
          <button onClick={onLogin} className="text-sm font-black text-slate-400 hover:text-white transition-colors uppercase tracking-widest">Login</button>
          <button onClick={onGetStarted} className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl blur opacity-30 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative bg-slate-900 border border-slate-800 text-white px-6 py-3 rounded-2xl text-sm font-black uppercase tracking-widest">Initialize Agent</div>
          </button>
        </div>
      </nav>

      {activeView === 'home' ? (
        <main className="relative z-10">
          {/* Hero Section */}
          <section className="max-w-7xl mx-auto px-6 pt-16 pb-32 flex flex-col items-center text-center">
            <div className="inline-flex items-center space-x-2 bg-indigo-500/10 border border-indigo-500/20 px-4 py-1.5 rounded-full text-indigo-400 text-[10px] font-black uppercase tracking-[0.3em] mb-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
              <SparklesIcon className="w-4 h-4" />
              <span>Version 2.5: Native Audio Integration</span>
            </div>
            
            <h1 className="text-7xl md:text-9xl font-black tracking-tighter leading-[0.85] text-white uppercase mb-8">
              True <span className="text-transparent bg-clip-text bg-gradient-to-b from-indigo-400 to-indigo-700">Autonomous</span> <br />
              Intelligence.
            </h1>
            
            <p className="text-xl text-slate-400 max-w-2xl leading-relaxed font-medium mb-12">
              The world's first APA that doesn't just talk—it executes. From high-stakes calling to autonomous commerce, your agent is ready.
            </p>

            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-6">
              <button 
                onClick={onGetStarted}
                className="px-10 py-5 bg-indigo-600 text-white rounded-[2rem] font-black text-xl shadow-[0_0_50px_rgba(79,70,229,0.3)] hover:scale-105 active:scale-95 transition-all flex items-center space-x-3"
              >
                <span>GET STARTED</span>
                <ChevronRightIcon className="w-6 h-6" />
              </button>
              <button 
                onClick={() => setActiveView('features')}
                className="px-10 py-5 bg-slate-900 border border-slate-800 text-white rounded-[2rem] font-black text-xl hover:bg-slate-800 transition-all"
              >
                VIEW CAPABILITIES
              </button>
            </div>

            {/* Futuristic Core Visualization */}
            <div className="mt-32 relative w-full max-w-4xl h-[400px] flex items-center justify-center">
               <div className="absolute w-[500px] h-[500px] border border-indigo-500/10 rounded-full animate-[spin_20s_linear_infinite]" />
               <div className="absolute w-[400px] h-[400px] border border-purple-500/10 rounded-full animate-[spin_15s_linear_infinite_reverse]" />
               <div className="absolute w-[300px] h-[300px] border border-indigo-500/20 rounded-full animate-pulse" />
               
               {/* Floating Agent Cards */}
               <div className="absolute top-0 left-1/4 p-6 bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl shadow-2xl animate-bounce duration-[3000ms]">
                  <PhoneIcon className="w-6 h-6 text-green-400 mb-2" />
                  <p className="text-[10px] font-black uppercase text-slate-500">Live Voice Relay</p>
                  <p className="text-sm font-bold text-white">"I'll be there in 10m."</p>
               </div>
               
               <div className="absolute bottom-10 right-1/4 p-6 bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl shadow-2xl animate-bounce duration-[4000ms] delay-500">
                  <ShoppingCartIcon className="w-6 h-6 text-indigo-400 mb-2" />
                  <p className="text-[10px] font-black uppercase text-slate-500">AutoPay Order</p>
                  <p className="text-sm font-bold text-white">Swiggy: Dinner Placed</p>
               </div>

               <div className="w-32 h-32 bg-indigo-600 rounded-[2.5rem] flex items-center justify-center shadow-[0_0_100px_rgba(79,70,229,0.5)] border border-indigo-400 animate-pulse relative z-10">
                  <CpuChipIcon className="w-16 h-16 text-white" />
               </div>
            </div>
          </section>
        </main>
      ) : (
        <main className="relative z-10 max-w-7xl mx-auto px-6 pt-16 pb-32 animate-in fade-in slide-in-from-right-8 duration-700">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-7xl font-black text-white uppercase tracking-tighter">Engine Capabilities</h2>
            <p className="text-slate-500 mt-4 text-xl font-medium">Deep-dive into the APA autonomous architecture.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureDetailCard 
              icon={<PhoneIcon className="w-8 h-8" />}
              title="Real-Time Voice Relay"
              desc="Powered by Gemini 2.5 Flash Native Audio. The agent places real phone calls, handles two-way conversation, and relays context-aware responses instantly."
              tags={["Gemini Live", "Full Duplex", "Low Latency"]}
            />
            <FeatureDetailCard 
              icon={<ShoppingCartIcon className="w-8 h-8" />}
              title="Autonomous Commerce"
              desc="Forget checkout forms. APA autonomously navigates Amazon, Swiggy, and Uber. It selects the best platform, verifies pricing, and executes via AutoPay."
              tags={["AutoPay", "Swiggy API", "Global Logistics"]}
            />
            <FeatureDetailCard 
              icon={<FingerPrintIcon className="w-8 h-8" />}
              title="Identity & Logic Vault"
              desc="A secure, encrypted memory store for your address, phone, and contacts. The agent learns your preferences to act exactly like you would."
              tags={["Logic Vault", "Privacy First", "Biometric Override"]}
            />
            <FeatureDetailCard 
              icon={<ShieldCheckIcon className="w-8 h-8" />}
              title="Financial Guardrails"
              desc="Set strict spending limits. Every transaction is assessed for risk. High-value orders require manual approval, keeping your wallet safe."
              tags={["Risk Engine", "Razorpay Secure", "Audit Trails"]}
            />
            <FeatureDetailCard 
              icon={<RocketLaunchIcon className="w-8 h-8" />}
              title="Multi-Agent Planning"
              desc="Decompose complex requests. 'Order dinner and call a cab' triggers parallel agents that sync status and timing perfectly."
              tags={["Chain of Thought", "Orchestration", "Parallel Execution"]}
            />
            <FeatureDetailCard 
              icon={<GlobeAltIcon className="w-8 h-8" />}
              title="Platform Agnostic"
              desc="The APA Brain isn't tied to one store. It scans the web in real-time to find availability across hundreds of platforms."
              tags={["Web Search", "Real-time Monitoring", "Price Tracking"]}
            />
          </div>

          <div className="mt-24 bg-slate-900 border border-slate-800 rounded-[3rem] p-12 flex flex-col md:flex-row items-center justify-between shadow-2xl">
             <div className="space-y-4 text-center md:text-left mb-8 md:mb-0">
                <h3 className="text-3xl font-black text-white uppercase tracking-tight">Ready to activate your agent?</h3>
                <p className="text-slate-400 font-medium">Experience the future of personal productivity today.</p>
             </div>
             <button 
              onClick={onGetStarted}
              className="px-12 py-5 bg-white text-slate-950 rounded-[2rem] font-black text-xl hover:scale-105 transition-all shadow-[0_0_50px_rgba(255,255,255,0.1)]"
             >
               INITIALIZE NOW
             </button>
          </div>
        </main>
      )}

      {/* Footer */}
      <footer className="relative z-10 max-w-7xl mx-auto px-6 py-12 border-t border-slate-900/50 flex flex-col md:flex-row justify-between items-center text-slate-600 text-[10px] font-black uppercase tracking-[0.3em]">
        <div className="flex items-center space-x-6 mb-4 md:mb-0">
           <span>© 2025 APA CORE</span>
           <span>SECURE MEMORY</span>
           <span>SYSTEM V2.5</span>
        </div>
        <div className="flex items-center space-x-6">
           <a href="#" className="hover:text-indigo-400">Terms</a>
           <a href="#" className="hover:text-indigo-400">Privacy</a>
           <a href="#" className="hover:text-indigo-400">Support</a>
        </div>
      </footer>
    </div>
  );
};

const FeatureDetailCard: React.FC<{ icon: React.ReactNode; title: string; desc: string; tags: string[] }> = ({ icon, title, desc, tags }) => (
  <div className="group bg-slate-900/40 backdrop-blur-xl border border-slate-800 p-10 rounded-[2.5rem] hover:border-indigo-500/50 transition-all duration-500 hover:-translate-y-2 relative overflow-hidden">
    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
       {React.cloneElement(icon as React.ReactElement, { className: 'w-24 h-24' })}
    </div>
    <div className="w-16 h-16 bg-indigo-600/10 text-indigo-500 rounded-2xl flex items-center justify-center mb-8 border border-indigo-500/20 group-hover:bg-indigo-600 group-hover:text-white transition-all">
      {icon}
    </div>
    <h3 className="text-2xl font-black text-white uppercase tracking-tight mb-4">{title}</h3>
    <p className="text-slate-400 leading-relaxed font-medium mb-8">
      {desc}
    </p>
    <div className="flex flex-wrap gap-2">
      {tags.map(tag => (
        <span key={tag} className="px-3 py-1 bg-slate-800 text-slate-500 text-[9px] font-black rounded-lg border border-slate-700 uppercase tracking-widest">
          {tag}
        </span>
      ))}
    </div>
  </div>
);

export default Landing;


import React, { useState } from 'react';
import { WalletIcon, PlusIcon, CreditCardIcon, ArrowUpIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';

interface Props {
  balance: number;
  onAddFunds: (amount: number) => void;
}

const Wallet: React.FC<Props> = ({ balance, onAddFunds }) => {
  const [addAmount, setAddAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleRazorpayMock = () => {
    const amount = parseFloat(addAmount);
    if (isNaN(amount) || amount <= 0) return;
    
    setIsProcessing(true);
    // Simulate Razorpay Gateway
    setTimeout(() => {
      onAddFunds(amount);
      setIsProcessing(false);
      setAddAmount('');
      alert(`Success! $${amount} added via Razorpay Secure Gateway.`);
    }, 2000);
  };

  return (
    <div className="p-8 h-full overflow-y-auto custom-scroll bg-slate-950">
      <div className="max-w-4xl mx-auto">
        <div className="mb-10">
          <h1 className="text-4xl font-black text-white tracking-tighter">APA Wallet</h1>
          <p className="text-slate-400 mt-2">Manage funds for autonomous payments and AutoPay execution.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-gradient-to-br from-indigo-600 to-indigo-900 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden flex flex-col justify-between aspect-video">
            <div className="relative z-10 flex justify-between items-start">
              <div>
                <span className="text-indigo-200 text-xs font-black uppercase tracking-widest">Current Balance</span>
                <p className="text-5xl font-black mt-1">${balance.toLocaleString()}</p>
              </div>
              <WalletIcon className="w-12 h-12 text-white/30" />
            </div>
            
            <div className="relative z-10 flex items-center space-x-4">
              <div className="px-4 py-2 bg-white/10 backdrop-blur-md rounded-xl text-xs font-bold border border-white/10">
                {balance > 0 ? 'AUTOPAY READY' : 'INSUFFICIENT FUNDS'}
              </div>
              <div className="flex items-center space-x-2 text-indigo-300">
                <ShieldCheckIcon className="w-5 h-5" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Razorpay Secure</span>
              </div>
            </div>
            
            <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-white/5 rounded-full blur-3xl" />
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-[3rem] p-10 space-y-8">
            <h2 className="text-xl font-bold text-white flex items-center space-x-3">
              <PlusIcon className="w-6 h-6 text-indigo-500" />
              <span>Add Funds via Razorpay</span>
            </h2>
            
            <div className="space-y-4">
               <div className="relative">
                 <span className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-black text-slate-500">$</span>
                 <input
                   type="number"
                   value={addAmount}
                   onChange={(e) => setAddAmount(e.target.value)}
                   placeholder="Enter amount"
                   className="w-full bg-slate-800 border-2 border-slate-700 rounded-2xl px-12 py-5 text-2xl font-black text-white focus:border-indigo-600 outline-none transition-all placeholder:text-slate-700"
                 />
               </div>
               
               <div className="grid grid-cols-3 gap-3">
                 {[100, 500, 1000].map(amt => (
                   <button 
                    key={amt}
                    onClick={() => setAddAmount(amt.toString())}
                    className="py-3 bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold text-slate-400 hover:bg-slate-700 hover:text-white transition-all"
                   >
                     +${amt}
                   </button>
                 ))}
               </div>

               <button
                 onClick={handleRazorpayMock}
                 disabled={isProcessing || !addAmount}
                 className={`w-full py-5 rounded-2xl font-black text-lg flex items-center justify-center space-x-3 shadow-xl transition-all ${
                   isProcessing ? 'bg-indigo-900 text-indigo-400 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-indigo-900/40'
                 }`}
               >
                 {isProcessing ? (
                   <>
                     <div className="w-5 h-5 border-2 border-indigo-400 border-t-white rounded-full animate-spin" />
                     <span>Connecting to Razorpay...</span>
                   </>
                 ) : (
                   <>
                     <CreditCardIcon className="w-6 h-6" />
                     <span>Add Money to Wallet</span>
                   </>
                 )}
               </button>
            </div>
          </div>
        </div>

        <div className="mt-12">
          <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-6 px-4">System Enforcement</h3>
          <div className="grid md:grid-cols-2 gap-4">
             <EnforcementCard 
              title="AutoPay Protocol" 
              desc="Orders are only placed if Wallet Balance >= Order Amount. Insufficient funds will block autonomous execution."
              status={balance > 0 ? 'Active' : 'Locked'}
             />
             <EnforcementCard 
              title="Home Delivery" 
              desc="Valid payment token is required for all home delivery actions. Cash on Delivery is restricted for high-value orders."
              status="Enforced"
             />
          </div>
        </div>
      </div>
    </div>
  );
};

const EnforcementCard: React.FC<{ title: string, desc: string, status: string }> = ({ title, desc, status }) => (
  <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-3xl">
    <div className="flex justify-between items-start mb-2">
      <h4 className="font-bold text-white">{title}</h4>
      <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md ${status === 'Locked' ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'}`}>
        {status}
      </span>
    </div>
    <p className="text-xs text-slate-500 leading-relaxed">{desc}</p>
  </div>
);

export default Wallet;

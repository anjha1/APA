
import React, { useState, useEffect } from 'react';
import { ShieldCheckIcon, EyeIcon, EyeSlashIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

interface Props {
  initialMode: 'login' | 'signup';
  onAuthSuccess: (user: any) => void;
  onBack: () => void;
}

const Auth: React.FC<Props> = ({ initialMode, onAuthSuccess, onBack }) => {
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Using the Google Client ID provided by you
  const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  useEffect(() => {
    const initGsi = () => {
      if ((window as any).google) {
        (window as any).google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleGoogleResponse,
          auto_select: false,
        });
        (window as any).google.accounts.id.renderButton(
          document.getElementById("googleBtn"),
          { theme: "outline", size: "large", width: "100%", text: "continue_with" }
        );
      }
    };

    // Script checking logic for local dev reliability
    if ((window as any).google) {
      initGsi();
    } else {
      const script = document.createElement('script');
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = initGsi;
      document.head.appendChild(script);
    }
  }, []);

  const parseJwt = (token: string) => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      return JSON.parse(jsonPayload);
    } catch (e) {
      return null;
    }
  };

  const handleGoogleResponse = (response: any) => {
    setLoading(true);
    const userObject = parseJwt(response.credential);
    if (userObject) {
      onAuthSuccess({
        id: userObject.sub,
        email: userObject.email,
        name: userObject.name,
        avatar: userObject.picture
      });
    }
    setLoading(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulation for Direct Auth fallback (Email/Password)
    setTimeout(() => {
      onAuthSuccess({ 
        id: 'user-' + Math.random().toString(36).substr(2, 9), 
        email: 'local@apa.core', 
        name: 'Local Operative' 
      });
      setLoading(false);
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 relative font-inter overflow-hidden">
      <div className="absolute top-0 right-0 w-1/3 h-full bg-slate-100 -skew-x-12 translate-x-1/2 pointer-events-none" />

      <button onClick={onBack} className="absolute top-8 left-8 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-indigo-600 transition-colors">
        ← Return Home
      </button>

      <div className="w-full max-w-md space-y-10 relative z-10">
        <div className="text-center">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-2xl shadow-indigo-200 mx-auto mb-8 border-4 border-white">
            <ShieldCheckIcon className="w-10 h-10" />
          </div>
          <h2 className="text-4xl font-black tracking-tighter text-slate-900 uppercase">
            {mode === 'login' ? 'Authorization' : 'Agent Initialization'}
          </h2>
          <p className="mt-3 text-sm font-medium text-slate-400 uppercase tracking-widest">
            {mode === 'login' ? "Secure gateway for APA Core" : "Establish identity profile"}
          </p>
        </div>

        <div className="space-y-6">
          {/* Real Google Button */}
          <div id="googleBtn" className="w-full overflow-hidden rounded-2xl shadow-sm border border-slate-200" />

          <div className="relative">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t-2 border-slate-200"></div></div>
            <div className="relative flex justify-center text-[10px] uppercase tracking-[0.4em] font-black text-slate-300">
              <span className="bg-slate-50 px-6">Direct Core Auth</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Cognitive Email</label>
              <input
                required
                type="email"
                placeholder="user@apa.core"
                className="w-full bg-white border-2 border-slate-200 rounded-2xl px-6 py-4 text-sm font-medium focus:outline-none focus:border-indigo-600 transition-all placeholder:text-slate-300"
              />
            </div>
            
            <div className="relative space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">System Password</label>
              <input
                required
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                className="w-full bg-white border-2 border-slate-200 rounded-2xl px-6 py-4 text-sm font-medium focus:outline-none focus:border-indigo-600 transition-all placeholder:text-slate-300"
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-10 text-slate-300 hover:text-indigo-600"
              >
                {showPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
              </button>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-sm uppercase tracking-widest shadow-2xl hover:bg-indigo-600 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center space-x-3"
            >
              {loading && <ArrowPathIcon className="w-5 h-5 animate-spin" />}
              <span>{mode === 'login' ? 'Activate Session' : 'Create Identity'}</span>
            </button>
          </form>
        </div>

        <p className="text-center text-xs font-bold text-slate-400">
          {mode === 'login' ? "New operative?" : "Existing operative?"}
          <button 
            onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
            className="ml-2 font-black text-indigo-600 hover:underline uppercase tracking-widest"
          >
            {mode === 'login' ? 'Initialize' : 'Authorize'}
          </button>
        </p>
      </div>
    </div>
  );
};

export default Auth;


import React, { useState, useEffect, useRef } from 'react';
import { APAEngine } from './services/geminiService';
import { PersistenceService } from './services/persistenceService';
import { ChatMessage, Task, TaskStatus, AgentType, UserPreferences, User, RiskLevel, CallLog, DetailedProfile, Contact, TaskItem } from './types';
import ChatInterface from './components/ChatInterface';
import TaskDashboard from './components/TaskDashboard';
import PreferencesPanel from './components/PreferencesPanel';
import Landing from './components/Landing';
import Auth from './components/Auth';
import HistoryLog from './components/HistoryLog';
import CallingAgent from './CallingAgent';
import ProfileSetup from './components/ProfileSetup';
import Wallet from './components/Wallet';
import { 
  ChatBubbleLeftRightIcon, 
  QueueListIcon, 
  ShieldCheckIcon,
  ClockIcon,
  PhoneIcon,
  ArrowRightOnRectangleIcon,
  WalletIcon,
  IdentificationIcon,
  ShieldExclamationIcon,
  Bars3Icon,
  XMarkIcon
} from '@heroicons/react/24/outline';

type TabType = 'chat' | 'tasks' | 'history' | 'calls' | 'settings' | 'profile' | 'wallet';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [appState, setAppState] = useState<'landing' | 'login' | 'signup' | 'dashboard'>('landing');
  const [activeTab, setActiveTab] = useState<TabType>('chat');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [callLogs, setCallLogs] = useState<CallLog[]>([]);
  const [walletBalance, setWalletBalance] = useState<number>(1500);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const [detailedProfile, setDetailedProfile] = useState<DetailedProfile>({
    fullName: "Google User",
    email: "google.user@gmail.com",
    houseNo: "Block-B, 402",
    street: "Silicon Valley Tech Park",
    city: "Palo Alto",
    state: "California",
    zip: "94304",
    phone: "+1 555-0199",
    altPhone: "",
    defaultVoice: "Zephyr",
    contacts: [
      { id: 'c1', name: 'NEHA', phone: '+1 555-9988', relationship: 'GIRLFRIEND' },
      { id: 'c2', name: 'MANAGER', phone: '+1 555-4433', relationship: 'WORK' }
    ],
    agentDefaultMessage: "Hello, this is your APA. I'm calling to handle your request."
  });

  const [prefs, setPrefs] = useState<UserPreferences>({
    name: "Google User",
    address: "Block-B, 402, Silicon Valley Tech Park, CA",
    phone: "+1 555-0199",
    paymentMethod: "Wallet (AutoPay)",
    spendingLimit: 5000
  });

  const engine = useRef<APAEngine | null>(null);
  const persistence = PersistenceService.getInstance();

  useEffect(() => {
    const loadData = async () => {
      const p = await persistence.getProfile();
      if (p) {
        setDetailedProfile(p);
        setPrefs(prev => ({ ...prev, name: p.fullName, phone: p.phone, address: `${p.houseNo}, ${p.street}, ${p.city}` }));
      }
      const t = await persistence.getTasks();
      if (t.length > 0) setTasks(t);
      const c = await persistence.getCallLogs();
      if (c.length > 0) setCallLogs(c);
      const w = await persistence.getWalletBalance();
      setWalletBalance(w);
    };
    loadData();
  }, []);

  useEffect(() => { if (appState === 'dashboard') persistence.saveProfile(detailedProfile); }, [detailedProfile, appState]);
  useEffect(() => { if (appState === 'dashboard') persistence.saveTasks(tasks); }, [tasks, appState]);
  useEffect(() => { if (appState === 'dashboard') persistence.saveCallLogs(callLogs); }, [callLogs, appState]);
  useEffect(() => { if (appState === 'dashboard') persistence.saveWalletBalance(walletBalance); }, [walletBalance, appState]);

  useEffect(() => {
    if (appState === 'dashboard') {
      engine.current = new APAEngine();
      if (messages.length === 0) {
        setMessages([{
          id: '1',
          role: 'assistant',
          content: `APA Core Activated. All logistics and wallets synchronized for ${currentUser?.name || detailedProfile.fullName}.`,
          timestamp: Date.now()
        }]);
      }
    }
  }, [appState]);

  const handleTaskFromCall = (task: Task) => {
    const totalPrice = task.price || 0;
    const canAutoPay = walletBalance >= totalPrice;
    
    const populatedTask = {
      ...task,
      deliveryAddress: `${detailedProfile.houseNo}, ${detailedProfile.street}, ${detailedProfile.city}, ${detailedProfile.state} ${detailedProfile.zip}`,
      contactPhone: detailedProfile.phone,
      paymentMethod: 'Wallet (AutoPay)',
      transactionId: `VOICE-${Date.now().toString().slice(-6)}`,
      status: (!canAutoPay) ? TaskStatus.FAILED : (task.riskLevel === RiskLevel.LOW ? TaskStatus.EXECUTING : TaskStatus.REQUIRES_APPROVAL)
    };

    setTasks(prev => [populatedTask, ...prev]);

    if (canAutoPay && populatedTask.status === TaskStatus.EXECUTING) {
        setWalletBalance(prev => prev - totalPrice);
        setTimeout(() => {
          setTasks(prev => prev.map(t => t.id === populatedTask.id ? { ...t, status: TaskStatus.COMPLETED, result: `Order successfully fulfilled via ${task.platform}.` } : t));
        }, 20000); 
    }
  };

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || !engine.current) return;
    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', content: text, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);

    try {
      const history = messages
        .filter(m => m.content.trim())
        .map(m => ({ role: m.role, parts: [{ text: m.content }] }));

      const response = await engine.current.processCommand(text, history);
      
      if (response.functionCalls) {
        for (const fc of response.functionCalls) {
          if (fc.name === 'initiateCall') {
            setActiveTab('calls');
            continue;
          }

          const args = fc.args as any;
          const totalPrice = args.totalPrice || 0;
          const canAutoPay = walletBalance >= totalPrice;

          const newTask: Task = {
            id: `order-${Date.now()}`,
            description: fc.name === 'orderFood' ? `Food Order: ${args.restaurantName}` : `Product Order: ${args.productName}`,
            type: fc.name === 'orderFood' ? AgentType.FOOD_DELIVERY : AgentType.SHOPPING,
            status: !canAutoPay ? TaskStatus.FAILED : (args.riskLevel === 'LOW' ? TaskStatus.EXECUTING : TaskStatus.REQUIRES_APPROVAL),
            timestamp: Date.now(),
            riskLevel: args.riskLevel as RiskLevel || RiskLevel.LOW,
            platform: args.platform || 'Auto-Optimized',
            platformLink: args.platformLink || '#',
            price: totalPrice,
            items: args.items || [],
            paymentMethod: 'Wallet (AutoPay)',
            deliveryAddress: `${detailedProfile.houseNo}, ${detailedProfile.street}, ${detailedProfile.city}, ${detailedProfile.state} ${detailedProfile.zip}`,
            contactPhone: detailedProfile.phone,
            source: 'Command Center',
            transactionId: `TXN-${Math.floor(Math.random() * 100000)}`
          };

          setTasks(prev => [newTask, ...prev]);
          if (canAutoPay && newTask.status === TaskStatus.EXECUTING) {
            setWalletBalance(prev => prev - totalPrice);
            setTimeout(() => {
              setTasks(prev => prev.map(t => t.id === newTask.id ? { ...t, status: TaskStatus.COMPLETED, result: `Verified order processed at ${args.platform}.` } : t));
            }, 30000);
          }
        }
      }

      const assistantText = response.text || "Orchestrating logistics...";
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: assistantText, timestamp: Date.now() }]);

    } catch (e) {
      console.error(e);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setAppState('landing');
    setActiveTab('chat');
  };

  const navItems = [
    { id: 'chat', label: 'Command Center', icon: <ChatBubbleLeftRightIcon className="w-5 h-5" /> },
    { id: 'tasks', label: 'Real-Time Orders', icon: <QueueListIcon className="w-5 h-5" /> },
    { id: 'wallet', label: 'APA Wallet', icon: <WalletIcon className="w-5 h-5" /> },
    { id: 'calls', label: 'Calling Agent', icon: <PhoneIcon className="w-5 h-5" /> },
    { id: 'history', label: 'History & Memory', icon: <ClockIcon className="w-5 h-5" /> },
    { id: 'profile', label: 'Unified Profile', icon: <IdentificationIcon className="w-5 h-5" />, category: 'Logistics' },
    { id: 'settings', label: 'Guardrails', icon: <ShieldExclamationIcon className="w-5 h-5" /> },
  ];

  if (appState === 'landing') return <Landing onGetStarted={() => setAppState('signup')} onLogin={() => setAppState('login')} />;
  if (appState === 'login' || appState === 'signup') return <Auth initialMode={appState as any} onBack={() => setAppState('landing')} onAuthSuccess={u => {
  setCurrentUser(u);

  setDetailedProfile(prev => ({
    ...prev,
    fullName: u.name || prev.fullName,
    email: u.email || prev.email,
    avatar: u.avatar || prev.avatar
  }));

  setPrefs(prev => ({
    ...prev,
    name: u.name || prev.name
  }));

  setAppState('dashboard');
}} />;

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden font-inter relative">
      
      {/* Mobile Backdrop */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden" 
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Desktop & Mobile Drawer */}
      <nav className={`
        fixed inset-y-0 left-0 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
        lg:relative lg:translate-x-0 transition-transform duration-300 ease-in-out
        w-64 bg-slate-900 border-r border-slate-800 flex flex-col py-6 z-50 h-full
      `}>
        <div className="px-6 mb-10 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg">
              <ShieldCheckIcon className="w-6 h-6" />
            </div>
            <span className="text-xl font-black tracking-tighter uppercase">APA CORE</span>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-slate-400 p-2">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>
        
        <div className="flex-1 space-y-1 px-3 overflow-y-auto custom-scroll">
          {navItems.map((item) => (
            <React.Fragment key={item.id}>
              {item.category && (
                <div className="pt-6 pb-2 px-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">{item.category}</div>
              )}
              <NavItem 
                active={activeTab === item.id} 
                onClick={() => { setActiveTab(item.id as TabType); setIsSidebarOpen(false); }} 
                icon={item.icon} 
                label={item.label} 
              />
            </React.Fragment>
          ))}
        </div>

        <div className="px-4 mt-auto pt-6 border-t border-slate-800 space-y-4">
           <div 
             className="bg-slate-800/40 p-3 rounded-2xl flex items-center space-x-3 group cursor-pointer hover:bg-slate-800/60 transition-all"
             onClick={() => { setActiveTab('profile'); setIsSidebarOpen(false); }}
           >
              <div className="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center font-black overflow-hidden shadow-inner shrink-0">
  <img
    src={
      detailedProfile.avatar ||
      "https://api.dicebear.com/7.x/initials/svg?seed=" +
        encodeURIComponent(detailedProfile.fullName)
    }
    alt="Avatar"
    className="w-full h-full object-cover"
  />
</div>

              <div className="overflow-hidden flex-1">
                 <p className="text-xs font-black truncate text-white uppercase">{detailedProfile.fullName}</p>
                 <p className="text-[9px] text-slate-500 truncate font-bold">{detailedProfile.email}</p>
              </div>
           </div>

           <button 
             onClick={handleLogout}
             className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-slate-500 hover:text-red-500 hover:bg-red-500/10 transition-all font-black text-[10px] uppercase tracking-widest"
           >
             <ArrowRightOnRectangleIcon className="w-5 h-5" />
             <span className="flex-1 text-left">Logout Core</span>
           </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 relative flex flex-col bg-[#020617] overflow-hidden">
        
        {/* Mobile Top Header */}
        <header className="lg:hidden flex items-center justify-between px-6 py-4 bg-slate-900 border-b border-slate-800 shrink-0">
          <div className="flex items-center space-x-3">
             <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
                <ShieldCheckIcon className="w-5 h-5" />
             </div>
             <span className="text-sm font-black tracking-tight uppercase">APA CORE</span>
          </div>
          <button onClick={() => setIsSidebarOpen(true)} className="text-slate-100 p-2 bg-slate-800 rounded-xl">
            <Bars3Icon className="w-6 h-6" />
          </button>
        </header>

        <div className="flex-1 overflow-hidden relative">
          {activeTab === 'chat' && <ChatInterface messages={messages} onSendMessage={handleSendMessage} engine={engine.current} />}
          {activeTab === 'tasks' && <TaskDashboard tasks={tasks.filter(t => t.status !== TaskStatus.COMPLETED)} onApprove={() => {}} onInitiateCall={() => setActiveTab('calls')} />}
          {activeTab === 'wallet' && <Wallet balance={walletBalance} onAddFunds={(a) => setWalletBalance(b => b + a)} />}
          {activeTab === 'history' && <HistoryLog tasks={tasks} callLogs={callLogs} onFeedback={() => {}} onInitiateCall={() => setActiveTab('calls')} />}
          {activeTab === 'profile' && <ProfileSetup profile={detailedProfile} setProfile={setDetailedProfile} />}
          {activeTab === 'calls' && (
            <CallingAgent 
              userName={detailedProfile.fullName} 
              contacts={detailedProfile.contacts} 
              engine={engine.current} 
              onTaskCreate={handleTaskFromCall} 
              onCallEnd={(log) => setCallLogs(prev => [log, ...prev])} 
            />
          )}
          {activeTab === 'settings' && <PreferencesPanel prefs={prefs} setPrefs={setPrefs} />}
        </div>
      </main>
    </div>
  );
};

const NavItem: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; label: string }> = ({ active, onClick, icon, label }) => (
  <button 
    onClick={onClick} 
    className={`w-full flex items-center space-x-3 px-4 py-3.5 rounded-xl transition-all font-bold text-sm ${
      active 
        ? 'bg-indigo-600/10 text-indigo-400 border-l-4 border-indigo-600 shadow-lg' 
        : 'text-slate-500 hover:text-slate-200 hover:bg-slate-800/40'
    }`}
  >
    <div className={`${active ? 'scale-110' : ''} transition-transform`}>{icon}</div>
    <span className="truncate uppercase tracking-tight">{label}</span>
  </button>
);

export default App;

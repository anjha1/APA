
import React, { useState, useEffect, useRef } from 'react';
import { 
  PhoneIcon, 
  SpeakerWaveIcon, 
  StopCircleIcon, 
  UserIcon, 
  ChatBubbleBottomCenterIcon,
  ArrowsRightLeftIcon,
  SignalIcon,
  AcademicCapIcon,
  BriefcaseIcon,
  ChevronDownIcon,
  ShieldCheckIcon,
  BoltIcon
} from '@heroicons/react/24/solid';
import { CallLog, Contact, Task, TaskStatus, AgentType, RiskLevel } from './types';
import { APAEngine } from './services/geminiService';
import { Modality, LiveServerMessage } from '@google/genai';
import { APA_TOOLS } from './constants';

interface Props {
  onCallEnd: (log: CallLog) => void;
  onTaskCreate: (task: Task) => void;
  userName: string;
  contacts: Contact[];
  engine: APAEngine | null;
  activeCallParams?: { recipient: string, message: string } | null;
}

const VOICES = [
  { id: 'Zephyr', label: 'English/Hindi - Male (Balanced)', category: 'Professional', gender: 'male' },
  { id: 'Puck', label: 'English/Hindi - Female (Friendly)', category: 'Personal', gender: 'female' },
  { id: 'Charon', label: 'English/Hindi - Male (Deep/Authority)', category: 'Business', gender: 'male' },
  { id: 'Kore', label: 'English/Hindi - Female (Energetic)', category: 'Action', gender: 'female' },
  { id: 'Fenrir', label: 'English/Hindi - Male (Serious)', category: 'Security', gender: 'male' }
];

const SPECIALIZED_AGENTS: Contact[] = [
  {
    id: 'tutor-en',
    name: 'ENGLISH TUTOR',
    phone: 'internal',
    relationship: 'EDUCATIONAL',
    isSpecialized: true,
    type: 'tutor',
    promptOverride: 'You are a highly skilled Language Tutor. YOUR GENDER IS [GENDER]. You MUST identify as and speak like a [GENDER] person. YOUR GOAL: Help the user practice. LANGUAGE RULE: Only speak in English or Hindi. CRITICAL RULE: WAIT for the user to finish speaking. Do not speak unless the user addresses you. Only respond to the user\'s actual words. Correct their grammar politely.'
  },
  {
    id: 'hr-interview',
    name: 'INTERVIEW COACH',
    phone: 'internal',
    relationship: 'HR PROFESSIONAL',
    isSpecialized: true,
    type: 'interviewer',
    promptOverride: 'You are a professional HR Interviewer. YOUR GENDER IS [GENDER]. You MUST identify as and speak like a [GENDER] person. DIFFICULTY LEVEL: [DIFFICULTY]. YOUR GOAL: Conduct a realistic job interview. LANGUAGE RULE: Only speak in English or Hindi. CRITICAL RULE: ASK ONE QUESTION AT A TIME. DO NOT SPEAK UNTIL THE USER FINISHES THEIR ANSWER. NEVER hallucinate an answer for the user.'
  }
];

const CallingAgent: React.FC<Props> = ({ onCallEnd, onTaskCreate, userName, contacts, engine, activeCallParams }) => {
  const [isCalling, setIsCalling] = useState(false);
  const [sessionMode, setSessionMode] = useState<'direct' | 'proxy' | 'training'>('direct');
  const [difficulty, setDifficulty] = useState<'EASY' | 'MEDIUM' | 'HARD'>('MEDIUM');
  const [status, setStatus] = useState('Standby');
  const [duration, setDuration] = useState(0);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [selectedSpecialized, setSelectedSpecialized] = useState<Contact | null>(SPECIALIZED_AGENTS[0]);
  const [selectedVoice, setSelectedVoice] = useState(VOICES[0]);
  const [relayMessage, setRelayMessage] = useState('');
  const [realTimeTranscription, setRealTimeTranscription] = useState<{ role: string, text: string }[]>([]);
  
  const sessionRef = useRef<any>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const timerRef = useRef<number | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const audioSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const transcriptRef = useRef<{ role: 'user' | 'assistant', content: string, timestamp: number }[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [realTimeTranscription]);

  const encode = (bytes: Uint8Array) => {
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
  };

  const decode = (base64: string) => {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
    return bytes;
  };

  const decodeAudioData = async (data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number) => {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) {
        channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
      }
    }
    return buffer;
  };

  const initiateLiveCall = async () => {
    if (!engine) return;

    try {
      setIsCalling(true);
      setStatus('Linking Core...');
      setDuration(0);
      transcriptRef.current = [];
      setRealTimeTranscription([]);

      inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const commonConstraint = `LANGUAGE: Only speak English or Hindi. IDENTITY: You are a ${selectedVoice.gender}. SOUND: You must sound and identify as a ${selectedVoice.gender} assistant. AUTONOMY: You can browse ANY website (Amazon, etc.) to place orders if requested. Use 'orderProduct' for purchases.`;

      let sysInstruction = '';
      if (sessionMode === 'direct') {
        sysInstruction = `You are the ${selectedVoice.gender} personal assistant of ${userName}. ${commonConstraint} If asked to order something like 'Blue Jeans', use the orderProduct tool immediately. Only stop if the user says 'stop', 'kaat do', or 'bye'.`;
      } else if (sessionMode === 'proxy') {
        sysInstruction = `You are a ${selectedVoice.gender} agent calling ${selectedContact?.name} on behalf of ${userName}. ${commonConstraint} Purpose: ${relayMessage}.`;
      } else if (sessionMode === 'training') {
        sysInstruction = (selectedSpecialized?.promptOverride || '')
          .replace(/\[GENDER\]/g, selectedVoice.gender.toUpperCase())
          .replace(/\[DIFFICULTY\]/g, difficulty);
        sysInstruction += ` ${commonConstraint}`;
      }
      
      sysInstruction = sysInstruction.replace(/\[GENDER\]/g, selectedVoice.gender.toUpperCase());

      const sessionPromise = engine.connectLive({
        callbacks: {
          onopen: () => {
            setStatus('Active Session');
            const source = inputAudioContextRef.current!.createMediaStreamSource(stream);
            const scriptProcessor = inputAudioContextRef.current!.createScriptProcessor(4096, 1, 1);
            
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const int16 = new Int16Array(inputData.length);
              for (let i = 0; i < inputData.length; i++) int16[i] = inputData[i] * 32768;
              sessionPromise.then((session: any) => {
                session.sendRealtimeInput({
                  media: { data: encode(new Uint8Array(int16.buffer)), mimeType: 'audio/pcm;rate=16000' }
                });
              });
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputAudioContextRef.current!.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            if (message.serverContent?.inputTranscription) {
              const text = message.serverContent.inputTranscription.text;
              if (text.trim()) {
                setRealTimeTranscription(prev => [...prev, { role: 'user', text }]);
                transcriptRef.current.push({ role: 'user', content: text, timestamp: Date.now() });

                const stopKeywords = ['stop', 'hang up', 'bye', 'cancel', 'end call', 'kat kar', 'rakho', 'kaat do', 'call kat karo', 'enough', 'chalo bye'];
                if (stopKeywords.some(keyword => text.toLowerCase().includes(keyword))) {
                  endCall();
                  return;
                }
              }
            }
            if (message.serverContent?.outputTranscription) {
              const text = message.serverContent.outputTranscription.text;
              if (text.trim()) {
                setRealTimeTranscription(prev => [...prev, { role: 'assistant', text }]);
                transcriptRef.current.push({ role: 'assistant', content: text, timestamp: Date.now() });
              }
            }

            if (message.toolCall) {
              for (const fc of message.toolCall.functionCalls) {
                const args = fc.args as any;
                const isFood = fc.name === 'orderFood';
                const newTask: Task = {
                  id: `voice-order-${Date.now()}`,
                  description: isFood ? `Food: ${args.restaurantName}` : `Product: ${args.productName}`,
                  type: isFood ? AgentType.FOOD_DELIVERY : AgentType.SHOPPING,
                  status: (args.riskLevel === 'LOW' || !args.riskLevel) ? TaskStatus.EXECUTING : TaskStatus.PENDING,
                  timestamp: Date.now(),
                  riskLevel: args.riskLevel as RiskLevel || RiskLevel.LOW,
                  price: args.totalPrice || 0,
                  platform: args.platform || 'Auto-browsed Platform',
                  platformLink: args.platformLink || '#',
                  items: args.items || [{ name: args.productName || 'Item', quantity: 1, price: args.totalPrice || 0 }],
                  source: 'Calling Agent'
                };
                
                onTaskCreate(newTask);
                
                sessionPromise.then(s => s.sendToolResponse({
                  functionResponses: { 
                    id: fc.id, 
                    name: fc.name, 
                    response: { result: "Order successfully placed autonomously. Check your Real-Time Orders dashboard." } 
                  }
                }));
              }
            }

            const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (base64Audio) {
              const ctx = outputAudioContextRef.current!;
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
              const audioBuffer = await decodeAudioData(decode(base64Audio), ctx, 24000, 1);
              const source = ctx.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(ctx.destination);
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
              audioSourcesRef.current.add(source);
            }
          },
          onerror: () => endCall(),
          onclose: () => setIsCalling(false)
        },
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: sysInstruction,
          tools: [{ functionDeclarations: APA_TOOLS }],
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: selectedVoice.id as any } } }
        }
      });

      sessionRef.current = await sessionPromise;
      timerRef.current = window.setInterval(() => setDuration(d => d + 1), 1000);
    } catch (err) {
      endCall();
    }
  };

  const endCall = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (sessionRef.current) {
        try { sessionRef.current.close(); } catch(e) {}
    }
    audioSourcesRef.current.forEach(s => {
      try { s.stop(); } catch (e) {}
    });
    audioSourcesRef.current.clear();
    
    onCallEnd({
      id: Date.now().toString(),
      recipient: sessionMode === 'direct' ? 'APA Brain' : (selectedContact?.name || selectedSpecialized?.name || 'Unknown'),
      duration: `${Math.floor(duration / 60)}m ${duration % 60}s`,
      purpose: sessionMode === 'training' ? `Training: ${selectedSpecialized?.name}` : (relayMessage || 'Direct Interaction'),
      timestamp: Date.now(),
      status: 'COMPLETED',
      transcript: transcriptRef.current,
      voiceUsed: selectedVoice.label
    });
    setIsCalling(false);
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-start lg:justify-center bg-[#020617] p-4 lg:p-8 overflow-y-auto custom-scroll h-full">
      <div className="max-w-7xl w-full grid lg:grid-cols-12 gap-6 lg:gap-10 items-stretch">
        
        {/* Call Visualization Area */}
        <div className="lg:col-span-7 flex flex-col bg-[#0b0f1a] border border-slate-800 rounded-[2rem] lg:rounded-[3rem] p-6 lg:p-10 text-center shadow-2xl relative overflow-hidden min-h-[400px] lg:min-h-[600px]">
          <div className="absolute top-0 left-0 w-full h-1 bg-indigo-600/30" />
          
          <div className="flex-1 flex flex-col justify-center items-center space-y-6 lg:space-y-10">
            <div className={`w-32 h-32 lg:w-48 lg:h-48 mx-auto rounded-full bg-slate-900 border-4 border-slate-800 flex items-center justify-center transition-all duration-700 ${isCalling ? 'scale-110 shadow-[0_0_100px_rgba(99,102,241,0.2)] border-indigo-600/40' : ''}`}>
               <div className={`w-24 h-24 lg:w-32 lg:h-32 rounded-full flex items-center justify-center transition-all ${isCalling ? 'bg-indigo-600 shadow-[0_0_40px_rgba(79,70,229,0.5)]' : 'bg-slate-800'}`}>
                 <PhoneIcon className={`w-10 h-10 lg:w-14 lg:h-14 ${isCalling ? 'text-white' : 'text-slate-500'}`} />
               </div>
            </div>
            
            <div className="space-y-2 lg:space-y-4 px-4">
              <h1 className="text-3xl lg:text-5xl font-black text-white tracking-tight uppercase break-words">
                {isCalling ? (sessionMode === 'direct' ? 'Autonomous Link' : (selectedContact?.name || selectedSpecialized?.name)) : 'Calling Agent'}
              </h1>
              
              <p className="text-slate-500 font-medium text-sm lg:text-lg">
                {isCalling ? 'Browsing & Ready' : 'Voice-activated autonomous ordering (EN/HI).'}
              </p>

              {isCalling && (
                <p className="text-indigo-400 font-mono text-3xl lg:text-4xl font-black tabular-nums">
                   {Math.floor(duration / 60)}:{(duration % 60).toString().padStart(2, '0')}
                </p>
              )}
            </div>

            {/* Transcription Feed */}
            {isCalling && (
              <div ref={scrollRef} className="w-full max-w-lg bg-black/40 border border-slate-800 rounded-2xl lg:rounded-3xl h-32 lg:h-48 overflow-y-auto p-4 lg:p-6 text-left space-y-3 lg:space-y-4 custom-scroll relative">
                <div className="absolute top-3 right-4 flex items-center space-x-1 text-[8px] font-black text-slate-700 uppercase tracking-widest">
                  <BoltIcon className="w-3 h-3 text-indigo-500" />
                  <span>Real-time Sync</span>
                </div>
                {realTimeTranscription.length === 0 ? (
                  <p className="text-slate-600 text-[10px] font-black uppercase text-center mt-8 lg:mt-12 opacity-50 italic">Listening...</p>
                ) : (
                  realTimeTranscription.map((t, i) => (
                    <div key={i} className={`flex space-x-2 lg:space-x-3 ${t.role === 'user' ? 'text-indigo-400' : 'text-slate-300'}`}>
                       <span className="font-black uppercase text-[9px] lg:text-[10px] shrink-0 mt-0.5">{t.role === 'user' ? 'You' : 'Agent'}:</span>
                       <p className="text-xs lg:text-sm font-medium leading-relaxed">{t.text}</p>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          <div className="pt-6 lg:pt-8">
            {isCalling ? (
              <button onClick={endCall} className="w-16 h-16 lg:w-24 lg:h-24 bg-red-600 text-white rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all flex items-center justify-center mx-auto">
                <StopCircleIcon className="w-8 h-8 lg:w-12 lg:h-12" />
              </button>
            ) : (
              <button 
                onClick={initiateLiveCall} 
                className="px-8 lg:px-16 py-4 lg:py-6 bg-indigo-600 text-white rounded-[1.5rem] lg:rounded-[2rem] font-black text-lg lg:text-2xl shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center space-x-3 lg:space-x-4 mx-auto shadow-indigo-900/40"
              >
                <SpeakerWaveIcon className="w-6 h-6 lg:w-8 lg:h-8" />
                <span>ACTIVATE VOICE LINK</span>
              </button>
            )}
          </div>
        </div>

        {/* Right Configuration Sidebar */}
        <div className="lg:col-span-5 flex flex-col space-y-4 lg:space-y-6">
          <div className="bg-[#0b0f1a] border border-slate-800 p-6 lg:p-8 rounded-[2rem] lg:rounded-[3rem] shadow-xl flex-1 flex flex-col space-y-6 lg:space-y-8">
             <div className="flex items-center space-x-3 lg:space-x-4">
               <SignalIcon className="w-6 h-6 lg:w-8 lg:h-8 text-indigo-500" />
               <h2 className="text-xl lg:text-2xl font-black text-white uppercase tracking-tighter">Core Configuration</h2>
             </div>

             {/* Mode Selector */}
             <div className="space-y-3 lg:space-y-4">
               <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Session Mode</label>
               <div className="grid grid-cols-3 gap-2 lg:gap-3">
                 <ModeBtn active={sessionMode === 'direct'} onClick={() => setSessionMode('direct')} icon={<UserIcon className="w-4 h-4" />} label="Direct" />
                 <ModeBtn active={sessionMode === 'proxy'} onClick={() => setSessionMode('proxy')} icon={<ArrowsRightLeftIcon className="w-4 h-4" />} label="Proxy" />
                 <ModeBtn active={sessionMode === 'training'} onClick={() => setSessionMode('training')} icon={<AcademicCapIcon className="w-4 h-4" />} label="Training" />
               </div>
             </div>

             {/* Voice Selector */}
             <div className="space-y-3 lg:space-y-4">
               <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Voice Identity</label>
               <div className="relative">
                 <select 
                   value={selectedVoice.id}
                   onChange={(e) => setSelectedVoice(VOICES.find(v => v.id === e.target.value)!)}
                   className="w-full bg-slate-900 border border-slate-800 rounded-xl lg:rounded-2xl px-4 lg:px-6 py-3 lg:py-4 text-xs lg:text-sm font-bold text-white appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-600 cursor-pointer transition-all hover:bg-slate-800"
                 >
                   {VOICES.map(v => <option key={v.id} value={v.id}>{v.label}</option>)}
                 </select>
                 <ChevronDownIcon className="w-4 h-4 lg:w-5 lg:h-5 text-slate-500 absolute right-4 lg:right-6 top-1/2 -translate-y-1/2 pointer-events-none" />
               </div>
               <div className="flex items-center space-x-2 px-1">
                 <div className={`w-2 h-2 rounded-full ${selectedVoice.gender === 'male' ? 'bg-blue-500' : 'bg-pink-500'} animate-pulse`} />
                 <p className="text-[9px] text-indigo-400 font-black uppercase tracking-widest">
                   {selectedVoice.gender.toUpperCase()} persona active
                 </p>
               </div>
             </div>

             {/* Dynamic Content */}
             <div className="flex-1 space-y-4 lg:space-y-6">
               {sessionMode === 'direct' && (
                 <div className="flex-1 flex items-center justify-center text-center p-6 lg:p-10 bg-slate-900/40 rounded-[2rem] lg:rounded-[3rem] border border-dashed border-slate-800 min-h-[120px]">
                    <div className="space-y-2 lg:space-y-4">
                       <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Voice Assistant Active</p>
                       <p className="text-[9px] lg:text-[10px] text-slate-700 font-bold max-w-[220px] mx-auto uppercase tracking-tighter leading-relaxed">Place orders or talk to your {selectedVoice.gender} APA. Say "stop" or "bye" to end.</p>
                    </div>
                 </div>
               )}

               {sessionMode === 'proxy' && (
                 <div className="space-y-4 lg:space-y-6 animate-in fade-in">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Contacts</label>
                    <div className="grid grid-cols-2 gap-2 lg:gap-3 max-h-[140px] overflow-y-auto custom-scroll pr-2">
                      {contacts.map(c => (
                        <button key={c.id} onClick={() => setSelectedContact(c)} className={`p-3 lg:p-4 rounded-xl lg:rounded-2xl border-2 transition-all flex items-center space-x-2 lg:space-x-3 ${selectedContact?.id === c.id ? 'bg-indigo-600/10 border-indigo-600 text-white shadow-lg' : 'bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-700'}`}>
                           <div className="w-6 h-6 lg:w-8 lg:h-8 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center font-black text-[10px] lg:text-xs shrink-0">{c.name[0]}</div>
                           <span className="text-[9px] lg:text-[10px] font-black uppercase truncate tracking-widest">{c.name}</span>
                        </button>
                      ))}
                    </div>
                    <div className="space-y-2 lg:space-y-3">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Relay Intent</label>
                      <textarea 
                        value={relayMessage} 
                        onChange={e => setRelayMessage(e.target.value)} 
                        placeholder="Relay message details..." 
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl lg:rounded-2xl p-4 lg:p-5 text-xs lg:text-sm text-slate-300 h-20 lg:h-24 resize-none outline-none focus:ring-2 focus:ring-indigo-600 transition-all font-medium placeholder:text-slate-700 shadow-inner"
                      />
                    </div>
                 </div>
               )}

               {sessionMode === 'training' && (
                 <div className="space-y-4 lg:space-y-6 animate-in fade-in">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">AI Agents</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-4">
                       {SPECIALIZED_AGENTS.map(agent => (
                         <button 
                           key={agent.id}
                           onClick={() => setSelectedSpecialized(agent)}
                           className={`p-4 lg:p-5 rounded-2xl lg:rounded-3xl border-2 transition-all flex items-center space-x-3 text-left ${selectedSpecialized?.id === agent.id ? 'bg-indigo-600/10 border-indigo-600 shadow-xl' : 'bg-slate-900 border-slate-800 hover:border-slate-700'}`}
                         >
                            <img src={`https://api.dicebear.com/7.x/bottts/svg?seed=${agent.id}&backgroundColor=${selectedSpecialized?.id === agent.id ? '6366f1' : '334155'}`} className="w-8 h-8 lg:w-10 lg:h-10 rounded-lg lg:rounded-xl shrink-0" alt="Bot" />
                            <div className="min-w-0">
                               <p className={`font-black text-[10px] lg:text-[11px] uppercase truncate ${selectedSpecialized?.id === agent.id ? 'text-white' : 'text-slate-500'}`}>{agent.name}</p>
                               <p className="text-[8px] lg:text-[9px] text-slate-600 font-bold uppercase tracking-widest truncate">{agent.type === 'tutor' ? 'Language' : 'Career'}</p>
                            </div>
                         </button>
                       ))}
                    </div>
                 </div>
               )}
             </div>

             <div className="pt-4 border-t border-slate-800 flex items-center space-x-3 lg:space-x-4 mt-auto">
                <div className="p-2 lg:p-3 bg-indigo-600/10 rounded-xl lg:rounded-2xl text-indigo-500 shrink-0">
                  <ShieldCheckIcon className="w-5 h-5 lg:w-6 lg:h-6" />
                </div>
                <div>
                   <p className="text-[10px] font-black text-white uppercase tracking-widest">Guardrails Sync</p>
                   <p className="text-[8px] lg:text-[9px] text-slate-600 font-bold uppercase tracking-tighter italic">Secure Web-Search Ready</p>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ModeBtn: React.FC<{ active: boolean, onClick: () => void, icon: React.ReactNode, label: string }> = ({ active, onClick, icon, label }) => (
  <button onClick={onClick} className={`p-3 lg:p-4 rounded-xl lg:rounded-2xl border-2 transition-all flex flex-col items-center space-y-1 lg:space-y-2 ${active ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg' : 'bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-700'}`}>
    {icon}
    <span className="text-[9px] lg:text-[10px] font-black uppercase tracking-widest">{label}</span>
  </button>
);

export default CallingAgent;

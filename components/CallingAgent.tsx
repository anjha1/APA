
import React, { useState, useEffect, useRef } from 'react';
import { 
  PhoneIcon, 
  MicrophoneIcon, 
  SpeakerWaveIcon, 
  StopCircleIcon, 
  UserIcon, 
  ChatBubbleBottomCenterIcon,
  ArrowsRightLeftIcon,
  SignalIcon,
  MusicalNoteIcon,
  AcademicCapIcon,
  BriefcaseIcon
} from '@heroicons/react/24/solid';
import { CallLog, Contact, Task, TaskStatus, AgentType, RiskLevel } from '../types';
import { APAEngine } from '../services/geminiService';
import { Modality, LiveServerMessage } from '@google/genai';
import { APA_TOOLS } from '../constants';

interface Props {
  onCallEnd: (log: CallLog) => void;
  onTaskCreate: (task: Task) => void;
  userName: string;
  contacts: Contact[];
  engine: APAEngine | null;
}

const VOICES = ['Zephyr', 'Puck', 'Charon', 'Kore', 'Fenrir'];

const CallingAgent: React.FC<Props> = ({ onCallEnd, onTaskCreate, userName, contacts, engine }) => {
  const [isCalling, setIsCalling] = useState(false);
  const [callMode, setCallMode] = useState<'direct' | 'proxy'>('direct');
  const [status, setStatus] = useState('Standby');
  const [duration, setDuration] = useState(0);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [relayMessage, setRelayMessage] = useState('');
  const [selectedVoice, setSelectedVoice] = useState('Zephyr');
  const [realTimeTranscription, setRealTimeTranscription] = useState<{ role: 'user' | 'assistant', content: string }[]>([]);
  
  const sessionRef = useRef<any>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const timerRef = useRef<number | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const audioSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const transcriptRef = useRef<{ role: 'user' | 'assistant', content: string, timestamp: number }[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
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

  const initiateLiveCall = async (contact: Contact | null, message: string, mode: 'direct' | 'proxy') => {
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
      
      let sysInstruction = mode === 'direct' 
        ? `You are the personal assistant of ${userName}. Speak directly to them. Handle logistics and orders.`
        : `You are calling ${contact?.name} on behalf of ${userName}. Relay: "${message}".`;

      if (contact?.isSpecialized) {
        sysInstruction = contact.promptOverride || sysInstruction;
      }

      const sessionPromise = engine.connectLive({
        callbacks: {
          onopen: () => {
            setStatus(mode === 'direct' ? 'Voice Link Secure' : `Call Active: ${contact?.name}`);
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
          onmessage: async (msg: LiveServerMessage) => {
            if (msg.serverContent?.outputTranscription) {
              const text = msg.serverContent.outputTranscription.text;
              setRealTimeTranscription(prev => [...prev, { role: 'assistant', content: text }]);
              transcriptRef.current.push({ role: 'assistant', content: text, timestamp: Date.now() });
            } else if (msg.serverContent?.inputTranscription) {
              const text = msg.serverContent.inputTranscription.text;
              setRealTimeTranscription(prev => [...prev, { role: 'user', content: text }]);
              transcriptRef.current.push({ role: 'user', content: text, timestamp: Date.now() });
            }

            if (msg.toolCall) {
              for (const fc of msg.toolCall.functionCalls) {
                const args = fc.args as any;
                const newTask: Task = {
                  id: `order-call-${Date.now()}`,
                  description: fc.name === 'orderFood' ? `Voice Food Order: ${args.restaurantName}` : `Voice Shopping: ${args.productName}`,
                  type: fc.name === 'orderFood' ? AgentType.FOOD_DELIVERY : AgentType.SHOPPING,
                  status: TaskStatus.PENDING,
                  timestamp: Date.now(),
                  riskLevel: RiskLevel.LOW,
                  price: args.totalPrice || 0,
                  source: 'Calling Agent'
                };
                onTaskCreate(newTask);
                sessionPromise.then(s => s.sendToolResponse({
                  functionResponses: { id: fc.id, name: fc.name, response: { result: "Order pending verification in dashboard." } }
                }));
              }
            }

            const base64Audio = msg.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
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
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: selectedVoice as any } } }
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
    if (sessionRef.current) sessionRef.current.close();
    audioSourcesRef.current.forEach(s => s.stop());
    onCallEnd({
      id: Date.now().toString(),
      recipient: callMode === 'direct' ? 'APA Brain' : (selectedContact?.name || 'Unknown'),
      duration: `${Math.floor(duration / 60)}m ${duration % 60}s`,
      purpose: callMode === 'direct' ? 'Direct Interaction' : (relayMessage || 'Task Execution'),
      timestamp: Date.now(),
      status: 'COMPLETED',
      voiceUsed: selectedVoice,
      transcript: transcriptRef.current,
      audioPlaybackAvailable: true
    });
    setIsCalling(false);
    setRealTimeTranscription([]);
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-slate-950 p-6 overflow-y-auto custom-scroll">
      <div className="max-w-6xl w-full grid lg:grid-cols-2 gap-10 items-stretch h-full">
        {/* Left: Call Control */}
        <div className="flex flex-col bg-slate-900 border border-slate-800 rounded-[3rem] p-10 text-center shadow-2xl relative overflow-hidden flex-1 min-h-[500px]">
          {isCalling && (
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-indigo-500/10 rounded-full animate-ping" />
            </div>
          )}
          
          <div className="flex-1 flex flex-col justify-center items-center space-y-10">
            <div className={`w-40 h-40 mx-auto rounded-full bg-slate-800 flex items-center justify-center transition-all ${isCalling ? 'scale-110 shadow-2xl shadow-indigo-600/20' : ''}`}>
               <div className={`w-28 h-28 rounded-full flex items-center justify-center transition-all ${isCalling ? 'bg-indigo-600' : 'bg-slate-700'}`}>
                 <PhoneIcon className={`w-12 h-12 ${isCalling ? 'text-white' : 'text-slate-500'}`} />
               </div>
            </div>
            
            <div className="space-y-4 relative z-10">
              <h1 className="text-3xl font-black text-white tracking-tight">
                {isCalling ? (callMode === 'direct' ? 'Personal Agent' : selectedContact?.name) : 'Voice Core'}
              </h1>
              <p className="text-indigo-400 font-mono text-5xl font-black tabular-nums">{Math.floor(duration / 60)}:{(duration % 60).toString().padStart(2, '0')}</p>
              <div className="bg-slate-800/80 border border-slate-700 px-4 py-1.5 rounded-full inline-flex items-center space-x-2">
                 <div className={`w-2 h-2 rounded-full ${isCalling ? 'bg-green-500 animate-pulse' : 'bg-slate-600'}`} />
                 <span className="text-slate-400 text-[9px] font-black uppercase tracking-widest">{status}</span>
              </div>
            </div>

            {/* Real-time transcription list */}
            {isCalling && (
              <div ref={scrollRef} className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl h-32 overflow-y-auto p-4 text-left space-y-2 custom-scroll">
                {realTimeTranscription.length === 0 ? (
                  <p className="text-[10px] text-slate-700 uppercase font-black text-center mt-8">Listening for speech...</p>
                ) : (
                  realTimeTranscription.slice(-10).map((t, i) => (
                    <div key={i} className={`flex space-x-2 text-[11px] ${t.role === 'user' ? 'text-indigo-400' : 'text-slate-400'}`}>
                      <span className="font-black uppercase shrink-0">{t.role === 'user' ? 'You:' : 'Agent:'}</span>
                      <span className="font-medium italic">{t.content}</span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          <div className="pt-8">
            {isCalling ? (
              <button onClick={endCall} className="w-20 h-20 bg-red-600 text-white rounded-full shadow-2xl hover:scale-110 transition-all flex items-center justify-center mx-auto">
                <StopCircleIcon className="w-10 h-10" />
              </button>
            ) : (
              <button 
                onClick={() => initiateLiveCall(selectedContact, relayMessage, callMode)} 
                className="px-10 py-5 bg-indigo-600 text-white rounded-[2rem] font-black text-xl shadow-xl hover:scale-105 active:scale-95 transition-all"
              >
                INITIALIZE LINK
              </button>
            )}
          </div>
        </div>

        {/* Right: Settings */}
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-[3rem] shadow-xl flex flex-col space-y-6 overflow-y-auto custom-scroll">
           <h2 className="text-xl font-black text-white flex items-center space-x-3">
             <ChatBubbleBottomCenterIcon className="w-6 h-6 text-indigo-500" />
             <span>Call Parameters</span>
           </h2>

           <div className="space-y-4">
             <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Agent Voice Persona</label>
             <div className="grid grid-cols-3 gap-2">
                {VOICES.map(v => (
                  <button 
                    key={v} 
                    onClick={() => setSelectedVoice(v)}
                    className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${selectedVoice === v ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-500 hover:bg-slate-700'}`}
                  >
                    {v}
                  </button>
                ))}
             </div>
           </div>

           <div className="space-y-4">
             <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Link Protocol</label>
             <div className="grid grid-cols-2 gap-4">
               <button onClick={() => setCallMode('direct')} className={`p-4 rounded-2xl border transition-all text-xs font-black uppercase ${callMode === 'direct' ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-500'}`}>Direct Session</button>
               <button onClick={() => setCallMode('proxy')} className={`p-4 rounded-2xl border transition-all text-xs font-black uppercase ${callMode === 'proxy' ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-500'}`}>Proxy Relay</button>
             </div>
           </div>

           {callMode === 'proxy' && (
             <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Specialized Tutors & Contacts</label>
                   <div className="grid grid-cols-2 gap-2">
                      {contacts.map(c => (
                        <button 
                          key={c.id} 
                          onClick={() => setSelectedContact(c)} 
                          className={`p-4 border rounded-2xl text-left transition-all ${selectedContact?.id === c.id ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg' : 'bg-slate-800 border-slate-700 text-slate-400'}`}
                        >
                           <div className="flex items-center space-x-2">
                             {c.id === 't1' ? <AcademicCapIcon className="w-4 h-4" /> : c.id === 't2' ? <BriefcaseIcon className="w-4 h-4" /> : <UserIcon className="w-4 h-4" />}
                             <p className="font-black text-xs uppercase tracking-tight">{c.name}</p>
                           </div>
                           <p className="text-[9px] opacity-70 mt-1">{c.relationship}</p>
                        </button>
                      ))}
                   </div>
                </div>
                {!selectedContact?.isSpecialized && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Relay Intent</label>
                    <textarea 
                      value={relayMessage} 
                      onChange={e => setRelayMessage(e.target.value)} 
                      placeholder="e.g. 'I'll be late by 15 mins. Start the dinner.'" 
                      className="w-full bg-slate-800 border border-slate-700 rounded-2xl p-4 text-xs text-white focus:ring-2 focus:ring-indigo-600 h-20 resize-none"
                    />
                  </div>
                )}
             </div>
           )}

           <div className="mt-auto bg-indigo-600/5 border border-indigo-600/10 p-4 rounded-2xl flex items-center space-x-3">
              <MusicalNoteIcon className="w-5 h-5 text-indigo-500" />
              <p className="text-[10px] text-slate-500 leading-tight">Gemini 2.5 Flash Native Audio logic enabled. System will handle full-duplex voice interaction with sub-200ms latency.</p>
           </div>
        </div>
      </div>
    </div>
  );
};

export default CallingAgent;

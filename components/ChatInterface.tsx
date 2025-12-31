
import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import { PaperAirplaneIcon, SparklesIcon, MicrophoneIcon } from '@heroicons/react/24/solid';
import { APAEngine } from '../services/geminiService';

interface Props {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  engine: APAEngine | null;
}

const ChatInterface: React.FC<Props> = ({ messages, onSendMessage, engine }) => {
  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (input.trim()) { onSendMessage(input); setInput(''); }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64Audio = (reader.result as string).split(',')[1];
          if (engine) {
            const transcript = await engine.transcribeAudio(base64Audio);
            if (transcript) { setInput(transcript); onSendMessage(transcript); }
          }
        };
      };
      recorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Recording error:", err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 p-4 lg:p-6 overflow-hidden">
      <div className="flex-1 overflow-y-auto space-y-6 lg:space-y-8 custom-scroll px-2 lg:px-4 pb-10" ref={scrollRef}>
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] lg:max-w-[75%] space-y-1.5 lg:space-y-2`}>
               {m.role === 'assistant' && (
                  <div className="flex items-center space-x-2 text-indigo-500 text-[9px] lg:text-[10px] font-black uppercase tracking-widest mb-1 ml-3 lg:ml-4">
                     <SparklesIcon className="w-3 h-3" />
                     <span>Orchestrator</span>
                  </div>
               )}
               <div className={`p-4 lg:p-5 rounded-2xl lg:rounded-[2rem] shadow-2xl border ${
                  m.role === 'user' 
                    ? 'bg-indigo-600 border-indigo-500 text-white rounded-tr-none' 
                    : 'bg-slate-900 border-slate-800 text-slate-100 rounded-tl-none'
               }`}>
                  <p className="text-sm lg:text-[15px] leading-relaxed font-medium break-words">{m.content}</p>
               </div>
               <p className={`text-[9px] text-slate-600 font-bold uppercase tracking-widest ${m.role === 'user' ? 'text-right mr-3 lg:mr-4' : 'text-left ml-3 lg:ml-4'}`}>
                  {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
               </p>
            </div>
          </div>
        ))}
      </div>

      <div className="max-w-4xl mx-auto w-full pt-4 sticky bottom-0 bg-slate-950/80 backdrop-blur-sm">
        <form onSubmit={handleSubmit} className="relative flex items-center space-x-2 lg:space-x-4">
          <div className="relative flex-1">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Instruct APA..."
              className="w-full bg-slate-900 border border-slate-800 text-white rounded-2xl lg:rounded-[2rem] px-5 lg:px-8 py-4 lg:py-6 pr-14 lg:pr-20 focus:outline-none focus:ring-4 focus:ring-indigo-600/20 shadow-2xl transition-all placeholder:text-slate-600 text-base lg:text-lg font-medium"
            />
            <button
              type="button"
              onClick={isRecording ? stopRecording : startRecording}
              className={`absolute right-2 lg:right-4 top-1/2 -translate-y-1/2 p-2.5 lg:p-3 rounded-full transition-all ${isRecording ? 'bg-red-600 animate-pulse text-white' : 'bg-slate-800 text-slate-400 hover:text-indigo-500'}`}
            >
              <MicrophoneIcon className="w-5 h-5 lg:w-6 lg:h-6" />
            </button>
          </div>
          <button
            type="submit"
            className="p-3.5 lg:p-4 bg-indigo-600 text-white rounded-full shadow-lg shadow-indigo-900/40 hover:scale-110 active:scale-95 transition-all shrink-0"
          >
            <PaperAirplaneIcon className="w-5 h-5 lg:w-6 lg:h-6" />
          </button>
        </form>
        <div className="hidden sm:flex mt-4 justify-center space-x-6 lg:space-x-8 text-[9px] font-black text-slate-600 uppercase tracking-widest">
           <span className="flex items-center"><div className="w-1.5 h-1.5 rounded-full bg-green-500 mr-2" /> AutoPay Enabled</span>
           <span className="flex items-center"><div className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-2" /> Thinking Mode</span>
           <span className="flex items-center"><div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mr-2" /> Secure Vault</span>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;

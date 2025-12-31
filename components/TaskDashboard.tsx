
import React, { useState } from 'react';
import { Task, TaskStatus, RiskLevel, AgentType } from '../types';
import { 
  ShoppingBagIcon, 
  BeakerIcon, 
  ArrowPathIcon,
  CheckIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  GlobeAltIcon,
  MapPinIcon,
  PhoneIcon,
  CreditCardIcon,
  ReceiptPercentIcon,
  ArrowTopRightOnSquareIcon,
  ChatBubbleLeftRightIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

interface Props {
  tasks: Task[];
  onApprove: (taskId: string) => void;
  onInitiateCall: (recipient: string, message: string) => void;
}

const TaskDashboard: React.FC<Props> = ({ tasks, onApprove, onInitiateCall }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const getIcon = (type: AgentType) => {
    if (type === AgentType.SHOPPING) return <ShoppingBagIcon className="w-5 h-5" />;
    if (type === AgentType.FOOD_DELIVERY) return <ReceiptPercentIcon className="w-5 h-5" />;
    if (type === AgentType.PHARMACY) return <BeakerIcon className="w-5 h-5" />;
    return <ArrowPathIcon className="w-5 h-5" />;
  };

  const toggleExpand = (id: string) => setExpandedId(expandedId === id ? null : id);

  return (
    <div className="p-4 lg:p-8 h-full overflow-y-auto custom-scroll bg-slate-950">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8 lg:mb-10 flex flex-col md:flex-row justify-between items-start md:items-end space-y-4 md:space-y-0">
          <div>
            <h1 className="text-3xl lg:text-4xl font-black text-white tracking-tighter uppercase">Real-Time Orders</h1>
            <p className="text-slate-400 mt-1 lg:mt-2 italic font-medium text-xs lg:text-sm">Monitoring {tasks.length} active autonomous chains.</p>
          </div>
          
          <div className="bg-slate-900 border border-slate-800 rounded-xl lg:rounded-2xl px-3 lg:px-4 py-1.5 lg:py-2 flex items-center space-x-2 shrink-0">
            <div className="w-1.5 lg:w-2 h-1.5 lg:h-2 rounded-full bg-indigo-500 animate-pulse" />
            <span className="text-[9px] lg:text-[10px] font-black text-slate-400 uppercase tracking-widest">Live Sync</span>
          </div>
        </div>

        {tasks.length === 0 ? (
          <div className="bg-slate-900/50 border border-slate-800 rounded-[2rem] lg:rounded-[3rem] p-10 lg:p-20 text-center flex flex-col items-center">
            <div className="w-16 h-16 lg:w-20 lg:h-20 bg-slate-800 rounded-2xl lg:rounded-3xl flex items-center justify-center mb-6 text-slate-600">
               <ShoppingBagIcon className="w-8 h-8 lg:w-10 lg:h-10 animate-bounce" />
            </div>
            <h3 className="text-xl lg:text-2xl font-bold text-white uppercase tracking-tighter">No Active Orders</h3>
            <p className="text-slate-500 max-w-sm mt-3 text-xs lg:text-sm">All actions synced to history. Use Command Center to place an order.</p>
          </div>
        ) : (
          <div className="grid gap-4 lg:gap-6">
            {tasks.map((task) => (
              <div 
                key={task.id} 
                className={`bg-slate-900 border rounded-2xl lg:rounded-[2.5rem] overflow-hidden transition-all duration-300 ${
                  expandedId === task.id ? 'border-indigo-500 ring-4 ring-indigo-500/10' : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                <div 
                  onClick={() => toggleExpand(task.id)}
                  className="p-5 lg:p-8 flex items-center space-x-4 lg:space-x-6 cursor-pointer"
                >
                  <div className={`w-12 h-12 lg:w-16 lg:h-16 rounded-xl lg:rounded-[1.5rem] flex items-center justify-center shrink-0 transition-all ${
                    task.status === TaskStatus.REQUIRES_APPROVAL ? 'bg-amber-600/20 text-amber-500' : 'bg-indigo-600/10 text-indigo-500'
                  }`}>
                    {getIcon(task.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3 className="font-black text-white text-base lg:text-xl tracking-tight uppercase truncate">{task.description}</h3>
                      <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${
                        task.riskLevel === RiskLevel.HIGH ? 'bg-red-500/10 text-red-500' : 
                        task.riskLevel === RiskLevel.MEDIUM ? 'bg-amber-500/10 text-amber-500' : 
                        'bg-green-500/10 text-green-500'
                      }`}>
                        {task.riskLevel}
                      </span>
                    </div>
                    <div className="flex items-center space-x-3 text-[10px] lg:text-xs font-bold truncate">
                       <span className="text-indigo-400 truncate">{task.platform || 'Optimizing...'}</span>
                       <span className="text-slate-500 flex items-center shrink-0">
                         <ClockIcon className="w-3 h-3 mr-1" />
                         {new Date(task.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                       </span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-lg lg:text-2xl font-black text-white">${task.price || 0}</p>
                    <p className={`text-[8px] lg:text-[10px] font-black uppercase tracking-widest mt-1 ${
                      task.status === TaskStatus.COMPLETED ? 'text-green-500' : 
                      task.status === TaskStatus.REQUIRES_APPROVAL ? 'text-amber-500' : 
                      'text-indigo-400'
                    }`}>
                      {task.status === TaskStatus.REQUIRES_APPROVAL ? 'NEEDS AUTH' : task.status}
                    </p>
                  </div>
                </div>

                {expandedId === task.id && (
                  <div className="px-5 lg:px-8 pb-5 lg:pb-8 pt-2 border-t border-slate-800 bg-slate-900/50 animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 py-4 lg:py-6">
                      
                      <div className="space-y-4 lg:space-y-6">
                        <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest block">Composition</label>
                        <div className="bg-slate-800/50 rounded-xl lg:rounded-2xl p-4 space-y-3 border border-slate-700">
                           {task.items?.map((item, i) => (
                             <div key={i} className="flex justify-between text-xs lg:text-sm">
                                <span className="text-slate-300 font-medium truncate max-w-[70%]">{item.name} <span className="text-slate-500 text-[10px]">x{item.quantity}</span></span>
                                <span className="text-white font-bold shrink-0">${(item.price * item.quantity).toFixed(2)}</span>
                             </div>
                           ))}
                           <div className="pt-3 border-t border-slate-700 flex justify-between font-black text-white text-sm lg:text-base">
                              <span>TOTAL</span>
                              <span>${task.price?.toFixed(2)}</span>
                           </div>
                        </div>
                      </div>

                      <div className="space-y-4 lg:space-y-6">
                        <div className="flex items-start space-x-3">
                           <MapPinIcon className="w-5 h-5 text-indigo-500 mt-0.5 shrink-0" />
                           <div className="min-w-0">
                              <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest block mb-1">Destination</label>
                              <p className="text-xs lg:text-sm text-slate-300 font-medium leading-relaxed break-words">{task.deliveryAddress}</p>
                           </div>
                        </div>
                        <div className="flex items-start space-x-3">
                           <GlobeAltIcon className="w-5 h-5 text-indigo-500 mt-0.5 shrink-0" />
                           <div className="min-w-0">
                              <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest block mb-1">Tracking</label>
                              <a href={task.platformLink} target="_blank" rel="noopener noreferrer" className="text-indigo-400 text-xs lg:text-sm font-bold flex items-center hover:underline group">
                                 Launch {task.platform}
                                 <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5 ml-1" />
                              </a>
                           </div>
                        </div>
                      </div>

                      <div className="space-y-4 lg:space-y-6">
                         <div className="bg-slate-800/50 rounded-2xl p-5 border border-slate-700">
                            <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest block mb-3">Audit Details</label>
                            <div className="space-y-2 text-[10px] lg:text-xs">
                               <div className="flex justify-between font-bold"><span className="text-slate-500">Method:</span><span className="text-slate-300">Wallet</span></div>
                               <div className="flex justify-between font-bold"><span className="text-slate-500">TXN:</span><span className="text-indigo-300 font-mono">{task.transactionId}</span></div>
                            </div>
                         </div>
                         
                         <div className="flex flex-col gap-3">
                            {task.status === TaskStatus.REQUIRES_APPROVAL && (
                              <button onClick={() => onApprove(task.id)} className="w-full bg-amber-600 hover:bg-amber-500 text-white py-3.5 lg:py-4 rounded-xl lg:rounded-2xl text-[10px] lg:text-xs font-black flex items-center justify-center space-x-2 transition-all shadow-xl shadow-amber-900/30">
                                <CheckIcon className="w-5 h-5" />
                                <span>AUTHORIZE TRANSACTION</span>
                              </button>
                            )}
                            <button onClick={() => onInitiateCall(task.platform || 'Support', `Inquiry: ${task.description}`)} className="w-full bg-slate-800 hover:bg-slate-700 text-white py-3.5 lg:py-4 rounded-xl lg:rounded-2xl text-[10px] lg:text-xs font-black flex items-center justify-center space-x-2 transition-all border border-slate-700">
                               <ChatBubbleLeftRightIcon className="w-5 h-5" />
                               <span>CONTACT LOGISTICS</span>
                            </button>
                         </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskDashboard;

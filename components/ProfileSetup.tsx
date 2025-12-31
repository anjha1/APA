
import React from 'react';
import { DetailedProfile, Contact } from '../types';
import { UserIcon, MapPinIcon, PhoneIcon, UserPlusIcon, ChatBubbleLeftEllipsisIcon, TrashIcon } from '@heroicons/react/24/outline';

interface Props {
  profile: DetailedProfile;
  setProfile: (p: DetailedProfile) => void;
}

const ProfileSetup: React.FC<Props> = ({ profile, setProfile }) => {
  const handleChange = (field: keyof DetailedProfile, value: any) => {
    setProfile({ ...profile, [field]: value });
  };

  const addContact = () => {
    const newContact: Contact = {
      id: Date.now().toString(),
      name: '',
      phone: '',
      relationship: ''
    };
    handleChange('contacts', [...profile.contacts, newContact]);
  };

  const updateContact = (id: string, field: keyof Contact, value: string) => {
    const updated = profile.contacts.map(c => c.id === id ? { ...c, [field]: value } : c);
    handleChange('contacts', updated);
  };

  const removeContact = (id: string) => {
    handleChange('contacts', profile.contacts.filter(c => c.id !== id));
  };

  return (
    <div className="p-8 h-full overflow-y-auto custom-scroll bg-slate-950">
      <div className="max-w-4xl mx-auto pb-20">
        <div className="mb-10">
          <h1 className="text-4xl font-black text-white tracking-tighter">Unified Identity</h1>
          <p className="text-slate-400 mt-2">Personal data and logistics parameters for autonomous APA execution.</p>
        </div>

        <div className="grid gap-12">
          {/* Section 1: Personal & Delivery */}
          <section className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-10 space-y-10 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-indigo-600/10 text-indigo-500 rounded-2xl flex items-center justify-center">
                  <MapPinIcon className="w-6 h-6" />
                </div>
                <h2 className="text-2xl font-bold text-white">Delivery Logistics</h2>
              </div>
              <div className="px-3 py-1 bg-green-500/10 text-green-500 text-[10px] font-black rounded-full uppercase tracking-widest border border-green-500/20">Verified</div>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8">
              <Input label="Full Name" value={profile.fullName} onChange={(v) => handleChange('fullName', v)} />
              <Input label="House / Flat No." value={profile.houseNo} onChange={(v) => handleChange('houseNo', v)} />
              <Input label="Street / Locality" value={profile.street} onChange={(v) => handleChange('street', v)} />
              <Input label="City" value={profile.city} onChange={(v) => handleChange('city', v)} />
              <Input label="State" value={profile.state} onChange={(v) => handleChange('state', v)} />
              <Input label="Postal Code" value={profile.zip} onChange={(v) => handleChange('zip', v)} />
              <Input label="Primary Mobile" value={profile.phone} onChange={(v) => handleChange('phone', v)} />
              <Input label="Alternative Line" value={profile.altPhone} onChange={(v) => handleChange('altPhone', v)} />
            </div>
          </section>

          {/* Section 2: Calling Agent Contacts */}
          <section className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-10 space-y-10 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-indigo-600/10 text-indigo-500 rounded-2xl flex items-center justify-center">
                  <UserPlusIcon className="w-6 h-6" />
                </div>
                <h2 className="text-2xl font-bold text-white">Verified Contacts</h2>
              </div>
              <button 
                onClick={addContact}
                className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-black flex items-center space-x-2 hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-900/40"
              >
                <span>+ ADD CONTACT</span>
              </button>
            </div>
            
            <div className="grid gap-4">
              {profile.contacts.map((c, idx) => (
                <div key={c.id} className="bg-slate-800/50 border border-slate-700 p-6 rounded-[2rem] relative group">
                   <button 
                    onClick={() => removeContact(c.id)}
                    className="absolute top-6 right-6 p-2 text-slate-600 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"
                   >
                     <TrashIcon className="w-5 h-5" />
                   </button>
                   <div className="grid md:grid-cols-3 gap-6">
                      <Input label="Name" value={c.name} onChange={(v) => updateContact(c.id, 'name', v)} placeholder="e.g. Neha" />
                      <Input label="Phone" value={c.phone} onChange={(v) => updateContact(c.id, 'phone', v)} />
                      <Input label="Relationship" value={c.relationship} onChange={(v) => updateContact(c.id, 'relationship', v)} placeholder="Girlfriend, Support, etc." />
                   </div>
                </div>
              ))}
            </div>

            <div className="space-y-2 pt-6">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center space-x-2">
                 <ChatBubbleLeftEllipsisIcon className="w-3.5 h-3.5 text-indigo-500" />
                 <span>Default Voice Introduction</span>
              </label>
              <textarea
                value={profile.agentDefaultMessage}
                onChange={(e) => handleChange('agentDefaultMessage', e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-2xl p-6 text-sm text-slate-300 focus:ring-2 focus:ring-indigo-600 outline-none transition-all h-28 resize-none font-medium italic"
                placeholder="Message the agent relays when starting a call..."
              />
            </div>
          </section>

          <div className="bg-indigo-600/10 border border-indigo-500/20 p-8 rounded-[3rem] flex items-center justify-between shadow-2xl">
            <div className="flex items-center space-x-4 text-indigo-400">
               <div className="p-3 bg-indigo-600/20 rounded-2xl">
                 <ShieldCheckIcon className="w-8 h-8" />
               </div>
               <div>
                 <span className="block text-lg font-black text-white">Encrypted Vault Storage</span>
                 <span className="text-xs font-medium text-slate-400">All identity data is stored in your private APA memory.</span>
               </div>
            </div>
            <button className="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black text-lg shadow-xl shadow-indigo-900/50 hover:scale-105 active:scale-95 transition-all">
              Save All Profile Details
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const Input: React.FC<{ label: string; value: string; onChange: (v: string) => void; placeholder?: string }> = ({ label, value, onChange, placeholder }) => (
  <div className="space-y-2">
    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">{label}</label>
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-6 py-4 text-sm text-white focus:ring-2 focus:ring-indigo-600 outline-none transition-all placeholder:text-slate-700"
    />
  </div>
);

const ShieldCheckIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

export default ProfileSetup;

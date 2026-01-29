'use client'
import React, { useState } from 'react';

// Mock data for the UI - eventually replaced by Clarity read-only calls
const MOCK_STATS = [
  { label: 'Total Value Locked', value: '45.2M STX', change: '+12%' },
  { label: 'Current APY', value: '9.2%', change: 'Stable' },
  { label: 'Active Stakers', value: '12,840', change: '+142 today' },
];

export default function StakingLandingPage() {
  const [amount, setAmount] = useState('');

  return (
    <div className="min-h-screen bg-[#020617] text-white selection:bg-indigo-500/30">
      
      {/* --- Navigation --- */}
      <nav className="flex justify-between items-center px-8 py-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg rotate-12"></div>
          <span className="text-xl font-bold tracking-tight">StacksYield</span>
        </div>
        <div className="hidden md:flex gap-8 text-sm text-slate-400 font-medium">
          <a href="#" className="hover:text-white transition">Dashboard</a>
          <a href="#" className="hover:text-white transition">Governance</a>
          <a href="#" className="hover:text-white transition">Docs</a>
        </div>
        <button className="bg-white text-black px-5 py-2.5 rounded-full text-sm font-bold hover:bg-slate-200 transition shadow-lg">
          Connect Wallet
        </button>
      </nav>

      <main className="max-w-7xl mx-auto px-8 py-12 grid lg:grid-cols-2 gap-16 items-center">
        
        {/* --- Hero Section --- */}
        <section className="space-y-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold uppercase tracking-widest">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
            </span>
            Live on Mainnet
          </div>
          
          <h1 className="text-6xl md:text-7xl font-extrabold tracking-tight leading-[1.1]">
            Yield from the bedrock of <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-indigo-500">Bitcoin.</span>
          </h1>
          
          <p className="text-lg text-slate-400 max-w-md leading-relaxed">
            Stake your STX to secure the network and earn rewards. Powered by Clarity smart contracts for 100% transparency.
          </p>

          <div className="grid grid-cols-3 gap-4 pt-4">
            {MOCK_STATS.map((stat) => (
              <div key={stat.label}>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-slate-500 uppercase font-semibold">{stat.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* --- Staking Card (Interactive Zone) --- */}
        <section className="relative">
          {/* Decorative background glow */}
          <div className="absolute -inset-4 bg-gradient-to-tr from-indigo-500/20 to-orange-500/20 blur-3xl opacity-50 rounded-full"></div>
          
          <div className="relative bg-slate-900 border border-slate-800 rounded-[2.5rem] shadow-2xl overflow-hidden backdrop-blur-xl">
            <div className="flex border-b border-slate-800">
              <button className="flex-1 py-5 text-sm font-bold border-b-2 border-indigo-500 bg-slate-800/30">Stake</button>
              <button className="flex-1 py-5 text-sm font-bold text-slate-500 hover:text-white transition">Unstake</button>
            </div>

            <div className="p-8 space-y-8">
              <div className="flex justify-between items-end">
                <div>
                  <label className="text-xs text-slate-500 uppercase font-bold tracking-widest">Amount to Stake</label>
                  <div className="flex items-center gap-2 mt-2">
                    <input 
                      type="number" 
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00" 
                      className="bg-transparent text-4xl font-bold focus:outline-none w-full placeholder:text-slate-800"
                    />
                    <span className="text-xl font-bold text-slate-600">STX</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2">
                {['25%', '50%', '75%', 'MAX'].map((pc) => (
                  <button key={pc} className="py-2 rounded-xl border border-slate-800 text-xs font-bold hover:bg-slate-800 transition text-slate-400 hover:text-white">
                    {pc}
                  </button>
                ))}
              </div>

              <div className="space-y-4 p-5 bg-black/40 rounded-3xl border border-slate-800/50">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 font-medium">Est. Monthly Rewards</span>
                  <span className="text-green-400 font-bold">~14.5 STX</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 font-medium">Unlock Period</span>
                  <span className="text-slate-300">2,100 Blocks</span>
                </div>
              </div>

              <button className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-5 rounded-2xl shadow-xl shadow-indigo-500/20 transition-all active:scale-[0.98]">
                Stake Now
              </button>

              <div className="flex items-center justify-center gap-2 text-[10px] text-slate-600 font-bold uppercase tracking-[0.2em]">
                <img src="/btc-icon.svg" className="w-3 h-3 grayscale opacity-50" alt="" />
                Secured by Bitcoin Finality
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* --- Footer / Feature Grid --- */}
      <footer className="max-w-7xl mx-auto px-8 mt-12 pb-20">
        <div className="h-px bg-gradient-to-r from-transparent via-slate-800 to-transparent w-full mb-12"></div>
        <div className="grid md:grid-cols-3 gap-12">
          <div>
            <h4 className="font-bold mb-3">Non-Custodial</h4>
            <p className="text-sm text-slate-500 leading-relaxed">Your funds are controlled by the Clarity smart contract, not our team. You retain ownership at all times.</p>
          </div>
          <div>
            <h4 className="font-bold mb-3">Clarity Secure</h4>
            <p className="text-sm text-slate-500 leading-relaxed">No re-entrancy attacks. Our contract code is public, interpreted, and anchored to Bitcoin.</p>
          </div>
          <div>
            <h4 className="font-bold mb-3">Stacking Yield</h4>
            <p className="text-sm text-slate-500 leading-relaxed">By participating in this pool, you help secure the Stacks layer and earn a share of protocol rewards.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
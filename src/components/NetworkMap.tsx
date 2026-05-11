import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Server, Globe, Shield, Wifi, Zap } from 'lucide-react';
import { cn } from '../lib/utils';
import { NetworkNode } from '../lib/gemini';

interface NetworkMapProps {
  nodes: NetworkNode[];
  activeNodeIp?: string;
}

export const NetworkMap: React.FC<NetworkMapProps> = ({ nodes, activeNodeIp }) => {
  return (
    <div className="flex flex-col h-full bg-[#050608] border border-slate-800 rounded p-4 relative overflow-hidden">
      <div className="absolute top-0 right-0 p-2 opacity-5">
        <Wifi className="w-24 h-24 text-rose-500" />
      </div>

      <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-2 shrink-0">
        <div className="text-[10px] font-bold text-slate-500 tracking-widest uppercase flex items-center gap-2">
          <Globe className="w-3 h-3 text-rose-500" /> Network Topology
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[9px] text-slate-600 uppercase">Nodes: {nodes.length}</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-4">
        {nodes.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-700 space-y-2 opacity-50">
            <Shield className="w-8 h-8" />
            <span className="text-[10px] tracking-tighter uppercase font-bold text-center">
              No reconnaissance data <br /> Discovered yet
            </span>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            <AnimatePresence>
              {nodes.map((node, index) => (
                <motion.div
                  key={node.ip}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={cn(
                    "p-3 rounded border bg-black/40 group relative overflow-hidden transition-all",
                    node.ip === activeNodeIp ? "border-rose-500/50 shadow-[0_0_10px_rgba(225,29,72,0.15)]" : "border-slate-800 hover:border-slate-700"
                  )}
                >
                  {/* Status Indicator */}
                  <div className={cn(
                    "absolute top-0 right-0 w-1 h-full",
                    node.status === 'up' ? "bg-emerald-500" : "bg-red-500"
                  )}></div>

                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-slate-900 rounded group-hover:bg-slate-800 transition-colors">
                      <Server className={cn(
                        "w-4 h-4",
                        node.status === 'up' ? "text-emerald-500" : "text-slate-600"
                      )} />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-200 tracking-tight">{node.ip}</span>
                        {node.status === 'up' && (
                          <div className="flex items-center gap-1">
                            <motion.div 
                              animate={{ opacity: [0.3, 1, 0.3] }}
                              transition={{ repeat: Infinity, duration: 2 }}
                              className="w-1.5 h-1.5 rounded-full bg-emerald-500"
                            />
                            <span className="text-[8px] text-emerald-500 font-bold uppercase tracking-widest">Live</span>
                          </div>
                        )}
                      </div>
                      
                      {node.hostname && (
                        <div className="text-[9px] text-slate-500 mt-0.5 truncate uppercase">
                          {node.hostname}
                        </div>
                      )}

                      <div className="mt-2 flex flex-wrap gap-1">
                        {node.services.map((svc) => (
                          <span 
                            key={svc} 
                            className="px-1.5 py-0.5 bg-slate-900 border border-slate-800 text-[8px] text-slate-400 rounded uppercase font-bold flex items-center gap-1 hover:text-rose-400 hover:border-rose-900/30 transition-colors"
                          >
                            <Zap className="w-2 h-2 text-rose-600" /> {svc}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      <div className="mt-4 pt-2 border-t border-slate-800/50 flex justify-between items-center shrink-0">
        <span className="text-[8px] text-slate-600 font-bold uppercase tracking-widest">System Scan Active</span>
        <div className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse"></div>
      </div>
    </div>
  );
};

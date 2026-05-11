import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Terminal as TerminalIcon, 
  ChevronRight, 
  Activity, 
  ShieldAlert, 
  Globe, 
  Lock, 
  Zap, 
  Skull,
  Server,
  Radar,
  Wifi,
  Cpu,
  Hash,
  Database,
  Search,
  Eye,
  ShieldCheck,
  Usb,
  Download
} from 'lucide-react';
import { cn } from '../lib/utils';
import { simulateToolOutput, getAdvisorSuggestion, extractNetworkEntities, NetworkNode, getExploitSuggestions, ExploitSuggestion } from '../lib/gemini';
import { NetworkMap } from './NetworkMap';

interface TerminalLine {
  id: string;
  type: 'input' | 'output' | 'error' | 'system' | 'success';
  content: string;
  command?: string;
}

const SNAKE_BITE_BANNER = `
 ██████╗███╗   ██╗ █████╗ ██╗  ██╗███████╗    ██████╗ ██╗████████╗███████╗
██╔════╝████╗  ██║██╔══██╗██║ ██╔╝██╔════╝    ██╔══██╗██║╚══██╔══╝██╔════╝
╚█████╗ ██╔██╗ ██║███████║█████╔╝ █████╗      ██████╔╝██║   ██║   █████╗  
 ╚═══██╗██║╚██╗██║██╔══██║██╔═██╗ ██╔══╝      ██╔══██╗██║   ██║   ██╔══╝  
██████╔╝██║ ╚████║██║  ██║██║  ██╗███████╗    ██████╔╝██║   ██║   ███████╗
╚═════╝ ╚═╝  ╚═══╝╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝    ╚═════╝ ╚═╝   ╚═╝   ╚══════╝
      :: Advanced Red Team Penetration Testing Environment v4.2 ::
`;

export const Terminal: React.FC = () => {
  const [history, setHistory] = useState<TerminalLine[]>([
    { id: '1', type: 'system', content: SNAKE_BITE_BANNER },
    { id: '2', type: 'system', content: '[+] Snake Bite Framework initialized successfully.' },
    { id: '3', type: 'system', content: '[i] Loading top-tier toolset from Kali repositories...' },
    { id: '4', type: 'system', content: 'Type "help" to list available commands.' },
  ]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeModule, setActiveModule] = useState<'RECON' | 'EXPLOIT' | 'POST-EXPLOIT' | 'CAPTURE' | 'REGISTRY'>('RECON');
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<'bash' | 'msfconsole'>('bash');

  // Stats for the detail panel
  const [targetIp, setTargetIp] = useState('192.168.1.104');
  const [os, setOs] = useState('Linux 5.10.0 (Ubuntu)');
  const [threatLevel, setThreatLevel] = useState(3);
  
  // Tactical Advisor State
  const [advisorMessage, setAdvisorMessage] = useState('Awaiting mission parameters for tactical analysis...');
  const [isAdvisorTyping, setIsAdvisorTyping] = useState(false);

  // Network Discovery State
  const [viewMode, setViewMode] = useState<'terminal' | 'network' | 'registry' | 'capture'>('terminal');
  const [discoveredNodes, setDiscoveredNodes] = useState<NetworkNode[]>([]);
  const [exploitSuggestions, setExploitSuggestions] = useState<ExploitSuggestion[]>([]);
  const [isAnalyzingExploits, setIsAnalyzingExploits] = useState(false);
  const [capturedPcaps, setCapturedPcaps] = useState<{name: string, size: string, timestamp: string}[]>([]);
  const [customTools, setCustomTools] = useState<{id: string, name: string, template: string, description: string}[]>(() => {
    const saved = localStorage.getItem('snakebite_custom_tools');
    return saved ? JSON.parse(saved) : [];
  });
  const [isAddingTool, setIsAddingTool] = useState(false);
  const [newTool, setNewTool] = useState({ name: '', template: '', description: '' });
  
  const [activeTools, setActiveTools] = useState<{name: string, status: 'active' | 'idle'}[]>([
    { name: 'NMAP', status: 'active' },
    { name: 'METASPLOIT', status: 'idle' },
    { name: 'HYDRA', status: 'idle' },
    { name: 'BURP_CORE', status: 'active' }
  ]);
  
  // Professional Lab State
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [auditLog, setAuditLog] = useState<{timestamp: string, action: string, type: 'info' | 'warn' | 'alert'}[]>([]);

  useEffect(() => {
    localStorage.setItem('snakebite_custom_tools', JSON.stringify(customTools));
  }, [customTools]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history]);

  const addLine = (content: string, type: TerminalLine['type'] = 'output') => {
    setHistory(prev => [...prev, { id: Math.random().toString(36), type, content }]);
    
    // Add to audit log for professional oversight
    if (type !== 'output') {
      const logType: 'info' | 'warn' | 'alert' = type === 'error' ? 'alert' : (type === 'system' ? 'info' : 'warn');
      setAuditLog(prev => [{
        timestamp: new Date().toLocaleTimeString(),
        action: content.substring(0, 50),
        type: logType
      }, ...prev].slice(0, 50));
    }
  };

  const updateAdvisor = async (currentHistory: TerminalLine[]) => {
    setIsAdvisorTyping(true);
    const historyStrings = currentHistory
      .slice(-20)
      .map(l => `[${l.type.toUpperCase()}] ${l.content}`);
    
    const suggestion = await getAdvisorSuggestion(historyStrings);
    setAdvisorMessage(suggestion);
    setIsAdvisorTyping(false);
  };

  const updateExploitSuggestions = async (nodes: NetworkNode[]) => {
    if (nodes.length === 0) return;
    setIsAnalyzingExploits(true);
    const suggestions = await getExploitSuggestions(nodes);
    setExploitSuggestions(suggestions);
    setIsAnalyzingExploits(false);
    
    if (suggestions.length > 0) {
      setThreatLevel(Math.min(5, Math.max(3, suggestions.some(s => s.severity === 'critical') ? 5 : 4)));
    }
  };

  const simulateExploitProgress = async (cmd: string) => {
    const stages = [
      `[i] Probing target stack for ${cmd} compatibility...`,
      `[*] Staging payload: reverse_tcp_lhost_staged...`,
      `[*] Encoding x86/shikata_ga_nai - pass 1...`,
      `[+] Encoder succeeded. Payload size: ${Math.floor(Math.random() * 300 + 400)} bytes.`,
      `[*] Negotiating SSL/TLS handshake with target...`,
      `[!] Critical vulnerability identified... striking...`
    ];

    for (const stage of stages) {
      addLine(stage, 'system');
      await new Promise(r => setTimeout(r, 500 + Math.random() * 400));
    }

    // Milestone-based progress bar
    const milestones = [20, 45, 78, 100];
    for (const p of milestones) {
      const barLength = 30;
      const filled = Math.floor((p / 100) * barLength);
      const bar = '█'.repeat(filled) + '░'.repeat(barLength - filled);
      addLine(`EXPLOIT PROGRESS: [${bar}] ${p}%`, 'success');
      await new Promise(r => setTimeout(r, 400));
    }
    addLine('[+] Exploit sent. Awaiting session stage 2...', 'success');
    await new Promise(r => setTimeout(r, 800));
  };

  const executeExploit = async (exploitCmd: string) => {
    if (!exploitCmd || isProcessing) return;
    
    // Switch to terminal view to see results
    setViewMode('terminal');
    
    // Create the command entry
    const entry: TerminalLine = {
      id: Date.now().toString(),
      type: 'input',
      content: `snakebite > ${exploitCmd}`,
      command: exploitCmd.split(' ')[0]
    };

    setHistory(prev => {
      const updated = [...prev, entry];
      updateAdvisor(updated);
      return updated;
    });
    
    setIsProcessing(true);
    
    // Add a system line indicating the auto-strike
    addLine(`[*] Initializing remote exploitation vector: ${exploitCmd}`, 'system');
    
    // Progress Sequencer
    await simulateExploitProgress(exploitCmd);
    
    const output = await simulateToolOutput("exploit_execution", exploitCmd, `Context: Vulnerability Strike against ${targetIp}`);
    addLine(output);
    
    setIsProcessing(false);
  };

  const highlightContent = (text: string) => {
    if (!text) return text;
    
    const patterns = [
      {
        regex: /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g,
        className: "text-sky-400 font-bold underline decoration-sky-400/30"
      },
      {
        regex: /\b\d{1,5}\/(tcp|udp)\b/gi,
        className: "text-amber-400 font-bold"
      },
      {
        regex: /\bCVE-\d{4}-\d{4,}\b/gi,
        className: "text-rose-500 font-black tracking-tighter"
      },
      {
        regex: /\b(open|success|active|up|authorized|started|established|ok)\b/gi,
        className: "text-emerald-400 font-bold uppercase"
      },
      {
        regex: /\b(closed|failed|down|unauthorized|denied|error|critical|vulnerability)\b/gi,
        className: "text-rose-500 font-bold underline"
      },
      {
        regex: /\[\+\]|\[\*\]|\[i\]/g,
        className: "text-blue-400 font-black"
      }
    ];

    let parts: (string | React.ReactNode)[] = [text];

    patterns.forEach(({ regex, className }) => {
      const newParts: (string | React.ReactNode)[] = [];
      parts.forEach(part => {
        if (typeof part !== 'string' && !React.isValidElement(part)) {
          newParts.push(part);
          return;
        }
        
        if (typeof part !== 'string') {
          newParts.push(part);
          return;
        }

        const matches = [...part.matchAll(regex)];
        if (matches.length === 0) {
          newParts.push(part);
          return;
        }

        let lastIndex = 0;
        matches.forEach(match => {
          if (match.index! > lastIndex) {
            newParts.push(part.substring(lastIndex, match.index));
          }
          newParts.push(
            <span key={`${match[0]}-${match.index}`} className={className}>
              {match[0]}
            </span>
          );
          lastIndex = match.index! + match[0].length;
        });

        if (lastIndex < part.length) {
          newParts.push(part.substring(lastIndex));
        }
      });
      parts = newParts;
    });

    return parts;
  };

  const handleCommand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isProcessing) return;

    const cmd = input.trim();
    const [command, ...args] = cmd.split(' ');
    
    const prefix = mode === 'bash' ? 'snakebite >' : 'msf6 >';
    
    const newEntry: TerminalLine = {
      id: Date.now().toString(),
      type: 'input',
      content: `${prefix} ${cmd}`,
      command
    };

    setAuditLog(prev => [{
      timestamp: new Date().toLocaleTimeString(),
      action: `CMD: ${cmd}`,
      type: 'info'
    }, ...prev]);

    setHistory(prev => {
      const updated = [...prev, newEntry];
      // Trigger advisor update in background
      updateAdvisor(updated);
      return updated;
    });
    setInput('');
    setIsProcessing(true);

    if (mode === 'msfconsole') {
      await processMsfCommand(command.toLowerCase(), args);
    } else {
      await processCommand(command.toLowerCase(), args);
    }
    setIsProcessing(false);
  };

  const processMsfCommand = async (cmd: string, args: string[]) => {
    switch (cmd) {
      case 'exit':
      case 'quit':
        setMode('bash');
        addLine('Exiting Metasploit Framework...', 'system');
        break;
      case 'help':
        addLine('MSF Global Commands:', 'system');
        addLine('  use [module]       - Load a module');
        addLine('  set [var] [val]    - Set environment variables');
        addLine('  exploit / run      - Launch exploit');
        addLine('  back               - Move back from a module');
        addLine('  exit               - Exit MSF console');
        break;
      default:
        addLine(`Executing MSF action: ${cmd} ${args.join(' ')}...`, 'system');
        const output = await simulateToolOutput(`metasploit ${cmd}`, args.join(' ') || 'context');
        addLine(output);
    }
  };

  const processCommand = async (cmd: string, args: string[]) => {
    const customTool = customTools.find(t => t.name.toLowerCase() === cmd);

    switch (cmd) {
      case 'msfconsole':
        setMode('msfconsole');
        setActiveModule('EXPLOIT');
        addLine('Starting the Metasploit Framework console...', 'system');
        addLine('Metasploit v6.3.0-dev', 'output');
        addLine('msf6 >', 'output');
        break;
      case 'help':
        addLine('Snake Bite - Advanced Offensive Security Kit', 'system');
        addLine('SYSTEM:');
        addLine('  whoami             - Current user identity');
        addLine('  clear              - Clear screen');
        addLine('  help               - This menu');
        addLine('  target [ip]        - Set global target focus');
        addLine('RECON:');
        addLine('  nmap [target]      - Network scanning');
        addLine('  gobuster [url]     - Directory discovery');
        addLine('  nslookup [host]    - DNS records enquiry');
        addLine('  bettercap          - Interactive network assessment');
        addLine('EXPLOITATION:');
        addLine('  msfconsole         - Metasploit Framework');
        addLine('  sqlmap [url]       - SQL injection engine');
        addLine('  commix [url]       - Automated OS command injection and exploitation');
        addLine('VULNERABILITY:');
        addLine('  nikto [url]        - Web server scanner');
        addLine('  searchsploit [term]- Exploit Database search');
        addLine('  nuclei [url]       - Template-based vulnerability scanner');
        addLine('POST-EXPLOITATION:');
        addLine('  john [file]        - Password cracker');
        addLine('  hydra [ip] [svc]   - Brute force service');
        addLine('  mimikatz [args]    - Windows credential dump');
        addLine('  responder [iface]  - LLMNR/NBT-NS poisoner');
        addLine('  linpeas            - Linux privesc checker');
        addLine('  winpeas            - Windows privesc checker');
        addLine('  hashcat [hash]     - GPU hash cracking');
        addLine('  lsassy [target]    - Remote LSASS credential dump');
        addLine('CAPTURE:');
        addLine('  tcpdump [iface]    - CLI packet sniffer');
        addLine('  tshark [iface]     - Terminal Wireshark');
        addLine('  sniff_remote [ip]  - Deploy remote capture agent');
        if (customTools.length > 0) {
          addLine('CUSTOM REGISTRY:');
          customTools.forEach(t => addLine(`  ${t.name.padEnd(18)} - ${t.description}`));
        }
        break;
      
      case 'clear':
        setHistory([]);
        break;

      case 'target':
        if (args[0]) {
          setTargetIp(args[0]);
          addLine(`[+] Global target context set to: ${args[0]}`, 'success');
        } else {
          addLine('Error: IP address required. Usage: target [ip]', 'error');
        }
        break;

      case 'whoami':
        addLine('root@snakebite-terminal', 'success');
        break;

      case 'nmap':
      case 'gobuster':
      case 'sqlmap':
      case 'john':
      case 'hydra':
      case 'nikto':
      case 'searchsploit':
      case 'nslookup':
      case 'bettercap':
      case 'commix':
      case 'nuclei':
      case 'mimikatz':
      case 'responder':
      case 'linpeas':
      case 'winpeas':
      case 'hashcat':
      case 'lsassy':
      case 'tcpdump':
      case 'tshark':
      case 'sniff_remote':
        if (args.length === 0 && !['bettercap', 'mimikatz', 'linpeas', 'winpeas', 'responder', 'tcpdump', 'tshark'].includes(cmd)) {
          addLine(`Error: Target required for ${cmd}. Usage: ${cmd} [target]`, 'error');
        } else {
          // Auto-switch tabs based on tool type
          if (['nmap', 'gobuster', 'nslookup', 'bettercap', 'tcpdump', 'tshark'].includes(cmd)) setActiveModule('RECON');
          if (['sqlmap', 'commix', 'msfconsole'].includes(cmd)) setActiveModule('EXPLOIT');
          if (['john', 'hydra', 'mimikatz', 'responder', 'linpeas', 'winpeas', 'hashcat', 'lsassy'].includes(cmd)) setActiveModule('POST-EXPLOIT');
          if (['sniff_remote'].includes(cmd)) {
            setActiveModule('CAPTURE');
            setViewMode('capture');
          }
          
          if (args[0] && args[0].split('.').length > 1) setTargetIp(args[0]);

          addLine(`[*] Initializing ${cmd} module...`, 'system');
          
          setActiveTools(prev => {
            const name = cmd.toUpperCase();
            const statusIndicator: 'active' | 'idle' = 'active';
            if (prev.find(t => t.name === name)) {
              return prev.map(t => t.name === name ? { ...t, status: statusIndicator } : t);
            }
            return [{ name, status: statusIndicator }, ...prev].slice(0, 6);
          });

          // Trigger simulated progress for exploit-class tools
          if (['sqlmap', 'commix', 'msfconsole'].includes(cmd)) {
            await simulateExploitProgress(cmd);
          }

          if (['tcpdump', 'tshark', 'sniff_remote'].includes(cmd)) {
            if (cmd === 'sniff_remote') {
              addLine(`[*] Deploying capture binary to ${targetIp}...`, 'system');
              addLine(`[+] Agent uplink established via 127.0.0.1:8888`, 'success');
              addLine(`[i] Listening for raw frames on ${targetIp}:eth0...`, 'system');
            } else {
              addLine(`[i] Listening on interface eth0...`, 'system');
              addLine(`[i] Buffer size: 2MB, Snaplen: 65535 bytes`, 'system');
            }
          }
          const target = args.join(' ') || 'local_session_context';
          const output = await simulateToolOutput(cmd, target);
          addLine(output);
 
          // If capture tool, simulate saving a file
          if (['tcpdump', 'tshark', 'sniff_remote'].includes(cmd)) {
            const fileName = `${cmd}_${Math.floor(Math.random()*10000)}.pcap`;
            addLine(`[+] Stopped capture after ${(Math.random() * 20 + 20).toFixed(0)} packets.`, 'success');
            if (cmd === 'sniff_remote') {
              addLine(`[+] Remote agent compressed stream.`, 'success');
              addLine(`[+] Successfully exfiltrated to: /home/root/pcaps/${fileName}`, 'success');
            } else {
              addLine(`[+] Session stream saved to: /tmp/${fileName}`, 'success');
            }
            setCapturedPcaps(prev => [{
              name: fileName,
              size: `${(Math.random() * 5 + 1).toFixed(2)} MB`,
              timestamp: new Date().toLocaleTimeString()
            }, ...prev]);
          }

          // Extract entities for the network map if it's a recon tool
          if (['nmap', 'bettercap', 'nslookup'].includes(cmd)) {
            const newNodes = await extractNetworkEntities(output);
            if (newNodes.length > 0) {
              setDiscoveredNodes(prev => {
                const combined = [...prev];
                newNodes.forEach(newNode => {
                  const existingIdx = combined.findIndex(n => n.ip === newNode.ip);
                  if (existingIdx >= 0) {
                    combined[existingIdx] = { 
                      ...combined[existingIdx], 
                      ...newNode,
                      services: Array.from(new Set([...combined[existingIdx].services, ...newNode.services]))
                    };
                  } else {
                    combined.push(newNode);
                  }
                });
                
                // Trigger exploit analysis
                updateExploitSuggestions(combined);
                
                return combined;
              });
            }
          }
        }
        break;

      default:
        if (customTool) {
          const target = args.join(' ') || targetIp || 'unspecified_target';
          const commandToRun = customTool.template.replace('{target}', target);
          
          addLine(`[*] Launching custom payload: ${customTool.name}`, 'system');
          addLine(`[>] Executing: ${commandToRun}`, 'output');
          
          const output = await simulateToolOutput(customTool.name, target, `Custom Command Template: ${customTool.template}`);
          addLine(output);
          
          setActiveTools(prev => {
            const name = customTool.name.toUpperCase();
            const statusIndicator: 'active' | 'idle' = 'active';
            if (prev.find(t => t.name === name)) {
              return prev.map(t => t.name === name ? { ...t, status: statusIndicator } : t);
            }
            return [{ name, status: statusIndicator }, ...prev].slice(0, 6);
          });
        } else {
          addLine(`Command not found: ${cmd}. Type "help" for a list of commands.`, 'error');
        }
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#0A0C10] text-slate-300 font-mono overflow-hidden select-none border border-slate-800 relative shadow-2xl">
      <AnimatePresence>
        {!isAuthorized && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[100] bg-black/95 backdrop-blur-md flex items-center justify-center p-6"
          >
            <div className="max-w-2xl w-full bg-[#0D1016] border border-rose-900/50 p-8 rounded shadow-[0_0_50px_rgba(225,29,72,0.1)]">
              <div className="flex items-center gap-4 mb-8">
                <ShieldAlert className="w-12 h-12 text-rose-600 animate-pulse" />
                <div>
                  <h1 className="text-2xl font-black tracking-tighter text-white uppercase">Controlled Lab Access</h1>
                  <p className="text-rose-500 text-[10px] font-bold tracking-[0.3em] uppercase">Security Authorization Required</p>
                </div>
              </div>
              
              <div className="space-y-4 text-slate-400 text-xs leading-relaxed mb-8">
                <p>This terminal is configured for <span className="text-white font-bold">PROFESSIONAL RED-TEAM OPERATIONS</span> within controlled laboratory settings.</p>
                <div className="bg-black/50 p-4 border border-slate-800 rounded">
                  <p className="mb-2 text-slate-500 uppercase font-bold text-[9px]">Terms of Authorization:</p>
                  <ul className="list-disc list-inside space-y-2">
                    <li>Strict adherence to <span className="text-rose-400">Rules of Engagement (RoE)</span> is mandatory.</li>
                    <li>System usage is monitored and logged for institutional oversight.</li>
                    <li>Operators must possess explicit written authorization for target nodes.</li>
                    <li>Unauthorized use outside of the designated lab environment is strictly prohibited.</li>
                  </ul>
                </div>
                <p className="italic opacity-60">By proceeding, you verify your identity as an authorized professional and accept responsibility for all executed payloads.</p>
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={() => setIsAuthorized(true)}
                  className="flex-1 py-3 bg-rose-600 text-white font-bold text-sm tracking-widest hover:bg-rose-700 active:scale-95 transition-all shadow-[0_0_20px_rgba(225,29,72,0.3)]"
                >
                  AUTHORIZE & INITIALIZE
                </button>
                <button 
                  onClick={() => window.location.reload()}
                  className="px-6 py-3 border border-slate-800 text-slate-500 font-bold text-sm hover:text-slate-300 transition-colors"
                >
                  ABORT
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scanline Effect Overlay */}
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.02),rgba(0,255,0,0.01),rgba(0,0,255,0.02))] bg-[length:100%_2px,3px_100%] z-50 overflow-hidden"></div>

      {/* Header Bar */}
      <header className="h-12 border-b border-rose-900/40 bg-[#12151C] flex items-center justify-between px-4 shrink-0 z-10">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-rose-600 shadow-[0_0_8px_rgba(225,29,72,0.6)] animate-pulse"></div>
            <span className="text-rose-500 font-bold tracking-tighter text-xl">SNAKE BITE</span>
          </div>
          <span className="text-[10px] text-slate-500 border border-slate-800 px-2 py-0.5 rounded uppercase tracking-widest bg-black/50">v4.2.0-STABLE</span>
        </div>
        <div className="flex items-center gap-6 text-[10px] tracking-widest uppercase">
          <div className="flex flex-col items-end">
            <span className="text-slate-600 font-bold">SESSION ID</span>
            <span className="text-rose-400">SB-X99-PROX</span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-slate-600 font-bold">UPTIME</span>
            <span className="text-slate-300">04:12:44</span>
          </div>
          <div className="flex flex-col items-end hidden md:flex">
            <span className="text-slate-600 font-bold">DEPLOYMENT</span>
            <span className="text-rose-400 italic flex items-center gap-1 font-bold">
              <Zap className="w-3 h-3 text-rose-500" /> LAB_CONTROLLED
            </span>
          </div>
          <div className="flex flex-col items-end hidden lg:flex">
            <span className="text-slate-600 font-bold">VPN STATUS</span>
            <span className="text-emerald-500 italic flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> ENCRYPTED
            </span>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Navigation */}
        <nav className="w-48 bg-[#0D1016] border-r border-slate-800 flex flex-col p-4 shrink-0 z-10">
          <div className="mb-8">
            <p className="text-[10px] text-slate-600 mb-3 uppercase font-bold tracking-widest flex items-center gap-2">
              <Activity className="w-3 h-3" /> Modules
            </p>
            <ul className="space-y-1">
              {[
                { id: 'RECON', icon: Eye, label: 'RECONNAISSANCE' },
                { id: 'EXPLOIT', icon: Zap, label: 'EXPLOITATION' },
                { id: 'POST-EXPLOIT', icon: Skull, label: 'POST-EXPLOIT' },
                { id: 'CAPTURE', icon: Wifi, label: 'PACKET CAPTURE' },
                { id: 'REGISTRY', icon: Database, label: 'REGISTRY' }
              ].map((m) => (
                <li 
                  key={m.id}
                  onClick={() => {
                    setActiveModule(m.id as any);
                    if (m.id === 'REGISTRY') setViewMode('registry');
                    else if (m.id === 'CAPTURE') setViewMode('capture');
                    else setViewMode('terminal');
                  }}
                  className={cn(
                    "px-3 py-2 text-[11px] cursor-pointer flex items-center gap-2 transition-all border-l-2",
                    activeModule === m.id 
                      ? "bg-rose-950/20 text-rose-400 border-rose-600 shadow-[inset_4px_0_10_rgba(225,29,72,0.05)]" 
                      : "text-slate-500 border-transparent hover:bg-slate-800/50 hover:text-slate-300"
                  )}
                >
                  <m.icon className="w-3.5 h-3.5 flex-shrink-0" />
                  {m.label}
                </li>
              ))}
              <li className="px-3 py-2 text-[11px] text-slate-700 italic flex items-center gap-2 mt-4 opacity-50 cursor-not-allowed">
                <Database className="w-3.5 h-3.5" /> REPORTING
              </li>
            </ul>
          </div>

          <div className="mb-8">
            <p className="text-[10px] text-slate-600 mb-3 uppercase font-bold tracking-widest flex items-center gap-2">
              <Activity className="w-3 h-3" /> Audit Log
            </p>
            <div className="space-y-1.5 h-48 overflow-y-auto custom-scrollbar pr-1">
              {auditLog.map((log, i) => (
                <div key={i} className="text-[9px] border-l border-slate-800 pl-2 py-0.5">
                  <div className="flex justify-between items-center mb-0.5">
                    <span className="text-slate-600 font-bold">{log.timestamp}</span>
                    <span className={cn(
                      "font-black uppercase tracking-tighter text-[7px] px-1 rounded-sm",
                      log.type === 'alert' ? "bg-rose-600 text-white" : 
                      log.type === 'warn' ? "bg-amber-600 text-black" : "bg-slate-800 text-slate-400"
                    )}>{log.type}</span>
                  </div>
                  <p className="text-slate-500 truncate leading-tight">{log.action}</p>
                </div>
              ))}
              {auditLog.length === 0 && (
                <p className="text-[9px] text-slate-800 italic">No events recorded.</p>
              )}
            </div>
          </div>
          
          <div>
            <p className="text-[10px] text-slate-600 mb-3 uppercase font-bold tracking-widest flex items-center gap-2">
              <Radar className="w-3 h-3" /> Active Tools
            </p>
            <ul className="space-y-1">
              {activeTools.map((tool) => (
                <li key={tool.name} className="px-3 py-2 text-[10px] flex justify-between items-center group cursor-pointer hover:bg-slate-800/30 rounded">
                  <span className="text-slate-400 group-hover:text-slate-200">{tool.name}</span>
                  <span className={cn(
                    "w-1.5 h-1.5 rounded-full",
                    tool.status === 'active' ? "bg-emerald-500 shadow-[0_0_5px_#10b981] animate-pulse" : "bg-slate-700"
                  )}></span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-auto space-y-2">
            <button 
              onClick={() => {
                const data = JSON.stringify({
                  timestamp: new Date().toISOString(),
                  operator: 'ROOT',
                  logs: auditLog,
                  discovery: discoveredNodes,
                  vulnerabilities: exploitSuggestions
                }, null, 2);
                const blob = new Blob([data], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `SNAKEBITE_AAR_${Date.now()}.json`;
                a.click();
              }}
              className="w-full p-2.5 bg-slate-800 text-slate-300 text-[10px] text-center font-bold tracking-tighter cursor-pointer hover:bg-slate-700 transition-all border border-slate-700 uppercase flex items-center justify-center gap-2"
            >
              <Database className="w-3 h-3" /> EXPORT AAR
            </button>
            <button 
              onClick={() => setHistory([])}
              className="w-full p-2.5 bg-rose-600/90 text-white text-[10px] text-center font-bold tracking-tighter cursor-pointer hover:bg-rose-700 transition-all shadow-[0_2px_10px_rgba(225,29,72,0.2)] active:scale-95 uppercase"
            >
              TERMINATE SESSION
            </button>
          </div>
        </nav>

        {/* Main Terminal Area */}
        <main className="flex-1 flex flex-col bg-black overflow-hidden relative" onClick={() => inputRef.current?.focus()}>
          <div className="h-8 bg-[#1a1a1a]/80 backdrop-blur-sm flex items-center px-4 border-b border-slate-800 shrink-0 gap-2">
            <span className="text-[10px] text-rose-500 font-bold uppercase tracking-widest flex items-center gap-1.5">
              <Server className="w-3 h-3" /> root@snakebite:
            </span>
            <span className="text-[10px] text-slate-500 truncate select-all">
              ~/snakebite/{activeModule.toLowerCase()}/{mode === 'msfconsole' ? 'metasploit' : 'shell'}
            </span>
            <div className="ml-auto flex gap-3 items-center">
               <div className="flex bg-slate-900 border border-slate-800 rounded p-0.5">
                  <button 
                    onClick={() => setViewMode('terminal')}
                    className={cn(
                      "px-2 py-0.5 text-[9px] font-bold transition-all rounded-sm",
                      viewMode === 'terminal' ? "bg-rose-600 text-white" : "text-slate-500 hover:text-slate-300"
                    )}
                  >
                    TERMINAL
                  </button>
                  <button 
                    onClick={() => setViewMode('network')}
                    className={cn(
                      "px-2 py-0.5 text-[9px] font-bold transition-all rounded-sm flex items-center gap-1",
                      viewMode === 'network' ? "bg-rose-600 text-white" : "text-slate-500 hover:text-slate-300"
                    )}
                  >
                    NETWORK {discoveredNodes.length > 0 && <span className="bg-white/20 px-1 rounded-full text-[8px]">{discoveredNodes.length}</span>}
                  </button>
               </div>
               <div className="h-4 w-px bg-slate-800"></div>
               <div className="flex gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-800 border border-slate-700"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-800 border border-slate-700"></div>
               </div>
            </div>
          </div>

          {/* Terminal History or Network Map */}
          <div className="flex-1 relative overflow-hidden flex flex-col">
            <div className={cn(
              "flex-1 flex flex-col transition-opacity duration-300",
              viewMode === 'terminal' ? "opacity-100 z-10" : "opacity-0 z-0 absolute inset-0 pointer-events-none"
            )}>
              <div 
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-6 space-y-1.5 scrollbar-hide custom-scrollbar text-[13px] leading-relaxed selection:bg-rose-500 selection:text-white"
              >
                <AnimatePresence initial={false}>
                  {history.map((line) => (
                    <motion.div
                      key={line.id}
                      initial={{ opacity: 0, x: -5 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.15 }}
                      className={cn(
                        "whitespace-pre-wrap break-all",
                        line.type === 'input' && "text-slate-300 font-bold pt-4 first:pt-0",
                        line.type === 'error' && "text-rose-500 font-bold bg-rose-500/5 px-2 py-1 rounded inline-block w-full border-l border-rose-500",
                        line.type === 'system' && "text-emerald-500 opacity-90",
                        line.type === 'success' && "text-sky-400 font-bold",
                        line.type === 'output' && "text-slate-400 opacity-80 pl-2 border-l border-slate-800"
                      )}
                    >
                      {highlightContent(line.content)}
                    </motion.div>
                  ))}
                </AnimatePresence>
                
                {isProcessing && (
                  <div className="flex items-center gap-3 pt-4 text-rose-500">
                    <span className="animate-pulse tracking-[0.2em] font-bold text-[11px] uppercase">
                      [!] DATA EXFILTRATION IN PROGRESS
                    </span>
                    <motion.div 
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 2.5, ease: "linear" }}
                      className="w-3.5 h-3.5 border border-rose-500 border-t-transparent rounded-full"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className={cn(
              "flex-1 p-4 transition-opacity duration-300",
              viewMode === 'network' ? "opacity-100 z-10" : "opacity-0 z-0 absolute inset-0 pointer-events-none"
            )}>
              <NetworkMap nodes={discoveredNodes} activeNodeIp={targetIp} />
            </div>

            <div className={cn(
              "flex-1 p-6 transition-opacity duration-300 overflow-y-auto custom-scrollbar",
              viewMode === 'capture' ? "opacity-100 z-10" : "opacity-0 z-0 absolute inset-0 pointer-events-none"
            )}>
              <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                  <div>
                    <h2 className="text-xl font-bold text-white tracking-widest uppercase flex items-center gap-3">
                      <Wifi className="w-6 h-6 text-sky-500" /> Remote Traffic Intercept
                    </h2>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">Real-time packet inspection and remote session capture</p>
                  </div>
                  <div className="flex gap-3">
                    <div className="px-3 py-1.5 bg-black/50 border border-slate-800 rounded flex items-center gap-4">
                      <div className="flex flex-col">
                        <span className="text-[8px] text-slate-600 font-bold uppercase">Active Agents</span>
                        <span className="text-sky-500 text-xs font-mono font-bold">{capturedPcaps.length > 0 ? '1' : '0'}</span>
                      </div>
                      <div className="w-px h-6 bg-slate-800"></div>
                      <div className="flex flex-col">
                        <span className="text-[8px] text-slate-600 font-bold uppercase">Total Captured</span>
                        <span className="text-emerald-500 text-xs font-mono font-bold">{capturedPcaps.length}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Capture Controller */}
                  <div className="lg:col-span-1 space-y-6">
                    <div className="bg-[#0D1016] border border-slate-800 p-5 rounded">
                      <h3 className="text-xs font-bold text-slate-200 mb-4 uppercase tracking-widest flex items-center gap-2">
                        <Zap className="w-3 h-3 text-sky-500" /> Control Unit
                      </h3>
                      <div className="space-y-4">
                        <div className="space-y-1.5">
                          <label className="text-[9px] text-slate-500 uppercase font-bold">Target Interface</label>
                          <select className="w-full bg-black border border-slate-800 p-2 text-[11px] text-slate-300 outline-none focus:border-sky-600">
                            <option>eth0 (Direct)</option>
                            <option>wlan0 (Monitor)</option>
                            <option>docker0 (Bridge)</option>
                            <option>tun0 (VPN)</option>
                          </select>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[9px] text-slate-500 uppercase font-bold">BPF Filter</label>
                          <input 
                            type="text" 
                            placeholder="e.g. port 80 and host 1.2.3.4"
                            className="w-full bg-black border border-slate-800 p-2 text-[11px] text-slate-300 outline-none focus:border-sky-600 font-mono"
                          />
                        </div>
                        <button 
                          onClick={() => {
                            setViewMode('terminal');
                            setInput(`tcpdump -i eth0 -w capture_${Date.now()}.pcap`);
                          }}
                          className="w-full py-2 bg-sky-600 text-white text-[10px] font-bold tracking-widest hover:bg-sky-700 transition-all rounded"
                        >
                          INITIALIZE LOCAL SNIFF
                        </button>
                      </div>
                    </div>

                    <div className="bg-[#0D1016] border border-slate-800 p-5 rounded">
                      <h3 className="text-xs font-bold text-slate-200 mb-4 uppercase tracking-widest flex items-center gap-2">
                        <Server className="w-3 h-3 text-rose-500" /> Agent Deployment
                      </h3>
                      <p className="text-[10px] text-slate-500 mb-4 leading-relaxed">Execute remote interception by deploying a headless sniff agent to a compromised node.</p>
                      <button 
                        onClick={() => {
                          setViewMode('terminal');
                          setInput(`sniff_remote ${targetIp}`);
                        }}
                        className="w-full py-2 border border-rose-600 text-rose-500 text-[10px] font-bold tracking-widest hover:bg-rose-600 hover:text-white transition-all rounded uppercase"
                      >
                        Deploy to {targetIp}
                      </button>
                    </div>
                  </div>

                  {/* Capture History */}
                  <div className="lg:col-span-2">
                    <div className="bg-[#0D1016] border border-slate-800 rounded overflow-hidden">
                      <div className="bg-slate-900/50 p-3 border-b border-slate-800 flex justify-between items-center">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Capture Archive</span>
                        <span className="text-[9px] text-slate-600">{capturedPcaps.length} Files Recorded</span>
                      </div>
                      <div className="divide-y divide-slate-800/50 max-h-[400px] overflow-y-auto custom-scrollbar">
                        {capturedPcaps.map((pcap, idx) => (
                          <div key={idx} className="p-4 hover:bg-slate-800/20 transition-all group flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded bg-sky-500/10 flex items-center justify-center border border-sky-500/20">
                                <Database className="w-5 h-5 text-sky-500" />
                              </div>
                              <div>
                                <h4 className="text-xs font-bold text-slate-200">{pcap.name}</h4>
                                <div className="flex gap-3 mt-1 text-[9px]">
                                  <span className="text-slate-500 uppercase">Size: <span className="text-sky-500">{pcap.size}</span></span>
                                  <span className="text-slate-500 uppercase">Date: <span className="text-slate-400">{pcap.timestamp}</span></span>
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button className="px-3 py-1.5 bg-slate-800 text-[10px] font-bold text-slate-300 hover:bg-slate-700 transition-all rounded opacity-0 group-hover:opacity-100 uppercase">
                                Inspect
                              </button>
                              <button className="px-3 py-1.5 bg-sky-600 text-[10px] font-bold text-white hover:bg-sky-700 transition-all rounded opacity-0 group-hover:opacity-100 uppercase flex items-center gap-1">
                                <Download className="w-3 h-3" /> DL
                              </button>
                            </div>
                          </div>
                        ))}
                        {capturedPcaps.length === 0 && (
                          <div className="p-12 text-center">
                            <Wifi className="w-10 h-10 text-slate-800 mx-auto mb-3" />
                            <p className="text-xs text-slate-600 font-bold uppercase tracking-widest">No traffic data captured</p>
                            <p className="text-[10px] text-slate-700 mt-1 italic">Initiate a sniff session to begin archival</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className={cn(
              "flex-1 p-6 transition-opacity duration-300 overflow-y-auto custom-scrollbar",
              viewMode === 'registry' ? "opacity-100 z-10" : "opacity-0 z-0 absolute inset-0 pointer-events-none"
            )}>
              <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                  <div>
                    <h2 className="text-xl font-bold text-white tracking-widest uppercase">Custom Tool Registry</h2>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">Manage external scripts and automated payloads</p>
                  </div>
                  <button 
                    onClick={() => setIsAddingTool(true)}
                    className="px-4 py-2 bg-rose-600 text-white text-[10px] font-bold tracking-widest hover:bg-rose-700 transition-all rounded shadow-[0_0_15px_rgba(225,29,72,0.2)]"
                  >
                    ADD CUSTOM TOOL
                  </button>
                </div>

                {isAddingTool && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-[#0D1016] border border-rose-900/40 p-6 rounded mb-8"
                  >
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xs font-bold text-rose-500 uppercase tracking-widest">Tool Specification Builder</h3>
                      <div className="flex gap-2">
                        <span className="text-[8px] text-slate-600 uppercase font-bold">Quick Presets:</span>
                        {['Python', 'Nmap', 'Go'].map(p => (
                          <button 
                            key={p}
                            onClick={() => {
                              if (p === 'Python') setNewTool(prev => ({ ...prev, template: 'python3 script.py --target {target}' }));
                              if (p === 'Nmap') setNewTool(prev => ({ ...prev, template: 'nmap -sV -p- {target}' }));
                              if (p === 'Go') setNewTool(prev => ({ ...prev, template: './bin/scanner --host {target} --v' }));
                            }}
                            className="text-[8px] bg-slate-900 border border-slate-800 px-2 py-0.5 text-slate-400 hover:text-white transition-colors"
                          >
                            {p}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="space-y-2">
                        <label className="text-[9px] text-slate-500 uppercase font-bold">Tool Alias (Command)</label>
                        <input 
                          type="text"
                          value={newTool.name}
                          onChange={e => setNewTool(prev => ({ ...prev, name: e.target.value.toLowerCase().replace(/\s+/g, '_') }))}
                          className="w-full bg-black border border-slate-800 p-2 text-xs text-white focus:border-rose-600 outline-none transition-colors"
                          placeholder="e.g. cloud_scan"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[9px] text-slate-500 uppercase font-bold">Description</label>
                        <input 
                          type="text"
                          value={newTool.description}
                          onChange={e => setNewTool(prev => ({ ...prev, description: e.target.value }))}
                          className="w-full bg-black border border-slate-800 p-2 text-xs text-white focus:border-rose-600 outline-none transition-colors"
                          placeholder="What does this tool do?"
                        />
                      </div>
                    </div>
                    <div className="space-y-2 mb-6">
                      <div className="flex justify-between items-center">
                        <label className="text-[9px] text-slate-500 uppercase font-bold">Command Template</label>
                        <span className="text-[8px] text-slate-600 italic">Use {"{target}"} for the IP/Host placeholder</span>
                      </div>
                      <input 
                        type="text"
                        value={newTool.template}
                        onChange={e => setNewTool(prev => ({ ...prev, template: e.target.value }))}
                        className="w-full bg-black border border-slate-800 p-2 text-xs text-white focus:border-rose-600 outline-none transition-colors font-mono"
                        placeholder="e.g. python3 scanner.py --host {target} --all"
                      />
                    </div>

                    {/* Visual Preview Section */}
                    <div className="bg-black/40 p-4 border border-slate-800 rounded mb-6">
                      <p className="text-[8px] text-slate-600 uppercase font-black mb-2">Payload Generation Preview</p>
                      <div className="bg-black border border-slate-900 p-3 rounded font-mono text-[10px] text-emerald-500 flex items-center justify-between">
                        <span className="truncate">
                          {newTool.template.replace('{target}', targetIp) || 'Waiting for template...'}
                        </span>
                        <span className="text-[8px] text-slate-700 bg-slate-900 px-1 border border-slate-800">PREVIEW_ONLY</span>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button 
                        onClick={() => {
                          if (newTool.name && newTool.template) {
                            setCustomTools(prev => [...prev, { ...newTool, id: Date.now().toString() }]);
                            setNewTool({ name: '', template: '', description: '' });
                            setIsAddingTool(false);
                            addLine(`[+] Registered new custom tool: ${newTool.name}`, 'success');
                          }
                        }}
                        className="flex-1 py-2 bg-emerald-600 text-white text-[10px] font-bold tracking-widest hover:bg-emerald-700"
                      >
                        CONFIRM REGISTRATION
                      </button>
                      <button 
                        onClick={() => setIsAddingTool(false)}
                        className="px-6 py-2 border border-slate-800 text-slate-500 text-[10px] font-bold hover:text-white"
                      >
                        CANCEL
                      </button>
                    </div>
                  </motion.div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {customTools.map(tool => (
                    <div key={tool.id} className="bg-[#0D1016] border border-slate-800 p-4 group hover:border-rose-900/40 transition-all rounded relative">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <Database className="w-3 h-3 text-rose-500" />
                          <h4 className="text-xs font-bold text-slate-200 uppercase tracking-widest">{tool.name}</h4>
                        </div>
                        <button 
                          onClick={() => setCustomTools(prev => prev.filter(t => t.id !== tool.id))}
                          className="opacity-0 group-hover:opacity-100 text-rose-500 hover:text-rose-400 text-[9px] font-bold uppercase transition-opacity"
                        >
                          Delete
                        </button>
                      </div>
                      <p className="text-[10px] text-slate-500 mb-4 line-clamp-1">{tool.description}</p>
                      <div className="bg-black/40 p-2 rounded border border-slate-900/50">
                        <code className="text-[9px] text-emerald-500/80 font-mono break-all line-clamp-1">{tool.template}</code>
                      </div>
                      <div className="mt-3 flex justify-between items-center pt-3 border-t border-slate-900">
                        <span className="text-[8px] text-slate-600 uppercase font-black">Status: Synced</span>
                        <button 
                          onClick={() => {
                            setViewMode('terminal');
                            setInput(tool.name);
                          }}
                          className="text-[9px] text-rose-400 font-bold hover:text-rose-300 transition-colors uppercase tracking-widest"
                        >
                          Load in CLI
                        </button>
                      </div>
                    </div>
                  ))}
                  {customTools.length === 0 && !isAddingTool && (
                    <div className="col-span-full border-2 border-dashed border-slate-800/50 p-12 flex flex-col items-center justify-center rounded">
                      <Database className="w-12 h-12 text-slate-800 mb-4" />
                      <p className="text-slate-600 text-center text-xs uppercase font-bold tracking-widest">No custom tools registered in this session.</p>
                      <p className="text-slate-700 text-center text-[10px] mt-2 italic">Add your specialized payloads to expand Snake Bite's core capabilities.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Command Input Area */}
          <div className="h-14 bg-[#0a0a0a] border-t border-slate-900 flex items-center px-6 shrink-0 relative overflow-hidden group">
            <div className="absolute left-0 top-0 w-1 h-full bg-rose-600 transition-all group-focus-within:w-1.5 animate-pulse"></div>
            <form onSubmit={handleCommand} className="flex items-center gap-3 w-full">
              <span className="text-rose-500 font-black text-sm tracking-tighter flex-shrink-0">
                {mode === 'bash' ? 'snakebite >' : 'msf6 >'}
              </span>
              <input
                ref={inputRef}
                type="text"
                autoFocus
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={isProcessing}
                autoComplete="off"
                spellCheck="false"
                className="flex-1 bg-transparent border-none outline-none text-slate-100 font-mono text-[13px] placeholder:text-slate-800 caret-rose-500"
                placeholder={isProcessing ? "WAITING FOR NODE FEEDBACK..." : "AWAITING INSTRUCTION..."}
              />
              <div className="flex items-center gap-2">
                <div className="h-px w-8 bg-slate-800"></div>
                <span className="text-[9px] text-slate-600 font-bold tracking-widest">LINUX_AMD64</span>
              </div>
            </form>
          </div>
        </main>

        {/* Detail Panel */}
        <aside className="w-72 bg-[#12151C] border-l border-slate-800 flex flex-col shrink-0 z-10">
          <div className="p-5 border-b border-slate-800 bg-rose-950/5">
            <p className="text-[10px] text-rose-500 mb-4 uppercase font-bold tracking-widest flex items-center gap-2">
              <Skull className="w-3 h-3" /> Tactical Advisor
            </p>
            <div className="relative">
              <div className={cn(
                "text-[11px] leading-relaxed transition-all duration-500",
                isAdvisorTyping ? "opacity-40" : "opacity-100"
              )}>
                <span className="text-rose-400 font-bold mr-1">[!] ADVISORY:</span>
                {advisorMessage}
              </div>
              {isAdvisorTyping && (
                <div className="absolute inset-0 flex items-center justify-center">
                   <motion.div 
                    animate={{ scale: [1, 1.2, 1] }} 
                    transition={{ repeat: Infinity, duration: 1 }}
                    className="w-1 h-3 bg-rose-500"
                   />
                </div>
              )}
            </div>
            <div className="mt-3 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-[8px] text-slate-600 font-bold uppercase tracking-widest">AI Core Synced</span>
            </div>
          </div>

          <div className="p-5 border-b border-slate-800">
            <p className="text-[10px] text-slate-600 mb-4 uppercase font-bold tracking-widest flex items-center gap-2">
              <Radar className="w-3 h-3" /> Target Intel
            </p>
            <div className="space-y-4">
              <div className="group cursor-default">
                <p className="text-[9px] text-slate-600 font-bold tracking-tighter uppercase group-hover:text-rose-500 transition-colors">IP_ADDRESS</p>
                <p className="text-[13px] text-slate-200 mt-0.5 flex justify-between">
                  {targetIp} <span className="text-[9px] text-emerald-500 font-bold group-hover:opacity-100 opacity-60">STABLE</span>
                </p>
              </div>
              <div>
                <p className="text-[9px] text-slate-600 font-bold tracking-tighter uppercase">OPERATING_SYSTEM</p>
                <p className="text-[13px] text-slate-200 mt-0.5">{os}</p>
              </div>
              <div>
                <p className="text-[9px] text-slate-600 font-bold tracking-tighter uppercase">THREAT_LEVEL</p>
                <div className="flex gap-1.5 mt-2">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <div 
                      key={level} 
                      className={cn(
                        "h-1.5 w-7 transition-all duration-500",
                        level <= threatLevel ? "bg-rose-600 shadow-[0_0_5px_#e11d48]" : "bg-slate-800"
                      )}
                    ></div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          <div className="p-5 overflow-y-auto custom-scrollbar flex-1">
            <p className="text-[10px] text-slate-600 mb-4 uppercase font-bold tracking-widest flex items-center gap-2">
              <Wifi className="w-3 h-3 text-emerald-500" /> Active Listeners
            </p>
            <div className="space-y-2">
              <div className="text-[10px] bg-[#0A0C10] p-2.5 border border-slate-800 flex items-center justify-between group hover:border-rose-500/30 transition-all">
                <span className="text-slate-400 group-hover:text-slate-200">HTTP:4444</span>
                <span className="text-emerald-500 font-bold text-[9px] animate-pulse">ACTIVE</span>
              </div>
              <div className="text-[10px] bg-[#0A0C10] p-2.5 border border-slate-800 flex items-center justify-between group">
                <span className="text-slate-500">TCP:8080</span>
                <span className="text-slate-700 font-bold text-[9px]">IDLE</span>
              </div>
              <div className="text-[10px] bg-[#0A0C10] p-2.5 border border-slate-800 flex items-center justify-between opacity-50">
                <span className="text-slate-600">SSH:2222</span>
                <span className="text-slate-800 font-bold text-[9px]">OFFLINE</span>
              </div>
            </div>

            <div className="mt-8">
              <p className="text-[10px] text-slate-600 mb-4 uppercase font-bold tracking-widest flex items-center gap-2">
                <ShieldAlert className="w-3 h-3 text-rose-500" /> Vulnerability Intel
              </p>
              <div className="space-y-3">
                {isAnalyzingExploits && (
                  <div className="flex items-center gap-2 text-[9px] text-rose-400 animate-pulse">
                    <Activity className="w-3 h-3 animate-spin" /> ANALYZING EXPLOITS...
                  </div>
                )}
                {exploitSuggestions.length === 0 && !isAnalyzingExploits && (
                  <p className="text-[9px] text-slate-700 italic">No vulnerabilities identified yet.</p>
                )}
                {exploitSuggestions.map((exploit, idx) => (
                  <div key={idx} className="bg-rose-950/10 border border-rose-900/20 p-2 rounded relative overflow-hidden group">
                    <div className={cn(
                      "absolute top-0 left-0 w-0.5 h-full transition-all group-hover:w-1",
                      exploit.severity === 'critical' ? "bg-rose-600" : 
                      exploit.severity === 'high' ? "bg-orange-600" : "bg-yellow-600"
                    )}></div>
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-[9px] font-bold text-rose-500 flex items-center gap-1">
                        <Skull className="w-2.5 h-2.5" /> {exploit.service}
                      </span>
                      {exploit.cve && <span className="text-[8px] bg-rose-600 text-white px-1 rounded">{exploit.cve}</span>}
                    </div>
                    <p className="text-[10px] text-slate-200 font-bold leading-tight">{exploit.vulnerability}</p>
                    <p className="text-[9px] text-slate-500 mt-1 leading-snug">{exploit.description}</p>
                    {exploit.suggestedExploit && (
                      <div className="mt-2 pt-2 border-t border-rose-900/20">
                         <div className="flex justify-between items-center mb-1">
                           <p className="text-[8px] text-rose-400 font-bold uppercase tracking-tighter">Recommended Vector:</p>
                           <button 
                            onClick={() => executeExploit(exploit.suggestedExploit!)}
                            disabled={isProcessing}
                            className="text-[9px] bg-rose-600 hover:bg-rose-500 text-white px-2 py-0.5 rounded font-bold transition-colors disabled:opacity-50 flex items-center gap-1 active:scale-95"
                           >
                            <Zap className="w-2.5 h-2.5 fill-current" /> EXECUTE
                           </button>
                         </div>
                         <code className="text-[9px] text-slate-300 block bg-black/40 p-1 mt-1 rounded border border-rose-900/10 select-all group-hover:border-rose-500/30 transition-colors whitespace-nowrap overflow-x-auto custom-scrollbar">{exploit.suggestedExploit}</code>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8">
              <p className="text-[10px] text-slate-600 mb-4 uppercase font-bold tracking-widest flex items-center gap-2">
                <Database className="w-3 h-3 text-sky-500" /> Captured Assets
              </p>
              <div className="space-y-2">
                {capturedPcaps.length === 0 && (
                  <p className="text-[9px] text-slate-700 italic">No packet captures available.</p>
                )}
                {capturedPcaps.map((pcap, idx) => (
                  <div key={idx} className="bg-slate-900/50 border border-slate-800 p-2 rounded group hover:border-sky-500/30 transition-all">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[10px] font-bold text-slate-300 truncate w-32">{pcap.name}</span>
                      <span className="text-[8px] text-slate-600">{pcap.timestamp}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[8px] text-sky-500 font-mono italic">{pcap.size}</span>
                      <button className="text-[9px] text-sky-400 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 hover:text-sky-300">
                        <Download className="w-2.5 h-2.5" /> DL
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8">
              <p className="text-[10px] text-slate-600 mb-3 uppercase font-bold tracking-widest flex items-center gap-2">
                <Hash className="w-3 h-3" /> Log Feed
              </p>
              <div className="text-[9px] text-slate-500 space-y-1.5 overflow-hidden leading-tight font-mono h-32 opacity-70 mask-linear-gradient">
                <p>[17:21] Engine v4.2 started...</p>
                <p>[17:22] VPN connection verified.</p>
                <p>[17:22] AES-256 handshake OK.</p>
                <p className="text-emerald-900 group-hover:text-emerald-700 transition-colors">[17:23] Port knocking sequence initiated.</p>
                <p>[17:23] Firewall fingerprinting...</p>
                <p>[17:23] Awaiting user command input.</p>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* Footer Status Bar */}
      <footer className="h-6 bg-rose-600 flex items-center px-4 text-[9px] font-bold text-white justify-between shrink-0 z-20 shadow-[0_-2px_10px_#e11d4833] uppercase">
        <div className="flex gap-6 items-center">
          <div className="flex items-center gap-1.5">
            <Cpu className="w-3 h-3" /> CPU: 12%
          </div>
          <div className="flex items-center gap-1.5">
            <Activity className="w-3 h-3" /> NET: 420 KB/S
          </div>
          <div className="flex items-center gap-1.5 hidden sm:flex">
             THREAT: <span className="bg-white text-rose-600 px-1 ml-1">CRITICAL</span>
          </div>
        </div>
        <div className="flex gap-6 items-center">
          <span className="hidden md:inline">USER: ROOT</span>
          <span className="hidden md:inline">HOST: SNAKE-KALI-PRO</span>
          <span className="flex items-center gap-1">
             <Activity className="w-3 h-3 animate-spin border-none" style={{ animationDuration: '3s' }} /> 
             {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })} UTC
          </span>
        </div>
      </footer>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.2);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #334155;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #475569;
        }
        
        .mask-linear-gradient {
          mask-image: linear-gradient(to bottom, black 50%, transparent 100%);
        }
      `}</style>
    </div>
  );
};


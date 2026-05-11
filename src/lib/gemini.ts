import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function simulateToolOutput(tool: string, target: string, context: string = "") {
  const prompt = `Simulate the terminal output of the Kali Linux tool "${tool}" targeting "${target}". 
  The output should look highly realistic, including headers, progress indicators, version banners, and vulnerabilities found.
  If the tool is "commix", simulate its specialized OS command injection testing phases, payload delivery, and result verification (e.g., [info] Testing the 'POST' parameter 'user'...).
  If the tool involves sniffing (e.g., "tcpdump", "tshark", "sniff_remote"), simulate the capture initialization, packet count increments, and a summary of captured protocol types (HTTP, DNS, TLS, etc.).
  If the tool is performative exploitation (like Metasploit or an exploit script), include granular stages: target identification, service validation, payload staging, NOP sled construction, and the final jump/shell execution.
  Include realistic status codes, memory addresses, and timestamps.
  Keep the output concise but detailed. 
  ${context ? `Additional context: ${context}` : ""}
  Do not include any preamble or explanation, just the terminal output.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        temperature: 0.7,
      }
    });

    return response.text || "Error generating output.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Error: Connection to simulation server failed.";
  }
}

export async function getAdvisorSuggestion(history: string[]) {
  const prompt = `You are a "Senior Lab Instructor" in a high-security cyber defense laboratory.
  Your role is to provide advanced architectural and tactical guidance to a student performing a penetration test.
  
  Current Mission Progress (Terminal Logs):
  ${history.slice(-10).join("\n")}
  
  Provide a professional, technical suggestion for the next logical step. 
  Focus on methodologies (e.g., OWASP, PTES, cyber kill chain) rather than just commands.
  Keep it to 1-3 concise sentences. No preamble.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        maxOutputTokens: 150,
      }
    });

    return response.text || "Awaiting further reconnaissance data...";
  } catch (error) {
    return "Advisory link disrupted. Check network integrity.";
  }
}

export interface NetworkNode {
  ip: string;
  hostname?: string;
  services: string[];
  status: 'up' | 'down' | 'unknown';
}

export async function extractNetworkEntities(terminalOutput: string): Promise<NetworkNode[]> {
  const prompt = `Extract network nodes (IP addresses, hostnames, and open services/ports) from the following terminal output. 
  Output the result as a strict JSON array of objects with the following structure:
  [{"ip": "string", "hostname": "string", "services": ["string"], "status": "up" | "down" | "unknown"}]
  
  Terminal Output:
  ${terminalOutput}
  
  If no nodes are found, return exactly []. Do not include any text other than the JSON array.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    const text = response.text || "[]";
    return JSON.parse(text);
  } catch (error) {
    console.error("Extraction Error:", error);
    return [];
  }
}

export interface ExploitSuggestion {
  nodeIp: string;
  service: string;
  vulnerability: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  cve?: string;
  description: string;
  suggestedExploit?: string;
}

export async function getExploitSuggestions(nodes: NetworkNode[]): Promise<ExploitSuggestion[]> {
  if (nodes.length === 0) return [];

  const prompt = `Based on the following discovered network nodes and their services, suggest potential exploits or known vulnerabilities from an "Exploit Database" perspective.
  
  Discovered Nodes:
  ${JSON.stringify(nodes, null, 2)}
  
  Output the result as a strict JSON array of objects with the following structure:
  [{"nodeIp": "string", "service": "string", "vulnerability": "string", "severity": "low" | "medium" | "high" | "critical", "cve": "string", "description": "string", "suggestedExploit": "string"}]
  
  Keep suggestions realistic based on common services and versions (like OpenSSH, Apache, etc).
  Do not include any text other than the JSON array.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    const text = response.text || "[]";
    return JSON.parse(text);
  } catch (error) {
    console.error("Exploit Suggestion Error:", error);
    return [];
  }
}

"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";

interface AiConversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

interface AiMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  created_at: string;
}

const SUGGESTED_PROMPTS = [
  { text: "Help me price my laptop for sale" },
  { text: "How does escrow payment work?" },
  { text: "What are the best selling categories?" },
  { text: "How do I get more reviews as a seller?" },
  { text: "How does delivery logistics work?" },
  { text: "How do I verify my account?" },
];

export default function AiAssistantPage() {
  const router = useRouter();
  const supabase = createClient();
  const [userId, setUserId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<AiConversation[]>([]);
  const [activeConv, setActiveConv] = useState<string | null>(null);
  const [messages, setMessages] = useState<AiMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push("/auth/login"); return; }
      setUserId(user.id);
    });
  }, [supabase, router]);

  const loadConversations = useCallback(async () => {
    if (!userId) return;
    const { data } = await supabase.from("ai_conversations").select("id, title, created_at, updated_at").eq("user_id", userId).order("updated_at", { ascending: false });
    setConversations(data || []);
  }, [userId, supabase]);

  useEffect(() => { if (userId) loadConversations(); }, [userId, loadConversations]);

  const loadMessages = useCallback(async (convId: string) => {
    const { data } = await supabase.from("ai_messages").select("id, role, content, created_at").eq("conversation_id", convId).order("created_at", { ascending: true });
    setMessages(data || []);
  }, [supabase]);

  useEffect(() => { if (activeConv) loadMessages(activeConv); }, [activeConv, loadMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleNewChat(firstMessage: string) {
    if (!userId) return;
    const title = firstMessage ? firstMessage.slice(0, 50) + (firstMessage.length > 50 ? "..." : "") : "New Chat";
    const { data, error } = await supabase.from("ai_conversations").insert({ user_id: userId, title }).select("id").single();
    if (error || !data) return;
    const convId = data.id;
    await loadConversations();
    setActiveConv(convId);
    if (firstMessage) await handleSend(firstMessage, convId);
  }

  async function handleSend(content?: string, convId?: string) {
    const msg = content || input.trim();
    const cid = convId || activeConv;
    if (!msg || !cid || !userId || loading) return;
    setLoading(true);
    setInput("");
    await supabase.from("ai_messages").insert({ conversation_id: cid, role: "user", content: msg });
    await supabase.from("ai_conversations").update({ updated_at: new Date().toISOString() }).eq("id", cid);
    await loadMessages(cid);

    try {
      const history = messages.map((m) => ({ role: m.role, content: m.content }));
      history.push({ role: "user", content: msg });
      const response = await fetch("https://api.opencode.ai/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.NEXT_PUBLIC_OPENCODE_API_KEY || ""}` },
        body: JSON.stringify({
          model: "opencode/zen",
          messages: [
            { role: "system", content: "You are Omix AI, a helpful assistant for Omix Marketplace — a Kenyan P2P marketplace. Help with pricing in KES, M-Pesa payments, escrow, logistics. Be concise and friendly." },
            ...history,
          ],
          max_tokens: 500,
        }),
      });
      let aiResponse = "I'm having trouble connecting right now. Please try again.";
      if (response.ok) {
        const data = await response.json();
        aiResponse = data.choices?.[0]?.message?.content || aiResponse;
      }
      await supabase.from("ai_messages").insert({ conversation_id: cid, role: "assistant", content: aiResponse });
      if (messages.length === 0) {
        const newTitle = msg.slice(0, 40) + (msg.length > 40 ? "..." : "");
        await supabase.from("ai_conversations").update({ title: newTitle }).eq("id", cid);
        await loadConversations();
      }
    } catch {
      await supabase.from("ai_messages").insert({ conversation_id: cid, role: "assistant", content: "Sorry, I'm having trouble responding. Please try again." });
    }
    await loadMessages(cid);
    setLoading(false);
  }

  async function handleDelete(convId: string) {
    await supabase.from("ai_messages").delete().eq("conversation_id", convId);
    await supabase.from("ai_conversations").delete().eq("id", convId).eq("user_id", userId!);
    if (activeConv === convId) { setActiveConv(null); setMessages([]); }
    await loadConversations();
  }

  if (!userId) return null;

  return (
    <div className="max-w-6xl mx-auto h-[calc(100vh-4rem)] flex">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? "w-64" : "w-0"} transition-all duration-200 border-r border-white/[0.06] overflow-hidden flex flex-col shrink-0`} style={{ background: "rgba(10,15,26,0.5)" }}>
        <div className="p-4 border-b border-white/[0.06]">
          <button onClick={() => handleNewChat("")} className="glass-btn w-full text-sm">New Chat</button>
        </div>
        <div className="flex-1 overflow-y-auto no-scrollbar">
          {conversations.map((conv) => (
            <div key={conv.id}
              className={`group flex items-center justify-between px-3 py-2.5 cursor-pointer transition-colors ${activeConv === conv.id ? "bg-emerald-500/10" : "hover:bg-white/[0.03]"}`}
              onClick={() => setActiveConv(conv.id)}>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-500 truncate">{conv.title}</p>
                <p className="text-[11px] text-slate-300">{new Date(conv.updated_at).toLocaleDateString("en-KE", { month: "short", day: "numeric" })}</p>
              </div>
              <button onClick={(e) => { e.stopPropagation(); handleDelete(conv.id); }}
                className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-400 p-1 transition-colors">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat */}
      <div className="flex-1 flex flex-col">
        <div className="p-3 border-b border-white/[0.06] flex items-center gap-3" style={{ background: "rgba(10,15,26,0.3)" }}>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-white/5 rounded-lg text-slate-400">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg>
          </button>
          <div>
            <h2 className="font-medium text-sm text-white">Omix AI Assistant</h2>
            <p className="text-xs text-slate-400">Your marketplace helper</p>
          </div>
        </div>

        {activeConv ? (
          <>
            <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[75%] rounded-2xl px-4 py-3 ${msg.role === "user" ? "bg-emerald-600 text-white rounded-br-sm" : "glass-card rounded-bl-sm"}`}>
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    <p className={`text-[10px] mt-1 ${msg.role === "user" ? "text-emerald-200" : "text-slate-400"}`}>
                      {new Date(msg.created_at).toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="glass-card rounded-2xl rounded-bl-sm px-4 py-3">
                    <div className="flex gap-1.5">
                      <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-3 border-t border-white/[0.06]" style={{ background: "rgba(10,15,26,0.3)" }}>
              <div className="flex gap-2">
                <input value={input} onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                  placeholder="Ask Omix AI anything..." className="glass-input rounded-full" disabled={loading} />
                <button onClick={() => handleSend()} disabled={loading || !input.trim()} className="glass-btn rounded-full px-5 text-sm">Send</button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center max-w-lg px-4">
              <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: "linear-gradient(135deg, rgba(16,185,129,0.2), rgba(6,78,59,0.3))" }}>
                <svg className="w-8 h-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Omix AI Assistant</h2>
              <p className="text-slate-400 mb-8 text-sm">Your smart helper for buying, selling, and everything marketplace.</p>
              <div className="grid grid-cols-2 gap-3">
                {SUGGESTED_PROMPTS.map((prompt) => (
                  <button key={prompt.text} onClick={() => handleNewChat(prompt.text)}
                    className="glass-card p-3 text-left text-sm text-slate-500 hover:text-emerald-400 transition-colors">
                    {prompt.text}
                  </button>
                ))}
              </div>
              <div className="mt-6 flex gap-2 max-w-md mx-auto">
                <input value={input} onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) handleNewChat(input); }}
                  placeholder="Type a question..." className="glass-input rounded-full" />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

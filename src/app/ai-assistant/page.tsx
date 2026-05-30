"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";

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
  { emoji: "💰", text: "Help me price my laptop for sale" },
  { emoji: "🔒", text: "How does escrow payment work?" },
  { emoji: "📊", text: "What are the best selling categories?" },
  { emoji: "⭐", text: "How do I get more reviews as a seller?" },
  { emoji: "🚚", text: "How does delivery logistics work?" },
  { emoji: "🛡️", text: "How do I verify my account?" },
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

  // Auth check
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.push("/auth/login");
        return;
      }
      setUserId(user.id);
    });
  }, [supabase, router]);

  // Load conversations
  const loadConversations = useCallback(async () => {
    if (!userId) return;
    const { data } = await supabase
      .from("ai_conversations")
      .select("id, title, created_at, updated_at")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false });
    setConversations(data || []);
  }, [userId, supabase]);

  useEffect(() => {
    if (userId) loadConversations();
  }, [userId, loadConversations]);

  // Load messages for active conversation
  const loadMessages = useCallback(async (convId: string) => {
    const { data } = await supabase
      .from("ai_messages")
      .select("id, role, content, created_at")
      .eq("conversation_id", convId)
      .order("created_at", { ascending: true });
    setMessages(data || []);
  }, [supabase]);

  useEffect(() => {
    if (activeConv) loadMessages(activeConv);
  }, [activeConv, loadMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // New conversation
  async function handleNewChat(firstMessage?: string) {
    if (!userId) return;
    const title = firstMessage ? firstMessage.slice(0, 50) + (firstMessage.length > 50 ? "..." : "") : "New Chat";
    const { data, error } = await supabase
      .from("ai_conversations")
      .insert({ user_id: userId, title })
      .select("id")
      .single();

    if (error || !data) return;

    const convId = data.id;
    await loadConversations();
    setActiveConv(convId);

    if (firstMessage) {
      await handleSend(firstMessage, convId);
    }
  }

  // Send message
  async function handleSend(content?: string, convId?: string) {
    const msg = content || input.trim();
    const cid = convId || activeConv;
    if (!msg || !cid || !userId || loading) return;

    setLoading(true);
    setInput("");

    // Insert user message
    await supabase.from("ai_messages").insert({
      conversation_id: cid,
      role: "user",
      content: msg,
    });

    // Update conversation timestamp
    await supabase
      .from("ai_conversations")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", cid);

    await loadMessages(cid);

    // Call AI API
    try {
      const apiUrl = process.env.NEXT_PUBLIC_OPENCODE_API_URL || "https://api.opencode.ai/chat/completions";
      const apiKey = process.env.NEXT_PUBLIC_OPENCODE_API_KEY || "";

      // Get conversation history for context
      const history = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));
      history.push({ role: "user", content: msg });

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "opencode/zen",
          messages: [
            {
              role: "system",
              content:
                "You are Omix AI, a helpful assistant for the Omix Marketplace — a Kenyan P2P marketplace platform. You help buyers and sellers with product searches, pricing advice in KES, negotiation strategies, escrow payment explanations, logistics/delivery questions, and general marketplace guidance. Be concise, friendly, and knowledgeable about the Kenyan market context. Omix uses KES currency, M-Pesa payments, and escrow protection for safe transactions.",
            },
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

      // Insert assistant response
      await supabase.from("ai_messages").insert({
        conversation_id: cid,
        role: "assistant",
        content: aiResponse,
      });

      // Update conversation title if first exchange
      if (messages.length === 0) {
        const newTitle = msg.slice(0, 40) + (msg.length > 40 ? "..." : "");
        await supabase
          .from("ai_conversations")
          .update({ title: newTitle })
          .eq("id", cid);
        await loadConversations();
      }
    } catch {
      await supabase.from("ai_messages").insert({
        conversation_id: cid,
        role: "assistant",
        content: "Sorry, I'm having trouble responding. Please try again.",
      });
    }

    await loadMessages(cid);
    setLoading(false);
  }

  // Delete conversation
  async function handleDelete(convId: string) {
    await supabase.from("ai_messages").delete().eq("conversation_id", convId);
    await supabase.from("ai_conversations").delete().eq("id", convId).eq("user_id", userId!);
    if (activeConv === convId) {
      setActiveConv(null);
      setMessages([]);
    }
    await loadConversations();
  }

  if (!userId) return null;

  return (
    <div className="max-w-6xl mx-auto h-[calc(100vh-4rem)] flex">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? "w-64" : "w-0"} transition-all duration-200 border-r border-gray-200 bg-white overflow-hidden flex flex-col shrink-0`}>
        <div className="p-4 border-b border-gray-100">
          <button
            onClick={() => handleNewChat()}
            className="w-full py-2 px-4 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700"
          >
            + New Chat
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.map((conv) => (
            <div
              key={conv.id}
              className={`group flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-gray-50 ${
                activeConv === conv.id ? "bg-emerald-50" : ""
              }`}
              onClick={() => setActiveConv(conv.id)}
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{conv.title}</p>
                <p className="text-xs text-gray-400">
                  {new Date(conv.updated_at).toLocaleDateString("en-KE", {
                    month: "short",
                    day: "numeric",
                  })}
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(conv.id);
                }}
                className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 p-1"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="p-3 border-b border-gray-100 flex items-center gap-3 bg-white">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-gray-100 rounded-lg text-gray-500"
          >
            ☰
          </button>
          <div>
            <h2 className="font-medium text-sm">Omix AI Assistant</h2>
            <p className="text-xs text-gray-400">Your marketplace helper</p>
          </div>
        </div>

        {activeConv ? (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${
                    msg.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                      msg.role === "user"
                        ? "bg-emerald-600 text-white rounded-br-sm"
                        : "bg-white border rounded-bl-sm shadow-sm"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    <p
                      className={`text-xs mt-1 ${
                        msg.role === "user" ? "text-emerald-200" : "text-gray-400"
                      }`}
                    >
                      {new Date(msg.created_at).toLocaleTimeString("en-KE", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-white border rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 border-t border-gray-100 bg-white">
              <div className="flex gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                  placeholder="Ask Omix AI anything..."
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
                  disabled={loading}
                />
                <button
                  onClick={() => handleSend()}
                  disabled={loading || !input.trim()}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-full text-sm font-medium hover:bg-emerald-700 disabled:opacity-50"
                >
                  Send
                </button>
              </div>
            </div>
          </>
        ) : (
          /* Welcome Screen */
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center max-w-lg px-4">
              <div className="text-6xl mb-4">✨</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Omix AI Assistant
              </h2>
              <p className="text-gray-500 mb-8">
                Your smart helper for buying, selling, and everything marketplace.
              </p>
              <div className="grid grid-cols-2 gap-3">
                {SUGGESTED_PROMPTS.map((prompt) => (
                  <button
                    key={prompt.text}
                    onClick={() => handleNewChat(prompt.text)}
                    className="p-3 bg-white border rounded-xl text-left hover:border-emerald-300 hover:shadow-sm transition-all"
                  >
                    <span className="text-lg">{prompt.emoji}</span>
                    <p className="text-sm mt-1">{prompt.text}</p>
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-6">
                Or type your own question below
              </p>
              <div className="mt-4 flex gap-2 max-w-md mx-auto">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      handleNewChat(input);
                    }
                  }}
                  placeholder="Type a question..."
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

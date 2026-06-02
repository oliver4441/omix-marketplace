"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Conversation {
  id: string;
  listing_id: string | null;
  last_message_at: string;
  other_user: {
    id: string;
    full_name: string;
    avatar_url: string | null;
  };
  last_message: string;
  unread_count: number;
}

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  message_type: string;
  content: string;
  attachment_url: string | null;
  offer_cents: number | null;
  offer_status: string | null;
  is_deleted: boolean;
  created_at: string;
  sender: {
    id: string;
    full_name: string;
    avatar_url: string | null;
  };
}

export default function MessagesPage({ params }: { params: Promise<{ conversationId?: string }> }) {
  const router = useRouter();
  const supabase = createClient();
  const [userId, setUserId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [otherUser, setOtherUser] = useState<{ id: string; full_name: string; avatar_url: string | null } | null>(null);
  const [listingTitle, setListingTitle] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<any>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.push("/auth/login");
        return;
      }
      setUserId(user.id);
    }).catch(() => router.push("/auth/login"));
  }, [supabase, router]);

  const loadConversations = useCallback(async () => {
    if (!userId) return;
    const { data, error } = await supabase
      .from("conversations")
      .select(`
        id,
        listing_id,
        last_message_at,
        conversation_members!inner(user_id, unread_count),
        messages(content, created_at)
      `)
      .eq("conversation_members.user_id", userId)
      .order("last_message_at", { ascending: false })
      .limit(30);

    if (error || !data) return;

    const convos: Conversation[] = (data as any[]).map((c: any) => {
      const msgs = c.messages || [];
      const lastMsg = msgs.sort((a: any, b: any) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )[0];
      const member = c.conversation_members?.find((m: any) => m.user_id === userId);
      return {
        id: c.id,
        listing_id: c.listing_id,
        last_message_at: c.last_message_at,
        other_user: { id: "", full_name: "", avatar_url: null },
        last_message: lastMsg?.content || "No messages yet",
        unread_count: member?.unread_count || 0,
      };
    });

    for (const convo of convos) {
      const { data: members } = await supabase
        .from("conversation_members")
        .select("user_id, profiles(id, full_name, avatar_url)")
        .eq("conversation_id", convo.id)
        .neq("user_id", userId);
      if (members && members[0]) {
        convo.other_user = (members[0] as any).profiles;
      }
    }

    setConversations(convos);
  }, [userId, supabase]);

  useEffect(() => {
    if (userId) loadConversations();
  }, [userId, loadConversations]);

  const subscribeToConversation = useCallback(async (conversationId: string) => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    const { data } = await supabase
      .from("messages")
      .select(`
        *,
        sender:profiles!messages_sender_id_fkey(id, full_name, avatar_url)
      `)
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })
      .limit(50);

    setMessages((data as Message[]) || []);

    const { data: convData } = await supabase
      .from("conversations")
      .select(`
        listing_id,
        listings(title),
        conversation_members(user_id, profiles(id, full_name, avatar_url))
      `)
      .eq("id", conversationId)
      .single();

    if (convData) {
      const other = (convData as any).conversation_members?.find((m: any) => m.user_id !== userId);
      if (other) setOtherUser(other.profiles);
      setListingTitle((convData as any).listings?.title || null);
    }

    await supabase
      .from("conversation_members")
      .update({ unread_count: 0 })
      .eq("conversation_id", conversationId)
      .eq("user_id", userId!);

    const channel = supabase
      .channel(`conversation:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages((prev) => {
            if (prev.find((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const updated = payload.new as Message;
          setMessages((prev) =>
            prev.map((m) => (m.id === updated.id ? { ...m, ...updated } : m))
          );
        }
      )
      .subscribe();

    channelRef.current = channel;
  }, [userId, supabase]);

  useEffect(() => {
    if (activeConversation) {
      subscribeToConversation(activeConversation);
    }
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [activeConversation, subscribeToConversation, supabase]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    if (!newMessage.trim() || !activeConversation || !userId || sending) return;
    setSending(true);
    const content = newMessage.trim();
    setNewMessage("");

    const { error } = await supabase.from("messages").insert({
      conversation_id: activeConversation,
      sender_id: userId,
      message_type: "text",
      content,
    });

    if (error) {
      setNewMessage(content);
    }
    setSending(false);
  }

  async function handleSendOffer(amount: number) {
    if (!activeConversation || !userId) return;
    const { data: conv } = await supabase
      .from("conversations")
      .select("listing_id, listings(price)")
      .eq("id", activeConversation)
      .single();

    if (!conv) return;

    await supabase.from("messages").insert({
      conversation_id: activeConversation,
      sender_id: userId,
      message_type: "offer",
      content: `Offered KES ${amount.toLocaleString()}`,
      offer_cents: amount * 100,
      offer_status: "pending",
    });
  }

  return (
    <div className="max-w-6xl mx-auto h-[calc(100vh-4rem)] flex">
      {/* Conversations List */}
      <div className="w-80 border-r border-white/10 flex flex-col bg-[#0a0f1a]">
        <div className="p-4 border-b border-white/10">
          <h2 className="text-lg font-bold text-white">Messages</h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="p-8 text-center">
              <svg className="w-10 h-10 text-slate-600 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
              <p className="text-sm text-slate-400">No conversations yet</p>
              <p className="text-xs text-slate-500 mt-1">Message a seller from a listing page</p>
            </div>
          ) : (
            conversations.map((convo) => (
              <button
                key={convo.id}
                onClick={() => setActiveConversation(convo.id)}
                className={`w-full p-3 flex items-start gap-3 text-left border-b border-white/5 transition-colors ${
                  activeConversation === convo.id ? "bg-emerald-500/10" : "hover:bg-white/5"
                }`}
              >
                <div className="w-10 h-10 rounded-full bg-emerald-500/15 flex items-center justify-center text-emerald-400 font-bold shrink-0">
                  {convo.other_user?.full_name?.[0]?.toUpperCase() || "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-sm text-slate-200 truncate">
                      {convo.other_user?.full_name || "Unknown"}
                    </span>
                    <span className="text-xs text-slate-500 shrink-0">
                      {new Date(convo.last_message_at).toLocaleDateString("en-KE", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 truncate">{convo.last_message}</p>
                </div>
                {convo.unread_count > 0 && (
                  <span className="bg-emerald-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center shrink-0">
                    {convo.unread_count}
                  </span>
                )}
              </button>
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-[#060a14]">
        {activeConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-3 border-b border-white/10 flex items-center justify-between bg-[#0a0f1a]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-emerald-500/15 flex items-center justify-center text-emerald-400 font-bold text-sm">
                  {otherUser?.full_name?.[0]?.toUpperCase() || "?"}
                </div>
                <div>
                  <p className="font-medium text-sm text-white">{otherUser?.full_name}</p>
                  {listingTitle && (
                    <p className="text-xs text-slate-500">Re: {listingTitle}</p>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                {conversations.find((c) => c.id === activeConversation)?.listing_id && (
                  <Link
                    href={`/listings/${conversations.find((c) => c.id === activeConversation)?.listing_id}`}
                    className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
                  >
                    View Listing
                  </Link>
                )}
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#080d18]">
              {messages.map((msg) => {
                const isMine = msg.sender_id === userId;
                return (
                  <div
                    key={msg.id}
                    className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                        isMine
                          ? "bg-emerald-600 text-white rounded-br-sm"
                          : "bg-white/10 text-slate-200 border border-white/5 rounded-bl-sm"
                      }`}
                    >
                      {msg.is_deleted ? (
                        <p className="text-sm italic opacity-50">Message deleted</p>
                      ) : msg.message_type === "offer" ? (
                        <div>
                          <p className="text-sm font-medium">Offer: KES {((msg.offer_cents || 0) / 100).toLocaleString()}</p>
                          {msg.offer_status === "pending" && !isMine && userId && (
                            <div className="flex gap-2 mt-2">
                              <button
                                onClick={async () => {
                                  await supabase.from("messages").update({ offer_status: "accepted" }).eq("id", msg.id);
                                }}
                                className="text-xs px-3 py-1 bg-emerald-600 text-white rounded-full"
                              >
                                Accept
                              </button>
                              <button
                                onClick={async () => {
                                  await supabase.from("messages").update({ offer_status: "declined" }).eq("id", msg.id);
                                }}
                                className="text-xs px-3 py-1 bg-white/10 text-slate-300 rounded-full border border-white/10"
                              >
                                Decline
                              </button>
                            </div>
                          )}
                          {msg.offer_status !== "pending" && (
                            <p className="text-xs mt-1 opacity-75">
                              {msg.offer_status === "accepted" ? "Accepted" : msg.offer_status === "declined" ? "Declined" : "Countered"}
                            </p>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      )}
                      <p className={`text-xs mt-1 ${isMine ? "text-emerald-200" : "text-slate-500"}`}>
                        {new Date(msg.created_at).toLocaleTimeString("en-KE", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 border-t border-white/10 bg-[#0a0f1a]">
              <div className="flex gap-2">
                <input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2 glass-input rounded-full text-sm"
                />
                <button
                  onClick={handleSend}
                  disabled={sending || !newMessage.trim()}
                  className="px-4 py-2 glass-btn rounded-full text-sm font-medium disabled:opacity-50"
                >
                  Send
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <svg className="w-12 h-12 text-slate-600 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
              <p className="font-medium text-slate-400">Select a conversation</p>
              <p className="text-sm text-slate-500">Choose from your existing conversations</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

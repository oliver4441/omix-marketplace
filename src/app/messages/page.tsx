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

  // Get current user
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

    // Transform
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
        other_user: { id: "", full_name: "", avatar_url: null }, // Will be populated below
        last_message: lastMsg?.content || "No messages yet",
        unread_count: member?.unread_count || 0,
      };
    });

    // Fetch other user profiles for each conversation
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

  // Subscribe to realtime messages
  const subscribeToConversation = useCallback(async (conversationId: string) => {
    // Unsubscribe previous
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    // Load messages
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

    // Get other user and listing info
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

    // Mark as read
    await supabase
      .from("conversation_members")
      .update({ unread_count: 0 })
      .eq("conversation_id", conversationId)
      .eq("user_id", userId!);

    // Realtime subscription
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
            // Deduplicate
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

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Send message
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
      // Re-add message on error
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
      <div className="w-80 border-r border-gray-200 flex flex-col bg-white">
        <div className="p-4 border-b border-gray-100">
          <h2 className="text-lg font-bold">Messages</h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              <p className="text-4xl mb-2">💬</p>
              <p className="text-sm">No conversations yet</p>
              <p className="text-xs mt-1">Message a seller from a listing page</p>
            </div>
          ) : (
            conversations.map((convo) => (
              <button
                key={convo.id}
                onClick={() => setActiveConversation(convo.id)}
                className={`w-full p-3 flex items-start gap-3 hover:bg-gray-50 text-left border-b border-gray-50 ${
                  activeConversation === convo.id ? "bg-emerald-50" : ""
                }`}
              >
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold shrink-0">
                  {convo.other_user?.full_name?.[0]?.toUpperCase() || "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-sm truncate">
                      {convo.other_user?.full_name || "Unknown"}
                    </span>
                    <span className="text-xs text-gray-400 shrink-0">
                      {new Date(convo.last_message_at).toLocaleDateString("en-KE", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 truncate">{convo.last_message}</p>
                </div>
                {convo.unread_count > 0 && (
                  <span className="bg-emerald-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center shrink-0">
                    {convo.unread_count}
                  </span>
                )}
              </button>
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {activeConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-3 border-b border-gray-100 flex items-center justify-between bg-white">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-sm">
                  {otherUser?.full_name?.[0]?.toUpperCase() || "?"}
                </div>
                <div>
                  <p className="font-medium text-sm">{otherUser?.full_name}</p>
                  {listingTitle && (
                    <p className="text-xs text-gray-400">Re: {listingTitle}</p>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                {conversations.find((c) => c.id === activeConversation)?.listing_id && (
                  <Link
                    href={`/listings/${conversations.find((c) => c.id === activeConversation)?.listing_id}`}
                    className="text-xs text-emerald-600 hover:underline"
                  >
                    View Listing
                  </Link>
                )}
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
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
                          : "bg-white border rounded-bl-sm"
                      }`}
                    >
                      {msg.is_deleted ? (
                        <p className="text-sm italic opacity-50">Message deleted</p>
                      ) : msg.message_type === "offer" ? (
                        <div>
                          <p className="text-sm font-medium">💰 Offer: KES {((msg.offer_cents || 0) / 100).toLocaleString()}</p>
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
                                className="text-xs px-3 py-1 bg-gray-200 text-gray-700 rounded-full"
                              >
                                Decline
                              </button>
                            </div>
                          )}
                          {msg.offer_status !== "pending" && (
                            <p className="text-xs mt-1 opacity-75">
                              {msg.offer_status === "accepted" ? "✅ Accepted" : msg.offer_status === "declined" ? "❌ Declined" : "🔄 Countered"}
                            </p>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      )}
                      <p className={`text-xs mt-1 ${isMine ? "text-emerald-200" : "text-gray-400"}`}>
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
            <div className="p-3 border-t border-gray-100 bg-white">
              <div className="flex gap-2">
                <input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
                />
                <button
                  onClick={handleSend}
                  disabled={sending || !newMessage.trim()}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-full text-sm font-medium hover:bg-emerald-700 disabled:opacity-50"
                >
                  Send
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            <div className="text-center">
              <p className="text-5xl mb-3">💬</p>
              <p className="font-medium">Select a conversation</p>
              <p className="text-sm">Choose from your existing conversations</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

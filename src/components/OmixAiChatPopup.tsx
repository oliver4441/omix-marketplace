"use client";

import { useState, useRef, useEffect, useCallback } from "react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  pending?: boolean;
}

interface OmixAiChatPopupProps {
  role?: "visitor" | "seller";
  context?: string;
  className?: string;
}

export default function OmixAiChatPopup({
  role = "visitor",
  context = "",
  className = "",
}: OmixAiChatPopupProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showGreeting, setShowGreeting] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      setShowGreeting(false);
    }
  }, [isOpen]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    setInput("");
    setIsLoading(true);

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
    };
    const assistantId = crypto.randomUUID();
    const assistantMsg: Message = {
      id: assistantId,
      role: "assistant",
      content: "",
      pending: true,
    };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);

    try {
      abortRef.current = new AbortController();

      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMsg].map((m) => ({
            role: m.role,
            content: m.content,
          })),
          context,
          role,
        }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "AI service error" }));
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, content: `Sorry, ${err.error || "something went wrong"}. Please try again.`, pending: false }
              : m
          )
        );
        setIsLoading(false);
        return;
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response stream");

      const decoder = new TextDecoder();
      let buffer = "";
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith("data: ")) continue;

          const data = trimmed.substring(6);
          if (data === "[DONE]") continue;

          try {
            const parsed = JSON.parse(data);
            if (parsed.error) {
              fullText += `[Error: ${parsed.error}]`;
            } else if (parsed.text) {
              fullText += parsed.text;
            }
            // Update the message in real-time
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId
                  ? { ...m, content: fullText, pending: false }
                  : m
              )
            );
          } catch {
            // skip malformed chunks
          }
        }
      }

      if (!fullText) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? {
                  ...m,
                  content:
                    "I received your message but could not generate a response. Please try again.",
                  pending: false,
                }
              : m
          )
        );
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? {
                ...m,
                content: "Connection lost. Please check your internet and try again.",
                pending: false,
              }
            : m
        )
      );
    } finally {
      setIsLoading(false);
      abortRef.current = null;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const roleLabel = role === "seller" ? "Omix Seller Assistant" : "Omix Support";
  const roleColor = role === "seller" ? "#a78bfa" : "#34d399";

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`omix-ai-btn ${className}`}
        style={{
          position: "fixed",
          bottom: "24px",
          right: "24px",
          width: "60px",
          height: "60px",
          borderRadius: "50%",
          background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
          border: `2px solid ${roleColor}`,
          boxShadow: `0 0 20px ${roleColor}44, 0 4px 24px rgba(0,0,0,0.5)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          zIndex: 9998,: "all 0.3s ease",
        }}
        title={`Ask Omix-AI (${role === "seller" ? "Seller" : "Support"})`}
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={roleColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2a8 8 0 0 1 8 8c0 3-1.5 5-4 6.5V20a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2v-3.5C5.5 15 4 13 4 10a8 8 0 0 1 8-8z" />
          <path d="M9 22h6" />
          <circle cx="9" cy="10" r="1" fill={roleColor} />
          <circle cx="15" cy="10" r="1" fill={roleColor} />
          <path d="M9 14h6" opacity="0.4" />
        </svg>
        {/* Greeting tooltip */}
        {showGreeting && !isOpen && (
          <div
            style={{
              position: "absolute",
              bottom: "70px",
              right: "0",
              background: "rgba(15,23,42,0.95)",
              backdropFilter: "blur(12px)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "12px",
              padding: "10px 14px",
              fontSize: "13px",
              color: "#e2e8f0",
              whiteSpace: "nowrap",
              boxShadow: "0 8px 32px rgba(0,0,0,0.4)",,
            }}
          >
            Need help? Ask me
            <div
              style={{
                position: "absolute",
                bottom: "-6px",
                right: "20px",
                width: "12px",
                height: "12px",
                background: "rgba(15,23,42,0.95)",
                borderRight: "1px solid rgba(255,255,255,0.1)",
                borderBottom: "1px solid rgba(255,255,255,0.1)",
                transform: "rotate(45deg)",
              }}
            />
          </div>
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div
          style={{
            position: "fixed",
            bottom: "96px",
            right: "24px",
            width: "380px",
            maxWidth: "calc(100vw - 48px)",
            height: "520px",
            maxHeight: "calc(100vh - 140px)",
            background: "linear-gradient(180deg, rgba(15,23,42,0.98) 0%, rgba(10,15,26,0.99) 100%)",
            backdropFilter: "blur(24px)",
            borderRadius: "20px",
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow:
              "0 24px 80px rgba(0,0,0,0.6), 0 0 40px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)",
            display: "flex",
            flexDirection: "column",
            zIndex: 9999,
            overflow: "hidden",,
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: "16px 20px",
              borderBottom: "1px solid rgba(255,255,255,0.06)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              background: "rgba(255,255,255,0.02)",
              flexShrink: 0,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "10px",
                  background: `linear-gradient(135deg, ${roleColor}22, ${roleColor}11)`,
                  border: `1px solid ${roleColor}33`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={roleColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2a8 8 0 0 1 8 8c0 3-1.5 5-4 6.5V20a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2v-3.5C5.5 15 4 13 4 10a8 8 0 0 1 8-8z" />
                  <circle cx="9" cy="10" r="1" fill={roleColor} />
                  <circle cx="15" cy="10" r="1" fill={roleColor} />
                </svg>
              </div>
              <div>
                <div style={{ color: "#f1f5f9", fontSize: "14px", fontWeight: 600 }}>
                  Omix-AI
                </div>
                <div style={{ color: roleColor, fontSize: "11px", fontWeight: 500 }}>
                  {roleLabel}
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              {/* Online indicator */}
              <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                <div
                  style={{
                    width: "7px",
                    height: "7px",
                    borderRadius: "50%",
                    background: "#34d399",
                    boxShadow: "0 0 6px #34d39988",
                  }}
                />
                <span style={{ color: "#64748b", fontSize: "11px" }}>Online</span>
              </div>
              <button
                onClick={() => {
                  abortRef.current?.abort();
                  setIsOpen(false);
                }}
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "8px",
                  border: "none",
                  background: "rgba(255,255,255,0.05)",
                  color: "#94a3b8",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(239,68,68,0.15)";
                  e.currentTarget.style.color = "#f87171";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                  e.currentTarget.style.color = "#94a3b8";
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Messages */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "16px",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
              scrollbarWidth: "thin",
              scrollbarColor: "rgba(255,255,255,0.1) transparent",
            }}
          >
            {messages.length === 0 && (
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "16px",
                  opacity: 0.7,
                }}
              >
                <div
                  style={{
                    width: "64px",
                    height: "64px",
                    borderRadius: "16px",
                    background: `linear-gradient(135deg, ${roleColor}15, ${roleColor}08)`,
                    border: `1px solid ${roleColor}22`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={roleColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2a8 8 0 0 1 8 8c0 3-1.5 5-4 6.5V20a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2v-3.5C5.5 15 4 13 4 10a8 8 0 0 1 8-8z" />
                    <path d="M9 22h6" />
                    <circle cx="9" cy="10" r="1.5" fill={roleColor} />
                    <circle cx="15" cy="10" r="1.5" fill={roleColor} />
                    <path d="M9 14c1 1 2 1.5 3 1.5s2-.5 3-1.5" opacity="0.5" />
                  </svg>
                </div>
                <div style={{ textAlign: "center", maxWidth: "260px" }}>
                  <div style={{ color: "#e2e8f0", fontSize: "15px", fontWeight: 600, marginBottom: "6px" }}>
                    Hi there
                  </div>
                  <div style={{ color: "#94a3b8", fontSize: "13px", lineHeight: 1.5 }}>
                    {role === "seller"
                      ? "Ask me about your listings, orders, analytics, or growing your business on Omix."
                      : "Ask me about any listing, how to buy, payments, shipping, or anything about Omix."}
                  </div>
                </div>
              </div>
            )}

            {messages.map((msg) => (
              <div
                key={msg.id}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: msg.role === "user" ? "flex-end" : "flex-start",
                  gap: "4px",,
                }}
              >
                {msg.role === "assistant" && (
                  <span
                    style={{
                      fontSize: "10px",
                      color: roleColor,
                      paddingLeft: "2px",
                      fontWeight: 500,
                    }}
                  >
                    Omix-AI
                  </span>
                )}
                <div
                  style={{
                    maxWidth: "85%",
                    padding: "10px 14px",
                    borderRadius:
                      msg.role === "user"
                        ? "16px 16px 4px 16px"
                        : "16px 16px 16px 4px",
                    background:
                      msg.role === "user"
                        ? "linear-gradient(135deg, #3b82f6, #2563eb)"
                        : "rgba(255,255,255,0.06)",
                    border:
                      msg.role === "user"
                        ? "1px solid rgba(96,165,250,0.3)"
                        : "1px solid rgba(255,255,255,0.08)",
                    color: "#f1f5f9",
                    fontSize: "13.5px",
                    lineHeight: 1.6,
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                    boxShadow:
                      msg.role === "user"
                        ? "0 2px 12px rgba(59,130,246,0.25)"
                        : "0 2px 8px rgba(0,0,0,0.15)",
                  }}
                >
                  {msg.pending && !msg.content ? (
                    <div style={{ display: "flex", gap: "4px", padding: "4px 0" }}>
                      {[0, 1, 2].map((i) => (
                        <div
                          key={i}
                          className="omix-ai-dot"
                          style={{
                            width: "7px",
                            height: "7px",
                            borderRadius: "50%",
                            background: roleColor,
                            opacity: 0.4,
                          }}
                        />
                      ))}
                    </div>
                  ) : (
                    <>
                      {msg.content}
                      {msg.pending && (
                        <span
                          style={{
                            display: "inline-block",
                            width: "2px",
                            height: "14px",
                            background: roleColor,
                            marginLeft: "3px",
                            verticalAlign: "middle",,
                          }}
                        />
                      )}
                    </>
                  )}
                </div>
                <span
                  style={{
                    fontSize: "10px",
                    color: "#475569",
                    paddingLeft: msg.role === "user" ? "0" : "2px",
                    paddingRight: msg.role === "user" ? "2px" : "0",
                  }}
                >
                  {new Date().toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div
            style={{
              padding: "12px 16px",
              borderTop: "1px solid rgba(255,255,255,0.06)",
              background: "rgba(0,0,0,0.15)",
              flexShrink: 0,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                background: "rgba(255,255,255,0.04)",
                borderRadius: "14px",
                border: "1px solid rgba(255,255,255,0.08)",
                padding: "6px 6px 6px 14px",: "border-color 0.2s",
              }}
            >
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  role === "seller"
                    ? "Ask about orders, listings, analytics..."
                    : "Ask about products, payments, shipping..."
                }
                disabled={isLoading}
                style={{
                  flex: 1,
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  color: "#e2e8f0",
                  fontSize: "13.5px",
                  padding: "6px 0",
                  caretColor: roleColor,
                }}
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || isLoading}
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "10px",
                  border: "none",
                  background:
                    input.trim() && !isLoading
                      ? `linear-gradient(135deg, ${roleColor}, ${roleColor}cc)`
                      : "rgba(255,255,255,0.06)",
                  color: input.trim() && !isLoading ? "#0f172a" : "#475569",
                  cursor: input.trim() && !isLoading ? "pointer" : "not-allowed",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",: "all 0.2s",
                  flexShrink: 0,
                }}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M22 2L11 13" />
                  <path d="M22 2L15 22L11 13L2 9L22 2Z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      
    </>
  );
}

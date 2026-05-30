"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

// =============================================
// Constants
// =============================================

const OMIX_SYSTEM_PROMPT = `You are Omix AI, a helpful assistant for the Omix Marketplace — a Kenyan P2P marketplace platform. You help buyers and sellers with product searches, pricing advice in KES, negotiation strategies, escrow payment explanations, logistics/delivery questions, and general marketplace guidance. Be concise, friendly, and knowledgeable about the Kenyan market context. Omix uses KES currency, M-Pesa payments, and escrow protection for safe transactions.`;

const OPENCODE_API_URL = "https://api.opencode.ai/chat/completions";
const OPENCODE_MODEL = "opencode/zen";

function getApiKey(): string | undefined {
  return process.env.OPENCODE_API_KEY || process.env.OPENAI_API_KEY;
}

// =============================================
// Call OpenCode Zen API (streaming)
// =============================================

async function callOpenCodeZen(
  messages: { role: string; content: string }[]
): Promise<string> {
  const apiKey = getApiKey();

  const response = await fetch(OPENCODE_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
    },
    body: JSON.stringify({
      model: OPENCODE_MODEL,
      messages: [
        { role: "system", content: OMIX_SYSTEM_PROMPT },
        ...messages,
      ],
      stream: true,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("OpenCode Zen API error:", response.status, errorText);
    throw new Error(
      `OpenCode Zen API error: ${response.status} ${errorText}`
    );
  }

  // Parse SSE stream manually to support environments without
  // Next.js experimental stream helpers.
  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error("No response body from OpenCode Zen API");
  }

  const decoder = new TextDecoder();
  let fullContent = "";
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    // Process complete SSE lines from the buffer
    const lines = buffer.split("\n");
    // Keep the last (potentially incomplete) chunk in buffer
    buffer = lines.pop() || "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || !trimmed.startsWith("data: ")) continue;

      const data = trimmed.slice(6); // Remove "data: " prefix
      if (data === "[DONE]") continue;

      try {
        const parsed = JSON.parse(data);
        const delta =
          parsed.choices?.[0]?.delta?.content ??
          parsed.choices?.[0]?.text ??
          "";
        if (delta) {
          fullContent += delta;
        }
      } catch {
        // Skip malformed JSON lines
      }
    }
  }

  // Process any remaining buffer content
  const trimmed = buffer.trim();
  if (trimmed.startsWith("data: ")) {
    const data = trimmed.slice(6);
    if (data !== "[DONE]") {
      try {
        const parsed = JSON.parse(data);
        const delta =
          parsed.choices?.[0]?.delta?.content ??
          parsed.choices?.[0]?.text ??
          "";
        if (delta) {
          fullContent += delta;
        }
      } catch {
        // Ignore
      }
    }
  }

  if (!fullContent) {
    throw new Error("Empty response from OpenCode Zen API");
  }

  return fullContent;
}

// =============================================
// Non-streaming fallback
// =============================================

async function callOpenCodeZenNonStreaming(
  messages: { role: string; content: string }[]
): Promise<string> {
  const apiKey = getApiKey();

  const response = await fetch(OPENCODE_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
    },
    body: JSON.stringify({
      model: OPENCODE_MODEL,
      messages: [
        { role: "system", content: OMIX_SYSTEM_PROMPT },
        ...messages,
      ],
      stream: false,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("OpenCode Zen API error:", response.status, errorText);
    throw new Error(
      `OpenCode Zen API error: ${response.status} ${errorText}`
    );
  }

  const json = await response.json();
  const content =
    json.choices?.[0]?.message?.content ??
    json.choices?.[0]?.text;

  if (!content) {
    throw new Error("Empty response from OpenCode Zen API");
  }

  return content;
}

// =============================================
// Try streaming first, fall back to non-streaming
// =============================================

async function chatWithOpenCodeZen(
  messages: { role: string; content: string }[]
): Promise<string> {
  try {
    return await callOpenCodeZen(messages);
  } catch (err) {
    console.warn(
      "Streaming call failed, falling back to non-streaming:",
      err
    );
    return await callOpenCodeZenNonStreaming(messages);
  }
}

// =============================================
// Generate a title from message content
// =============================================

function generateTitle(content: string): string {
  // Take first 60 chars, break at word boundary
  const trimmed = content.trim();
  if (trimmed.length <= 60) return trimmed;
  const truncated = trimmed.slice(0, 60);
  const lastSpace = truncated.lastIndexOf(" ");
  return (lastSpace > 20 ? truncated.slice(0, lastSpace) : truncated) + "…";
}

// =============================================
// GET AI CONVERSATIONS — List all for user
// =============================================

export async function getAiConversations(userId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("ai_conversations")
    .select("id, user_id, title, created_at, updated_at")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("getAiConversations error:", error);
    return [];
  }

  return data || [];
}

// =============================================
// GET AI CONVERSATION — Single with messages
// =============================================

export async function getAiConversation(id: string, userId: string) {
  const supabase = await createClient();

  const { data: conversation, error: convError } = await supabase
    .from("ai_conversations")
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
    .single();

  if (convError || !conversation) {
    console.error("getAiConversation conversation error:", convError);
    return null;
  }

  const { data: messages, error: msgError } = await supabase
    .from("ai_messages")
    .select("id, conversation_id, role, content, created_at")
    .eq("conversation_id", id)
    .order("created_at", { ascending: true });

  if (msgError) {
    console.error("getAiConversation messages error:", msgError);
  }

  return {
    ...conversation,
    ai_messages: messages || [],
  };
}

// =============================================
// CREATE AI CONVERSATION — Optionally with first message
// =============================================

export async function createAiConversation(
  userId: string,
  firstMessage?: string
) {
  const supabase = await createClient();

  const title = firstMessage
    ? generateTitle(firstMessage)
    : "New Conversation";

  const { data: conversation, error } = await supabase
    .from("ai_conversations")
    .insert({
      user_id: userId,
      title,
    })
    .select("*")
    .single();

  if (error) {
    console.error("createAiConversation error:", error);
    return { error: "Failed to create conversation" };
  }

  // If a first message was provided, add it and get AI response
  if (firstMessage) {
    // Insert user message
    await supabase.from("ai_messages").insert({
      conversation_id: conversation.id,
      role: "user",
      content: firstMessage,
    });

    try {
      const assistantContent = await chatWithOpenCodeZen([
        { role: "user", content: firstMessage },
      ]);

      await supabase.from("ai_messages").insert({
        conversation_id: conversation.id,
        role: "assistant",
        content: assistantContent,
      });

      // Update conversation title from first message if default
      await supabase
        .from("ai_conversations")
        .update({
          title: generateTitle(firstMessage),
          updated_at: new Date().toISOString(),
        })
        .eq("id", conversation.id);
    } catch (err) {
      console.error("createAiConversation AI call error:", err);
      // Still return the conversation even if AI call fails
    }
  }

  revalidatePath("/ai-assistant");
  return { conversation };
}

// =============================================
// SEND AI MESSAGE — Insert user message, call AI, insert response
// =============================================

export async function sendAiMessage(
  conversationId: string,
  userId: string,
  content: string
) {
  const supabase = await createClient();

  // Verify conversation belongs to user
  const { data: conversation } = await supabase
    .from("ai_conversations")
    .select("id")
    .eq("id", conversationId)
    .eq("user_id", userId)
    .single();

  if (!conversation) {
    return { error: "Conversation not found" };
  }

  // Insert user message
  const { error: insertError } = await supabase.from("ai_messages").insert({
    conversation_id: conversationId,
    role: "user",
    content,
  });

  if (insertError) {
    console.error("sendAiMessage insert user error:", insertError);
    return { error: "Failed to send message" };
  }

  // Get conversation history for context
  const { data: history } = await supabase
    .from("ai_messages")
    .select("role, content")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  const messages = (history || [])
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map((m) => ({ role: m.role, content: m.content }));

  try {
    // Call OpenCode Zen API
    const assistantContent = await chatWithOpenCodeZen(messages);

    // Insert assistant response
    const { data: assistantMsg, error: responseError } = await supabase
      .from("ai_messages")
      .insert({
        conversation_id: conversationId,
        role: "assistant",
        content: assistantContent,
      })
      .select("*")
      .single();

    if (responseError) {
      console.error("sendAiMessage insert assistant error:", responseError);
      return { error: "Failed to save response" };
    }

    // Check if this is the first user message (conversation has user msg + this response only)
    const { count: msgCount } = await supabase
      .from("ai_messages")
      .select("*", { count: "exact", head: true })
      .eq("conversation_id", conversationId);

    // If first exchange (<= 2 msgs so far), update title
    if (msgCount !== null && msgCount <= 2) {
      await supabase
        .from("ai_conversations")
        .update({
          title: generateTitle(content),
          updated_at: new Date().toISOString(),
        })
        .eq("id", conversationId);
    } else {
      // Just update the timestamp
      await supabase
        .from("ai_conversations")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", conversationId);
    }

    return { message: assistantMsg };
  } catch (err) {
    console.error("sendAiMessage AI call error:", err);

    // Save error message from assistant
    await supabase.from("ai_messages").insert({
      conversation_id: conversationId,
      role: "assistant",
      content:
        "Sorry, I'm having trouble responding right now. Please try again.",
    });

    return { error: "AI service unavailable" };
  }
}

// =============================================
// DELETE AI CONVERSATION — Delete conversation and messages
// =============================================

export async function deleteAiConversation(id: string, userId: string) {
  const supabase = await createClient();

  // Delete messages first (foreign key constraint)
  await supabase.from("ai_messages").delete().eq("conversation_id", id);

  // Delete conversation — only if owned by user
  const { error } = await supabase
    .from("ai_conversations")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) {
    console.error("deleteAiConversation error:", error);
    return { error: "Failed to delete conversation" };
  }

  revalidatePath("/ai-assistant");
  return { success: true };
}

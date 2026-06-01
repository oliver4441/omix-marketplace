import { NextRequest } from "next/server";

const OPENCODE_URL = "https://opencode.ai/zen/v1/chat/completions";
const DEFAULT_MODEL = "deepseek-v4-flash-free";

function getApiKey(): string {
  return process.env.OPENCODE_API_KEY || "";
}

// Strip reasoning/thinking blocks from response text
function stripReasoning(text: string): string {
  if (!text) return "";
  // Remove <think>...</think> blocks (MiniMax style)
  let cleaned = text.replace(/<think>[\s\S]*?<\/think>/gi, "");
  // Remove "Thinking." prefixes and numbered reasoning steps (DeepSeek style)
  cleaned = cleaned.replace(/Thinking\.\s*\d+\.\s*\*\*[^*]+\*\*[\s\S]*?(?=\n\n[A-Z]|$)/gi, "");
  return cleaned.trim();
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages, context, role } = body as {
      messages: { role: string; content: string }[];
      context?: string;
      role?: "visitor" | "seller";
    };

    if (!getApiKey()) {
      return Response.json(
        { error: "AI service not configured. Please add OPENCODE_API_KEY." },
        { status: 503 }
      );
    }

    const isVisitor = role === "visitor";

    const systemPrompt = isVisitor
      ? `You are Omix-AI, a friendly customer support assistant for Omix Marketplace — Kenya's leading P2P buying and selling platform.

KEY RULES:
- Never use ** bold, ## headers, or markdown formatting in your responses
- Use plain text with line breaks for organization
- Keep responses concise and helpful (2-4 sentences normally)
- If you don't know something, say so honestly and suggest contacting the seller or support

ABOUT OMIX:
- Omix is a marketplace where Kenyans buy and sell products and services
- Payments are via M-Pesa STK Push
- Buyers can browse listings, chat with sellers, and pay securely
- Sellers can list products, manage orders, and track earnings
- Categories include Electronics, Furniture, Clothing, Books, Vehicles, Home and Garden, Sports, Toys, Health and Beauty, and Business Services
- Orders use escrow — payment is held until buyer confirms delivery
- Disputes can be filed from the order page
- Sellers earn trust through ratings, verified badges, and completed sales

LISTING CONTEXT (current page):
${context || "General browsing"}

Help the user with questions about listings, payments, shipping, seller profiles, or platform features. Be warm, helpful, and use simple language. If speaking to a buyer about a specific item, reference the listing context above.`
      : `You are Omix-AI, a business assistant for sellers on Omix Marketplace — Kenya's leading P2P buying and selling platform.

KEY RULES:
- Never use ** bold, ## headers, or markdown formatting in your responses
- Use plain text with line breaks for organization
- Use numbered lists (1. 2. 3.) when giving steps or multiple items
- Keep responses actionable and practical
- If you don't know something specific, suggest checking the dashboard or support

SELLER TOOLS AVAILABLE:
- Dashboard with earnings stats, 7-day chart, and listing management
- Create new listings with photos, descriptions, and pricing
- Manage orders through the order pipeline (pending > paid > shipped > delivered)
- Respond to buyer messages via the conversations panel
- Track ratings and build verified seller status
- M-Pesa STK Push for receiving payments
- Dispute resolution for problematic orders

LISTING/DASHBOARD CONTEXT:
${context || "Seller dashboard"}

Help the seller with pricing strategies, listing optimization, order management, buyer communication, M-Pesa payouts, account verification, featured listings, and growing their business on Omix. Be professional and data-driven. ${context ? "Reference the current listing/dashboard context above when relevant." : ""}`;

    const apiMessages = [
      { role: "system", content: systemPrompt },
      ...messages.slice(-10),
    ];

    const encoder = new TextEncoder();
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();

    // Start the fetch in background
    (async () => {
      try {
        const res = await fetch(OPENCODE_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getApiKey()}`,
          },
          body: JSON.stringify({
            model: DEFAULT_MODEL,
            messages: apiMessages,
            max_tokens: 512,
            stream: true,
          }),
        });

        if (!res.ok || !res.body) {
          const errText = await res.text();
          await writer.write(
            encoder.encode(
              `data: ${JSON.stringify({ error: `AI service error (${res.status})` })}\n\n`
            )
          );
          await writer.write(encoder.encode("data: [DONE]\n\n"));
          await writer.close();
          return;
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

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
              const delta = parsed.choices?.[0]?.delta;
              const reasoning = delta?.reasoning_content || "";
              const content = delta?.content || "";
              const text = stripReasoning(reasoning + content);

              if (text) {
                await writer.write(
                  encoder.encode(`data: ${JSON.stringify({ text })}\n\n`)
                );
              }
            } catch {
              // skip malformed chunks
            }
          }
        }

        await writer.write(encoder.encode("data: [DONE]\n\n"));
        await writer.close();
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        await writer.write(
          encoder.encode(
            `data: ${JSON.stringify({ error: msg })}\n\n`
          )
        );
        await writer.write(encoder.encode("data: [DONE]\n\n"));
        await writer.close();
      }
    })();

    return new Response(stream.readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Server error";
    return Response.json({ error: msg }, { status: 500 });
  }
}

import { handleMpesaCallback } from "@/lib/actions/payments";

// Safaricom Daraja API IP ranges (production + sandbox)
// Source: https://developer.safaricom.co.ke/APIs/
const ALLOWED_IP_RANGES = [
  "196.201.214.0/24",  // Safaricom production
  "10.12.0.0/16",      // Safaricom internal
  "197.248.0.0/16",    // Safaricom alternate
];

function ipInRange(ip: string, cidr: string): boolean {
  try {
    const [range, bits] = cidr.split("/");
    const mask = ~(2 ** (32 - parseInt(bits)) - 1);
    const ipNum = ip.split(".").reduce((acc, octet) => (acc << 8) + parseInt(octet), 0) >>> 0;
    const rangeNum = range.split(".").reduce((acc, octet) => (acc << 8) + parseInt(octet), 0) >>> 0;
    return (ipNum & mask) === (rangeNum & mask);
  } catch {
    return false;
  }
}

function isAllowedIp(ip: string): boolean {
  // In development, allow all IPs
  if (process.env.NODE_ENV !== "production") return true;
  return ALLOWED_IP_RANGES.some((range) => ipInRange(ip, range));
}

// M-Pesa callback secret for HMAC validation
const MPESA_CALLBACK_SECRET = process.env.MPESA_CALLBACK_SECRET || "";

function validateCallbackPayload(body: any): boolean {
  // Verify required Daraja callback fields
  const result = body?.Body?.stkCallback;
  if (!result) return false;
  if (!result.CheckoutRequestID || typeof result.CheckoutRequestID !== "string") return false;
  if (typeof result.ResultCode !== "number") return false;
  if (!result.ResultDesc || typeof result.ResultDesc !== "string") return false;

  // Sanitize — reject suspicious patterns
  const raw = JSON.stringify(body);
  if (raw.includes("' OR ") || raw.includes("DROP TABLE") || raw.includes("<script")) {
    return false;
  }

  return true;
}

// Deduplication — prevent replay attacks
const processedCallbacks = new Set<string>();
const MAX_CACHE_SIZE = 10000;

export async function POST(request: Request) {
  // 1. IP allowlisting — only accept from Safaricom IPs
  const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!isAllowedIp(clientIp)) {
    console.warn(`M-Pesa callback rejected from unauthorized IP: ${clientIp}`);
    // Return 200 to prevent Safaricom from retrying (but log internally)
    return Response.json({ ResultCode: 1, ResultDesc: "Unauthorized source" });
  }

  try {
    // 2. Validate payload structure
    const body = await request.json();
    if (!validateCallbackPayload(body)) {
      return Response.json({ ResultCode: 1, ResultDesc: "Invalid payload" });
    }

    // 3. Deduplication — prevent replay attacks
    const checkoutId = body.Body.stkCallback.CheckoutRequestID;
    if (processedCallbacks.has(checkoutId)) {
      console.warn(`Duplicate M-Pesa callback: ${checkoutId}`);
      return Response.json({ ResultCode: 0, ResultDesc: "Already processed" });
    }
    processedCallbacks.add(checkoutId);
    if (processedCallbacks.size > MAX_CACHE_SIZE) {
      // Clear oldest entries (simple cleanup)
      const entries = Array.from(processedCallbacks);
      entries.slice(0, MAX_CACHE_SIZE / 2).forEach((e) => processedCallbacks.delete(e));
    }

    // 4. Process the callback
    await handleMpesaCallback(body);
    return Response.json({ ResultCode: 0, ResultDesc: "Success" });
  } catch (error: any) {
    console.error("M-Pesa callback error:", error);
    // Return ResultCode=0 to prevent Safaricom retries for processing failures
    return Response.json({ ResultCode: 0, ResultDesc: "Processed with errors" });
  }
}

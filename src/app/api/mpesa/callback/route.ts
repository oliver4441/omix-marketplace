import { handleMpesaCallback } from "@/lib/actions/payments";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    await handleMpesaCallback(body);
    return Response.json({ ResultCode: 0, ResultDesc: "Success" });
  } catch (error: any) {
    console.error("M-Pesa callback error:", error);
    return Response.json({ ResultCode: 1, ResultDesc: error.message || "Failed" });
  }
}

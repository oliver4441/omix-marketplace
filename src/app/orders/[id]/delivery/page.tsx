"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { formatPrice, DELIVERY_STATUSES } from "@/lib/constants";

const DELIVERY_STEPS = ["pending", "picked_up", "in_transit", "delivered"];

export default function DeliveryTrackingPage({ params }: { params: Promise<{ orderId: string }> }) {
  const router = useRouter();
  const supabase = createClient();
  const [trackingNumber, setTrackingNumber] = useState("");
  const [courierName, setCourierName] = useState("");
  const [courierPhone, setCourierPhone] = useState("");
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // This page would fetch order + delivery data on the server side
  // For now it's a client component placeholder
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Delivery Tracking</h1>
      <p className="text-slate-400">Track delivery status for your order.</p>
    </div>
  );
}

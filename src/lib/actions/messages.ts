"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ConversationMemberInfo {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  last_read_message_id: string | null;
  unread_count: number;
  joined_at: string;
}

export interface ConversationSummary {
  id: string;
  listing_id: string | null;
  order_id: string | null;
  last_message_at: string | null;
  created_at: string;
  members: ConversationMemberInfo[];
  last_message: {
    content: string | null;
    message_type: string | null;
    sender_id: string | null;
    created_at: string | null;
  } | null;
  /** unread count for the *current* user (not total) */
  unread_count: number;
  /** profile info of the "other" member (non-current user) */
  other_member: {
    user_id: string;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
}

export interface MessageRow {
  id: string;
  conversation_id: string;
  sender_id: string;
  message_type: string;
  content: string | null;
  attachment_url: string | null;
  attachment_duration: number | null;
  offer_cents: number | null;
  offer_status: string | null;
  reply_to_message_id: string | null;
  is_edited: boolean;
  is_deleted: boolean;
  created_at: string;
  sender_profile: {
    display_name: string | null;
    avatar_url: string | null;
  } | null;
  reactions: { emoji: string; user_ids: string[] }[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function getAuthenticatedUserId(): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return user.id;
}

// ---------------------------------------------------------------------------
// getConversations
// ---------------------------------------------------------------------------

export async function getConversations(
  userId: string
): Promise<ConversationSummary[]> {
  const supabase = await createClient();

  // 1. Find all conversation IDs where the user is a member
  const { data: memberships, error: membershipErr } = await supabase
    .from("conversation_members")
    .select("conversation_id, last_read_message_id, unread_count, joined_at")
    .eq("user_id", userId);

  if (membershipErr) throw membershipErr;
  if (!memberships || memberships.length === 0) return [];

  const conversationIds = memberships.map((m) => m.conversation_id);

  // 2. Fetch conversation records
  const { data: conversations, error: convErr } = await supabase
    .from("conversations")
    .select("*")
    .in("id", conversationIds)
    .order("last_message_at", { ascending: false, nullsFirst: false });

  if (convErr) throw convErr;
  if (!conversations || conversations.length === 0) return [];

  // 3. Fetch all members + their profiles for these conversations
  const { data: allMembers, error: membersErr } = await supabase
    .from("conversation_members")
    .select(
      `
      conversation_id,
      user_id,
      last_read_message_id,
      unread_count,
      joined_at,
      profiles:user_id ( display_name, avatar_url )
    `
    )
    .in("conversation_id", conversationIds);

  if (membersErr) throw membersErr;

  // Index members by conversation
  const membersByConv = new Map<
    string,
    {
      user_id: string;
      last_read_message_id: string | null;
      unread_count: number;
      joined_at: string;
      display_name: string | null;
      avatar_url: string | null;
    }[]
  >();

  for (const m of allMembers ?? []) {
    const arr = membersByConv.get(m.conversation_id) ?? [];
    const profiles = m.profiles as { display_name: string | null; avatar_url: string | null }[] | { display_name: string | null; avatar_url: string | null } | null;
    const profile = Array.isArray(profiles) ? profiles[0] : profiles;
    arr.push({
      user_id: m.user_id,
      last_read_message_id: m.last_read_message_id,
      unread_count: m.unread_count,
      joined_at: m.joined_at,
      display_name: profile?.display_name ?? null,
      avatar_url: profile?.avatar_url ?? null,
    });
    membersByConv.set(m.conversation_id, arr);
  }

  // 4. Fetch last message per conversation
  const lastMessageById = new Map<
    string,
    {
      content: string | null;
      message_type: string | null;
      sender_id: string | null;
      created_at: string | null;
    }
  >();

  // Use a single batched query — fetch latest messages for all conversations
  // Supabase doesn't support DISTINCT ON, so we fetch all messages and pick first per conv
  const { data: latestMessages, error: latestErr } = await supabase
    .from("messages")
    .select("conversation_id, content, message_type, sender_id, created_at")
    .in("conversation_id", conversationIds)
    .order("created_at", { ascending: false })
    .limit(500); // safety cap; most conversations will resolve well before this

  if (latestErr) throw latestErr;

  for (const msg of latestMessages ?? []) {
    if (!lastMessageById.has(msg.conversation_id)) {
      lastMessageById.set(msg.conversation_id, {
        content: msg.content,
        message_type: msg.message_type,
        sender_id: msg.sender_id,
        created_at: msg.created_at,
      });
    }
  }

  // 5. Build current-user membership lookup
  const memLookup = new Map<
    string,
    { last_read_message_id: string | null; unread_count: number; joined_at: string }
  >();
  for (const m of memberships) {
    memLookup.set(m.conversation_id, {
      last_read_message_id: m.last_read_message_id,
      unread_count: m.unread_count,
      joined_at: m.joined_at,
    });
  }

  // 6. Assemble
  const result: ConversationSummary[] = [];
  for (const conv of conversations) {
    const members = membersByConv.get(conv.id) ?? [];
    const myMem = memLookup.get(conv.id);
    const otherMember = members.find((m) => m.user_id !== userId) ?? null;

    result.push({
      id: conv.id,
      listing_id: conv.listing_id,
      order_id: conv.order_id,
      last_message_at: conv.last_message_at,
      created_at: conv.created_at,
      members: members.map((m) => ({
        user_id: m.user_id,
        display_name: m.display_name,
        avatar_url: m.avatar_url,
        last_read_message_id: m.last_read_message_id,
        unread_count: m.unread_count,
        joined_at: m.joined_at,
      })),
      last_message: lastMessageById.get(conv.id) ?? null,
      unread_count: myMem?.unread_count ?? 0,
      other_member: otherMember
        ? {
            user_id: otherMember.user_id,
            display_name: otherMember.display_name,
            avatar_url: otherMember.avatar_url,
          }
        : null,
    });
  }

  return result;
}

// ---------------------------------------------------------------------------
// getOrCreateConversation
// ---------------------------------------------------------------------------

export async function getOrCreateConversation(
  userId: string,
  otherUserId: string,
  listingId?: string | null
): Promise<string> {
  const supabase = await createClient();

  if (userId === otherUserId) {
    throw new Error("Cannot create a conversation with yourself");
  }

  // Try to find an existing conversation that has exactly these two members
  if (listingId) {
    // Scoped to a listing — find conversation with this listing_id that both users are in
    const { data: existing, error: findErr } = await supabase
      .from("conversations")
      .select(
        `
        id,
        conversation_members!inner ( user_id )
      `
      )
      .eq("listing_id", listingId)
      .eq("conversation_members.user_id", userId);

    if (findErr) throw findErr;

    for (const conv of existing ?? []) {
      const memberIds: string[] = (conv.conversation_members as unknown as { user_id: string }[]).map(
        (m) => m.user_id
      );
      if (memberIds.includes(otherUserId)) {
        return conv.id as string;
      }
    }
  } else {
    // General conversation — no listing_id
    const { data: existing, error: findErr } = await supabase
      .from("conversations")
      .select(
        `
        id,
        conversation_members!inner ( user_id )
      `
      )
      .is("listing_id", null)
      .eq("conversation_members.user_id", userId);

    if (findErr) throw findErr;

    for (const conv of existing ?? []) {
      const memberIds: string[] = (conv.conversation_members as unknown as { user_id: string }[]).map(
        (m) => m.user_id
      );
      if (memberIds.includes(otherUserId)) {
        return conv.id as string;
      }
    }
  }

  // No existing conversation — create one and add both members in a transaction-like manner
  const { data: created, error: createErr } = await supabase
    .from("conversations")
    .insert({
      listing_id: listingId ?? null,
      last_message_at: null,
    })
    .select("id")
    .single();

  if (createErr) throw createErr;
  if (!created) throw new Error("Failed to create conversation");

  const conversationId = created.id;

  const { error: membersErr } = await supabase
    .from("conversation_members")
    .insert([
      { conversation_id: conversationId, user_id: userId },
      { conversation_id: conversationId, user_id: otherUserId },
    ]);

  if (membersErr) {
    // Rollback: delete the conversation we just created
    await supabase.from("conversations").delete().eq("id", conversationId);
    throw membersErr;
  }

  return conversationId;
}

// ---------------------------------------------------------------------------
// getMessages
// ---------------------------------------------------------------------------

export async function getMessages(
  conversationId: string,
  limit: number = 50,
  before?: string // cursor: message id or ISO timestamp to paginate before
): Promise<MessageRow[]> {
  const supabase = await createClient();

  let query = supabase
    .from("messages")
    .select(
      `
      id,
      conversation_id,
      sender_id,
      message_type,
      content,
      attachment_url,
      attachment_duration,
      offer_cents,
      offer_status,
      reply_to_message_id,
      is_edited,
      is_deleted,
      created_at,
      sender_profiles:sender_id ( display_name, avatar_url )
    `
    )
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (before) {
    // Use created_at of the message referenced by `before` as the cursor
    const { data: cursorMsg } = await supabase
      .from("messages")
      .select("created_at")
      .eq("id", before)
      .single();

    if (cursorMsg) {
      query = query.lt("created_at", cursorMsg.created_at);
    }
  }

  const { data, error } = await query;
  if (error) throw error;

  const messages = data ?? [];

  // Fetch reactions for all message ids
  const messageIds = messages.map((m) => m.id);
  if (messageIds.length > 0) {
    const { data: reactions } = await supabase
      .from("message_reactions")
      .select("message_id, user_id, emoji")
      .in("message_id", messageIds);

    const reactionsByMsg = new Map<string, { emoji: string; user_ids: string[] }[]>();
    for (const r of reactions ?? []) {
      const existing = reactionsByMsg.get(r.message_id) ?? [];
      const group = existing.find((g) => g.emoji === r.emoji);
      if (group) {
        group.user_ids.push(r.user_id);
      } else {
        existing.push({ emoji: r.emoji, user_ids: [r.user_id] });
      }
      reactionsByMsg.set(r.message_id, existing);
    }

    return messages.map((m) => {
      const senderProfiles = m.sender_profiles as { display_name: string | null; avatar_url: string | null }[] | { display_name: string | null; avatar_url: string | null } | null;
      const senderProfile = Array.isArray(senderProfiles) ? senderProfiles[0] : senderProfiles;
      return {
        id: m.id,
        conversation_id: m.conversation_id,
        sender_id: m.sender_id,
        message_type: m.message_type,
        content: m.content,
        attachment_url: m.attachment_url,
        attachment_duration: m.attachment_duration,
        offer_cents: m.offer_cents,
        offer_status: m.offer_status,
        reply_to_message_id: m.reply_to_message_id,
        is_edited: m.is_edited,
        is_deleted: m.is_deleted,
        created_at: m.created_at,
        sender_profile: senderProfile
          ? {
              display_name: senderProfile.display_name,
              avatar_url: senderProfile.avatar_url,
            }
          : null,
        reactions: reactionsByMsg.get(m.id) ?? [],
      };
    });
  }

  return messages.map((m) => {
    const senderProfiles = m.sender_profiles as { display_name: string | null; avatar_url: string | null }[] | { display_name: string | null; avatar_url: string | null } | null;
    const senderProfile = Array.isArray(senderProfiles) ? senderProfiles[0] : senderProfiles;
    return {
      id: m.id,
      conversation_id: m.conversation_id,
      sender_id: m.sender_id,
      message_type: m.message_type,
      content: m.content,
      attachment_url: m.attachment_url,
      attachment_duration: m.attachment_duration,
      offer_cents: m.offer_cents,
      offer_status: m.offer_status,
      reply_to_message_id: m.reply_to_message_id,
      is_edited: m.is_edited,
      is_deleted: m.is_deleted,
      created_at: m.created_at,
      sender_profile: senderProfile
        ? {
            display_name: senderProfile.display_name,
            avatar_url: senderProfile.avatar_url,
          }
        : null,
      reactions: [],
    };
  });
}

// ---------------------------------------------------------------------------
// sendMessage
// ---------------------------------------------------------------------------

export async function sendMessage(
  conversationId: string,
  senderId: string,
  content: string,
  messageType: string = "text",
  attachmentUrl?: string | null,
  offerCents?: number | null
): Promise<MessageRow> {
  if (!content.trim() && !attachmentUrl) {
    throw new Error("Message must have content or an attachment");
  }

  const supabase = await createClient();

  // Insert the message
  const { data: inserted, error: insertErr } = await supabase
    .from("messages")
    .insert({
      conversation_id: conversationId,
      sender_id: senderId,
      message_type: messageType,
      content: content?.trim() ?? null,
      attachment_url: attachmentUrl ?? null,
      offer_cents: offerCents ?? null,
    })
    .select("*")
    .single();

  if (insertErr) throw insertErr;
  if (!inserted) throw new Error("Failed to insert message");

  // Update conversation's last_message_at
  const { error: updateErr } = await supabase
    .from("conversations")
    .update({ last_message_at: inserted.created_at })
    .eq("id", conversationId);

  if (updateErr) throw updateErr;

  // Increment unread_count for all other members in the conversation
  // (everyone except the sender)
  const { data: otherMembers } = await supabase
    .from("conversation_members")
    .select("user_id")
    .eq("conversation_id", conversationId)
    .neq("user_id", senderId);

  if (otherMembers && otherMembers.length > 0) {
    // Use a raw update — Supabase client doesn't support increment natively
    // so we do it per member
    for (const member of otherMembers) {
      const { data: current } = await supabase
        .from("conversation_members")
        .select("unread_count")
        .eq("conversation_id", conversationId)
        .eq("user_id", member.user_id)
        .single();

      if (current) {
        await supabase
          .from("conversation_members")
          .update({ unread_count: current.unread_count + 1 })
          .eq("conversation_id", conversationId)
          .eq("user_id", member.user_id);
      }
    }
  }

  revalidatePath("/messages");

  return {
    id: inserted.id,
    conversation_id: inserted.conversation_id,
    sender_id: inserted.sender_id,
    message_type: inserted.message_type,
    content: inserted.content,
    attachment_url: inserted.attachment_url,
    attachment_duration: inserted.attachment_duration,
    offer_cents: inserted.offer_cents,
    offer_status: inserted.offer_status,
    reply_to_message_id: inserted.reply_to_message_id,
    is_edited: inserted.is_edited,
    is_deleted: inserted.is_deleted,
    created_at: inserted.created_at,
    sender_profile: null, // caller can refetch if needed
    reactions: [],
  };
}

// ---------------------------------------------------------------------------
// markConversationRead
// ---------------------------------------------------------------------------

export async function markConversationRead(
  conversationId: string,
  userId: string
): Promise<void> {
  const supabase = await createClient();

  // Find the latest message in the conversation
  const { data: latestMsg } = await supabase
    .from("messages")
    .select("id")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  const latestMessageId = latestMsg?.id ?? null;

  const { error } = await supabase
    .from("conversation_members")
    .update({
      last_read_message_id: latestMessageId,
      unread_count: 0,
    })
    .eq("conversation_id", conversationId)
    .eq("user_id", userId);

  if (error) throw error;
}

// ---------------------------------------------------------------------------
// getUnreadCount
// ---------------------------------------------------------------------------

export async function getUnreadCount(userId: string): Promise<number> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("conversation_members")
    .select("unread_count")
    .eq("user_id", userId);

  if (error) throw error;

  return (data ?? []).reduce(
    (sum: number, row: { unread_count: number }) => sum + row.unread_count,
    0
  );
}

// ---------------------------------------------------------------------------
// sendOffer
// ---------------------------------------------------------------------------

export async function sendOffer(
  conversationId: string,
  senderId: string,
  listingPriceCents: number,
  offerCents: number
): Promise<MessageRow> {
  if (offerCents <= 0) {
    throw new Error("Offer amount must be positive");
  }
  if (offerCents > listingPriceCents) {
    throw new Error("Offer cannot exceed the listing price");
  }

  const offerContent = `Offer: $${(offerCents / 100).toFixed(2)} (listed at $${(
    listingPriceCents / 100
  ).toFixed(2)})`;

  return sendMessage(
    conversationId,
    senderId,
    offerContent,
    "offer",
    null,
    offerCents
  );
}

// ---------------------------------------------------------------------------
// respondToOffer
// ---------------------------------------------------------------------------

export async function respondToOffer(
  messageId: string,
  response: "accept" | "decline" | "counter"
): Promise<void> {
  const supabase = await createClient();

  const statusMap: Record<string, string> = {
    accept: "accepted",
    decline: "declined",
    counter: "countered",
  };

  const offerStatus = statusMap[response];
  if (!offerStatus) {
    throw new Error(`Invalid response type: ${response}`);
  }

  // Verify the message exists and is an offer-type message
  const { data: msg, error: fetchErr } = await supabase
    .from("messages")
    .select("id, message_type, offer_status")
    .eq("id", messageId)
    .single();

  if (fetchErr) throw fetchErr;
  if (!msg) throw new Error("Message not found");
  if (msg.message_type !== "offer") {
    throw new Error("Message is not an offer");
  }
  if (msg.offer_status !== "pending") {
    throw new Error(`Offer has already been ${msg.offer_status}`);
  }

  const { error } = await supabase
    .from("messages")
    .update({ offer_status: offerStatus })
    .eq("id", messageId);

  if (error) throw error;
}

// ---------------------------------------------------------------------------
// addReaction
// ---------------------------------------------------------------------------

export async function addReaction(
  messageId: string,
  userId: string,
  emoji: string
): Promise<void> {
  const supabase = await createClient();

  // Upsert — ignore duplicate
  const { error } = await supabase.from("message_reactions").upsert(
    {
      message_id: messageId,
      user_id: userId,
      emoji,
    },
    { onConflict: "message_id,user_id,emoji", ignoreDuplicates: true }
  );

  if (error) throw error;
}

// ---------------------------------------------------------------------------
// removeReaction
// ---------------------------------------------------------------------------

export async function removeReaction(
  messageId: string,
  user_id: string,
  emoji: string
): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("message_reactions")
    .delete()
    .eq("message_id", messageId)
    .eq("user_id", user_id)
    .eq("emoji", emoji);

  if (error) throw error;
}

// ---------------------------------------------------------------------------
// deleteMessage (soft delete)
// ---------------------------------------------------------------------------

export async function deleteMessage(
  messageId: string,
  senderId: string
): Promise<void> {
  const supabase = await createClient();

  // Verify ownership before allowing deletion
  const { data: msg, error: fetchErr } = await supabase
    .from("messages")
    .select("sender_id")
    .eq("id", messageId)
    .single();

  if (fetchErr) throw fetchErr;
  if (!msg) throw new Error("Message not found");
  if (msg.sender_id !== senderId) {
    throw new Error("You can only delete your own messages");
  }

  const { error } = await supabase
    .from("messages")
    .update({
      is_deleted: true,
      content: null, // redact content on soft delete
      attachment_url: null,
    })
    .eq("id", messageId);

  if (error) throw error;
}

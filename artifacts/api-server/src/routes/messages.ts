import { Router, type IRouter } from "express";
import { eq, or, and, desc, inArray } from "drizzle-orm";
import { db, messagesTable, messageReactionsTable } from "@workspace/db";
import { z } from "zod";

const router: IRouter = Router();

// In-memory typing state: "senderName->recipientName" => timestamp of last keystroke
const typingMap = new Map<string, number>();

// Prune stale entries every 30 seconds so the map doesn't grow forever
setInterval(() => {
  const cutoff = Date.now() - 6_000;
  for (const [key, ts] of typingMap) {
    if (ts < cutoff) typingMap.delete(key);
  }
}, 30_000);

const SendMessageBody = z.object({
  senderName: z.string().min(1).max(80),
  recipientName: z.string().min(1).max(80),
  content: z.string().min(1).max(2000),
});

const GetMessagesQuery = z.object({
  name: z.string().min(1).max(80),
});

const TypingBody = z.object({
  senderName: z.string().min(1).max(80),
  recipientName: z.string().min(1).max(80),
});

const TypingQuery = z.object({
  from: z.string().min(1).max(80),
  to: z.string().min(1).max(80),
});

const ReactBody = z.object({
  reactorName: z.string().min(1).max(80),
  emoji: z.string().min(1).max(10),
});

// Helper: fetch reactions for a list of message IDs and group them
async function fetchReactions(
  messageIds: number[],
): Promise<Map<number, { emoji: string; reactors: string[] }[]>> {
  const map = new Map<number, { emoji: string; reactors: string[] }[]>();
  if (messageIds.length === 0) return map;

  const rows = await db
    .select()
    .from(messageReactionsTable)
    .where(inArray(messageReactionsTable.messageId, messageIds));

  for (const row of rows) {
    const existing = map.get(row.messageId) ?? [];
    const group = existing.find((g) => g.emoji === row.emoji);
    if (group) {
      group.reactors.push(row.reactorName);
    } else {
      existing.push({ emoji: row.emoji, reactors: [row.reactorName] });
    }
    map.set(row.messageId, existing);
  }

  return map;
}

// POST /messages/typing  — called each time the sender presses a key
router.post("/messages/typing", (req, res): void => {
  const parsed = TypingBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "senderName and recipientName required" });
    return;
  }
  typingMap.set(`${parsed.data.senderName}->${parsed.data.recipientName}`, Date.now());
  res.json({ ok: true });
});

// GET /messages/typing?from=X&to=Y  — recipient polls this to see if sender is typing
// Must be declared before GET /messages/:partner so "typing" isn't treated as a partner name
router.get("/messages/typing", (req, res): void => {
  const parsed = TypingQuery.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "from and to query params required" });
    return;
  }
  const key = `${parsed.data.from}->${parsed.data.to}`;
  const ts = typingMap.get(key);
  const isTyping = ts !== undefined && Date.now() - ts < 3_000;
  res.json({ isTyping });
});

router.get("/messages", async (req, res): Promise<void> => {
  const parsed = GetMessagesQuery.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "name query param required" });
    return;
  }

  const { name } = parsed.data;

  const messages = await db
    .select()
    .from(messagesTable)
    .where(
      or(
        eq(messagesTable.senderName, name),
        eq(messagesTable.recipientName, name),
      ),
    )
    .orderBy(desc(messagesTable.createdAt));

  const conversationMap = new Map<
    string,
    {
      partner: string;
      lastMessage: string;
      lastAt: string;
      unread: number;
      messages: typeof messages;
    }
  >();

  for (const msg of messages) {
    const partner = msg.senderName === name ? msg.recipientName : msg.senderName;
    if (!conversationMap.has(partner)) {
      conversationMap.set(partner, {
        partner,
        lastMessage: msg.content,
        lastAt: msg.createdAt.toISOString(),
        unread: 0,
        messages: [],
      });
    }
    const conv = conversationMap.get(partner)!;
    conv.messages.push(msg);
    if (!msg.read && msg.recipientName === name) conv.unread++;
  }

  const conversations = Array.from(conversationMap.values()).map((c) => ({
    partner: c.partner,
    lastMessage: c.lastMessage,
    lastAt: c.lastAt,
    unread: c.unread,
  }));

  res.json({ conversations, total: conversations.length });
});

router.get("/messages/:partner", async (req, res): Promise<void> => {
  const nameQ = GetMessagesQuery.safeParse(req.query);
  if (!nameQ.success) {
    res.status(400).json({ error: "name query param required" });
    return;
  }

  const myName = nameQ.data.name;
  const partner = decodeURIComponent(req.params.partner);

  const messages = await db
    .select()
    .from(messagesTable)
    .where(
      or(
        and(eq(messagesTable.senderName, myName), eq(messagesTable.recipientName, partner)),
        and(eq(messagesTable.senderName, partner), eq(messagesTable.recipientName, myName)),
      ),
    )
    .orderBy(messagesTable.createdAt);

  await db
    .update(messagesTable)
    .set({ read: true })
    .where(
      and(eq(messagesTable.recipientName, myName), eq(messagesTable.senderName, partner)),
    );

  const reactionMap = await fetchReactions(messages.map((m) => m.id));

  const messagesWithReactions = messages.map((m) => ({
    ...m,
    reactions: reactionMap.get(m.id) ?? [],
  }));

  res.json({ messages: messagesWithReactions, total: messages.length });
});

// POST /messages/:id/react — toggle an emoji reaction
router.post("/messages/:id/react", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid message id" }); return; }

  const parsed = ReactBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "reactorName and emoji required" });
    return;
  }

  const { reactorName, emoji } = parsed.data;

  // Check if the reaction already exists (toggle)
  const existing = await db
    .select()
    .from(messageReactionsTable)
    .where(
      and(
        eq(messageReactionsTable.messageId, id),
        eq(messageReactionsTable.reactorName, reactorName),
        eq(messageReactionsTable.emoji, emoji),
      ),
    );

  if (existing.length > 0) {
    await db
      .delete(messageReactionsTable)
      .where(
        and(
          eq(messageReactionsTable.messageId, id),
          eq(messageReactionsTable.reactorName, reactorName),
          eq(messageReactionsTable.emoji, emoji),
        ),
      );
  } else {
    await db
      .insert(messageReactionsTable)
      .values({ messageId: id, reactorName, emoji });
  }

  // Return updated reactions for this message
  const reactionMap = await fetchReactions([id]);
  res.json({ reactions: reactionMap.get(id) ?? [] });
});

router.post("/messages", async (req, res): Promise<void> => {
  const parsed = SendMessageBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid message body" });
    return;
  }

  if (parsed.data.senderName === parsed.data.recipientName) {
    res.status(400).json({ error: "Cannot message yourself" });
    return;
  }

  const [message] = await db
    .insert(messagesTable)
    .values(parsed.data)
    .returning();

  // Clear typing signal once the message is sent
  typingMap.delete(`${parsed.data.senderName}->${parsed.data.recipientName}`);

  res.status(201).json({ ...message, reactions: [] });
});

router.delete("/messages/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  const nameQ = GetMessagesQuery.safeParse(req.query);
  if (!nameQ.success || isNaN(id)) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }

  const [msg] = await db.select().from(messagesTable).where(eq(messagesTable.id, id));
  if (!msg) { res.status(404).json({ error: "Not found" }); return; }
  if (msg.senderName !== nameQ.data.name && msg.recipientName !== nameQ.data.name) {
    res.status(403).json({ error: "Forbidden" }); return;
  }

  await db.delete(messagesTable).where(eq(messagesTable.id, id));
  res.sendStatus(204);
});

export default router;

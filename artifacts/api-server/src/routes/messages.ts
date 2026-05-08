import { Router, type IRouter } from "express";
import { eq, or, and, desc, sql } from "drizzle-orm";
import { db, messagesTable } from "@workspace/db";
import { z } from "zod";

const router: IRouter = Router();

const SendMessageBody = z.object({
  senderName: z.string().min(1).max(80),
  recipientName: z.string().min(1).max(80),
  content: z.string().min(1).max(2000),
});

const GetMessagesQuery = z.object({
  name: z.string().min(1).max(80),
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

  res.json({ messages, total: messages.length });
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

  res.status(201).json(message);
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

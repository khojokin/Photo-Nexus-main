import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { supportChatTable } from "@workspace/db";
import { eq, desc, and } from "drizzle-orm";
import { z } from "zod";

const router: IRouter = Router();

const SendMessageBody = z.object({
  sessionId: z.string().min(1).max(64),
  senderName: z.string().min(1).max(80),
  senderRole: z.enum(["customer", "support"]).default("customer"),
  message: z.string().min(1).max(2000),
});

router.get("/support-chat/sessions", async (_req, res): Promise<void> => {
  const messages = await db
    .select()
    .from(supportChatTable)
    .orderBy(desc(supportChatTable.createdAt));

  const sessionMap = new Map<string, {
    sessionId: string;
    customerName: string;
    lastMessage: string;
    lastAt: string;
    unread: number;
    messageCount: number;
  }>();

  for (const msg of messages) {
    if (!sessionMap.has(msg.sessionId)) {
      const customerMsg = messages.find(m => m.sessionId === msg.sessionId && m.senderRole === "customer");
      sessionMap.set(msg.sessionId, {
        sessionId: msg.sessionId,
        customerName: customerMsg?.senderName ?? msg.senderName,
        lastMessage: msg.message,
        lastAt: msg.createdAt.toISOString(),
        unread: 0,
        messageCount: 0,
      });
    }
    const s = sessionMap.get(msg.sessionId)!;
    s.messageCount++;
    if (!msg.read && msg.senderRole === "customer") s.unread++;
  }

  res.json({ sessions: Array.from(sessionMap.values()) });
});

router.get("/support-chat/:sessionId", async (req, res): Promise<void> => {
  const { sessionId } = req.params;
  const messages = await db
    .select()
    .from(supportChatTable)
    .where(eq(supportChatTable.sessionId, sessionId))
    .orderBy(supportChatTable.createdAt);

  await db
    .update(supportChatTable)
    .set({ read: true })
    .where(and(eq(supportChatTable.sessionId, sessionId), eq(supportChatTable.senderRole, "customer")));

  res.json({ messages });
});

router.post("/support-chat", async (req, res): Promise<void> => {
  const parsed = SendMessageBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid message body" });
    return;
  }

  const [message] = await db
    .insert(supportChatTable)
    .values(parsed.data)
    .returning();

  res.status(201).json(message);
});

router.get("/support-chat/unread-count", async (_req, res): Promise<void> => {
  const messages = await db
    .select()
    .from(supportChatTable)
    .where(and(eq(supportChatTable.senderRole, "customer"), eq(supportChatTable.read, false)));
  res.json({ count: messages.length });
});

export default router;

import { useState, useEffect, useRef, useCallback } from "react";
import { MessageCircle, X, Send, Loader2, MinusSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/auth-context";

interface ChatMessage {
  id: number;
  sessionId: string;
  senderName: string;
  senderRole: string;
  message: string;
  read: boolean;
  createdAt: string;
}

const SESSION_KEY = "affuaa_chat_session";

function getOrCreateSession(): string {
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = "sess-" + Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

const BTN_SIZE = 56;
const EDGE_MARGIN = 12;

export function LiveChat() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [minimised, setMinimised] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const sessionId = useRef(getOrCreateSession());
  const bottomRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [btnSide, setBtnSide] = useState<"left" | "right">("right");
  const [btnY, setBtnY] = useState<number | null>(null);
  const isDragging = useRef(false);
  const dragStartY = useRef(0);
  const dragStartBtnY = useRef(0);
  const dragStartX = useRef(0);
  const hasMoved = useRef(false);

  useEffect(() => {
    setBtnY(window.innerHeight - 120);
  }, []);

  const customerName =
    user
      ? [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email || "Visitor"
      : "Visitor";

  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch(`/api/support-chat/${sessionId.current}`);
      if (res.ok) {
        const data = await res.json() as { messages: ChatMessage[] };
        setMessages(data.messages);
        const newUnread = data.messages.filter(m => m.senderRole === "support" && !m.read).length;
        if (!open) setUnread(newUnread);
      }
    } catch { }
  }, [open]);

  useEffect(() => {
    if (open) {
      setUnread(0);
      setLoading(true);
      fetchMessages().finally(() => setLoading(false));
      pollRef.current = setInterval(() => { void fetchMessages(); }, 4000);
    } else {
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = setInterval(() => { void fetchMessages(); }, 15000);
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [open, fetchMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage() {
    const text = input.trim();
    if (!text || sending) return;
    setSending(true);
    setInput("");
    try {
      const res = await fetch("/api/support-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: sessionId.current,
          senderName: customerName,
          senderRole: "customer",
          message: text,
        }),
      });
      if (res.ok) await fetchMessages();
    } catch { } finally {
      setSending(false);
    }
  }

  function onPointerDown(e: React.PointerEvent<HTMLButtonElement>) {
    isDragging.current = true;
    hasMoved.current = false;
    dragStartY.current = e.clientY;
    dragStartX.current = e.clientX;
    dragStartBtnY.current = btnY ?? (window.innerHeight - 120);
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: React.PointerEvent<HTMLButtonElement>) {
    if (!isDragging.current) return;
    const dy = e.clientY - dragStartY.current;
    const dx = Math.abs(e.clientX - dragStartX.current);
    if (Math.abs(dy) > 4 || dx > 4) hasMoved.current = true;
    const newY = Math.max(60, Math.min(window.innerHeight - BTN_SIZE - 80, dragStartBtnY.current + dy));
    setBtnY(newY);
    if (e.clientX < window.innerWidth / 2) setBtnSide("left");
    else setBtnSide("right");
  }

  function onPointerUp(e: React.PointerEvent<HTMLButtonElement>) {
    isDragging.current = false;
    if (!hasMoved.current) {
      setOpen(true);
      setMinimised(false);
    }
  }

  const btnLeft = btnSide === "left" ? EDGE_MARGIN : undefined;
  const btnRight = btnSide === "right" ? EDGE_MARGIN : undefined;

  return (
    <>
      {!open && btnY !== null && (
        <button
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          style={{
            position: "fixed",
            top: btnY,
            left: btnLeft,
            right: btnRight,
            zIndex: 50,
            touchAction: "none",
            cursor: isDragging.current ? "grabbing" : "grab",
          }}
          className="w-14 h-14 bg-foreground text-background rounded-full shadow-lg flex items-center justify-center hover:opacity-90 transition-opacity select-none"
          aria-label="Open live chat"
        >
          <MessageCircle className="w-6 h-6 pointer-events-none" />
          {unread > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-[10px] flex items-center justify-center font-bold pointer-events-none">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </button>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-[2px]"
            onClick={() => setOpen(false)}
          />

          <div className={cn(
            "relative w-full max-w-sm sm:max-w-md bg-background border border-border shadow-2xl flex flex-col transition-all duration-200",
            minimised ? "h-12" : "h-[520px] max-h-[90vh]"
          )}>
            <div className="flex items-center justify-between px-4 h-12 border-b border-border bg-foreground text-background flex-shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-400" />
                <span className="text-sm font-medium">Affuaa Support</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setMinimised(v => !v)}
                  className="p-1 hover:opacity-70 transition-opacity"
                  aria-label="Minimise"
                >
                  <MinusSquare className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setOpen(false)}
                  className="p-1 hover:opacity-70 transition-opacity"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {!minimised && (
              <>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {loading && (
                    <div className="flex justify-center py-8">
                      <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                    </div>
                  )}
                  {!loading && messages.length === 0 && (
                    <div className="text-center py-8 space-y-2">
                      <MessageCircle className="w-8 h-8 mx-auto text-muted-foreground/40" />
                      <p className="text-sm text-muted-foreground">Hi {customerName.split(" ")[0]}! 👋</p>
                      <p className="text-xs text-muted-foreground">How can we help you today? Send us a message and we'll get back to you shortly.</p>
                    </div>
                  )}
                  {messages.map(msg => (
                    <div
                      key={msg.id}
                      className={cn(
                        "flex",
                        msg.senderRole === "customer" ? "justify-end" : "justify-start"
                      )}
                    >
                      <div className={cn(
                        "max-w-[75%] px-3 py-2 text-sm rounded-sm",
                        msg.senderRole === "customer"
                          ? "bg-foreground text-background"
                          : "bg-muted text-foreground border border-border"
                      )}>
                        {msg.senderRole === "support" && (
                          <p className="text-[10px] font-medium mb-1 opacity-60">Affuaa Support</p>
                        )}
                        <p className="leading-relaxed">{msg.message}</p>
                        <p className={cn(
                          "text-[10px] mt-1",
                          msg.senderRole === "customer" ? "text-background/50 text-right" : "text-muted-foreground"
                        )}>
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={bottomRef} />
                </div>

                <div className="border-t border-border p-3 flex items-end gap-2 flex-shrink-0">
                  <textarea
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        void sendMessage();
                      }
                    }}
                    placeholder="Type a message…"
                    rows={1}
                    className="flex-1 bg-transparent border border-border px-3 py-2 text-sm resize-none focus:outline-none focus:border-foreground/40 transition-colors max-h-24"
                  />
                  <button
                    onClick={() => void sendMessage()}
                    disabled={!input.trim() || sending}
                    className="w-9 h-9 bg-foreground text-background flex items-center justify-center hover:opacity-80 transition-opacity disabled:opacity-30 flex-shrink-0"
                  >
                    {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

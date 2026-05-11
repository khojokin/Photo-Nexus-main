import { useState, useEffect, useRef, useCallback } from "react";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Send, MessageSquare, User, ArrowLeft, Trash2, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, isToday, isYesterday } from "date-fns";

const NAME_KEY = "affuaa_display_name";

const QUICK_EMOJIS = ["❤️", "😂", "😮", "😢", "🔥", "👏"];

interface Reaction {
  emoji: string;
  reactors: string[];
}

interface Message {
  id: number;
  senderName: string;
  recipientName: string;
  content: string;
  read: boolean;
  createdAt: string;
  reactions: Reaction[];
}

interface Conversation {
  partner: string;
  lastMessage: string;
  lastAt: string;
  unread: number;
}

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  if (isToday(d)) return format(d, "h:mm a");
  if (isYesterday(d)) return "Yesterday";
  return format(d, "MMM d");
}

function useMessages(myName: string) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(false);

  async function loadConversations() {
    if (!myName) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/messages?name=${encodeURIComponent(myName)}`);
      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations ?? []);
      }
    } finally {
      setLoading(false);
    }
  }

  return { conversations, loading, loadConversations, setConversations };
}

function useThread(myName: string, partner: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  async function loadThread(silent = false) {
    if (!myName || !partner) return;
    if (!silent) setLoading(true);
    try {
      const res = await fetch(
        `/api/messages/${encodeURIComponent(partner)}?name=${encodeURIComponent(myName)}`
      );
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages ?? []);
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }

  // Poll the thread every 4 s so read receipts and reactions stay fresh
  useEffect(() => {
    if (!myName || !partner) return;
    pollRef.current = setInterval(() => void loadThread(true), 4_000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [myName, partner]);

  async function sendMessage(content: string): Promise<Message | null> {
    const res = await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ senderName: myName, recipientName: partner, content }),
    });
    if (res.ok || res.status === 201) {
      const msg: Message = await res.json();
      setMessages((prev) => [...prev, msg]);
      return msg;
    }
    return null;
  }

  async function deleteMessage(id: number) {
    const res = await fetch(
      `/api/messages/${id}?name=${encodeURIComponent(myName)}`,
      { method: "DELETE" }
    );
    if (res.status === 204 || res.ok) {
      setMessages((prev) => prev.filter((m) => m.id !== id));
    }
  }

  async function toggleReaction(messageId: number, emoji: string) {
    const res = await fetch(`/api/messages/${messageId}/react`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reactorName: myName, emoji }),
    });
    if (res.ok) {
      const data = await res.json() as { reactions: Reaction[] };
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, reactions: data.reactions } : m))
      );
    }
  }

  return { messages, loading, loadThread, sendMessage, deleteMessage, toggleReaction };
}

// Handles both signalling that the local user is typing and polling for the partner
function useTypingIndicator(myName: string, partner: string) {
  const [partnerIsTyping, setPartnerIsTyping] = useState(false);
  const lastSignalRef = useRef(0);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Throttled: only send a typing signal at most every 2 seconds
  const signalTyping = useCallback(() => {
    if (!myName || !partner) return;
    const now = Date.now();
    if (now - lastSignalRef.current < 2_000) return;
    lastSignalRef.current = now;
    fetch("/api/messages/typing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ senderName: myName, recipientName: partner }),
    }).catch(() => { /* non-critical */ });
  }, [myName, partner]);

  // Poll every 1.5 s to check if partner is typing
  useEffect(() => {
    if (!myName || !partner) {
      setPartnerIsTyping(false);
      return;
    }

    const check = async () => {
      try {
        const res = await fetch(
          `/api/messages/typing?from=${encodeURIComponent(partner)}&to=${encodeURIComponent(myName)}`
        );
        if (res.ok) {
          const data = await res.json() as { isTyping: boolean };
          setPartnerIsTyping(data.isTyping);
        }
      } catch { /* ignore */ }
    };

    void check();
    pollRef.current = setInterval(() => void check(), 1_500);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      setPartnerIsTyping(false);
    };
  }, [myName, partner]);

  return { partnerIsTyping, signalTyping };
}

function TypingBubble({ name }: { name: string }) {
  return (
    <div className="flex gap-2 justify-start items-end">
      <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs flex-shrink-0">
        {name.charAt(0)}
      </div>
      <div className="bg-muted px-4 py-3 flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:0ms]" />
        <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:160ms]" />
        <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:320ms]" />
      </div>
    </div>
  );
}

function EmojiPicker({
  onPick,
  isMine,
}: {
  onPick: (emoji: string) => void;
  isMine: boolean;
}) {
  return (
    <div
      className={cn(
        "absolute -top-9 flex items-center gap-0.5 bg-card border border-border shadow-md px-1.5 py-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto",
        isMine ? "right-0" : "left-0"
      )}
    >
      {QUICK_EMOJIS.map((emoji) => (
        <button
          key={emoji}
          onClick={(e) => { e.stopPropagation(); onPick(emoji); }}
          className="text-base leading-none hover:scale-125 transition-transform p-0.5"
          aria-label={`React with ${emoji}`}
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}

function ReactionPills({
  reactions,
  myName,
  onToggle,
}: {
  reactions: Reaction[];
  myName: string;
  onToggle: (emoji: string) => void;
}) {
  if (reactions.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {reactions.map((r) => {
        const iReacted = r.reactors.includes(myName);
        return (
          <button
            key={r.emoji}
            onClick={() => onToggle(r.emoji)}
            title={r.reactors.join(", ")}
            className={cn(
              "flex items-center gap-0.5 px-1.5 py-0.5 text-xs border transition-colors",
              iReacted
                ? "border-foreground/40 bg-foreground/10"
                : "border-border bg-transparent hover:bg-muted/50"
            )}
          >
            <span>{r.emoji}</span>
            <span className="text-[10px] text-muted-foreground">{r.reactors.length}</span>
          </button>
        );
      })}
    </div>
  );
}

function NameSetup({ onSet, pendingTo }: { onSet: (name: string) => void; pendingTo: string | null }) {
  const [value, setValue] = useState("");

  return (
    <Layout>
      <div className="container mx-auto px-4 py-32 max-w-md text-center">
        <MessageSquare className="w-12 h-12 mx-auto mb-6 text-muted-foreground opacity-40" />
        <h1 className="text-3xl font-serif mb-3">Your Messages</h1>
        {pendingTo ? (
          <p className="text-muted-foreground text-sm mb-8">
            Choose a display name to start chatting with <span className="text-foreground font-medium">{pendingTo}</span>.
          </p>
        ) : (
          <p className="text-muted-foreground text-sm mb-8">
            Choose a display name to send and receive messages. This name identifies you in conversations.
          </p>
        )}
        <div className="flex gap-2">
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && value.trim()) onSet(value.trim()); }}
            placeholder="e.g. Hiroshi Nakamura"
            maxLength={80}
            className="flex-1 bg-transparent border border-border px-4 py-3 text-sm focus:outline-none focus:border-foreground transition-colors"
          />
          <Button
            onClick={() => value.trim() && onSet(value.trim())}
            disabled={!value.trim()}
            className="rounded-none h-12 px-6"
          >
            Continue
          </Button>
        </div>
      </div>
    </Layout>
  );
}

function NewConversationModal({
  onSend,
  onClose,
}: {
  onSend: (recipient: string) => void;
  onClose: () => void;
}) {
  const [to, setTo] = useState("");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-card border border-border w-full max-w-sm mx-4">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h3 className="font-serif text-lg">New Message</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs uppercase tracking-widest text-muted-foreground">To (photographer name)</label>
            <input
              autoFocus
              type="text"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && to.trim()) { onSend(to.trim()); onClose(); } }}
              placeholder="e.g. Aria Chen"
              className="w-full bg-transparent border border-border px-3 py-2.5 text-sm focus:outline-none focus:border-foreground transition-colors"
            />
          </div>
          <Button
            onClick={() => { if (to.trim()) { onSend(to.trim()); onClose(); } }}
            disabled={!to.trim()}
            className="w-full rounded-none"
          >
            Start Conversation
          </Button>
        </div>
      </div>
    </div>
  );
}

export function Messages() {
  const pendingToRef = useRef<string | null>(
    new URLSearchParams(window.location.search).get("to")
  );

  const [myName, setMyName] = useState(() => localStorage.getItem(NAME_KEY) ?? "");
  const [activePartner, setActivePartner] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [mobileView, setMobileView] = useState<"list" | "thread">("list");
  const bottomRef = useRef<HTMLDivElement>(null);

  const { conversations, loading: convLoading, loadConversations, setConversations } = useMessages(myName);
  const { messages, loading: threadLoading, loadThread, sendMessage, deleteMessage, toggleReaction } = useThread(myName, activePartner ?? "");
  const { partnerIsTyping, signalTyping } = useTypingIndicator(myName, activePartner ?? "");

  function handleSetName(name: string) {
    localStorage.setItem(NAME_KEY, name);
    setMyName(name);
  }

  useEffect(() => {
    if (!myName) return;
    loadConversations().then(() => {
      const to = pendingToRef.current;
      if (to) {
        pendingToRef.current = null;
        window.history.replaceState(null, "", "/messages");
        setConversations((prev) => {
          if (prev.find((c) => c.partner === to)) return prev;
          return [{ partner: to, lastMessage: "", lastAt: new Date().toISOString(), unread: 0 }, ...prev];
        });
        setActivePartner(to);
        setMobileView("thread");
      }
    });
  }, [myName]);

  useEffect(() => {
    if (myName && activePartner) void loadThread();
  }, [myName, activePartner]);

  // Scroll to bottom when messages or typing state changes
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, partnerIsTyping]);

  if (!myName) return <NameSetup onSet={handleSetName} pendingTo={pendingToRef.current} />;

  async function handleSend() {
    if (!draft.trim() || !activePartner || sending) return;
    setSending(true);
    const content = draft.trim();
    const msg = await sendMessage(content);
    if (msg) {
      setDraft("");
      setConversations((prev) => {
        const existing = prev.find((c) => c.partner === activePartner);
        if (existing) {
          return prev.map((c) =>
            c.partner === activePartner
              ? { ...c, lastMessage: content, lastAt: new Date().toISOString() }
              : c
          );
        }
        return [{ partner: activePartner!, lastMessage: content, lastAt: new Date().toISOString(), unread: 0 }, ...prev];
      });
    }
    setSending(false);
  }

  function openConversation(partner: string) {
    setActivePartner(partner);
    setMobileView("thread");
  }

  function handleNewConversation(recipient: string) {
    if (!conversations.find((c) => c.partner === recipient)) {
      setConversations((prev) => [
        { partner: recipient, lastMessage: "", lastAt: new Date().toISOString(), unread: 0 },
        ...prev,
      ]);
    }
    openConversation(recipient);
  }

  return (
    <Layout>
      {showNew && (
        <NewConversationModal
          onSend={handleNewConversation}
          onClose={() => setShowNew(false)}
        />
      )}

      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-serif">Messages</h1>
            <p className="text-xs text-muted-foreground mt-1">
              Messaging as <span className="text-foreground font-medium">{myName}</span>
              <button
                onClick={() => { localStorage.removeItem(NAME_KEY); setMyName(""); }}
                className="ml-2 underline underline-offset-2 hover:text-foreground transition-colors"
              >
                Change
              </button>
            </p>
          </div>
          <Button onClick={() => setShowNew(true)} className="rounded-none gap-2 h-9 px-4 text-sm">
            <Plus className="w-4 h-4" />
            New Message
          </Button>
        </div>

        <div className="border border-border overflow-hidden" style={{ height: "calc(100vh - 280px)", minHeight: 400 }}>
          <div className="flex h-full">
            {/* Sidebar — conversation list */}
            <div className={cn(
              "w-full md:w-72 border-r border-border flex flex-col flex-shrink-0",
              mobileView === "thread" && "hidden md:flex"
            )}>
              <div className="border-b border-border px-4 py-3">
                <p className="text-xs uppercase tracking-widest text-muted-foreground">Conversations</p>
              </div>
              <div className="flex-1 overflow-y-auto">
                {convLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="w-5 h-5 rounded-full border-2 border-muted border-t-foreground animate-spin" />
                  </div>
                ) : conversations.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                    <MessageSquare className="w-8 h-8 mb-3 text-muted-foreground opacity-30" />
                    <p className="text-sm text-muted-foreground">No conversations yet.</p>
                    <button
                      onClick={() => setShowNew(true)}
                      className="mt-3 text-xs underline underline-offset-2 text-muted-foreground hover:text-foreground"
                    >
                      Start one
                    </button>
                  </div>
                ) : (
                  conversations.map((conv) => (
                    <button
                      key={conv.partner}
                      onClick={() => openConversation(conv.partner)}
                      className={cn(
                        "w-full text-left px-4 py-3.5 border-b border-border/50 hover:bg-muted/30 transition-colors",
                        activePartner === conv.partner && "bg-muted/40"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-serif flex-shrink-0">
                          {conv.partner.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-medium truncate">{conv.partner}</p>
                            <span className="text-xs text-muted-foreground flex-shrink-0">{formatTime(conv.lastAt)}</span>
                          </div>
                          {activePartner === conv.partner && partnerIsTyping ? (
                            <p className="text-xs text-muted-foreground mt-0.5 italic">typing…</p>
                          ) : (
                            <p className="text-xs text-muted-foreground truncate mt-0.5">{conv.lastMessage}</p>
                          )}
                        </div>
                        {conv.unread > 0 && (
                          <span className="flex-shrink-0 w-4 h-4 rounded-full bg-foreground text-background text-[10px] flex items-center justify-center font-medium">
                            {conv.unread}
                          </span>
                        )}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Main thread area */}
            <div className={cn(
              "flex-1 flex flex-col min-w-0",
              mobileView === "list" && "hidden md:flex"
            )}>
              {!activePartner ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
                  <User className="w-10 h-10 mb-4 text-muted-foreground opacity-20" />
                  <p className="text-muted-foreground text-sm">Select a conversation or start a new one.</p>
                </div>
              ) : (
                <>
                  {/* Thread header */}
                  <div className="border-b border-border px-4 py-3 flex items-center gap-3 flex-shrink-0">
                    <button onClick={() => setMobileView("list")} className="md:hidden text-muted-foreground hover:text-foreground mr-1">
                      <ArrowLeft className="w-4 h-4" />
                    </button>
                    <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-xs font-serif">
                      {activePartner.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm leading-tight">{activePartner}</p>
                      {partnerIsTyping && (
                        <p className="text-[11px] text-muted-foreground leading-tight animate-pulse">
                          typing…
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                    {threadLoading ? (
                      <div className="flex items-center justify-center py-12">
                        <div className="w-5 h-5 rounded-full border-2 border-muted border-t-foreground animate-spin" />
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground text-sm">
                        No messages yet. Say hello!
                      </div>
                    ) : (
                      (() => {
                        const lastMineIdx = messages.reduce(
                          (acc, msg, i) => (msg.senderName === myName ? i : acc),
                          -1,
                        );
                        return messages.map((msg, idx) => {
                          const isMine = msg.senderName === myName;
                          const showSeen = isMine && idx === lastMineIdx && msg.read;
                          return (
                            <div key={msg.id} className={cn("flex gap-2 group", isMine ? "justify-end" : "justify-start")}>
                              {!isMine && (
                                <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs flex-shrink-0 mt-1">
                                  {msg.senderName.charAt(0)}
                                </div>
                              )}
                              <div className={cn("max-w-[70%]", isMine ? "items-end" : "items-start", "flex flex-col")}>
                                {/* Bubble + emoji picker */}
                                <div className="relative">
                                  <EmojiPicker
                                    isMine={isMine}
                                    onPick={(emoji) => void toggleReaction(msg.id, emoji)}
                                  />
                                  <div className={cn(
                                    "px-3.5 py-2.5 text-sm leading-relaxed",
                                    isMine ? "bg-foreground text-background" : "bg-muted text-foreground"
                                  )}>
                                    {msg.content}
                                  </div>
                                </div>

                                {/* Reaction pills */}
                                <ReactionPills
                                  reactions={msg.reactions}
                                  myName={myName}
                                  onToggle={(emoji) => void toggleReaction(msg.id, emoji)}
                                />

                                {/* Timestamp + delete */}
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-[10px] text-muted-foreground">{format(new Date(msg.createdAt), "h:mm a")}</span>
                                  {isMine && (
                                    <button
                                      onClick={() => void deleteMessage(msg.id)}
                                      className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
                                      aria-label="Delete"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  )}
                                </div>

                                {/* Seen receipt */}
                                {showSeen && (
                                  <span className="text-[10px] text-muted-foreground/70 select-none">
                                    Seen
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        });
                      })()
                    )}

                    {/* Typing indicator bubble — shown after the last message */}
                    {partnerIsTyping && !threadLoading && (
                      <TypingBubble name={activePartner} />
                    )}

                    <div ref={bottomRef} />
                  </div>

                  {/* Compose box */}
                  <div className="border-t border-border px-4 py-3 flex-shrink-0">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={draft}
                        onChange={(e) => { setDraft(e.target.value); signalTyping(); }}
                        onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void handleSend(); } }}
                        placeholder={`Message ${activePartner}…`}
                        className="flex-1 bg-transparent border border-border px-4 py-2.5 text-sm focus:outline-none focus:border-foreground transition-colors"
                      />
                      <Button
                        onClick={() => void handleSend()}
                        disabled={!draft.trim() || sending}
                        className="rounded-none h-10 w-10 p-0 flex items-center justify-center flex-shrink-0"
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

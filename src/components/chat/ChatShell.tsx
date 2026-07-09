import { useEffect, useMemo, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { Link, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { AVAILABLE_MODELS, DEFAULT_MODEL } from "@/lib/models";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import { Plus, Send, Sparkles, Trash2, Settings, LogOut, MessageSquare, Puzzle } from "lucide-react";
import {
  Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue,
} from "@/components/ui/select";

type ThreadRow = { id: string; title: string; model: string; updated_at: string };
type DbMessage = { id: string; role: string; parts: unknown; created_at: string };

export function ChatShell({ threadId }: { threadId: string }) {
  const navigate = useNavigate();
  const [threads, setThreads] = useState<ThreadRow[]>([]);
  const [model, setModel] = useState<string>(DEFAULT_MODEL);
  const [initialMessages, setInitialMessages] = useState<UIMessage[] | null>(null);
  const [input, setInput] = useState("");
  const [token, setToken] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load session token + threads list
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setToken(data.session?.access_token ?? null));
    refreshThreads();
  }, []);

  async function refreshThreads() {
    const { data } = await supabase
      .from("threads")
      .select("id,title,model,updated_at")
      .order("updated_at", { ascending: false });
    setThreads((data ?? []) as ThreadRow[]);
  }

  // Load thread messages + model
  useEffect(() => {
    (async () => {
      const { data: t } = await supabase.from("threads").select("model").eq("id", threadId).maybeSingle();
      if (t?.model) setModel(t.model);
      const { data: msgs } = await supabase
        .from("messages")
        .select("id,role,parts,created_at")
        .eq("thread_id", threadId)
        .order("created_at", { ascending: true });
      const ui: UIMessage[] = ((msgs ?? []) as DbMessage[]).map((m) => ({
        id: m.id,
        role: m.role as UIMessage["role"],
        parts: Array.isArray(m.parts) ? (m.parts as UIMessage["parts"]) : [{ type: "text", text: String(m.parts ?? "") }],
      }));
      setInitialMessages(ui);
    })();
  }, [threadId]);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: { model, threadId },
      }),
    [token, model, threadId],
  );

  const { messages, sendMessage, status, error, stop } = useChat({
    id: threadId,
    messages: initialMessages ?? [],
    transport,
    onError: (err) => toast.error(err.message || "Chat error"),
    onFinish: () => refreshThreads(),
  });

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, status]);

  useEffect(() => {
    if (status !== "streaming") textareaRef.current?.focus();
  }, [status, threadId]);

  const busy = status === "submitted" || status === "streaming";

  async function handleSend() {
    const text = input.trim();
    if (!text || busy || !token) return;
    setInput("");
    // Auto-title first message
    const isFirst = messages.length === 0;
    if (isFirst) {
      const title = text.slice(0, 60);
      await supabase.from("threads").update({ title, model }).eq("id", threadId);
      refreshThreads();
    } else {
      await supabase.from("threads").update({ model }).eq("id", threadId);
    }
    sendMessage({ text });
  }

  async function newThread() {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const { data, error } = await supabase
      .from("threads")
      .insert({ user_id: u.user.id, model })
      .select("id")
      .single();
    if (error) { toast.error(error.message); return; }
    refreshThreads();
    navigate({ to: "/chat/$threadId", params: { threadId: data.id } });
  }

  async function deleteThread(id: string) {
    const { error } = await supabase.from("threads").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    if (id === threadId) {
      const remaining = threads.filter((t) => t.id !== id);
      if (remaining[0]) navigate({ to: "/chat/$threadId", params: { threadId: remaining[0].id } });
      else navigate({ to: "/chat" });
    } else {
      refreshThreads();
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  }

  return (
    <div className="h-screen flex bg-background text-foreground">
      {/* Sidebar */}
      <aside className="w-72 border-r border-border bg-sidebar flex flex-col shrink-0">
        <div className="p-4 border-b border-sidebar-border">
          <Link to="/" className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-primary" />
            <span className="font-semibold tracking-tight">Nexus</span>
          </Link>
          <Button onClick={newThread} className="w-full" size="sm">
            <Plus className="w-4 h-4 mr-1.5" /> New chat
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {threads.map((t) => (
            <div
              key={t.id}
              className={`group flex items-center gap-2 rounded-lg px-2 py-2 text-sm cursor-pointer transition-colors ${
                t.id === threadId ? "bg-sidebar-accent text-sidebar-accent-foreground" : "hover:bg-sidebar-accent/50 text-sidebar-foreground/80"
              }`}
              onClick={() => navigate({ to: "/chat/$threadId", params: { threadId: t.id } })}
            >
              <MessageSquare className="w-3.5 h-3.5 shrink-0 opacity-60" />
              <span className="truncate flex-1">{t.title || "New chat"}</span>
              <button
                onClick={(e) => { e.stopPropagation(); deleteThread(t.id); }}
                className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                aria-label="Delete thread"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
          {threads.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-6">No chats yet</p>
          )}
        </div>
        <div className="p-2 border-t border-sidebar-border flex flex-col gap-1">
          <Button variant="ghost" size="sm" className="justify-start" asChild>
            <Link to="/skills"><Puzzle className="w-4 h-4 mr-2" /> Skills & Plugins</Link>
          </Button>
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" className="flex-1 justify-start" asChild>
              <Link to="/settings"><Settings className="w-4 h-4 mr-2" /> Settings</Link>
            </Button>
            <Button variant="ghost" size="sm" onClick={signOut} aria-label="Sign out">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b border-border px-4 flex items-center justify-between shrink-0">
          <Select value={model} onValueChange={setModel}>
            <SelectTrigger className="w-64 h-9 bg-transparent border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Google</SelectLabel>
                {AVAILABLE_MODELS.filter((m) => m.provider === "Google").map((m) => (
                  <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                ))}
              </SelectGroup>
              <SelectGroup>
                <SelectLabel>OpenAI</SelectLabel>
                {AVAILABLE_MODELS.filter((m) => m.provider === "OpenAI").map((m) => (
                  <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          {busy && (
            <Button variant="ghost" size="sm" onClick={() => stop()}>Stop</Button>
          )}
        </header>

        <div ref={listRef} className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
            {messages.length === 0 && (
              <div className="text-center py-24">
                <Sparkles className="w-8 h-8 text-primary mx-auto mb-3" />
                <h2 className="text-2xl font-semibold mb-2">What can I help with?</h2>
                <p className="text-sm text-muted-foreground">Ask anything. Switch models anytime.</p>
              </div>
            )}
            {messages.map((m) => (
              <MessageRow key={m.id} message={m} />
            ))}
            {status === "submitted" && (
              <div className="flex gap-3">
                <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center shrink-0"><Sparkles className="w-4 h-4 text-primary" /></div>
                <div className="text-sm text-muted-foreground pt-1">Thinking…</div>
              </div>
            )}
            {error && <div className="text-sm text-destructive">{error.message}</div>}
          </div>
        </div>

        <div className="border-t border-border p-4">
          <div className="max-w-3xl mx-auto">
            <div className="relative bg-card border border-border rounded-2xl focus-within:border-primary/50 transition-colors">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
                }}
                placeholder="Message Nexus…"
                rows={1}
                className="resize-none border-0 bg-transparent focus-visible:ring-0 min-h-[52px] max-h-40 pr-14"
                disabled={!token}
              />
              <Button
                size="icon"
                className="absolute right-2 bottom-2 h-9 w-9 rounded-lg"
                onClick={handleSend}
                disabled={busy || !input.trim() || !token}
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground text-center mt-2">
              Free tier: 30 messages / 24h · Nexus can make mistakes, verify important info.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

function MessageRow({ message }: { message: UIMessage }) {
  const isUser = message.role === "user";
  const text = message.parts
    .map((p) => (p.type === "text" ? p.text : ""))
    .join("");
  return (
    <div className={`flex gap-3 ${isUser ? "" : ""}`}>
      <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${isUser ? "bg-muted" : "bg-primary/20"}`}>
        {isUser ? <span className="text-xs font-medium">You</span> : <Sparkles className="w-4 h-4 text-primary" />}
      </div>
      <div className={`flex-1 min-w-0 ${isUser ? "text-foreground" : "text-foreground"}`}>
        <div className="text-xs text-muted-foreground mb-1">{isUser ? "You" : "Assistant"}</div>
        <div className="prose-chat text-[15px]">
          <ReactMarkdown>{text}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
}

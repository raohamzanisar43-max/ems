import { useEffect, useRef, useState } from "react";
import api from "../api/client";
import { useAuth } from "../context/useAuth";
import { usePaginatedList } from "../hooks/usePaginatedList";
import { PageHeader, Card, EmptyState, Loading, ErrorBanner, Button, Pagination, Avatar } from "../components/ui";

export default function Chat() {
  const { user } = useAuth();
  const {
    items: conversations, page, count, hasNext, hasPrevious, loading, error, setError, goToPage, reload: reloadConversations,
  } = usePaginatedList("/api/chat/conversations/", "Couldn't load chat.");
  const [active, setActive] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [newForm, setNewForm] = useState({ other_user_id: "", task_id: "" });
  const messagesEndRef = useRef(null);

  async function loadMessages(conversationId) {
    try {
      const { data } = await api.get(`/api/chat/messages/?conversation=${conversationId}`);
      setMessages(data.results || data);
    } catch {
      setError("Couldn't load messages.");
    }
  }

  useEffect(() => {
    if (active) loadMessages(active.id);
  }, [active]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(e) {
    e.preventDefault();
    if (!text.trim()) return;
    try {
      await api.post("/api/chat/messages/", { conversation: active.id, text });
      setText("");
      loadMessages(active.id);
    } catch {
      setError("Couldn't send that message.");
    }
  }

  async function handleNewConversation(e) {
    e.preventDefault();
    try {
      const { data } = await api.post("/api/chat/conversations/", {
        participant_ids: [user.id, Number(newForm.other_user_id)],
        department_id: user.department_id,
        task_id: newForm.task_id ? Number(newForm.task_id) : null,
      });
      setShowNew(false);
      setNewForm({ other_user_id: "", task_id: "" });
      reloadConversations();
      setActive(data);
    } catch {
      setError("Couldn't start that conversation.");
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Direct"
        title="Chat"
        icon="fa-solid fa-comments"
        action={
          <Button onClick={() => setShowNew((s) => !s)}>
            <i className={`fa-solid ${showNew ? "fa-xmark" : "fa-plus"}`}></i>
            {showNew ? "Cancel" : "New conversation"}
          </Button>
        }
      />

      <ErrorBanner message={error} />

      {showNew && (
        <Card className="p-5 mb-6">
          <form onSubmit={handleNewConversation} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-muted mb-1.5">Other person's user ID</label>
              <input required type="number" className="w-full bg-panel2 border border-line rounded-lg px-3 py-2 text-ink outline-none focus:border-signal"
                value={newForm.other_user_id} onChange={(e) => setNewForm({ ...newForm, other_user_id: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs text-muted mb-1.5">Related task ID (optional)</label>
              <input type="number" className="w-full bg-panel2 border border-line rounded-lg px-3 py-2 text-ink outline-none focus:border-signal"
                value={newForm.task_id} onChange={(e) => setNewForm({ ...newForm, task_id: e.target.value })} />
            </div>
            <div className="sm:col-span-2">
              <Button type="submit"><i className="fa-solid fa-comment-dots"></i> Start conversation</Button>
            </div>
          </form>
        </Card>
      )}

      {loading ? (
        <Loading />
      ) : conversations.length === 0 ? (
        <EmptyState icon="fa-solid fa-comments" title="No conversations yet" hint="Start one to discuss a task with your lead or team." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="col-span-1">
            <Card className="divide-y divide-line overflow-hidden">
              {conversations.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setActive(c)}
                  className={`w-full text-left px-4 py-3.5 flex items-center gap-3 hover:bg-panel2/50 transition-colors ${
                    active?.id === c.id ? "bg-panel2" : ""
                  }`}
                >
                  <Avatar name={c.task_id ? `Task ${c.task_id}` : `Conversation ${c.id}`} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-ink truncate">
                      {c.task_id ? `Task #${c.task_id}` : `Conversation #${c.id}`}
                    </p>
                    <p className="text-xs text-muted mt-0.5 truncate">
                      {c.last_message?.text || "No messages yet"}
                    </p>
                  </div>
                </button>
              ))}
            </Card>
            <Pagination page={page} count={count} hasNext={hasNext} hasPrevious={hasPrevious} onPageChange={goToPage} />
          </div>

          <Card className="col-span-1 md:col-span-2 flex flex-col h-[500px]">
            {!active ? (
              <EmptyState icon="fa-solid fa-comment-dots" title="Select a conversation" />
            ) : (
              <>
                <div className="border-b border-line px-4 py-3 flex items-center gap-2.5">
                  <Avatar name={active.task_id ? `Task ${active.task_id}` : `Conversation ${active.id}`} />
                  <p className="text-sm font-semibold text-ink">
                    {active.task_id ? `Task #${active.task_id}` : `Conversation #${active.id}`}
                  </p>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {messages.map((m) => (
                    <div
                      key={m.id}
                      className={`max-w-[75%] ${
                        m.sender_id === user.id ? "ml-auto" : ""
                      }`}
                    >
                      <div
                        className={`rounded-xl px-3.5 py-2 text-sm shadow-sm ${
                          m.sender_id === user.id
                            ? "bg-signal text-white"
                            : "bg-panel2 text-ink"
                        }`}
                      >
                        {m.text}
                      </div>
                      <p className={`text-[10px] text-muted mt-1 px-1 ${m.sender_id === user.id ? "text-right" : ""}`}>
                        {m.sender_username} · {new Date(m.sent_at).toLocaleTimeString()}
                      </p>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
                <form onSubmit={handleSend} className="border-t border-line p-3 flex gap-2">
                  <input
                    className="flex-1 bg-panel2 border border-line rounded-lg px-3 py-2 text-sm text-ink outline-none focus:border-signal"
                    placeholder="Write a message…"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                  />
                  <Button type="submit"><i className="fa-solid fa-paper-plane"></i></Button>
                </form>
              </>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}

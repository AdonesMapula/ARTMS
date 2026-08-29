import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MessageSquare, Search, Send, Users, ChevronLeft, Circle, Paperclip, Image as ImageIcon } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import messageService from "../../services/messageService";
import Badge from "../ui/Badge";
import { Skeleton } from "../ui/Skeleton";
import SearchBar from "../ui/SearchBar";

const ROLE_TONE = {
  super_admin: "danger",
  hr_admin: "info",
  coo: "accent",
  department_head: "warning",
  employee: "default",
};

const ROLE_LABEL = {
  super_admin: "Super Admin",
  hr_admin: "HR Admin",
  coo: "COO",
  department_head: "Dept Head",
  employee: "Employee",
};

function getDisplayName(user) {
  if (!user) return "Unknown";
  const parts = [user.first_name, user.last_name].filter(Boolean);
  return parts.length > 0 ? parts.join(" ") : user.name || user.email || "Unknown";
}

function getInitials(user) {
  const name = getDisplayName(user);
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function Messages({ sectionLabel = "Communication" }) {
  const { user: authUser } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [activePartnerId, setActivePartnerId] = useState(null);
  const [thread, setThread] = useState([]);
  const [partner, setPartner] = useState(null);
  const [compose, setCompose] = useState("");
  const [search, setSearch] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingConvos, setLoadingConvos] = useState(true);
  const [loadingThread, setLoadingThread] = useState(false);
  const [showUserList, setShowUserList] = useState(false);
  const [mobileShowThread, setMobileShowThread] = useState(false);
  const threadEndRef = useRef(null);

  // Load conversations
  const loadConversations = useCallback(() => {
    messageService.getConversations()
      .then((res) => setConversations(res.data.conversations || []))
      .catch(() => {})
      .finally(() => setLoadingConvos(false));
  }, []);

  // Load all users for new conversation
  const loadUsers = useCallback(() => {
    messageService.getUsers()
      .then((res) => setAllUsers(res.data.users || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    loadConversations();
    loadUsers();
  }, [loadConversations, loadUsers]);

  // Poll conversations every 10s
  useEffect(() => {
    const interval = setInterval(loadConversations, 10000);
    return () => clearInterval(interval);
  }, [loadConversations]);

  // Load thread when partner selected
  useEffect(() => {
    if (!activePartnerId) return;
    setLoadingThread(true);
    messageService.getThread(activePartnerId)
      .then((res) => {
        setThread(res.data.messages || []);
        setPartner(res.data.partner || null);
      })
      .catch(() => {})
      .finally(() => setLoadingThread(false));
  }, [activePartnerId]);

  // Poll active thread every 5s
  useEffect(() => {
    if (!activePartnerId) return;
    const interval = setInterval(() => {
      messageService.getThread(activePartnerId)
        .then((res) => {
          setThread(res.data.messages || []);
        })
        .catch(() => {});
    }, 5000);
    return () => clearInterval(interval);
  }, [activePartnerId]);

  // Auto-scroll
  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [thread]);

  const handleSelectPartner = (id) => {
    setActivePartnerId(id);
    setMobileShowThread(true);
    setShowUserList(false);
    setSearch("");
    // Refresh conversations to update unread counts
    loadConversations();
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!compose.trim() || !activePartnerId || sending) return;
    setSending(true);
    try {
      const res = await messageService.sendMessage(activePartnerId, compose.trim());
      setThread((prev) => [...prev, res.data.message]);
      setCompose("");
      loadConversations();
    } catch {
      // handle error silently
    } finally {
      setSending(false);
    }
  };

  // Filter conversations by search
  const filteredConversations = useMemo(() => {
    if (!search.trim()) return conversations;
    const q = search.toLowerCase();
    return conversations.filter((c) => {
      const name = getDisplayName(c.partner).toLowerCase();
      const email = (c.partner?.email || "").toLowerCase();
      return name.includes(q) || email.includes(q);
    });
  }, [conversations, search]);

  // Filter all users by search (for new conversation)
  const filteredUsers = useMemo(() => {
    const existingPartnerIds = new Set(conversations.map((c) => c.partner?.id));
    let users = allUsers.filter((u) => !existingPartnerIds.has(u.id) && u.id !== authUser?.id);
    if (search.trim()) {
      const q = search.toLowerCase();
      users = users.filter((u) => {
        const name = getDisplayName(u).toLowerCase();
        const email = (u.email || "").toLowerCase();
        return name.includes(q) || email.includes(q);
      });
    }
    return users;
  }, [allUsers, conversations, search, authUser]);

  const totalUnread = conversations.reduce((sum, c) => sum + (c.unread_count || 0), 0);

  return (
    <div className="-mx-4 -mt-6 sm:-mx-6 sm:-mt-8 lg:-mx-8 lg:-mt-10 -mb-4 sm:-mb-6 lg:-mb-8 flex bg-white" style={{ height: "calc(100vh - 73px)" }}>
      {/* LEFT PANEL — Conversation List */}
      <div className={`w-full sm:w-80 lg:w-[400px] border-r border-slate-200 flex flex-col shrink-0 bg-white ${mobileShowThread ? "hidden sm:flex" : "flex"}`}>
        
        {/* Sidebar Header */}
        <div className="px-5 pt-5 pb-4 border-b border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-black tracking-tight text-[#111A62]">Messages</h1>
              <p className="text-xs font-bold text-[#E15B1D] uppercase tracking-wider mt-0.5">{sectionLabel}</p>
            </div>
            {totalUnread > 0 && (
              <div className="h-6 w-6 rounded-full bg-[#E15B1D] text-white flex items-center justify-center text-[10px] font-black shadow-md shadow-[#E15B1D]/20 shrink-0">
                {totalUnread}
              </div>
            )}
          </div>
          <div className="space-y-3 mt-4">
            <SearchBar
              value={search}
              onChange={setSearch}
              placeholder={showUserList ? "Search users..." : "Search conversations..."}
              icon={Search}
            />
            <button
              onClick={() => {
                setShowUserList(!showUserList);
                setSearch("");
              }}
              className="flex items-center gap-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 hover:border-[#111A62]/30 hover:text-[#111A62] transition-all cursor-pointer"
            >
              <Users size={14} />
              {showUserList ? "Back to Conversations" : "New Conversation"}
            </button>
          </div>
        </div>

        {/* Conversation List / User List */}
        <div className="flex-1 overflow-y-auto">
          {loadingConvos ? (
            <div className="p-4 space-y-3">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
            </div>
          ) : showUserList ? (
            // All Users List
            <div className="p-2">
              {filteredUsers.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400 font-medium">No users available</div>
              ) : (
                filteredUsers.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => handleSelectPartner(u.id)}
                    className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-slate-50 transition-all cursor-pointer text-left group"
                  >
                    {u.avatar ? (
                      <img src={u.avatar} alt="" className="h-10 w-10 rounded-full object-cover border border-slate-200 shrink-0" />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-[#111A62]/10 text-[#111A62] flex items-center justify-center text-xs font-black shrink-0 ring-1 ring-[#111A62]/20">
                        {getInitials(u)}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-extrabold text-slate-900 truncate group-hover:text-[#111A62] transition-colors">{getDisplayName(u)}</p>
                      <p className="text-[10px] font-semibold text-slate-400 truncate">{u.email}</p>
                    </div>
                    <Badge tone={ROLE_TONE[u.role] || "default"} className="text-[9px] font-black px-2 py-0.5 shrink-0">
                      {ROLE_LABEL[u.role] || u.role}
                    </Badge>
                  </button>
                ))
              )}
            </div>
          ) : (
            // Conversations List
            <div className="p-2">
              {filteredConversations.length === 0 ? (
                <div className="py-12 text-center">
                  <MessageSquare size={36} className="mx-auto mb-3 text-slate-300" />
                  <p className="text-xs font-bold text-slate-500">No conversations yet</p>
                  <p className="text-[10px] text-slate-400 mt-1">Start a new conversation above</p>
                </div>
              ) : (
                filteredConversations.map((c) => {
                  const isActive = activePartnerId === c.partner?.id;
                  return (
                    <button
                      key={c.partner?.id}
                      onClick={() => handleSelectPartner(c.partner?.id)}
                      className={`flex items-center gap-3 w-full p-3 rounded-xl transition-all cursor-pointer text-left group ${
                        isActive
                          ? "bg-[#111A62]/5 border border-[#111A62]/15"
                          : "hover:bg-slate-50 border border-transparent"
                      }`}
                    >
                      <div className="relative shrink-0">
                        {c.partner?.avatar ? (
                          <img src={c.partner.avatar} alt="" className="h-11 w-11 rounded-full object-cover border border-slate-200" />
                        ) : (
                          <div className="h-11 w-11 rounded-full bg-[#111A62]/10 text-[#111A62] flex items-center justify-center text-xs font-black ring-1 ring-[#111A62]/20">
                            {getInitials(c.partner)}
                          </div>
                        )}
                        {c.unread_count > 0 && (
                          <span className="absolute -top-0.5 -right-0.5 h-5 w-5 rounded-full bg-[#E15B1D] text-white text-[9px] font-black flex items-center justify-center ring-2 ring-white">
                            {c.unread_count > 9 ? "9+" : c.unread_count}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className={`text-xs font-extrabold truncate ${isActive ? "text-[#111A62]" : "text-slate-900"}`}>
                            {getDisplayName(c.partner)}
                          </p>
                          <span className="text-[10px] font-semibold text-slate-400 shrink-0">{timeAgo(c.last_message?.created_at)}</span>
                        </div>
                        <div className="flex items-center justify-between gap-2 mt-0.5">
                          <p className={`text-[11px] truncate ${c.unread_count > 0 ? "font-bold text-slate-700" : "font-medium text-slate-400"}`}>
                            {c.last_message?.sender_id === authUser?.id ? "You: " : ""}
                            {c.last_message?.body || "No messages yet"}
                          </p>
                          <Badge tone={ROLE_TONE[c.partner?.role] || "default"} className="text-[8px] font-black px-1.5 py-0 shrink-0">
                            {ROLE_LABEL[c.partner?.role] || "User"}
                          </Badge>
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT PANEL — Chat Thread */}
      <div className={`flex-1 flex flex-col min-w-0 bg-slate-50/50 ${!mobileShowThread ? "hidden sm:flex" : "flex"}`}>
        {!activePartnerId ? (
          // Empty state
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-slate-50/50">
            <div className="h-24 w-24 rounded-full bg-white flex items-center justify-center mb-6 shadow-sm border border-slate-100">
              <MessageSquare size={40} className="text-[#111A62]/30" />
            </div>
            <h2 className="text-xl font-extrabold text-slate-800">Your Messages</h2>
            <p className="mt-2 text-sm text-slate-500 max-w-sm">Select a conversation from the sidebar or start a new one to connect with your team.</p>
          </div>
        ) : (
          <>
            {/* Thread Header */}
            <div className="flex items-center gap-3 px-5 py-3.5 border-b border-slate-100 bg-slate-50/50 shrink-0">
              <button
                onClick={() => { setMobileShowThread(false); setActivePartnerId(null); }}
                className="sm:hidden flex items-center justify-center h-8 w-8 rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-[#111A62] hover:border-[#111A62]/30 transition cursor-pointer"
              >
                <ChevronLeft size={16} />
              </button>
                  {partner?.avatar ? (
                    <img src={partner.avatar} alt="" className="h-10 w-10 rounded-full object-cover border border-slate-200 shrink-0" />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-[#111A62]/10 text-[#111A62] flex items-center justify-center text-xs font-black shrink-0 ring-1 ring-[#111A62]/20">
                      {getInitials(partner)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-extrabold text-slate-900 truncate">{getDisplayName(partner)}</p>
                    <p className="text-[10px] font-semibold text-slate-400 truncate">{partner?.email}</p>
                  </div>
                  <Badge tone={ROLE_TONE[partner?.role] || "default"} className="text-[10px] font-black px-2.5 py-0.5 shrink-0">
                    {ROLE_LABEL[partner?.role] || "User"}
                  </Badge>
                </div>

                {/* Messages Thread */}
                <div className="flex-1 overflow-y-auto p-5 space-y-3 bg-gradient-to-b from-slate-50/30 to-white">
                  {loadingThread ? (
                    <div className="space-y-3">
                      {[...Array(4)].map((_, i) => <Skeleton key={i} className={`h-12 rounded-2xl ${i % 2 === 0 ? "w-3/4" : "w-2/3 ml-auto"}`} />)}
                    </div>
                  ) : thread.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-xs font-bold text-slate-400">No messages yet. Say hello! 👋</p>
                    </div>
                  ) : (
                    thread.map((msg, idx) => {
                      const isMine = msg.sender_id === authUser?.id;
                      const showLabel = idx === 0 || thread[idx - 1].sender_id !== msg.sender_id;
                      
                      return (
                        <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                          <div className={`max-w-[75%] group`}>
                            {showLabel && (
                              <p className={`text-[10px] font-extrabold mb-1.5 px-1 ${isMine ? "text-right text-slate-400" : "text-left text-[#111A62]"}`}>
                                {isMine ? "You" : getDisplayName(partner)}
                              </p>
                            )}
                            <div
                              className={`px-4 py-2.5 rounded-2xl text-sm font-medium break-words shadow-sm ${
                                isMine
                                  ? "bg-[#111A62] text-white rounded-tr-md rounded-tl-2xl rounded-bl-2xl rounded-br-sm"
                                  : "bg-white text-slate-800 rounded-tl-sm rounded-tr-2xl rounded-bl-2xl rounded-br-2xl border border-slate-200"
                              }`}
                            >
                              {msg.body}
                            </div>
                            <p className={`text-[10px] font-semibold mt-1 ${isMine ? "text-right text-slate-400" : "text-left text-slate-400"}`}>
                              {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                              {isMine && msg.read_at && <span className="ml-1.5 text-[#10B981]">✓ Read</span>}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={threadEndRef} />
                </div>

                {/* Compose Bar */}
                <div className="p-4 bg-white border-t border-slate-100">
                  <form onSubmit={handleSend} className="flex items-end gap-2 max-w-4xl mx-auto">
                    <button
                      type="button"
                      className="flex items-center justify-center h-[52px] w-[40px] text-slate-400 hover:text-[#111A62] transition-colors shrink-0"
                      title="Upload Photo"
                    >
                      <ImageIcon size={22} />
                    </button>
                    <button
                      type="button"
                      className="flex items-center justify-center h-[52px] w-[40px] text-slate-400 hover:text-[#111A62] transition-colors shrink-0"
                      title="Upload File"
                    >
                      <Paperclip size={22} />
                    </button>
                    <div className="flex-1 relative">
                      <textarea
                        value={compose}
                        onChange={(e) => setCompose(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSend(e);
                          }
                        }}
                        placeholder="Type a message... (Press Enter to send)"
                        className="w-full min-h-[52px] max-h-32 py-3.5 pl-4 pr-12 rounded-2xl border border-slate-200 bg-slate-50 text-sm font-medium text-slate-700 outline-none transition-all hover:bg-white focus:border-[#111A62] focus:bg-white focus:ring-4 focus:ring-[#111A62]/10 resize-none"
                        disabled={sending}
                        rows={1}
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={!compose.trim() || sending}
                      className="flex items-center justify-center h-[52px] w-[52px] rounded-2xl bg-[#111A62] text-white hover:bg-[#0d1550] disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shrink-0 shadow-md shadow-[#111A62]/20"
                    >
                      <Send size={20} />
                    </button>
                  </form>
                </div>
              </>
            )}
          </div>
    </div>
  );
}

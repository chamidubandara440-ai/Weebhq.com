"use client";

import { useState, useEffect, useRef } from "react";

const TG_BOT_TOKEN = "8820584279:AAFIFgFaIaKLh9fE8-fYeadmAuUTQRMnaE8";
const TG_CHAT_ID = "-1003947849568";
const TG_GROUP_LINK = "https://t.me/AnimeDLW";

// Curated anime quick reaction stickers
const CHAT_STICKERS = [
  { id: "cinema", name: "Absolute Cinema", emoji: "🎬", tag: "ABSOLUTE CINEMA", color: "#f59e0b" },
  { id: "peak", name: "Peak Fiction", emoji: "👑", tag: "PEAK FICTION", color: "#8b5cf6" },
  { id: "hype", name: "Max Hype", emoji: "🔥", tag: "MAX HYPE", color: "#ef4444" },
  { id: "anya", name: "Anya Heh", emoji: "😏", tag: "HEH", color: "#ec4899" },
  { id: "shock", name: "Nani?!", emoji: "😱", tag: "NANI?!", color: "#06b6d4" },
  { id: "popcorn", name: "Popcorn", emoji: "🍿", tag: "GRAB POPCORN", color: "#10b981" },
  { id: "tears", name: "Crying", emoji: "😭", tag: "TEARS", color: "#3b82f6" },
  { id: "dead", name: "Dead", emoji: "💀", tag: "BRO WHAT", color: "#64748b" },
];

const SEED_MESSAGES = [
  {
    id: "seed-1",
    author: "WeebHQ Bot",
    avatar: "🤖",
    source: "telegram",
    role: "System",
    text: "🚀 WeebHQ Live Bridge Connected! Messages sent from the website lounge will now appear in @AnimeDLW, and Telegram replies sync here.",
    time: "Live",
    sticker: { emoji: "🎬", tag: "ABSOLUTE CINEMA", color: "#f59e0b" },
  },
];

export default function LiveDiscussionsHub() {
  const [messages, setMessages] = useState(SEED_MESSAGES);
  const [authorName, setAuthorName] = useState("");
  const [messageText, setMessageText] = useState("");
  const [selectedSticker, setSelectedSticker] = useState(null);
  const [showStickers, setShowStickers] = useState(false);
  const [onlineCount, setOnlineCount] = useState(52);
  const [isSending, setIsSending] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const lastOffsetRef = useRef(0);
  const chatEndRef = useRef(null);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 3500);
  };

  // Load username & cached messages on mount
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem("weebhq_chat_username") || "";
      if (savedUser) setAuthorName(savedUser);
      else setAuthorName("Otaku_" + Math.floor(1000 + Math.random() * 9000));

      const savedMsgs = localStorage.getItem("weebhq_live_messages");
      if (savedMsgs) {
        const parsed = JSON.parse(savedMsgs);
        if (parsed.length > 0) setMessages(parsed);
      }
    } catch (e) {}

    // Fluctuate online users slightly
    const interval = setInterval(() => {
      setOnlineCount((prev) => Math.max(38, prev + Math.floor(Math.random() * 5) - 2));
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  // Poll for new messages from Telegram group
  useEffect(() => {
    let isSubscribed = true;

    const pollTelegramUpdates = async () => {
      try {
        const offset = lastOffsetRef.current ? `&offset=${lastOffsetRef.current + 1}` : "";
        const res = await fetch(
          `https://api.telegram.org/bot${TG_BOT_TOKEN}/getUpdates?limit=20${offset}`
        );
        const data = await res.json();

        if (data.ok && Array.isArray(data.result) && data.result.length > 0) {
          const newIncoming = [];

          data.result.forEach((update) => {
            if (update.update_id > lastOffsetRef.current) {
              lastOffsetRef.current = update.update_id;
            }

            const msg = update.message || update.channel_post;
            if (!msg) return;

            // Check if message belongs to our group
            if (String(msg.chat.id) !== TG_CHAT_ID && String(msg.chat.username) !== "AnimeDLW") {
              return;
            }

            // Skip messages sent by our bot bridge to prevent duplicates
            if (msg.from && msg.from.id === 8820584279) {
              return;
            }

            const sender = msg.from || {};
            const senderName =
              [sender.first_name, sender.last_name].filter(Boolean).join(" ") ||
              sender.username ||
              "Telegram User";

            const timeStr = msg.date
              ? new Date(msg.date * 1000).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "Just now";

            newIncoming.push({
              id: "tg-" + msg.message_id,
              author: senderName,
              avatar: senderName.charAt(0).toUpperCase() || "T",
              source: "telegram",
              role: "Member",
              text: msg.text || msg.caption || "📷 [Sent media in Telegram]",
              time: timeStr,
            });
          });

          if (isSubscribed && newIncoming.length > 0) {
            setMessages((prev) => {
              const existingIds = new Set(prev.map((m) => m.id));
              const filtered = newIncoming.filter((m) => !existingIds.has(m.id));
              if (filtered.length === 0) return prev;
              const combined = [...prev, ...filtered].slice(-100);
              try {
                localStorage.setItem("weebhq_live_messages", JSON.stringify(combined));
              } catch (e) {}
              return combined;
            });
          }
        }
      } catch (err) {
        // Silently handle polling errors
      }
    };

    pollTelegramUpdates();
    const pollTimer = setInterval(pollTelegramUpdates, 3500);

    return () => {
      isSubscribed = false;
      clearInterval(pollTimer);
    };
  }, []);

  // Scroll to bottom when messages update
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Send message to Telegram group
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if ((!messageText.trim() && !selectedSticker) || isSending) return;

    const trimmedName = authorName.trim() || "Anonymous Otaku";
    try {
      localStorage.setItem("weebhq_chat_username", trimmedName);
    } catch (e) {}

    const textToSend = messageText.trim();
    const stickerToSend = selectedSticker;
    const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    // 1. Optimistic Client Message
    const clientMsg = {
      id: "web-" + Date.now(),
      author: trimmedName,
      avatar: trimmedName.charAt(0).toUpperCase() || "W",
      source: "web",
      role: "Visitor",
      text: textToSend,
      sticker: stickerToSend,
      time: timeStr,
    };

    setMessages((prev) => {
      const updated = [...prev, clientMsg].slice(-100);
      try {
        localStorage.setItem("weebhq_live_messages", JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    setMessageText("");
    setSelectedSticker(null);
    setShowStickers(false);
    setIsSending(true);

    // 2. Post to Telegram Group via Bot API
    try {
      let tgFormatted = `🌐 *${trimmedName} (Web)*:
${textToSend}`;
      if (stickerToSend) {
        tgFormatted += `
[Sticker: ${stickerToSend.emoji} ${stickerToSend.tag}]`;
      }

      const res = await fetch(`https://api.telegram.org/bot${TG_BOT_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: TG_CHAT_ID,
          text: tgFormatted,
          parse_mode: "Markdown",
        }),
      });

      const resJson = await res.json();
      if (resJson.ok) {
        showToast("✓ Message delivered to Telegram group!");
      } else {
        showToast("Sent to live lounge (Telegram sync pending)");
      }
    } catch (err) {
      showToast("Sent locally!");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="whq-live-disc-root">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="whq-toast-container">
          <span>{toastMsg}</span>
        </div>
      )}

      {/* ── 1. Hero Banner ─────────────────────────────────────────── */}
      <div className="whq-disc-hero-banner">
        <div className="whq-disc-hero-container">
          <div className="whq-disc-hero-left">
            <span className="whq-live-pulse-badge">
              <span className="whq-pulse-dot" /> LIVE 2-WAY TELEGRAM SYNC
            </span>
            <h1 className="whq-disc-main-title">Anime Discussions &amp; Lounge</h1>
            <p className="whq-disc-subtitle">
              Live discussion lounge connected directly to our Telegram community. Messages typed here are posted to <strong>@AnimeDLW</strong>, and group replies show up here in real-time!
            </p>
          </div>
          <div className="whq-disc-hero-right">
            <a
              href={TG_GROUP_LINK}
              target="_blank"
              rel="noreferrer"
              className="whq-btn-new-thread tg-cta"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.75-.56 2.95-1.28 4.92-2.13 5.92-2.55 2.82-1.18 3.4-1.38 3.79-1.39.08 0 .28.02.4.12.1.08.13.2.14.28 0 .07.01.21 0 .33z" />
              </svg>
              Join Official Group @AnimeDLW ↗
            </a>
          </div>
        </div>
      </div>

      {/* ── 2. Live Chat Container ──────────────────────────────────── */}
      <div className="whq-disc-body-container">
        <div className="whq-chat-room-layout">
          {/* Main Chat Box */}
          <div className="whq-chat-box-main">
            {/* Chat Box Top Header */}
            <div className="whq-chat-top-bar">
              <div className="whq-chat-top-left">
                <span className="whq-live-status-dot" />
                <span className="whq-chat-room-title">#Anime Discussions &amp; Lounge</span>
                <span className="whq-chat-online-badge">👥 {onlineCount} online</span>
              </div>
              <div className="whq-chat-top-right">
                <span className="whq-sync-badge">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.75-.56 2.95-1.28 4.92-2.13 5.92-2.55 2.82-1.18 3.4-1.38 3.79-1.39.08 0 .28.02.4.12.1.08.13.2.14.28 0 .07.01.21 0 .33z" />
                  </svg>
                  Live Telegram Synced (@AnimeDLW)
                </span>
              </div>
            </div>

            {/* Messages Feed */}
            <div className="whq-chat-messages-stream">
              {messages.map((m) => (
                <div key={m.id} className="whq-chat-message-row">
                  <div className="whq-chat-avatar">{m.avatar}</div>
                  <div className="whq-chat-msg-body">
                    <div className="whq-chat-meta">
                      <span className="whq-chat-author">{m.author}</span>
                      {m.source === "telegram" ? (
                        <span className="whq-source-tag tg" title="Message sent from Telegram Group">
                          ✈️ Telegram
                        </span>
                      ) : (
                        <span className="whq-source-tag web" title="Message sent from Website Lounge">
                          🌐 Web
                        </span>
                      )}
                      {m.role && <span className="whq-role-tag">{m.role}</span>}
                      <span className="whq-chat-timestamp">{m.time}</span>
                    </div>

                    {m.text && <div className="whq-chat-text">{m.text}</div>}

                    {m.sticker && (
                      <div
                        className="whq-chat-sticker-badge"
                        style={{ borderColor: m.sticker.color }}
                      >
                        <span className="whq-sticker-emoji">{m.sticker.emoji}</span>
                        <span className="whq-sticker-tag" style={{ color: m.sticker.color }}>
                          {m.sticker.tag}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            {/* Sticker Picker Drawer */}
            {showStickers && (
              <div className="whq-chat-stickers-drawer">
                <div className="whq-stickers-drawer-title">
                  <span>Pick an Anime Reaction Sticker:</span>
                  <button type="button" onClick={() => setShowStickers(false)}>✕</button>
                </div>
                <div className="whq-chat-stickers-grid">
                  {CHAT_STICKERS.map((st) => (
                    <button
                      key={st.id}
                      type="button"
                      className="whq-chat-sticker-btn"
                      style={{ borderColor: st.color }}
                      onClick={() => {
                        setSelectedSticker(st);
                        setShowStickers(false);
                      }}
                    >
                      <span className="whq-st-emoji">{st.emoji}</span>
                      <span className="whq-st-tag" style={{ color: st.color }}>
                        {st.tag}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Active Attachment Pill */}
            {selectedSticker && (
              <div className="whq-chat-attached-pill" style={{ borderColor: selectedSticker.color }}>
                <span>Attached: {selectedSticker.emoji} {selectedSticker.tag}</span>
                <button type="button" onClick={() => setSelectedSticker(null)}>✕</button>
              </div>
            )}

            {/* Input Composer Bar */}
            <form onSubmit={handleSendMessage} className="whq-chat-composer-bar">
              {/* Nickname Input */}
              <div className="whq-chat-nickname-wrap">
                <span className="whq-nick-icon">👤</span>
                <input
                  type="text"
                  placeholder="Your Name"
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  className="whq-chat-nickname-input"
                  title="Your display name in chat"
                  required
                />
              </div>

              {/* Message Input */}
              <div className="whq-chat-input-wrap">
                <input
                  type="text"
                  placeholder="Type a message to the Telegram group..."
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  className="whq-chat-main-input"
                  disabled={isSending}
                />

                <button
                  type="button"
                  className={`whq-chat-tool-btn ${showStickers ? "active" : ""}`}
                  onClick={() => setShowStickers(!showStickers)}
                  title="Insert anime reaction sticker"
                >
                  🎭
                </button>
              </div>

              {/* Send Button */}
              <button
                type="submit"
                className="whq-chat-send-btn"
                disabled={(!messageText.trim() && !selectedSticker) || isSending}
              >
                {isSending ? "Sending..." : "Send 🚀"}
              </button>
            </form>
          </div>

          {/* Right Sidebar Info */}
          <div className="whq-chat-sidebar">
            {/* Telegram Community Card */}
            <div className="whq-sidebar-card tg-card">
              <div className="whq-tg-side-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.75-.56 2.95-1.28 4.92-2.13 5.92-2.55 2.82-1.18 3.4-1.38 3.79-1.39.08 0 .28.02.4.12.1.08.13.2.14.28 0 .07.01.21 0 .33z" />
                </svg>
              </div>
              <h3 className="whq-sidebar-title">Anime Discussions &amp; Lounge</h3>
              <p className="whq-sidebar-desc">
                Official Telegram Group for WeebHQ. Chat directly with members, join voice chats, share anime art and episode memes!
              </p>
              <a
                href={TG_GROUP_LINK}
                target="_blank"
                rel="noreferrer"
                className="whq-side-tg-btn"
              >
                Open in Telegram ↗
              </a>
            </div>

            {/* Community Rules Card */}
            <div className="whq-sidebar-card">
              <h3 className="whq-sidebar-title">📜 Lounge Rules</h3>
              <ul className="whq-rules-simple">
                <li>✨ Be polite and friendly to all anime fans.</li>
                <li>🚫 No NSFW or toxic anime spoilers.</li>
                <li>⚡ Messages sync live with @AnimeDLW.</li>
                <li>🛡️ Protected by WeebHQ Live Bot.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AdminPage() {
  const [email, setEmail] = useState("asimsaham0@gmail.com");
  const [password, setPassword] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
  const [replies, setReplies] = useState<any[]>([]);
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [sendingReply, setSendingReply] = useState<string | null>(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadMessages() {
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      setError("تعذر تحميل الرسائل: " + error.message);
      return;
    }

    const { data: repliesData, error: repliesError } = await supabase
      .from("message_replies")
      .select("*")
      .order("created_at", { ascending: true });

    if (repliesError) {
      setError("تعذر تحميل الردود: " + repliesError.message);
      return;
    }

    setMessages(data || []);
    setReplies(repliesData || []);
    setError("");
  }

  useEffect(() => {
    if (!loggedIn) return;

    const timer = setInterval(() => {
      loadMessages();
    }, 10000);

    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loggedIn]);

  async function sendReply(messageId: string) {
    const content = (replyDrafts[messageId] || "").trim();

    if (!content) {
      setError("اكتب الرد أولاً.");
      return;
    }

    setSendingReply(messageId);
    setError("");
    setSuccess("");

    const { data: userData, error: userError } =
      await supabase.auth.getUser();

    if (userError || !userData.user) {
      setError("تعذر التحقق من حساب المدير.");
      setSendingReply(null);
      return;
    }

    const { data, error } = await supabase
      .from("message_replies")
      .insert({
        message_id: messageId,
        admin_id: userData.user.id,
        content,
      })
      .select()
      .single();

    if (error) {
      setError("تعذر إرسال الرد: " + error.message);
      setSendingReply(null);
      return;
    }

    setReplies((current) => [...current, data]);
    setReplyDrafts((current) => ({
      ...current,
      [messageId]: "",
    }));

    setSuccess("تم إرسال الرد بنجاح.");
    setSendingReply(null);
  }

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError("خطأ الدخول: " + error.message);
      setLoading(false);
      return;
    }

    if (data.user.app_metadata?.role !== "admin") {
      setError("هذا الحساب لا يملك صلاحية المدير.");
      await supabase.auth.signOut();
      setLoading(false);
      return;
    }

    setLoggedIn(true);
    await loadMessages();
    setLoading(false);
  }

  async function logout() {
    await supabase.auth.signOut();
    setLoggedIn(false);
    setMessages([]);
    setReplies([]);
  }

  return (
    <main dir="rtl" className="min-h-screen bg-slate-950 p-5 text-white">
      <div className="mx-auto max-w-2xl">

        <header className="mb-8 border-b border-slate-800 pb-5">
          <h1 className="text-3xl font-bold text-cyan-400">
            وصال
          </h1>
          <p className="mt-2 text-slate-400">
            لوحة تحكم المدير
          </p>
        </header>

        {!loggedIn ? (
          <form
            onSubmit={login}
            className="rounded-3xl border border-slate-800 bg-slate-900 p-6"
          >
            <h2 className="mb-6 text-xl font-bold">
              تسجيل دخول المدير
            </h2>

            <label className="mb-2 block text-sm">
              البريد الإلكتروني
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mb-5 w-full rounded-xl bg-slate-800 p-4 text-white"
              required
            />

            <label className="mb-2 block text-sm">
              كلمة المرور
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl bg-slate-800 p-4 text-white"
              required
            />

            <button
              disabled={loading}
              className="mt-6 w-full rounded-xl bg-cyan-500 p-4 font-bold text-slate-950"
            >
              {loading ? "جارٍ الدخول..." : "دخول"}
            </button>

            {error && (
              <p className="mt-4 text-center text-red-400">{error}</p>
            )}
          </form>
        ) : (
          <>
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-bold">
                رسائل المتابعين ({messages.length})
              </h2>

              <button
                onClick={logout}
                className="rounded-xl bg-red-600 px-4 py-2"
              >
                خروج
              </button>
            </div>

            <button
              onClick={loadMessages}
              className="mb-5 rounded-xl bg-slate-800 px-5 py-3"
            >
              تحديث الرسائل ↻
            </button>

            {messages.length === 0 ? (
              <p className="rounded-2xl bg-slate-900 p-6 text-center text-slate-400">
                لا توجد رسائل حالياً.
              </p>
            ) : (
              <div className="space-y-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className="rounded-2xl border border-slate-800 bg-slate-900 p-5"
                  >
                    <p className="mb-3 text-sm text-cyan-400">
                      متابع {msg.sender_id.slice(0, 8)}
                    </p>

                    <p className="whitespace-pre-wrap leading-7">
                      {msg.content}
                    </p>

                    <p className="mt-4 text-xs text-slate-500">
                      {new Date(msg.created_at).toLocaleString("ar-OM")}
                    </p>

                    <div className="mt-5 border-t border-slate-700 pt-4">
                      <h3 className="mb-3 font-bold text-cyan-400">
                        الردود
                      </h3>

                      {replies
                        .filter((reply) => reply.message_id === msg.id)
                        .map((reply) => (
                          <div
                            key={reply.id}
                            className="mb-3 rounded-xl bg-slate-800 p-3"
                          >
                            <p className="whitespace-pre-wrap leading-7">
                              {reply.content}
                            </p>
                            <p className="mt-2 text-xs text-slate-500">
                              {new Date(reply.created_at).toLocaleString("ar-OM")}
                            </p>
                          </div>
                        ))}

                      <textarea
                        value={replyDrafts[msg.id] || ""}
                        onChange={(e) =>
                          setReplyDrafts((current) => ({
                            ...current,
                            [msg.id]: e.target.value,
                          }))
                        }
                        placeholder="اكتب ردك هنا..."
                        maxLength={5000}
                        rows={3}
                        className="w-full rounded-xl bg-slate-800 p-4 text-white outline-none"
                      />

                      <button
                        onClick={() => sendReply(msg.id)}
                        disabled={sendingReply === msg.id}
                        className="mt-3 rounded-xl bg-cyan-500 px-6 py-3 font-bold text-slate-950 disabled:opacity-50"
                      >
                        {sendingReply === msg.id ? "جارٍ الإرسال..." : "إرسال الرد"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {error && (
              <p className="mt-4 text-red-400">{error}</p>
            )}

            {success && (
              <p className="mt-4 text-green-400">{success}</p>
            )}
          </>
        )}

      </div>
    </main>
  );
}
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function Home() {
  const [userId, setUserId] = useState("");
  const [senderName, setSenderName] = useState("");
  const [nameLocked, setNameLocked] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("");
  const [sending, setSending] = useState(false);
  const [myMessages, setMyMessages] = useState<any[]>([]);
  const [replies, setReplies] = useState<any[]>([]);
  const [loadingReplies, setLoadingReplies] = useState(false);

  async function loadReplies(id: string, silent = false) {
    if (!silent) setLoadingReplies(true);

    const { data: messagesData, error: messagesError } =
      await supabase
        .from("messages")
        .select("id, content, created_at")
        .eq("sender_id", id)
        .order("created_at", { ascending: false });

    if (messagesError) {
      if (!silent) setLoadingReplies(false);
      return;
    }

    const ownMessages = messagesData || [];
    setMyMessages(ownMessages);

    if (ownMessages.length === 0) {
      setReplies([]);
      if (!silent) setLoadingReplies(false);
      return;
    }

    const messageIds = ownMessages.map((msg) => msg.id);

    const { data: repliesData, error: repliesError } =
      await supabase
        .from("message_replies")
        .select("*")
        .in("message_id", messageIds)
        .order("created_at", { ascending: true });

    if (!repliesError) setReplies(repliesData || []);

    if (!silent) setLoadingReplies(false);
  }

  async function prepareUser() {
    const { data, error: sessionError } =
      await supabase.auth.getSession();

    if (sessionError) {
      setStatus("تعذر الاتصال. حاول مرة أخرى.");
      setProfileLoading(false);
      return;
    }

    let currentUser = data.session?.user;

    if (!currentUser) {
      const { data: result, error } =
        await supabase.auth.signInAnonymously();

      if (error || !result?.user) {
        setStatus("تعذر الاتصال. حاول مرة أخرى.");
        setProfileLoading(false);
        return;
      }

      currentUser = result.user;
    }

    const currentUserId = currentUser.id;

    const { data: profile, error: profileError } =
      await supabase
        .from("sender_profiles")
        .select("sender_name")
        .eq("user_id", currentUserId)
        .maybeSingle();

    if (profileError) {
      setStatus("تعذر تحميل الاسم. حاول تحديث الصفحة.");
      setProfileLoading(false);
      return;
    }

    if (profile?.sender_name) {
      setSenderName(profile.sender_name);
      setNameLocked(true);
      localStorage.setItem(
        "wasal_sender_name",
        profile.sender_name
      );
    } else {
      const savedName = localStorage.getItem("wasal_sender_name");
      if (savedName) setSenderName(savedName);
      setNameLocked(false);
    }

    setUserId(currentUserId);
    await loadReplies(currentUserId);
    setProfileLoading(false);
  }

  useEffect(() => {
    prepareUser();
  }, []);

  useEffect(() => {
    if (!userId) return;

    const timer = setInterval(() => {
      loadReplies(userId, true);
    }, 15000);

    return () => clearInterval(timer);
  }, [userId]);

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();

    if (!senderName.trim() || !message.trim() || !userId) return;

    setSending(true);
    setStatus("");

    let finalName = senderName.trim();

    if (!nameLocked) {
      const { data: newProfile, error: profileInsertError } =
        await supabase
          .from("sender_profiles")
          .insert({
            user_id: userId,
            sender_name: finalName,
          })
          .select("sender_name")
          .single();

      if (newProfile?.sender_name) {
        finalName = newProfile.sender_name;
        setSenderName(finalName);
        setNameLocked(true);
        localStorage.setItem("wasal_sender_name", finalName);
      } else {
        const { data: existingProfile, error: fetchError } =
          await supabase
            .from("sender_profiles")
            .select("sender_name")
            .eq("user_id", userId)
            .maybeSingle();

        if (fetchError || !existingProfile?.sender_name) {
          setStatus("تعذر تثبيت الاسم. حاول مرة أخرى.");
          setSending(false);
          return;
        }

        finalName = existingProfile.sender_name;
        setSenderName(finalName);
        setNameLocked(true);
        localStorage.setItem("wasal_sender_name", finalName);
      }
    }

    const { error } = await supabase.from("messages").insert({
      sender_id: userId,
      sender_name: finalName,
      content: message.trim(),
    });

    if (error) {
      setStatus("تعذر إرسال الرسالة. حاول مرة أخرى.");
    } else {
      setMessage("");
      setStatus("تم إرسال رسالتك بنجاح ✓");
      await loadReplies(userId);
    }

    setSending(false);
  }

  return (
    <main dir="rtl" className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-md px-5 py-8">

        <header className="mb-10 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-cyan-400">وصال</h1>
            <p className="mt-1 text-sm text-slate-400">
              تواصل بأمان وخصوصية
            </p>
          </div>
          <div className="rounded-full bg-cyan-400/10 p-3 text-2xl">
            💬
          </div>
        </header>

        <section className="mb-8 rounded-3xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="mb-2 text-xl font-bold">
            مرحباً بك في وصال
          </h2>
          <p className="text-sm leading-7 text-slate-400">
            تواصل معي مباشرة عبر الرسائل، دون الحاجة إلى إظهار رقم هاتفك.
          </p>
          <div className="mt-5 rounded-xl bg-slate-800 p-4">
            <p className="text-sm text-slate-400">حالة الاتصال</p>
            <p className="mt-2 font-semibold text-green-400">
              ● متاح للتواصل
            </p>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
          <h3 className="mb-4 text-lg font-bold">📩 أرسل رسالة</h3>

          <form onSubmit={sendMessage}>
            <input
              type="text"
              value={senderName}
              onChange={(e) => {
                setSenderName(e.target.value);
                localStorage.setItem(
                  "wasal_sender_name",
                  e.target.value
                );
              }}
              placeholder={
                nameLocked
                  ? "اسمك المستعار ثابت"
                  : "اكتب اسمك المستعار..."
              }
              maxLength={40}
              required
              disabled={nameLocked || profileLoading}
              className="mb-4 w-full rounded-xl border border-slate-700 bg-slate-800 p-4 text-white outline-none focus:border-cyan-400 disabled:opacity-70"
            />

            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="اكتب رسالتك هنا..."
              maxLength={5000}
              rows={5}
              className="w-full rounded-xl border border-slate-700 bg-slate-800 p-4 text-white outline-none focus:border-cyan-400"
            />

            <button
              type="submit"
              disabled={
                sending ||
                profileLoading ||
                !userId ||
                !senderName.trim() ||
                !message.trim()
              }
              className="mt-4 w-full rounded-xl bg-cyan-500 p-4 font-bold text-slate-950 disabled:opacity-50"
            >
              {sending ? "جارٍ الإرسال..." : "إرسال الرسالة"}
            </button>

            {status && (
              <p className="mt-4 text-center text-sm text-cyan-300">
                {status}
              </p>
            )}
          </form>
        </section>

        <section className="mt-8 rounded-3xl border border-slate-800 bg-slate-900 p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-bold">💌 ردود المدير</h3>

            <button
              onClick={() => userId && loadReplies(userId)}
              disabled={loadingReplies || !userId}
              className="rounded-xl bg-slate-800 px-3 py-2 text-sm"
            >
              تحديث ↻
            </button>
          </div>

          {loadingReplies ? (
            <p className="text-center text-slate-400">
              جارٍ تحميل الردود...
            </p>
          ) : myMessages.length === 0 ? (
            <p className="text-center text-slate-400">
              لم ترسل أي رسالة بعد.
            </p>
          ) : (
            <div className="space-y-4">
              {myMessages.map((msg) => {
                const messageReplies = replies.filter(
                  (reply) => reply.message_id === msg.id
                );

                return (
                  <div
                    key={msg.id}
                    className="rounded-xl bg-slate-800 p-4"
                  >
                    <p className="mb-2 text-xs text-cyan-400">
                      رسالتك
                    </p>

                    <p className="whitespace-pre-wrap leading-7">
                      {msg.content}
                    </p>

                    {messageReplies.length > 0 ? (
                      <div className="mt-4 space-y-3 border-t border-slate-700 pt-3">
                        {messageReplies.map((reply) => (
                          <div key={reply.id}>
                            <p className="mb-2 text-xs text-green-400">
                              رد المدير
                            </p>
                            <p className="whitespace-pre-wrap leading-7">
                              {reply.content}
                            </p>
                            <p className="mt-2 text-xs text-slate-500">
                              {new Date(reply.created_at).toLocaleString("ar-OM")}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-3 text-sm text-slate-500">
                        بانتظار رد المدير...
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <div className="mt-10 text-center text-xs text-slate-500">
          وصال © 2026 | خصوصيتك أولويتنا
        </div>

      </div>
    </main>
  );
}
export default function Home() {
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
          <h2 className="mb-2 text-xl font-bold">مرحباً بك في وصال</h2>
          <p className="text-sm leading-7 text-slate-400">
            تواصل معي مباشرة عبر الرسائل أو المكالمات الصوتية،
            دون الحاجة إلى إظهار رقم هاتفك.
          </p>
          <div className="mt-5 rounded-xl bg-slate-800 p-4">
            <p className="text-sm text-slate-400">حالة الاتصال</p>
            <p className="mt-2 font-semibold text-green-400">
              ● متاح للتواصل
            </p>
          </div>
        </section>

        <h3 className="mb-4 text-lg font-bold">طرق التواصل</h3>

        <div className="space-y-4">
          <button className="flex w-full items-center gap-4 rounded-2xl border border-slate-800 bg-slate-900 p-5 text-right">
            <span className="text-3xl">✉️</span>
            <span>
              <span className="block font-bold">إرسال رسالة</span>
              <span className="mt-1 block text-sm text-slate-400">
                أرسل رسالتك بشكل خاص
              </span>
            </span>
          </button>

          <button className="flex w-full items-center gap-4 rounded-2xl border border-slate-800 bg-slate-900 p-5 text-right">
            <span className="text-3xl">📞</span>
            <span>
              <span className="block font-bold">مكالمة صوتية</span>
              <span className="mt-1 block text-sm text-slate-400">
                تحدث معي مباشرة
              </span>
            </span>
          </button>
        </div>

        <div className="mt-10 text-center text-xs text-slate-500">
          وصال © 2026 | خصوصيتك أولويتنا
        </div>

      </div>
    </main>
  );
}
"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { FiBookOpen, FiEdit2, FiEye, FiEyeOff, FiLoader, FiLogOut, FiPlus, FiSave, FiTrash2, FiUser, FiX } from "react-icons/fi";

type Session = { siteId: string; loginId: string };

export default function AdminPanel() {
  const [checking, setChecking] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const clearSession = useCallback(() => setSession(null), []);

  useEffect(() => {
    fetch("/api/admin/session", { cache: "no-store" })
      .then(async (response) => response.ok ? setSession(await response.json()) : null)
      .finally(() => setChecking(false));
  }, []);

  if (checking) return <LoadingScreen />;
  if (!session) return <Login onSuccess={(value) => setSession(value)} />;
  return <Dashboard session={session} onLogout={clearSession} />;
}

function Login({ onSuccess }: { onSuccess: (session: Session) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true); setError("");
    try {
      const response = await fetch("/api/admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Login failed");
      onSuccess({ siteId: data.siteId, loginId: data.loginId });
    } catch (cause) { setError((cause as Error).message); }
    finally { setLoading(false); }
  }

  return (
    <main className="min-h-screen bg-[#fffdf0] px-4 py-10 flex items-center justify-center">
      <form onSubmit={submit} className="w-full max-w-md rounded-[28px] border-2 border-yellow-200 bg-white p-7 shadow-xl shadow-slate-900/10 sm:p-9">
        <div className="mb-8">
          <p className="mb-2 text-xs font-black uppercase tracking-[0.18em] text-amber-600">Satta Online Control Room</p>
          <h1 className="text-3xl font-black tracking-tight text-slate-950">Admin Login</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">Sign in with the account assigned to your website.</p>
        </div>
        <label className="mb-2 block text-sm font-bold text-slate-800" htmlFor="email">Email</label>
        <input id="email" type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} className="mb-5 min-h-12 w-full rounded-xl border border-slate-300 px-4 text-slate-950 outline-none transition focus:border-amber-500 focus:ring-4 focus:ring-yellow-100" placeholder="admin@example.com" />
        <label className="mb-2 block text-sm font-bold text-slate-800" htmlFor="password">Password</label>
        <div className="relative">
          <input id="password" type={showPassword ? "text" : "password"} autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} className="min-h-12 w-full rounded-xl border border-slate-300 px-4 pr-12 text-slate-950 outline-none transition focus:border-amber-500 focus:ring-4 focus:ring-yellow-100" placeholder="Enter password" />
          <button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Hide password" : "Show password"} className="absolute right-1 top-1 grid size-10 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-600">{showPassword ? <FiEyeOff /> : <FiEye />}</button>
        </div>
        {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p>}
        <button disabled={loading} className="mt-6 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-black px-5 font-black text-yellow-100 transition hover:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-yellow-300 disabled:cursor-not-allowed disabled:opacity-60">{loading && <FiLoader className="animate-spin" />} Sign in</button>
      </form>
    </main>
  );
}

function Dashboard({ session, onLogout }: { session: Session; onLogout: () => void }) {
  const [tab, setTab] = useState<"khaiwal" | "blogs">("khaiwal");
  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; error?: boolean } | null>(null);

  useEffect(() => {
    fetch("/api/admin/khaiwal", { cache: "no-store" }).then(async (response) => {
      if (response.status === 401) return onLogout();
      const data = await response.json(); setName(data.settings?.name || ""); setWhatsapp(data.settings?.whatsapp || "");
    }).finally(() => setLoading(false));
  }, [onLogout]);

  async function save(event: FormEvent) {
    event.preventDefault(); setSaving(true); setMessage(null);
    try {
      const response = await fetch("/api/admin/khaiwal", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, whatsapp }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not save details");
      setMessage({ text: "Khaiwal details saved successfully." });
    } catch (cause) { setMessage({ text: (cause as Error).message, error: true }); }
    finally { setSaving(false); }
  }

  async function logout() { await fetch("/api/admin/logout", { method: "POST" }); onLogout(); }

  return (
    <main className="min-h-screen bg-[#fffdf0] text-slate-950">
      <header className="border-b-4 border-yellow-300 bg-black px-5 py-7 text-white sm:py-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-5">
          <div><p className="text-xs font-black uppercase tracking-[0.18em] text-yellow-300">Satta Online Control Room</p><h1 className="mt-1 text-2xl font-black sm:text-3xl">Admin Panel</h1><p className="mt-1 text-xs text-yellow-100/70">{session.siteId}</p></div>
          <button onClick={logout} className="flex min-h-12 items-center gap-2 rounded-xl border border-yellow-200/60 px-5 font-bold transition hover:bg-yellow-200 hover:text-black focus:outline-none focus:ring-4 focus:ring-yellow-300/40"><FiLogOut /> Logout</button>
        </div>
      </header>
      <div className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
        <nav className="grid grid-cols-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm" aria-label="Admin sections">
          <button onClick={() => setTab("khaiwal")} className={`flex min-h-14 items-center justify-center gap-2 rounded-xl font-black ${tab === "khaiwal" ? "bg-yellow-200 text-black" : "text-slate-500 hover:bg-yellow-50"}`}><FiUser /> Khaiwal</button>
          <button onClick={() => setTab("blogs")} className={`flex min-h-14 items-center justify-center gap-2 rounded-xl font-black ${tab === "blogs" ? "bg-yellow-200 text-black" : "text-slate-500 hover:bg-yellow-50"}`}><FiBookOpen /> Blogs</button>
        </nav>
        {tab === "khaiwal" ? <section className="mt-6 rounded-[28px] border-2 border-yellow-200 bg-white p-6 shadow-sm sm:p-10">
          <h2 className="text-2xl font-black">Khaiwal details</h2>
          <p className="mt-2 text-sm text-slate-500">These details are saved only for <strong>{session.siteId}</strong>.</p>
          {loading ? <div className="grid min-h-52 place-items-center"><FiLoader className="animate-spin text-2xl text-amber-600" /></div> : (
            <form onSubmit={save} className="mt-7 space-y-5">
              <div><label htmlFor="name" className="mb-2 block font-bold">Name</label><input id="name" required value={name} onChange={(e) => setName(e.target.value)} className="min-h-14 w-full rounded-xl border border-slate-300 px-5 text-lg outline-none focus:border-amber-500 focus:ring-4 focus:ring-yellow-100" /></div>
              <div><label htmlFor="whatsapp" className="mb-2 block font-bold">WhatsApp number</label><input id="whatsapp" inputMode="tel" required value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} className="min-h-14 w-full rounded-xl border border-slate-300 px-5 text-lg outline-none focus:border-amber-500 focus:ring-4 focus:ring-yellow-100" /></div>
              {message && <p role="status" className={`rounded-xl px-4 py-3 text-sm font-bold ${message.error ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}>{message.text}</p>}
              <button disabled={saving} className="flex min-h-14 w-full items-center justify-center gap-2 rounded-xl bg-black px-5 text-lg font-black text-yellow-100 transition hover:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-yellow-300 disabled:opacity-60">{saving ? <FiLoader className="animate-spin" /> : <FiSave />} {saving ? "Saving..." : "Save Khaiwal details"}</button>
            </form>
          )}
        </section> : <BlogManager siteId={session.siteId} />}
      </div>
    </main>
  );
}

type AdminPost = { _id: string; title: string; slug: string; metaTitle?: string; metaDescription?: string; image?: string; content: string; published: boolean };
const EMPTY_POST = { title: "", slug: "", metaTitle: "", metaDescription: "", image: "", content: "", published: true };

function BlogManager({ siteId }: { siteId: string }) {
  const [posts, setPosts] = useState<AdminPost[]>([]);
  const [form, setForm] = useState(EMPTY_POST);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const load = useCallback(() => fetch("/api/admin/blogs", { cache: "no-store" }).then((r) => r.json()).then((d) => setPosts(d.posts || [])), []);
  useEffect(() => { load(); }, [load]);
  const field = (key: keyof typeof EMPTY_POST, value: string | boolean) => setForm((current) => ({ ...current, [key]: value }));
  const startCreate = () => { setEditingId(null); setForm(EMPTY_POST); setOpen(true); setMessage(""); };
  const startEdit = (post: AdminPost) => { setEditingId(post._id); setForm({ title: post.title, slug: post.slug, metaTitle: post.metaTitle || "", metaDescription: post.metaDescription || "", image: post.image || "", content: post.content, published: post.published }); setOpen(true); setMessage(""); };
  async function savePost(event: FormEvent) {
    event.preventDefault(); setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/admin/blogs", { method: editingId ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, id: editingId }) });
      const data = await response.json(); if (!response.ok) throw new Error(data.error || "Could not save blog");
      setOpen(false); await load();
    } catch (error) { setMessage((error as Error).message); } finally { setBusy(false); }
  }
  async function remove(post: AdminPost) {
    if (!confirm(`Delete “${post.title}”?`)) return;
    await fetch("/api/admin/blogs", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: post._id }) }); await load();
  }
  return <section className="mt-6 space-y-6">
    <div className="flex flex-col gap-5 rounded-[28px] border-2 border-yellow-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-8">
      <div><p className="text-xs font-black uppercase tracking-[.18em] text-amber-600">Content manager</p><h2 className="mt-1 text-2xl font-black">Website Blogs</h2><p className="mt-2 text-sm text-slate-500">Articles are assigned automatically to {siteId}.</p></div>
      <button onClick={startCreate} className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-black px-6 font-black text-yellow-100 hover:bg-slate-800 focus:ring-4 focus:ring-yellow-300"><FiPlus /> Create New Blog</button>
    </div>
    {open && <form onSubmit={savePost} className="rounded-[28px] border-2 border-yellow-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="flex items-start justify-between"><div><h3 className="text-xl font-black">{editingId ? "Edit blog" : "Create a new blog"}</h3><p className="text-sm text-slate-500">Published only for {siteId}.</p></div><button type="button" onClick={() => setOpen(false)} aria-label="Close editor" className="grid size-11 place-items-center rounded-xl bg-slate-100 hover:bg-yellow-100"><FiX /></button></div>
      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <Field label="Title" value={form.title} onChange={(v) => { field("title", v); if (!editingId) field("slug", v.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")); }} required />
        <Field label="URL slug" value={form.slug} onChange={(v) => field("slug", v.toLowerCase())} required />
        <Field label="Meta title" value={form.metaTitle} onChange={(v) => field("metaTitle", v)} />
        <div className="sm:col-span-2"><Field label="Meta description" value={form.metaDescription} onChange={(v) => field("metaDescription", v)} /></div>
        <label className="sm:col-span-2"><span className="mb-2 block font-bold">Featured image</span><input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={(event) => {
          const file = event.target.files?.[0]; if (!file) return;
          if (file.size > 2 * 1024 * 1024) { setMessage("Featured image must be smaller than 2 MB"); return; }
          const reader = new FileReader(); reader.onload = () => field("image", String(reader.result)); reader.readAsDataURL(file);
        }} className="min-h-13 w-full rounded-xl border border-slate-300 px-3 py-2 file:mr-4 file:rounded-lg file:border-0 file:bg-yellow-200 file:px-4 file:py-2 file:font-bold" />{form.image && <img src={form.image} alt="Featured image preview" className="mt-3 h-32 rounded-xl border object-cover" />}</label>
        <div className="sm:col-span-2"><RichTextEditor value={form.content} onChange={(value) => field("content", value)} /></div>
      </div>
      <label className="mt-4 flex items-center gap-3 font-bold"><input type="checkbox" checked={form.published} onChange={(e) => field("published", e.target.checked)} className="size-5 accent-black" /> Publish immediately</label>
      {message && <p className="mt-4 rounded-xl bg-red-50 p-3 font-bold text-red-700">{message}</p>}
      <button disabled={busy} className="mt-6 flex min-h-14 w-full items-center justify-center gap-2 rounded-xl bg-yellow-300 font-black text-black hover:bg-yellow-400 disabled:opacity-60">{busy ? <FiLoader className="animate-spin" /> : <FiSave />} {editingId ? "Save Blog" : "Create & Publish Blog"}</button>
    </form>}
    <div className="rounded-[28px] border-2 border-yellow-200 bg-white p-6 shadow-sm sm:p-8"><h3 className="text-xl font-black">Published blogs</h3><p className="text-sm text-slate-500">{posts.length} articles</p>
      <div className="mt-5 space-y-3">{posts.length ? posts.map((post) => <article key={post._id} className="flex flex-col gap-4 rounded-2xl border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex min-w-0 items-center gap-4">{post.image ? <img src={post.image} alt="" className="size-20 shrink-0 rounded-xl border border-yellow-100 object-cover" /> : <div className="grid size-20 shrink-0 place-items-center rounded-xl bg-yellow-50 text-amber-500"><FiBookOpen /></div>}<div className="min-w-0"><h4 className="truncate font-black">{post.title}</h4><p className="truncate text-sm text-slate-500">/blog/{post.slug} · {post.published ? "Published" : "Draft"}</p></div></div><div className="flex shrink-0 gap-2"><button onClick={() => startEdit(post)} className="flex min-h-11 items-center gap-2 rounded-xl bg-yellow-100 px-4 font-bold hover:bg-yellow-200"><FiEdit2 /> Edit</button><button onClick={() => remove(post)} className="grid size-11 place-items-center rounded-xl bg-red-50 text-red-700 hover:bg-red-100" aria-label={`Delete ${post.title}`}><FiTrash2 /></button></div></article>) : <div className="rounded-2xl border-2 border-dashed border-yellow-200 py-12 text-center"><FiBookOpen className="mx-auto text-2xl text-amber-500" /><p className="mt-3 font-black">No blogs yet</p></div>}</div>
    </div>
  </section>;
}

function Field({ label, value, onChange, required }: { label: string; value: string; onChange: (value: string) => void; required?: boolean }) {
  return <label><span className="mb-2 block font-bold">{label}</span><input required={required} value={value} onChange={(e) => onChange(e.target.value)} className="min-h-13 w-full rounded-xl border border-slate-300 px-4 outline-none focus:border-amber-500 focus:ring-4 focus:ring-yellow-100" /></label>;
}

function RichTextEditor({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const editor = useRef<HTMLDivElement>(null);
  useEffect(() => { if (editor.current && editor.current.innerHTML !== value) editor.current.innerHTML = value; }, [value]);
  const command = (name: string, argument?: string) => {
    editor.current?.focus(); document.execCommand(name, false, argument); onChange(editor.current?.innerHTML || "");
  };
  const link = () => { const url = window.prompt("Enter the link URL"); if (url) command("createLink", url); };
  const tools: Array<[string, string, string?]> = [
    ["B", "bold"], ["I", "italic"], ["U", "underline"], ["H2", "formatBlock", "h2"], ["H3", "formatBlock", "h3"],
    ["• List", "insertUnorderedList"], ["1. List", "insertOrderedList"], ["Quote", "formatBlock", "blockquote"],
  ];
  return <div><span className="mb-2 block font-bold">Article content</span><div className="overflow-hidden rounded-2xl border border-slate-300 focus-within:border-amber-500 focus-within:ring-4 focus-within:ring-yellow-100">
    <div className="flex flex-wrap gap-1.5 border-b border-slate-200 bg-slate-50 p-2.5" role="toolbar" aria-label="Text formatting">
      {tools.map(([label, name, argument]) => <button key={label} type="button" onMouseDown={(event) => { event.preventDefault(); command(name, argument); }} className="min-h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-black hover:bg-yellow-100" aria-label={label}>{label}</button>)}
      <button type="button" onMouseDown={(event) => { event.preventDefault(); link(); }} className="min-h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-black hover:bg-yellow-100">Link</button>
      <button type="button" onMouseDown={(event) => { event.preventDefault(); command("removeFormat"); }} className="min-h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-black hover:bg-yellow-100">Clear</button>
    </div>
    <div ref={editor} contentEditable role="textbox" aria-multiline="true" data-placeholder="Start writing your article here..." onInput={(event) => onChange(event.currentTarget.innerHTML)} className="min-h-80 bg-white p-5 text-base leading-7 outline-none empty:before:pointer-events-none empty:before:text-slate-400 empty:before:content-[attr(data-placeholder)] [&_blockquote]:border-l-4 [&_blockquote]:border-yellow-300 [&_blockquote]:pl-4 [&_h2]:text-2xl [&_h2]:font-black [&_h3]:text-xl [&_h3]:font-bold [&_ol]:list-decimal [&_ol]:pl-6 [&_ul]:list-disc [&_ul]:pl-6" suppressContentEditableWarning />
  </div></div>;
}

function LoadingScreen() { return <div className="grid min-h-screen place-items-center bg-[#fffdf0]"><FiLoader className="animate-spin text-3xl text-amber-600" aria-label="Loading" /></div>; }

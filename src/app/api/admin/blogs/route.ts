import { ObjectId } from "mongodb";
import { getAdminSession } from "@/lib/khaiwal-admin-auth";
import { getKhaiwalDatabase } from "@/lib/khaiwal-mongodb";

async function context() {
  const session = await getAdminSession();
  if (!session) return null;
  return { session, collection: (await getKhaiwalDatabase()).collection("blog_posts") };
}

export async function GET() {
  const ctx = await context();
  if (!ctx) return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });
  const posts = await ctx.collection.find({ siteId: ctx.session.siteId }).sort({ updatedAt: -1 }).toArray();
  return Response.json({ success: true, posts: posts.map((post) => ({ ...post, _id: String(post._id) })) });
}

export async function POST(request: Request) {
  const ctx = await context();
  if (!ctx) return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  const error = validate(body);
  if (error) return Response.json({ success: false, error }, { status: 400 });
  const now = new Date();
  const post = clean(body, ctx.session.siteId);
  try {
    const result = await ctx.collection.insertOne({ ...post, createdAt: now, updatedAt: now, date: now.toISOString() });
    return Response.json({ success: true, id: String(result.insertedId) });
  } catch (error) {
    if ((error as { code?: number }).code === 11000) return Response.json({ success: false, error: "This URL slug already exists" }, { status: 409 });
    throw error;
  }
}

export async function PUT(request: Request) {
  const ctx = await context();
  if (!ctx) return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  if (!ObjectId.isValid(body.id)) return Response.json({ success: false, error: "Invalid article" }, { status: 400 });
  const error = validate(body);
  if (error) return Response.json({ success: false, error }, { status: 400 });
  await ctx.collection.updateOne({ _id: new ObjectId(body.id), siteId: ctx.session.siteId }, { $set: { ...clean(body, ctx.session.siteId), updatedAt: new Date() } });
  return Response.json({ success: true });
}

export async function DELETE(request: Request) {
  const ctx = await context();
  if (!ctx) return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });
  const { id } = await request.json();
  if (!ObjectId.isValid(id)) return Response.json({ success: false, error: "Invalid article" }, { status: 400 });
  await ctx.collection.deleteOne({ _id: new ObjectId(id), siteId: ctx.session.siteId });
  return Response.json({ success: true });
}

function validate(body: Record<string, unknown>) {
  if (!String(body.title || "").trim()) return "Title is required";
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(String(body.slug || ""))) return "Use a valid lowercase URL slug";
  if (!String(body.content || "").trim()) return "Content is required";
  return null;
}

function clean(body: Record<string, unknown>, siteId: string) {
  return {
    siteId, title: String(body.title).trim(), slug: String(body.slug).trim().toLowerCase(),
    metaTitle: String(body.metaTitle || body.title).trim(), metaDescription: String(body.metaDescription || "").trim(),
    excerpt: String(body.metaDescription || "").trim(), image: String(body.image || "").trim(),
    content: sanitizeRichText(String(body.content)), published: body.published !== false,
  };
}

function sanitizeRichText(html: string) {
  const allowed = /^(p|br|strong|b|em|i|u|h2|h3|ul|ol|li|blockquote|a)$/i;
  return html
    .replace(/<(script|style|iframe|object)[^>]*>[\s\S]*?<\/\1>/gi, "")
    .replace(/\s+on\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/javascript:/gi, "")
    .replace(/<\/?([a-z0-9]+)(?:\s[^>]*)?>/gi, (tag, name: string) => allowed.test(name) ? tag : "")
    .trim();
}

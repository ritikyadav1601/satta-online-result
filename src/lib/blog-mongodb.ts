import { BLOG_POSTS, type BlogPost } from "./blog-data";
import { DEFAULT_SITE_ID, getKhaiwalDatabase } from "./khaiwal-mongodb";

type BlogDocument = {
  slug?: string; title?: string; excerpt?: string; metaDescription?: string;
  content?: string; image?: string; date?: string | Date; createdAt?: Date; published?: boolean;
};

export async function getPublicBlogPosts(): Promise<BlogPost[]> {
  try {
    const documents = await (await getKhaiwalDatabase()).collection<BlogDocument>("blog_posts")
      .find({ siteId: DEFAULT_SITE_ID, published: true }).sort({ date: -1 }).toArray();
    const dynamic = documents.map(toBlogPost).filter((post): post is BlogPost => Boolean(post));
    const dynamicSlugs = new Set(dynamic.map((post) => post.slug));
    return [...dynamic, ...BLOG_POSTS.filter((post) => !dynamicSlugs.has(post.slug))];
  } catch {
    return BLOG_POSTS;
  }
}

export async function getPublicBlogPost(slug: string) {
  return (await getPublicBlogPosts()).find((post) => post.slug === slug);
}

function toBlogPost(document: BlogDocument): BlogPost | null {
  if (!document.slug || !document.title || !document.content) return null;
  const plainText = document.content.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  return {
    slug: document.slug, title: document.title,
    excerpt: document.excerpt || document.metaDescription || plainText.slice(0, 180),
    date: new Date(document.date || document.createdAt || Date.now()).toISOString(),
    readTime: `${Math.max(1, Math.ceil(document.content.split(/\s+/).length / 200))} min read`,
    tags: ["Satta King", "Guide"], content: [{ type: "html", html: document.content }], image: document.image,
  };
}

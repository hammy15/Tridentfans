import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Blog',
  description: 'Mariners analysis, takes, and stories from Mark at TridentFans.',
  openGraph: {
    title: 'TridentFans Blog',
    description: 'Mariners analysis, takes, and stories from Mark.',
  },
};

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export const revalidate = 300; // Revalidate every 5 minutes

export default async function BlogPage() {
  const { data: posts } = await supabase
    .from('blog_posts')
    .select('slug, title, excerpt, tags, published_at')
    .eq('is_published', true)
    .order('published_at', { ascending: false })
    .limit(20);

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-mariners-navy dark:text-white mb-2">
          The TridentFans Blog
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Mariners analysis, takes, and stories. By Mark.
        </p>
      </div>

      {!posts || posts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-lg text-gray-500">First posts coming soon. Mark&apos;s cooking.</p>
          <Link href="/forum" className="text-mariners-teal hover:underline mt-2 inline-block">
            Check out the forum in the meantime
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {posts.map((post) => (
            <article key={post.slug} className="border-b border-gray-200 dark:border-gray-700 pb-6">
              <Link href={`/blog/${post.slug}`}>
                <h2 className="text-xl font-semibold text-mariners-navy dark:text-white hover:text-mariners-teal transition-colors">
                  {post.title}
                </h2>
              </Link>
              {post.excerpt && (
                <p className="text-gray-600 dark:text-gray-400 mt-2">{post.excerpt}</p>
              )}
              <div className="flex items-center gap-3 mt-3 text-sm text-gray-500">
                <span>⚓ Mark</span>
                <span>·</span>
                <time>
                  {new Date(post.published_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </time>
                {post.tags && post.tags.length > 0 && (
                  <>
                    <span>·</span>
                    <div className="flex gap-1">
                      {post.tags.slice(0, 3).map((tag: string) => (
                        <span
                          key={tag}
                          className="bg-mariners-teal/10 text-mariners-teal px-2 py-0.5 rounded text-xs"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

import { createClient } from '@supabase/supabase-js';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export const revalidate = 600; // 10 minutes

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { data: post } = await supabase
    .from('blog_posts')
    .select('title, excerpt')
    .eq('slug', slug)
    .eq('is_published', true)
    .single();

  if (!post) return { title: 'Not Found' };

  return {
    title: post.title,
    description: post.excerpt || post.title,
    openGraph: {
      title: post.title,
      description: post.excerpt || post.title,
      type: 'article',
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const { data: post } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('slug', slug)
    .eq('is_published', true)
    .single();

  if (!post) notFound();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt,
    datePublished: post.published_at,
    dateModified: post.updated_at,
    author: { '@type': 'Person', name: 'Mark', url: 'https://tridentfans.com' },
    publisher: { '@type': 'Organization', name: 'TridentFans' },
    mainEntityOfPage: `https://tridentfans.com/blog/${post.slug}`,
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Link
        href="/blog"
        className="text-sm text-mariners-teal hover:underline mb-6 inline-block"
      >
        ← Back to blog
      </Link>

      <article>
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-mariners-navy dark:text-white mb-3">
            {post.title}
          </h1>
          <div className="flex items-center gap-3 text-sm text-gray-500">
            <span>⚓ Mark</span>
            <span>·</span>
            <time>
              {new Date(post.published_at).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </time>
          </div>
          {post.tags && post.tags.length > 0 && (
            <div className="flex gap-2 mt-3">
              {post.tags.map((tag: string) => (
                <span
                  key={tag}
                  className="bg-mariners-teal/10 text-mariners-teal px-2 py-1 rounded text-xs"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </header>

        <div className="prose prose-lg dark:prose-invert max-w-none">
          {post.content.split('\n\n').map((paragraph: string, i: number) => {
            if (paragraph.startsWith('## ')) {
              return (
                <h2
                  key={i}
                  className="text-xl font-bold text-mariners-navy dark:text-white mt-8 mb-4"
                >
                  {paragraph.replace('## ', '')}
                </h2>
              );
            }
            if (paragraph.startsWith('### ')) {
              return (
                <h3
                  key={i}
                  className="text-lg font-semibold text-mariners-navy dark:text-white mt-6 mb-3"
                >
                  {paragraph.replace('### ', '')}
                </h3>
              );
            }
            return (
              <p key={i} className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
                {paragraph}
              </p>
            );
          })}
        </div>

        <footer className="mt-12 pt-6 border-t border-gray-200 dark:border-gray-700">
          <p className="text-gray-500 text-sm">
            — Mark, TridentFans
          </p>
          <div className="mt-4 flex gap-4">
            <Link href="/forum" className="text-mariners-teal hover:underline text-sm">
              Join the discussion →
            </Link>
            <Link href="/blog" className="text-mariners-teal hover:underline text-sm">
              More posts →
            </Link>
          </div>
        </footer>
      </article>
    </div>
  );
}

import { Metadata } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Props {
  params: Promise<{ postId: string }>;
  children: React.ReactNode;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { postId } = await params;

  try {
    const { data: post } = await supabase
      .from('forum_posts')
      .select('title, content')
      .eq('id', postId)
      .single();

    if (!post) {
      return {
        title: 'Post Not Found',
      };
    }

    const description =
      post.content.length > 160 ? post.content.substring(0, 157) + '...' : post.content;

    const ogImageUrl = new URL('https://tridentfans.com/api/og');
    ogImageUrl.searchParams.set('type', 'forum');
    ogImageUrl.searchParams.set('title', post.title);
    ogImageUrl.searchParams.set('subtitle', description.substring(0, 80));

    return {
      title: post.title,
      description,
      openGraph: {
        title: post.title,
        description,
        type: 'article',
        images: [
          {
            url: ogImageUrl.toString(),
            width: 1200,
            height: 630,
            alt: post.title,
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title: post.title,
        description,
        images: [ogImageUrl.toString()],
      },
    };
  } catch {
    return {
      title: 'Forum Post',
    };
  }
}

export default function PostLayout({ children }: Props) {
  return <>{children}</>;
}

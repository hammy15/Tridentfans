'use client';

import { useState } from 'react';
import { Share2, Twitter, Facebook, Link, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  ShareData,
  buildTwitterShareUrl,
  buildFacebookShareUrl,
  buildRedditShareUrl,
  copyToClipboard,
  nativeShare,
  isNativeShareSupported,
  openShareWindow,
} from '@/lib/share';

interface ShareButtonProps {
  data: ShareData;
  variant?: 'default' | 'outline' | 'ghost' | 'mariners';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  showLabel?: boolean;
  className?: string;
}

export function ShareButton({
  data,
  variant = 'outline',
  size = 'sm',
  showLabel = true,
  className,
}: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleNativeShare = async () => {
    await nativeShare(data);
  };

  const handleTwitterShare = () => {
    openShareWindow(buildTwitterShareUrl(data), 'twitter-share');
  };

  const handleFacebookShare = () => {
    openShareWindow(buildFacebookShareUrl(data), 'facebook-share');
  };

  const handleRedditShare = () => {
    openShareWindow(buildRedditShareUrl(data), 'reddit-share');
  };

  const handleCopyLink = async () => {
    const success = await copyToClipboard(data.url || 'https://tridentfans.com');
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // On mobile, use native share if available
  if (isNativeShareSupported()) {
    return (
      <Button variant={variant} size={size} onClick={handleNativeShare} className={className}>
        <Share2 className="h-4 w-4" />
        {showLabel && <span className="ml-2">Share</span>}
      </Button>
    );
  }

  // On desktop, show dropdown with options
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} className={className}>
          <Share2 className="h-4 w-4" />
          {showLabel && <span className="ml-2">Share</span>}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={handleTwitterShare}>
          <Twitter className="mr-2 h-4 w-4" />
          Share on X
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleFacebookShare}>
          <Facebook className="mr-2 h-4 w-4" />
          Share on Facebook
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleRedditShare}>
          <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z" />
          </svg>
          Share on Reddit
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleCopyLink}>
          {copied ? (
            <>
              <Check className="mr-2 h-4 w-4 text-green-500" />
              Copied!
            </>
          ) : (
            <>
              <Link className="mr-2 h-4 w-4" />
              Copy Link
            </>
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

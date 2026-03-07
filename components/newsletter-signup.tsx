'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase/client';

export function NewsletterSignup() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Insert newsletter subscription into Supabase
      const { error } = await supabase
        .from('newsletter_subscribers')
        .insert([
          {
            email: email,
            subscribed_at: new Date().toISOString(),
            active: true,
            source: 'website'
          }
        ]);

      if (error) {
        console.error('Newsletter signup error:', error);
        toast.error('Failed to subscribe. Please try again.');
        return;
      }

      toast.success("Welcome to Mark's Mariners Digest! First edition coming Sunday.");
      setEmail('');
      
      // Track conversion for analytics
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'newsletter_signup', {
          event_category: 'engagement',
          event_label: 'homepage_signup'
        });
      }
      
    } catch (error) {
      console.error('Newsletter signup error:', error);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-r from-teal-600 to-blue-700 p-6 rounded-lg">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-2xl">📧</span>
        <h3 className="text-xl font-bold text-white">Get Mark's Weekly Digest</h3>
      </div>
      
      <p className="text-teal-100 mb-4 text-sm">
        Scoops, standings, prediction leaders, hot takes — one email, every Sunday.
        The week's best Mariners analysis delivered straight to your inbox.
      </p>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          required
          className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-white/70"
          disabled={isLoading}
        />
        <Button 
          type="submit" 
          disabled={isLoading || !email}
          className="bg-white text-teal-600 hover:bg-white/90 font-semibold"
        >
          {isLoading ? 'Subscribing...' : 'Subscribe'}
        </Button>
      </form>
      
      <p className="text-teal-200 text-xs mt-2">
        Free forever. Unsubscribe anytime. No spam, just Mariners.
      </p>
    </div>
  );
}

// Newsletter subscriber management functions
export async function getNewsletterSubscribers() {
  const { data, error } = await supabase
    .from('newsletter_subscribers')
    .select('*')
    .eq('active', true)
    .order('subscribed_at', { ascending: false });

  if (error) {
    console.error('Error fetching newsletter subscribers:', error);
    return [];
  }

  return data || [];
}

export async function sendWeeklyDigest(content: string, subject: string) {
  // This will integrate with email service (SendGrid, ConvertKit, etc.)
  // For now, log the action
  console.log('Sending weekly digest:', { subject, content });
  
  // TODO: Integrate with chosen email service
  // Example: SendGrid API call, ConvertKit API, etc.
  
  return { success: true, sent: 0 }; // Placeholder
}
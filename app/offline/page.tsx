'use client';

import { WifiOff, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function OfflinePage() {
  return (
    <div className="container mx-auto px-4 py-16 flex items-center justify-center min-h-[60vh]">
      <Card className="max-w-md w-full text-center">
        <CardContent className="pt-8 pb-8">
          <div className="flex justify-center mb-6">
            <div className="h-20 w-20 rounded-full bg-mariners-navy/10 flex items-center justify-center">
              <WifiOff className="h-10 w-10 text-mariners-navy" />
            </div>
          </div>

          <h1 className="text-2xl font-bold mb-2">You&apos;re Offline</h1>
          <p className="text-muted-foreground mb-6">
            It looks like you&apos;ve lost your internet connection.
            Don&apos;t worry - TridentFans will be back when you&apos;re online!
          </p>

          <div className="space-y-3">
            <Button
              variant="mariners"
              className="w-full"
              onClick={() => window.location.reload()}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>

            <p className="text-sm text-muted-foreground">
              Some pages you&apos;ve visited before may still be available.
            </p>
          </div>

          <div className="mt-8 pt-6 border-t">
            <p className="text-sm text-muted-foreground">
              Go Mariners! We&apos;ll be here when you get back.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

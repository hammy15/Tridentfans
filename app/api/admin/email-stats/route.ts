import { NextRequest, NextResponse } from 'next/server';
import { getEmailStats } from '@/lib/email';

/**
 * GET - Get email statistics for admin dashboard
 */
export async function GET(request: NextRequest) {
  try {
    // Note: In production, add admin authentication check here
    const stats = await getEmailStats();
    return NextResponse.json(stats);
  } catch (error) {
    console.error('[Admin Email Stats] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch email stats' }, { status: 500 });
  }
}

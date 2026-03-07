import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { headers } from 'next/headers';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { partner, clickUrl, referrerPage } = await request.json();

    if (!partner || !clickUrl) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Get request metadata
    const headersList = headers();
    const userAgent = headersList.get('user-agent') || '';
    const forwardedFor = headersList.get('x-forwarded-for');
    const realIp = headersList.get('x-real-ip');
    const ipAddress = forwardedFor || realIp || '0.0.0.0';

    // Get user ID if authenticated (optional)
    const authHeader = headersList.get('authorization');
    let userId = null;
    
    if (authHeader) {
      try {
        const { data: { user } } = await supabase.auth.getUser(
          authHeader.replace('Bearer ', '')
        );
        userId = user?.id || null;
      } catch (error) {
        // User not authenticated, which is fine for affiliate tracking
      }
    }

    // Track the click in database
    const { error } = await supabase
      .from('affiliate_clicks')
      .insert([
        {
          user_id: userId,
          affiliate_partner: partner,
          click_url: clickUrl,
          referrer_page: referrerPage,
          user_agent: userAgent,
          ip_address: ipAddress,
          clicked_at: new Date().toISOString(),
        }
      ]);

    if (error) {
      console.error('Affiliate click tracking error:', error);
      return NextResponse.json(
        { error: 'Failed to track click' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Affiliate tracking error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Get affiliate performance metrics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const partner = searchParams.get('partner');
    const days = parseInt(searchParams.get('days') || '30');

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    let query = supabase
      .from('affiliate_clicks')
      .select('*')
      .gte('clicked_at', startDate.toISOString());

    if (partner) {
      query = query.eq('affiliate_partner', partner);
    }

    const { data: clicks, error } = await query
      .order('clicked_at', { ascending: false });

    if (error) {
      console.error('Error fetching affiliate clicks:', error);
      return NextResponse.json(
        { error: 'Failed to fetch affiliate data' },
        { status: 500 }
      );
    }

    // Aggregate metrics by partner
    const metrics = clicks?.reduce((acc: any, click: any) => {
      const partner = click.affiliate_partner;
      if (!acc[partner]) {
        acc[partner] = {
          partner,
          totalClicks: 0,
          conversions: 0,
          estimatedRevenue: 0,
          clicksByDay: {},
        };
      }
      
      acc[partner].totalClicks += 1;
      
      // Track conversions (simplified - would need webhook from partners)
      if (click.conversion_tracked) {
        acc[partner].conversions += 1;
      }
      
      // Estimate revenue based on typical affiliate rates
      const revenueEstimates = {
        draftkings: 150, // $150 per signup
        stubhub: 30,     // 3% of $1000 avg ticket purchase
        mlbshop: 20,     // 4% of $500 avg purchase
      };
      
      if (click.conversion_tracked) {
        acc[partner].estimatedRevenue += revenueEstimates[partner as keyof typeof revenueEstimates] || 0;
      }

      // Track clicks by day
      const date = click.clicked_at.split('T')[0];
      acc[partner].clicksByDay[date] = (acc[partner].clicksByDay[date] || 0) + 1;

      return acc;
    }, {});

    return NextResponse.json({
      success: true,
      period: `${days} days`,
      metrics: Object.values(metrics || {}),
      totalClicks: clicks?.length || 0,
    });

  } catch (error) {
    console.error('Affiliate metrics error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Update conversion status (called from webhooks or manual tracking)
export async function PATCH(request: NextRequest) {
  try {
    const { clickId, conversionValue, referenceId } = await request.json();

    if (!clickId) {
      return NextResponse.json(
        { error: 'Click ID required' },
        { status: 400 }
      );
    }

    // Update the click record with conversion info
    const { error } = await supabase
      .from('affiliate_clicks')
      .update({
        conversion_tracked: true,
        conversion_value_cents: conversionValue || 0,
        updated_at: new Date().toISOString(),
      })
      .eq('id', clickId);

    if (error) {
      console.error('Error updating conversion:', error);
      return NextResponse.json(
        { error: 'Failed to update conversion' },
        { status: 500 }
      );
    }

    // Optionally track revenue
    if (conversionValue && conversionValue > 0) {
      const { data: clickData } = await supabase
        .from('affiliate_clicks')
        .select('affiliate_partner')
        .eq('id', clickId)
        .single();

      if (clickData) {
        await supabase
          .from('revenue_tracking')
          .insert([
            {
              source: 'affiliate',
              amount_cents: conversionValue,
              description: `${clickData.affiliate_partner} affiliate conversion`,
              reference_id: clickId,
            }
          ]);
      }
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Conversion update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
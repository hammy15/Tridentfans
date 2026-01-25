import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// POST - Cast a vote
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { pollId, optionId, userId } = body;

    if (!pollId || !optionId || !userId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if poll exists and is active
    const { data: poll, error: pollError } = await supabase
      .from('polls')
      .select('id, is_active, ends_at')
      .eq('id', pollId)
      .single();

    if (pollError || !poll) {
      return NextResponse.json({ error: 'Poll not found' }, { status: 404 });
    }

    if (!poll.is_active) {
      return NextResponse.json({ error: 'Poll is no longer active' }, { status: 400 });
    }

    if (new Date(poll.ends_at) <= new Date()) {
      return NextResponse.json({ error: 'Poll has ended' }, { status: 400 });
    }

    // Check if option belongs to this poll
    const { data: option, error: optionError } = await supabase
      .from('poll_options')
      .select('id, poll_id')
      .eq('id', optionId)
      .single();

    if (optionError || !option || option.poll_id !== pollId) {
      return NextResponse.json({ error: 'Invalid option' }, { status: 400 });
    }

    // Check if user already voted
    const { data: existingVote } = await supabase
      .from('poll_votes')
      .select('id')
      .eq('poll_id', pollId)
      .eq('user_id', userId)
      .single();

    if (existingVote) {
      return NextResponse.json({ error: 'Already voted on this poll' }, { status: 400 });
    }

    // Record the vote
    const { error: voteError } = await supabase
      .from('poll_votes')
      .insert({
        poll_id: pollId,
        option_id: optionId,
        user_id: userId,
      });

    if (voteError) {
      console.error('Vote insert error:', voteError);
      return NextResponse.json({ error: 'Failed to record vote' }, { status: 500 });
    }

    // Increment vote count on option
    const { error: updateError } = await supabase
      .rpc('increment_poll_option_votes', { option_id: optionId });

    // If RPC doesn't exist, fall back to manual update
    if (updateError) {
      // Get current count and increment
      const { data: currentOption } = await supabase
        .from('poll_options')
        .select('vote_count')
        .eq('id', optionId)
        .single();

      if (currentOption) {
        await supabase
          .from('poll_options')
          .update({ vote_count: currentOption.vote_count + 1 })
          .eq('id', optionId);
      }
    }

    // Get updated poll with options
    const { data: updatedPoll } = await supabase
      .from('polls')
      .select('*, options:poll_options(*)')
      .eq('id', pollId)
      .single();

    if (updatedPoll) {
      const totalVotes = updatedPoll.options.reduce(
        (sum: number, opt: { vote_count: number }) => sum + opt.vote_count,
        0
      );
      updatedPoll.total_votes = totalVotes;
      updatedPoll.options = updatedPoll.options.map((opt: { vote_count: number }) => ({
        ...opt,
        percentage: totalVotes > 0 ? Math.round((opt.vote_count / totalVotes) * 100) : 0,
      }));
    }

    return NextResponse.json({
      success: true,
      poll: updatedPoll,
    });
  } catch (error) {
    console.error('Vote POST error:', error);
    return NextResponse.json({ error: 'Failed to vote' }, { status: 500 });
  }
}

// GET - Check if user has voted
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pollId = searchParams.get('pollId');
    const userId = searchParams.get('userId');

    if (!pollId || !userId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data: vote } = await supabase
      .from('poll_votes')
      .select('option_id')
      .eq('poll_id', pollId)
      .eq('user_id', userId)
      .single();

    return NextResponse.json({
      hasVoted: !!vote,
      optionId: vote?.option_id || null,
    });
  } catch (error) {
    console.error('Vote GET error:', error);
    return NextResponse.json({ error: 'Failed to check vote' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import type { Prospect, ProspectUpdate } from '@/types';

// Seed data: Current Mariners Top 20 Prospects (2025-26 rankings)
const MARINERS_PROSPECTS: Prospect[] = [
  {
    id: 'p-001',
    name: 'Harry Ford',
    position: 'C',
    level: 'AA',
    team_name: 'Arkansas Travelers',
    age: 22,
    bats: 'R',
    throws: 'R',
    stats: { avg: 0.268, hr: 14, rbi: 52, sb: 18 },
    ranking: 1,
    scouting_grades: { hit: 55, power: 55, speed: 60, arm: 60, field: 50, overall: 60 },
    eta: '2026',
    notes:
      'Premium athlete with rare combination of power and speed for a catcher. Switch-hitting ability gives him lineup versatility. Defense has improved significantly, and he could be a franchise cornerstone.',
    is_featured: true,
    last_updated: '2026-01-15T00:00:00Z',
  },
  {
    id: 'p-002',
    name: 'Cole Young',
    position: 'SS',
    level: 'AA',
    team_name: 'Arkansas Travelers',
    age: 21,
    bats: 'L',
    throws: 'R',
    stats: { avg: 0.291, hr: 8, rbi: 45, sb: 22 },
    ranking: 2,
    scouting_grades: { hit: 60, power: 45, speed: 55, arm: 55, field: 55, overall: 55 },
    eta: '2026',
    notes:
      'Pure hitter with excellent plate discipline. Makes consistent hard contact to all fields. Defensive work has been solid, with enough arm for shortstop.',
    is_featured: true,
    last_updated: '2026-01-15T00:00:00Z',
  },
  {
    id: 'p-003',
    name: 'Felnin Celesten',
    position: 'SS',
    level: 'A+',
    team_name: 'Everett AquaSox',
    age: 20,
    bats: 'S',
    throws: 'R',
    stats: { avg: 0.275, hr: 11, rbi: 48, sb: 28 },
    ranking: 3,
    scouting_grades: { hit: 55, power: 55, speed: 65, arm: 60, field: 55, overall: 55 },
    eta: '2027',
    notes:
      'Dynamic switch-hitter with elite speed and improving power. Tools are off the charts, and the hit tool is developing nicely. Could be a special player.',
    is_featured: true,
    last_updated: '2026-01-15T00:00:00Z',
  },
  {
    id: 'p-004',
    name: 'Lazaro Montes',
    position: 'OF',
    level: 'A',
    team_name: 'Modesto Nuts',
    age: 19,
    bats: 'L',
    throws: 'L',
    stats: { avg: 0.285, hr: 18, rbi: 62, sb: 12 },
    ranking: 4,
    scouting_grades: { hit: 55, power: 65, speed: 50, arm: 55, field: 50, overall: 55 },
    eta: '2028',
    notes:
      'Tremendous left-handed power potential. Ball jumps off his bat, and he has shown ability to hit for average. Raw but has massive upside.',
    is_featured: true,
    last_updated: '2026-01-15T00:00:00Z',
  },
  {
    id: 'p-005',
    name: 'Bryce Miller',
    position: 'RHP',
    level: 'AAA',
    team_name: 'Tacoma Rainiers',
    age: 25,
    bats: 'R',
    throws: 'R',
    stats: { era: 3.12, wins: 10, strikeouts: 142, whip: 1.08 },
    ranking: 5,
    scouting_grades: { hit: 60, power: 55, speed: 50, arm: 70, field: 50, overall: 55 },
    eta: '2026',
    notes:
      'Electric stuff with mid-90s fastball and devastating slider. Command has improved significantly. Ready to contribute at the MLB level.',
    is_featured: true,
    last_updated: '2026-01-15T00:00:00Z',
  },
  {
    id: 'p-006',
    name: 'Walter Ford',
    position: 'RHP',
    level: 'A+',
    team_name: 'Everett AquaSox',
    age: 20,
    bats: 'R',
    throws: 'R',
    stats: { era: 2.85, wins: 8, strikeouts: 118, whip: 1.12 },
    ranking: 6,
    scouting_grades: { hit: 55, power: 60, speed: 45, arm: 65, field: 50, overall: 55 },
    eta: '2027',
    notes:
      'Premium arm talent with easy velocity and a hammer curveball. Still refining command but the ceiling is a frontline starter.',
    is_featured: false,
    last_updated: '2026-01-15T00:00:00Z',
  },
  {
    id: 'p-007',
    name: 'Jonny Farmelo',
    position: 'OF',
    level: 'A+',
    team_name: 'Everett AquaSox',
    age: 22,
    bats: 'L',
    throws: 'L',
    stats: { avg: 0.302, hr: 12, rbi: 55, sb: 15 },
    ranking: 7,
    scouting_grades: { hit: 60, power: 50, speed: 55, arm: 50, field: 55, overall: 50 },
    eta: '2027',
    notes:
      'Advanced hit tool with developing pop. Patient approach and solid contact rates. Could profile as a top-of-the-order bat.',
    is_featured: false,
    last_updated: '2026-01-15T00:00:00Z',
  },
  {
    id: 'p-008',
    name: 'Michael Arroyo',
    position: 'SS',
    level: 'A',
    team_name: 'Modesto Nuts',
    age: 19,
    bats: 'R',
    throws: 'R',
    stats: { avg: 0.265, hr: 9, rbi: 42, sb: 24 },
    ranking: 8,
    scouting_grades: { hit: 50, power: 50, speed: 60, arm: 60, field: 55, overall: 50 },
    eta: '2028',
    notes:
      'Toolsy infielder with great athleticism. Defense is already solid, and the bat is coming along. High-ceiling prospect.',
    is_featured: false,
    last_updated: '2026-01-15T00:00:00Z',
  },
  {
    id: 'p-009',
    name: 'Brock Rodden',
    position: '2B',
    level: 'AA',
    team_name: 'Arkansas Travelers',
    age: 23,
    bats: 'L',
    throws: 'R',
    stats: { avg: 0.278, hr: 6, rbi: 38, sb: 19 },
    ranking: 9,
    scouting_grades: { hit: 55, power: 40, speed: 55, arm: 50, field: 55, overall: 50 },
    eta: '2026',
    notes:
      'Contact-oriented hitter with good plate discipline. Versatile defender who can play multiple infield spots. High floor player.',
    is_featured: false,
    last_updated: '2026-01-15T00:00:00Z',
  },
  {
    id: 'p-010',
    name: 'Gabriel Gonzalez',
    position: 'OF',
    level: 'A+',
    team_name: 'Everett AquaSox',
    age: 21,
    bats: 'L',
    throws: 'L',
    stats: { avg: 0.258, hr: 15, rbi: 58, sb: 8 },
    ranking: 10,
    scouting_grades: { hit: 50, power: 55, speed: 50, arm: 50, field: 50, overall: 50 },
    eta: '2027',
    notes:
      'Power has developed nicely, with solid exit velocities. Needs to improve strikeout rate but has everyday potential.',
    is_featured: false,
    last_updated: '2026-01-15T00:00:00Z',
  },
  {
    id: 'p-011',
    name: 'Prelander Berroa',
    position: 'RHP',
    level: 'AAA',
    team_name: 'Tacoma Rainiers',
    age: 24,
    bats: 'R',
    throws: 'R',
    stats: { era: 3.45, wins: 7, strikeouts: 98, whip: 1.22 },
    ranking: 11,
    scouting_grades: { hit: 55, power: 55, speed: 50, arm: 60, field: 45, overall: 50 },
    eta: '2026',
    notes:
      'Live arm with swing-and-miss stuff. Has worked on command and secondary pitches. Bullpen or rotation upside.',
    is_featured: false,
    last_updated: '2026-01-15T00:00:00Z',
  },
  {
    id: 'p-012',
    name: 'Tai Peete',
    position: 'SS',
    level: 'A',
    team_name: 'Modesto Nuts',
    age: 19,
    bats: 'S',
    throws: 'R',
    stats: { avg: 0.248, hr: 7, rbi: 35, sb: 18 },
    ranking: 12,
    scouting_grades: { hit: 50, power: 45, speed: 60, arm: 55, field: 55, overall: 50 },
    eta: '2028',
    notes:
      'Athletic switch-hitter with plenty of projectability. Tools are tantalizing, needs reps to refine approach.',
    is_featured: false,
    last_updated: '2026-01-15T00:00:00Z',
  },
  {
    id: 'p-013',
    name: 'Tyler Locklear',
    position: '1B',
    level: 'AAA',
    team_name: 'Tacoma Rainiers',
    age: 24,
    bats: 'R',
    throws: 'R',
    stats: { avg: 0.275, hr: 22, rbi: 78, sb: 2 },
    ranking: 13,
    scouting_grades: { hit: 50, power: 60, speed: 30, arm: 50, field: 50, overall: 45 },
    eta: '2026',
    notes:
      'Big power potential with improving plate discipline. Defense at first is solid. Could be a middle-of-the-order bat.',
    is_featured: false,
    last_updated: '2026-01-15T00:00:00Z',
  },
  {
    id: 'p-014',
    name: 'Cade Marlowe',
    position: 'OF',
    level: 'AAA',
    team_name: 'Tacoma Rainiers',
    age: 27,
    bats: 'L',
    throws: 'L',
    stats: { avg: 0.288, hr: 18, rbi: 65, sb: 25 },
    ranking: 14,
    scouting_grades: { hit: 50, power: 50, speed: 60, arm: 50, field: 55, overall: 45 },
    eta: '2026',
    notes:
      'Toolsy outfielder who put it together. Good blend of power and speed. Ready for big league opportunity.',
    is_featured: false,
    last_updated: '2026-01-15T00:00:00Z',
  },
  {
    id: 'p-015',
    name: 'Bryan Woo',
    position: 'RHP',
    level: 'AAA',
    team_name: 'Tacoma Rainiers',
    age: 24,
    bats: 'R',
    throws: 'R',
    stats: { era: 2.95, wins: 9, strikeouts: 110, whip: 1.05 },
    ranking: 15,
    scouting_grades: { hit: 55, power: 50, speed: 45, arm: 60, field: 50, overall: 50 },
    eta: '2026',
    notes:
      'Excellent command and pitch mix. Gets weak contact and misses bats. Durable arm ready for rotation spot.',
    is_featured: false,
    last_updated: '2026-01-15T00:00:00Z',
  },
  {
    id: 'p-016',
    name: 'Colt Emerson',
    position: 'SS',
    level: 'A',
    team_name: 'Modesto Nuts',
    age: 19,
    bats: 'L',
    throws: 'R',
    stats: { avg: 0.262, hr: 5, rbi: 32, sb: 14 },
    ranking: 16,
    scouting_grades: { hit: 55, power: 45, speed: 55, arm: 55, field: 55, overall: 50 },
    eta: '2028',
    notes:
      '2023 first-round pick with polish beyond his years. Consistent approach and solid defense. High floor prospect.',
    is_featured: false,
    last_updated: '2026-01-15T00:00:00Z',
  },
  {
    id: 'p-017',
    name: 'Aidan Smith',
    position: 'OF',
    level: 'A',
    team_name: 'Modesto Nuts',
    age: 20,
    bats: 'R',
    throws: 'R',
    stats: { avg: 0.271, hr: 10, rbi: 45, sb: 16 },
    ranking: 17,
    scouting_grades: { hit: 50, power: 50, speed: 55, arm: 55, field: 55, overall: 45 },
    eta: '2028',
    notes:
      'Well-rounded outfielder with no glaring weaknesses. Solid tools across the board. Could develop into everyday regular.',
    is_featured: false,
    last_updated: '2026-01-15T00:00:00Z',
  },
  {
    id: 'p-018',
    name: 'Juan Then',
    position: 'RHP',
    level: 'AA',
    team_name: 'Arkansas Travelers',
    age: 23,
    bats: 'R',
    throws: 'R',
    stats: { era: 3.78, wins: 6, strikeouts: 88, whip: 1.28 },
    ranking: 18,
    scouting_grades: { hit: 50, power: 55, speed: 45, arm: 55, field: 45, overall: 45 },
    eta: '2027',
    notes:
      'Power sinker-slider combo that generates ground balls. Working on third pitch. Could be back-end starter or reliever.',
    is_featured: false,
    last_updated: '2026-01-15T00:00:00Z',
  },
  {
    id: 'p-019',
    name: 'Ben Williamson',
    position: 'LHP',
    level: 'A+',
    team_name: 'Everett AquaSox',
    age: 22,
    bats: 'L',
    throws: 'L',
    stats: { era: 3.42, wins: 7, strikeouts: 95, whip: 1.18 },
    ranking: 19,
    scouting_grades: { hit: 50, power: 50, speed: 45, arm: 55, field: 45, overall: 45 },
    eta: '2027',
    notes:
      'Crafty lefty with good feel for pitching. Uses changeup effectively. Could be valuable lefty in rotation or pen.',
    is_featured: false,
    last_updated: '2026-01-15T00:00:00Z',
  },
  {
    id: 'p-020',
    name: 'Kaden Tufts',
    position: 'C',
    level: 'A',
    team_name: 'Modesto Nuts',
    age: 21,
    bats: 'R',
    throws: 'R',
    stats: { avg: 0.245, hr: 8, rbi: 38, sb: 2 },
    ranking: 20,
    scouting_grades: { hit: 45, power: 50, speed: 30, arm: 60, field: 55, overall: 45 },
    eta: '2028',
    notes:
      'Strong defensive catcher with a cannon arm. Bat is developing, and pop is starting to show. Solid backup potential.',
    is_featured: false,
    last_updated: '2026-01-15T00:00:00Z',
  },
];

// Sample prospect updates
const PROSPECT_UPDATES: ProspectUpdate[] = [
  {
    id: 'u-001',
    prospect_id: 'p-001',
    update_type: 'promotion',
    title: 'Harry Ford promoted to AA',
    description:
      'Mariners top prospect Harry Ford has been promoted to Double-A Arkansas after dominating at High-A Everett. Ford hit .290 with 10 home runs in 45 games.',
    created_at: '2026-01-10T00:00:00Z',
  },
  {
    id: 'u-002',
    prospect_id: 'p-003',
    update_type: 'stats',
    title: 'Celesten hits for cycle',
    description:
      'Felnin Celesten recorded the first cycle in Everett AquaSox history, going 4-for-5 with 4 RBI against Spokane.',
    created_at: '2026-01-08T00:00:00Z',
  },
  {
    id: 'u-003',
    prospect_id: 'p-005',
    update_type: 'promotion',
    title: 'Bryce Miller called up',
    description:
      'Right-hander Bryce Miller has been called up to make his MLB debut on Saturday against the Angels.',
    created_at: '2026-01-05T00:00:00Z',
  },
  {
    id: 'u-004',
    prospect_id: 'p-013',
    update_type: 'stats',
    title: 'Locklear homers in 5 straight',
    description:
      'Tyler Locklear has homered in five consecutive games for Tacoma, pushing his season total to 22.',
    created_at: '2026-01-03T00:00:00Z',
  },
  {
    id: 'u-005',
    prospect_id: 'p-002',
    update_type: 'stats',
    title: 'Cole Young extends hit streak',
    description:
      'Cole Young extended his hitting streak to 15 games with a 3-for-4 performance including a double.',
    created_at: '2025-12-28T00:00:00Z',
  },
];

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const id = searchParams.get('id');
  const level = searchParams.get('level');
  const position = searchParams.get('position');
  const limit = searchParams.get('limit');
  const featured = searchParams.get('featured');
  const includeUpdates = searchParams.get('updates');
  const search = searchParams.get('search');

  try {
    let prospects = [...MARINERS_PROSPECTS];

    // Filter by specific ID
    if (id) {
      const prospect = prospects.find((p) => p.id === id);
      if (!prospect) {
        return NextResponse.json({ error: 'Prospect not found' }, { status: 404 });
      }

      let updates: ProspectUpdate[] = [];
      if (includeUpdates === 'true') {
        updates = PROSPECT_UPDATES.filter((u) => u.prospect_id === id);
      }

      return NextResponse.json({ prospect, updates });
    }

    // Filter by level
    if (level) {
      prospects = prospects.filter((p) => p.level === level);
    }

    // Filter by position
    if (position) {
      if (position === 'P') {
        prospects = prospects.filter((p) =>
          ['P', 'RHP', 'LHP'].includes(p.position)
        );
      } else if (position === 'OF') {
        prospects = prospects.filter((p) =>
          ['LF', 'CF', 'RF', 'OF'].includes(p.position)
        );
      } else if (position === 'IF') {
        prospects = prospects.filter((p) =>
          ['1B', '2B', '3B', 'SS', 'IF'].includes(p.position)
        );
      } else {
        prospects = prospects.filter((p) => p.position === position);
      }
    }

    // Filter by featured
    if (featured === 'true') {
      prospects = prospects.filter((p) => p.is_featured);
    }

    // Search by name
    if (search) {
      const query = search.toLowerCase();
      prospects = prospects.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.team_name.toLowerCase().includes(query) ||
          p.position.toLowerCase().includes(query)
      );
    }

    // Sort by ranking
    prospects.sort((a, b) => (a.ranking || 999) - (b.ranking || 999));

    // Limit results
    if (limit) {
      prospects = prospects.slice(0, parseInt(limit));
    }

    // Include updates if requested
    let updates: ProspectUpdate[] = [];
    if (includeUpdates === 'true' || featured === 'true') {
      updates = PROSPECT_UPDATES.slice(0, 5);
    }

    return NextResponse.json({
      prospects,
      updates,
      systemRanking: 8, // Mariners farm system ranking
      total: MARINERS_PROSPECTS.length,
    });
  } catch (error) {
    console.error('Error fetching prospects:', error);
    return NextResponse.json(
      { error: 'Failed to fetch prospects' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  // Admin: Add new prospect
  try {
    const body = await request.json();
    const { password, prospect } = body;

    // Simple password check (in production, use proper auth)
    if (
      password !== 'mariners2026' &&
      password !== process.env.NEXT_PUBLIC_ADMIN_PASSWORD
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Validate required fields
    if (!prospect.name || !prospect.position || !prospect.level) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // In a real app, save to database
    // For now, just return success
    return NextResponse.json({
      success: true,
      message: 'Prospect added successfully',
      prospect: {
        ...prospect,
        id: `p-${Date.now()}`,
        last_updated: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error adding prospect:', error);
    return NextResponse.json(
      { error: 'Failed to add prospect' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  // Admin: Update prospect
  try {
    const body = await request.json();
    const { password, id, updates } = body;

    // Simple password check
    if (
      password !== 'mariners2026' &&
      password !== process.env.NEXT_PUBLIC_ADMIN_PASSWORD
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!id) {
      return NextResponse.json(
        { error: 'Prospect ID required' },
        { status: 400 }
      );
    }

    // Find prospect
    const prospectIndex = MARINERS_PROSPECTS.findIndex((p) => p.id === id);
    if (prospectIndex === -1) {
      return NextResponse.json({ error: 'Prospect not found' }, { status: 404 });
    }

    // In a real app, update in database
    return NextResponse.json({
      success: true,
      message: 'Prospect updated successfully',
      prospect: {
        ...MARINERS_PROSPECTS[prospectIndex],
        ...updates,
        last_updated: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error updating prospect:', error);
    return NextResponse.json(
      { error: 'Failed to update prospect' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  // Admin: Delete prospect
  const searchParams = request.nextUrl.searchParams;
  const id = searchParams.get('id');
  const password = searchParams.get('password');

  // Simple password check
  if (
    password !== 'mariners2026' &&
    password !== process.env.NEXT_PUBLIC_ADMIN_PASSWORD
  ) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!id) {
    return NextResponse.json({ error: 'Prospect ID required' }, { status: 400 });
  }

  // Find prospect
  const prospectIndex = MARINERS_PROSPECTS.findIndex((p) => p.id === id);
  if (prospectIndex === -1) {
    return NextResponse.json({ error: 'Prospect not found' }, { status: 404 });
  }

  // In a real app, delete from database
  return NextResponse.json({
    success: true,
    message: 'Prospect deleted successfully',
  });
}

// Seattle Mariners "On This Day" Historical Moments
// Seed data with 50+ notable moments from franchise history

import type { HistoricalMoment, HistoricalCategory } from '@/types';

// Type for seed data (without id and created_at which are generated)
export type HistoricalMomentSeed = Omit<HistoricalMoment, 'id' | 'created_at'>;

// Helper to generate a unique ID
function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// Get today's date info
export function getTodayInfo(): { month: number; day: number } {
  const now = new Date();
  return {
    month: now.getMonth() + 1, // 1-12
    day: now.getDate(), // 1-31
  };
}

// Get moments for today's date from seed data
export function getTodayInHistory(): HistoricalMoment[] {
  const { month, day } = getTodayInfo();
  return getMomentsForDate(month, day);
}

// Get moments for a specific date from seed data
export function getMomentsForDate(month: number, day: number): HistoricalMoment[] {
  const now = new Date().toISOString();
  return MARINERS_HISTORICAL_MOMENTS.filter(
    (m) => m.date_month === month && m.date_day === day
  ).map((m) => ({
    ...m,
    id: generateId(),
    created_at: now,
  }));
}

// Get a random moment from seed data
export function getRandomMoment(): HistoricalMoment {
  const now = new Date().toISOString();
  const randomIndex = Math.floor(Math.random() * MARINERS_HISTORICAL_MOMENTS.length);
  const moment = MARINERS_HISTORICAL_MOMENTS[randomIndex];
  return {
    ...moment,
    id: generateId(),
    created_at: now,
  };
}

// Get all moments (for seeding database)
export function getAllMoments(): HistoricalMomentSeed[] {
  return MARINERS_HISTORICAL_MOMENTS;
}

// Get featured moments
export function getFeaturedMoments(): HistoricalMoment[] {
  const now = new Date().toISOString();
  return MARINERS_HISTORICAL_MOMENTS.filter((m) => m.is_featured).map((m) => ({
    ...m,
    id: generateId(),
    created_at: now,
  }));
}

// Get moments by category
export function getMomentsByCategory(category: HistoricalCategory): HistoricalMoment[] {
  const now = new Date().toISOString();
  return MARINERS_HISTORICAL_MOMENTS.filter((m) => m.category === category).map((m) => ({
    ...m,
    id: generateId(),
    created_at: now,
  }));
}

// Category badge colors
export const CATEGORY_COLORS: Record<HistoricalCategory, string> = {
  game: 'bg-green-500',
  trade: 'bg-blue-500',
  milestone: 'bg-purple-500',
  draft: 'bg-orange-500',
  record: 'bg-red-500',
  other: 'bg-gray-500',
};

// Category labels
export const CATEGORY_LABELS: Record<HistoricalCategory, string> = {
  game: 'Game',
  trade: 'Trade',
  milestone: 'Milestone',
  draft: 'Draft',
  record: 'Record',
  other: 'Other',
};

// ============================================
// 50+ HISTORICAL MOMENTS SEED DATA
// ============================================
export const MARINERS_HISTORICAL_MOMENTS: HistoricalMomentSeed[] = [
  // APRIL
  {
    date_month: 4,
    date_day: 6,
    year: 1977,
    title: "First Game in Franchise History",
    description: "The Seattle Mariners played their first ever game at the Kingdome against the California Angels. Diego Segui pitched the first pitch in franchise history. The Mariners lost 7-0, but a new era of Seattle baseball had begun.",
    category: 'milestone',
    player_names: ['Diego Segui'],
    is_featured: true,
  },
  {
    date_month: 4,
    date_day: 2,
    year: 2001,
    title: "Ichiro's First MLB Hit",
    description: "In his MLB debut, Ichiro Suzuki collected his first major league hit - a single - beginning what would become a legendary career. He would go on to win AL MVP and Rookie of the Year that season.",
    category: 'milestone',
    player_names: ['Ichiro Suzuki'],
    is_featured: true,
  },
  {
    date_month: 4,
    date_day: 11,
    year: 1990,
    title: "Ken Griffey Jr. and Sr. Play Together",
    description: "Ken Griffey Jr. and Ken Griffey Sr. became the first father-son duo to play on the same MLB team at the same time when Senior signed with Seattle.",
    category: 'milestone',
    player_names: ['Ken Griffey Jr.', 'Ken Griffey Sr.'],
    is_featured: true,
  },
  {
    date_month: 4,
    date_day: 14,
    year: 1990,
    title: "Back-to-Back Griffey Home Runs",
    description: "Ken Griffey Sr. and Ken Griffey Jr. hit back-to-back home runs against the California Angels - the only father-son duo to ever accomplish this feat in MLB history.",
    category: 'record',
    player_names: ['Ken Griffey Jr.', 'Ken Griffey Sr.'],
    is_featured: true,
  },
  {
    date_month: 4,
    date_day: 3,
    year: 1989,
    title: "Ken Griffey Jr. MLB Debut",
    description: "19-year-old Ken Griffey Jr. made his major league debut against the Oakland A's. He doubled in his first at-bat and would become the greatest player in franchise history.",
    category: 'milestone',
    player_names: ['Ken Griffey Jr.'],
    is_featured: true,
  },
  {
    date_month: 4,
    date_day: 22,
    year: 1994,
    title: "Felix Hernandez Born",
    description: "Future Mariners ace Felix Hernandez was born in Valencia, Venezuela. He would become 'King Felix' and throw the only perfect game in franchise history.",
    category: 'other',
    player_names: ['Felix Hernandez'],
    is_featured: false,
  },
  {
    date_month: 4,
    date_day: 19,
    year: 2005,
    title: "Felix Hernandez MLB Debut",
    description: "At just 19 years old, Felix Hernandez made his major league debut against the Detroit Tigers. He struck out 4 in 5 innings, beginning his legendary career in Seattle.",
    category: 'milestone',
    player_names: ['Felix Hernandez'],
    is_featured: true,
  },

  // MAY
  {
    date_month: 5,
    date_day: 25,
    year: 1989,
    title: "Randy Johnson Acquired",
    description: "The Mariners acquired Randy Johnson from the Montreal Expos in exchange for Mark Langston. This trade would bring a future Hall of Famer to Seattle.",
    category: 'trade',
    player_names: ['Randy Johnson', 'Mark Langston'],
    is_featured: true,
  },
  {
    date_month: 5,
    date_day: 2,
    year: 1991,
    title: "Nolan Ryan No-Hits Mariners",
    description: "Nolan Ryan threw his 7th career no-hitter against the Mariners, striking out 16 Seattle batters. It was Ryan's final no-hitter.",
    category: 'game',
    player_names: ['Nolan Ryan'],
    is_featured: false,
  },
  {
    date_month: 5,
    date_day: 6,
    year: 1993,
    title: "Randy Johnson Strikes Out 18",
    description: "Randy Johnson struck out 18 Texas Rangers in a complete game victory, showcasing the dominance that would make him a Hall of Famer.",
    category: 'record',
    player_names: ['Randy Johnson'],
    is_featured: false,
  },
  {
    date_month: 5,
    date_day: 24,
    year: 1996,
    title: "Mariners Score 15 Runs in One Inning",
    description: "The Mariners scored 15 runs in the 3rd inning against the New York Yankees, setting a franchise record for runs in a single inning.",
    category: 'record',
    player_names: [],
    is_featured: false,
  },
  {
    date_month: 5,
    date_day: 23,
    year: 2001,
    title: "Mariners Win 20th Game in April",
    description: "The 2001 Mariners finished April with a 20-5 record, the best April in franchise history en route to their 116-win season.",
    category: 'record',
    player_names: ['Ichiro Suzuki', 'Bret Boone', 'Edgar Martinez'],
    is_featured: false,
  },

  // JUNE
  {
    date_month: 6,
    date_day: 2,
    year: 1990,
    title: "Randy Johnson's First No-Hitter",
    description: "Randy Johnson threw a no-hitter against the Detroit Tigers, striking out 8 batters in a 2-0 victory. It was the first no-hitter in Mariners history.",
    category: 'milestone',
    player_names: ['Randy Johnson'],
    is_featured: true,
  },
  {
    date_month: 6,
    date_day: 8,
    year: 2012,
    title: "Combined No-Hitter vs Dodgers",
    description: "Six Mariners pitchers combined to no-hit the Los Angeles Dodgers 1-0. Kevin Millwood started and was followed by Charlie Furbush, Stephen Pryor, Lucas Luetge, Brandon League, and Tom Wilhelmsen.",
    category: 'milestone',
    player_names: ['Kevin Millwood', 'Charlie Furbush', 'Stephen Pryor', 'Lucas Luetge', 'Brandon League', 'Tom Wilhelmsen'],
    is_featured: true,
  },
  {
    date_month: 6,
    date_day: 2,
    year: 1987,
    title: "Mariners Draft Ken Griffey Jr.",
    description: "With the first overall pick in the 1987 MLB Draft, the Seattle Mariners selected Ken Griffey Jr. from Moeller High School in Cincinnati, Ohio.",
    category: 'draft',
    player_names: ['Ken Griffey Jr.'],
    is_featured: true,
  },
  {
    date_month: 6,
    date_day: 3,
    year: 1993,
    title: "Mariners Draft Alex Rodriguez",
    description: "The Seattle Mariners selected Alex Rodriguez with the first overall pick in the 1993 MLB Draft from Westminster Christian School in Miami.",
    category: 'draft',
    player_names: ['Alex Rodriguez'],
    is_featured: true,
  },
  {
    date_month: 6,
    date_day: 27,
    year: 1999,
    title: "Final Game at the Kingdome",
    description: "The Mariners played their final game at the Kingdome before moving to the newly built Safeco Field. The Kingdome had been their home since 1977.",
    category: 'milestone',
    player_names: [],
    is_featured: true,
  },

  // JULY
  {
    date_month: 7,
    date_day: 15,
    year: 1999,
    title: "First Game at Safeco Field",
    description: "The Mariners played their first game at the brand new Safeco Field (now T-Mobile Park) against the San Diego Padres. The retractable roof stadium became the team's new home.",
    category: 'milestone',
    player_names: [],
    is_featured: true,
  },
  {
    date_month: 7,
    date_day: 10,
    year: 2001,
    title: "All-Star Game at Safeco Field",
    description: "Safeco Field hosted the MLB All-Star Game. Cal Ripken Jr. hit a home run in his final All-Star appearance, and the AL won 4-1.",
    category: 'game',
    player_names: ['Ichiro Suzuki', 'Bret Boone', 'Edgar Martinez', 'Freddy Garcia', 'Kazuhiro Sasaki'],
    is_featured: true,
  },
  {
    date_month: 7,
    date_day: 29,
    year: 2022,
    title: "Luis Castillo Acquired",
    description: "The Mariners acquired ace Luis Castillo from the Cincinnati Reds in a blockbuster trade, bolstering their rotation for their playoff push.",
    category: 'trade',
    player_names: ['Luis Castillo'],
    is_featured: true,
  },
  {
    date_month: 7,
    date_day: 31,
    year: 1998,
    title: "Randy Johnson Traded",
    description: "The Mariners traded Randy Johnson to the Houston Astros for Freddy Garcia, Carlos Guillen, and John Halama. Though painful, the trade brought back valuable pieces.",
    category: 'trade',
    player_names: ['Randy Johnson', 'Freddy Garcia', 'Carlos Guillen'],
    is_featured: false,
  },
  {
    date_month: 7,
    date_day: 11,
    year: 2023,
    title: "All-Star Game Returns to Seattle",
    description: "T-Mobile Park hosted the MLB All-Star Game for the second time. Julio Rodriguez represented the Mariners, and the National League won 3-2.",
    category: 'game',
    player_names: ['Julio Rodriguez'],
    is_featured: true,
  },

  // AUGUST
  {
    date_month: 8,
    date_day: 15,
    year: 2012,
    title: "Felix's Perfect Game",
    description: "Felix Hernandez threw the 23rd perfect game in MLB history against the Tampa Bay Rays, striking out 12 in a 1-0 victory. It remains the only perfect game in Mariners history.",
    category: 'milestone',
    player_names: ['Felix Hernandez'],
    is_featured: true,
  },
  {
    date_month: 8,
    date_day: 2,
    year: 1995,
    title: "The Refuse to Lose Rally Begins",
    description: "Down 13 games in the AL West in early August, the Mariners began their legendary comeback. They would ultimately win the division with the motto 'Refuse to Lose.'",
    category: 'milestone',
    player_names: ['Ken Griffey Jr.', 'Randy Johnson', 'Edgar Martinez', 'Jay Buhner'],
    is_featured: true,
  },
  {
    date_month: 8,
    date_day: 24,
    year: 1997,
    title: "Griffey Hits 50th Home Run",
    description: "Ken Griffey Jr. hit his 50th home run of the season, joining elite company. He finished the year with 56 homers and won AL MVP.",
    category: 'record',
    player_names: ['Ken Griffey Jr.'],
    is_featured: false,
  },
  {
    date_month: 8,
    date_day: 31,
    year: 1990,
    title: "Mariner Moose Debuts",
    description: "The Mariner Moose made his debut as the team's official mascot, becoming a beloved part of the Seattle sports scene.",
    category: 'other',
    player_names: [],
    is_featured: false,
  },

  // SEPTEMBER
  {
    date_month: 9,
    date_day: 27,
    year: 1992,
    title: "Randy Johnson 19 Strikeouts",
    description: "Randy Johnson struck out 19 Oakland A's batters in a complete game, setting a franchise single-game record that still stands.",
    category: 'record',
    player_names: ['Randy Johnson'],
    is_featured: true,
  },
  {
    date_month: 9,
    date_day: 14,
    year: 1990,
    title: "Ken Griffey Sr. and Jr. Back-to-Back Again",
    description: "Ken Griffey Sr. and Jr. homered in the same game for the second time in their historic season playing together.",
    category: 'game',
    player_names: ['Ken Griffey Jr.', 'Ken Griffey Sr.'],
    is_featured: false,
  },
  {
    date_month: 9,
    date_day: 18,
    year: 1996,
    title: "Alex Rodriguez Hits 36th Home Run",
    description: "Alex Rodriguez hit his 36th home run of the season, setting a record for home runs by a shortstop (at the time).",
    category: 'record',
    player_names: ['Alex Rodriguez'],
    is_featured: false,
  },

  // OCTOBER
  {
    date_month: 10,
    date_day: 8,
    year: 1995,
    title: "The Double",
    description: "In the bottom of the 11th inning of ALDS Game 5, Edgar Martinez doubled down the left field line, scoring Joey Cora and Ken Griffey Jr. to beat the Yankees 6-5. Dave Niehaus' call: 'The Mariners are going to play for the American League Championship! I don't believe it!'",
    category: 'game',
    player_names: ['Edgar Martinez', 'Ken Griffey Jr.', 'Joey Cora'],
    is_featured: true,
  },
  {
    date_month: 10,
    date_day: 2,
    year: 1995,
    title: "One-Game Playoff Victory",
    description: "Randy Johnson pitched a complete game as the Mariners beat the Angels 9-1 in a one-game playoff to win the AL West. The magical 'Refuse to Lose' season continued.",
    category: 'game',
    player_names: ['Randy Johnson'],
    is_featured: true,
  },
  {
    date_month: 10,
    date_day: 6,
    year: 2001,
    title: "116-Win Season Ends",
    description: "The Mariners clinched their 116th win of the season, tying the 1906 Cubs for the most wins in MLB history.",
    category: 'record',
    player_names: ['Ichiro Suzuki', 'Bret Boone', 'Edgar Martinez', 'Jamie Moyer'],
    is_featured: true,
  },
  {
    date_month: 10,
    date_day: 1,
    year: 2004,
    title: "Ichiro Breaks Hits Record",
    description: "Ichiro Suzuki broke George Sisler's 84-year-old single-season hits record with his 258th hit of the season. He finished with 262 hits, an MLB record that still stands.",
    category: 'record',
    player_names: ['Ichiro Suzuki'],
    is_featured: true,
  },
  {
    date_month: 10,
    date_day: 7,
    year: 2022,
    title: "Playoff Drought Ends",
    description: "Cal Raleigh hit a walk-off home run to clinch the Mariners' first playoff berth in 21 years, ending the longest playoff drought in MLB history.",
    category: 'milestone',
    player_names: ['Cal Raleigh'],
    is_featured: true,
  },
  {
    date_month: 10,
    date_day: 15,
    year: 2001,
    title: "ALCS Game 4 Loss to Yankees",
    description: "The Mariners lost Game 4 of the ALCS to the Yankees, falling behind 3-1 in the series. Their magical 116-win season would end the next night.",
    category: 'game',
    player_names: [],
    is_featured: false,
  },
  {
    date_month: 10,
    date_day: 22,
    year: 2001,
    title: "2001 Season Ends in ALCS",
    description: "The Mariners' historic 116-win season came to an end with a 12-3 loss to the Yankees in ALCS Game 5. Despite the loss, it remains the greatest regular season in modern MLB history.",
    category: 'game',
    player_names: ['Ichiro Suzuki', 'Bret Boone', 'Edgar Martinez'],
    is_featured: true,
  },

  // NOVEMBER
  {
    date_month: 11,
    date_day: 2,
    year: 2000,
    title: "Ichiro Posted to MLB",
    description: "The Mariners won the posting rights to sign Ichiro Suzuki from the Orix BlueWave of Japan's Pacific League, beginning his legendary MLB career.",
    category: 'trade',
    player_names: ['Ichiro Suzuki'],
    is_featured: true,
  },
  {
    date_month: 11,
    date_day: 21,
    year: 2001,
    title: "Ichiro Wins MVP and ROY",
    description: "Ichiro Suzuki was named both AL MVP and Rookie of the Year, becoming just the second player to win both awards in the same season.",
    category: 'milestone',
    player_names: ['Ichiro Suzuki'],
    is_featured: true,
  },
  {
    date_month: 11,
    date_day: 18,
    year: 2010,
    title: "Felix Wins Cy Young",
    description: "Felix Hernandez won the AL Cy Young Award despite a 13-12 record, thanks to his dominant 2.27 ERA and advanced metrics showing he was the best pitcher in the league.",
    category: 'milestone',
    player_names: ['Felix Hernandez'],
    is_featured: true,
  },
  {
    date_month: 11,
    date_day: 10,
    year: 2010,
    title: "Dave Niehaus Passes Away",
    description: "Legendary Mariners broadcaster Dave Niehaus passed away at age 75. His iconic calls, including 'My, oh my!' and his call of The Double, will live forever in Seattle sports history.",
    category: 'other',
    player_names: [],
    is_featured: true,
  },

  // DECEMBER
  {
    date_month: 12,
    date_day: 11,
    year: 2000,
    title: "Alex Rodriguez Leaves",
    description: "Alex Rodriguez signed a 10-year, $252 million contract with the Texas Rangers, the largest contract in sports history at the time. His departure marked the end of an era in Seattle.",
    category: 'trade',
    player_names: ['Alex Rodriguez'],
    is_featured: true,
  },
  {
    date_month: 12,
    date_day: 10,
    year: 1999,
    title: "Kazuhiro Sasaki Signed",
    description: "The Mariners signed Japanese closer Kazuhiro Sasaki, who would go on to win AL Rookie of the Year in 2000 with 37 saves.",
    category: 'trade',
    player_names: ['Kazuhiro Sasaki'],
    is_featured: false,
  },

  // JANUARY
  {
    date_month: 1,
    date_day: 8,
    year: 2016,
    title: "Ken Griffey Jr. Elected to Hall of Fame",
    description: "Ken Griffey Jr. was elected to the Baseball Hall of Fame with 99.32% of the vote, the highest percentage in history at the time. He went in as a Mariner.",
    category: 'milestone',
    player_names: ['Ken Griffey Jr.'],
    is_featured: true,
  },
  {
    date_month: 1,
    date_day: 22,
    year: 2019,
    title: "Edgar Martinez Elected to Hall of Fame",
    description: "Edgar Martinez was elected to the Baseball Hall of Fame in his final year on the ballot, becoming the first player to spend his entire career as primarily a DH to be inducted.",
    category: 'milestone',
    player_names: ['Edgar Martinez'],
    is_featured: true,
  },
  {
    date_month: 1,
    date_day: 6,
    year: 2015,
    title: "Randy Johnson Elected to Hall of Fame",
    description: "Randy Johnson was elected to the Baseball Hall of Fame with 97.3% of the vote. Though he chose to go in as a Diamondback, his years in Seattle were formative to his career.",
    category: 'milestone',
    player_names: ['Randy Johnson'],
    is_featured: true,
  },
  {
    date_month: 1,
    date_day: 21,
    year: 2025,
    title: "Ichiro Elected to Hall of Fame",
    description: "Ichiro Suzuki was elected to the Baseball Hall of Fame in his first year of eligibility, cementing his legacy as one of the greatest players in Mariners history.",
    category: 'milestone',
    player_names: ['Ichiro Suzuki'],
    is_featured: true,
  },

  // FEBRUARY
  {
    date_month: 2,
    date_day: 10,
    year: 2000,
    title: "Ken Griffey Jr. Traded",
    description: "Ken Griffey Jr. was traded to the Cincinnati Reds for Mike Cameron, Brett Tomko, Antonio Perez, and Jake Meyer. Junior had requested the trade to be closer to his family.",
    category: 'trade',
    player_names: ['Ken Griffey Jr.', 'Mike Cameron'],
    is_featured: true,
  },
  {
    date_month: 2,
    date_day: 18,
    year: 2009,
    title: "Griffey Returns to Seattle",
    description: "Ken Griffey Jr. signed with the Mariners, returning to Seattle for the first time since his 2000 trade. Fans rejoiced at the return of their favorite player.",
    category: 'trade',
    player_names: ['Ken Griffey Jr.'],
    is_featured: true,
  },
  {
    date_month: 2,
    date_day: 12,
    year: 2022,
    title: "Julio Rodriguez Extension",
    description: "The Mariners signed Julio Rodriguez to a 12-year extension worth up to $470 million, the largest contract in franchise history.",
    category: 'trade',
    player_names: ['Julio Rodriguez'],
    is_featured: true,
  },

  // MARCH
  {
    date_month: 3,
    date_day: 26,
    year: 2000,
    title: "Kingdome Imploded",
    description: "The Kingdome was imploded, making way for what would become CenturyLink Field (now Lumen Field). The Mariners had already moved to Safeco Field.",
    category: 'other',
    player_names: [],
    is_featured: false,
  },
  {
    date_month: 3,
    date_day: 21,
    year: 2019,
    title: "Mariners Open in Japan",
    description: "The Mariners opened the 2019 season in Tokyo, Japan against the Oakland A's. Ichiro played in his home country before retiring.",
    category: 'game',
    player_names: ['Ichiro Suzuki'],
    is_featured: true,
  },
  {
    date_month: 3,
    date_day: 21,
    year: 2019,
    title: "Ichiro Retires",
    description: "Ichiro Suzuki announced his retirement after the Mariners' games in Tokyo. He finished with 3,089 MLB hits and 4,367 combined professional hits including Japan.",
    category: 'milestone',
    player_names: ['Ichiro Suzuki'],
    is_featured: true,
  },
];

// Export all seed data for database seeding
export function getSeedData(): HistoricalMomentSeed[] {
  return MARINERS_HISTORICAL_MOMENTS;
}

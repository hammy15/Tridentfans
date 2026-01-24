// Comprehensive Seattle Mariners Historical Data (1977-Present)
// Used to inject context into AI bots for knowledgeable conversations

export interface HistoricalRecord {
  category: string;
  data: Record<string, unknown>;
}

// ============================================
// FRANCHISE BASICS
// ============================================
export const franchiseInfo: HistoricalRecord = {
  category: 'franchise_info',
  data: {
    name: 'Seattle Mariners',
    established: 1977,
    league: 'American League',
    division: 'AL West',
    stadiums: [
      { name: 'Kingdome', years: '1977-1999', capacity: 59166 },
      { name: 'T-Mobile Park', years: '1999-present', capacity: 47929, formerNames: ['Safeco Field (1999-2018)'] },
    ],
    colors: {
      primary: 'Navy Blue (#0C2C56)',
      secondary: 'Northwest Green/Teal (#005C5C)',
      accent: 'Silver (#C4CED4)',
    },
    mascot: {
      name: 'Mariner Moose',
      debut: 1990,
      description: 'Beloved mascot known for ATV stunts and fan interactions',
    },
    playoffAppearances: [1995, 1997, 2000, 2001, 2022, 2024],
    worldSeriesAppearances: 0,
    divisionTitles: [2001],
    wildCardWins: [1995, 1997, 2000, 2022, 2024],
  },
};

// ============================================
// LEGENDARY PLAYERS
// ============================================
export const legendaryPlayers: HistoricalRecord = {
  category: 'legendary_players',
  data: {
    hallOfFamers: [
      {
        name: 'Ken Griffey Jr.',
        nickname: 'The Kid, Junior',
        position: 'CF',
        years: '1989-1999, 2009-2010',
        achievements: [
          '10x All-Star with Mariners',
          '1997 AL MVP',
          '630 career home runs (417 with SEA)',
          'Gold Glove winner 10 times',
          'Iconic backwards cap',
          'Sweetest swing in baseball history',
        ],
        marinersStats: { avg: '.292', hr: 417, rbi: 1216, sb: 167 },
        hallOfFameYear: 2016,
        jerseyRetired: 24,
      },
      {
        name: 'Randy Johnson',
        nickname: 'The Big Unit',
        position: 'SP',
        years: '1989-1998',
        achievements: [
          '5x Cy Young Award winner (1 with SEA)',
          '10x All-Star',
          '4,875 career strikeouts',
          '1995 Cy Young with Mariners',
          'Key to 1995 playoff run',
          'Intimidating 6\'10" left-hander',
        ],
        marinersStats: { w: 130, l: 74, era: '3.42', k: 2162 },
        hallOfFameYear: 2015,
        jerseyRetired: 51,
      },
      {
        name: 'Edgar Martinez',
        nickname: 'Gar, Papi Grande',
        position: 'DH/3B',
        years: '1987-2004',
        achievements: [
          '7x All-Star',
          '2x Batting Champion (1992, 1995)',
          '.312 career batting average',
          'The Double - most iconic hit in franchise history',
          'DH Award named after him',
          'Spent entire 18-year career with Mariners',
        ],
        marinersStats: { avg: '.312', hr: 309, rbi: 1261, obp: '.418' },
        hallOfFameYear: 2019,
        jerseyRetired: 11,
      },
      {
        name: 'Ichiro Suzuki',
        nickname: 'Ichiro',
        position: 'RF',
        years: '2001-2012, 2018-2019',
        achievements: [
          '10x All-Star',
          '2001 AL MVP and ROY',
          '10 consecutive 200-hit seasons',
          '262 hits in 2004 (MLB single-season record)',
          '3,089 MLB hits + 1,278 NPB hits',
          'Gold Glove winner 10 times',
          'Laser throws from right field',
        ],
        marinersStats: { avg: '.322', hits: 2542, sb: 438 },
        hallOfFameYear: 2025,
        jerseyRetired: 51,
      },
    ],
    retiredNumbers: [
      { number: 11, player: 'Edgar Martinez', year: 2017 },
      { number: 24, player: 'Ken Griffey Jr.', year: 2016 },
      { number: 42, player: 'Jackie Robinson', year: 1997, note: 'League-wide' },
      { number: 51, player: 'Randy Johnson & Ichiro Suzuki', year: '2024' },
    ],
    franchiseGreats: [
      {
        name: 'Felix Hernandez',
        nickname: 'King Felix',
        position: 'SP',
        years: '2005-2019',
        achievements: [
          '2010 Cy Young Award',
          '6x All-Star',
          'Perfect game August 15, 2012',
          'Face of franchise during dark years',
          'Most wins in Mariners history (169)',
        ],
        marinersStats: { w: 169, l: 136, era: '3.42', k: 2524 },
      },
      {
        name: 'Jay Buhner',
        nickname: 'Bone',
        position: 'RF',
        years: '1988-2001',
        achievements: [
          '1x All-Star',
          '310 home runs with Mariners',
          'Fan favorite for intensity',
          'Part of iconic 90s core',
          'Famous Seinfeld episode reference',
        ],
        marinersStats: { avg: '.255', hr: 307, rbi: 951 },
      },
      {
        name: 'Dan Wilson',
        position: 'C',
        years: '1994-2005',
        achievements: [
          '1x All-Star',
          'Gold Glove winner',
          'Caught Randy Johnson and Felix',
          'Beloved team leader',
        ],
        marinersStats: { avg: '.262', hr: 88, rbi: 508 },
      },
      {
        name: 'Jamie Moyer',
        position: 'SP',
        years: '1996-2006',
        achievements: [
          '2x All-Star',
          '145 wins with Mariners',
          'Crafty left-hander',
          'Pitched until age 49',
        ],
        marinersStats: { w: 145, l: 87, era: '3.97' },
      },
      {
        name: 'Alvin Davis',
        nickname: 'Mr. Mariner',
        position: '1B',
        years: '1984-1991',
        achievements: [
          '1984 AL Rookie of the Year',
          '2x All-Star',
          'First true Mariners star',
        ],
        marinersStats: { avg: '.281', hr: 160, rbi: 667 },
      },
    ],
  },
};

// ============================================
// HISTORIC SEASONS
// ============================================
export const historicSeasons: HistoricalRecord = {
  category: 'historic_seasons',
  data: {
    seasons: [
      {
        year: 1995,
        record: '79-66',
        finish: 'AL West Champions',
        playoffs: 'Lost ALCS to Cleveland 4-2',
        highlights: [
          'Refuse to Lose - rallied from 13 games back in August',
          'One-game playoff vs Angels (Randy Johnson complete game)',
          'The Double by Edgar Martinez to beat Yankees in ALDS',
          'Saved baseball in Seattle - led to new stadium',
          'Ken Griffey Jr. broke wrist but returned for playoffs',
          'Vince Coleman catch phrase: "Refuse to Lose"',
        ],
        keyPlayers: ['Ken Griffey Jr.', 'Randy Johnson', 'Edgar Martinez', 'Jay Buhner', 'Tino Martinez'],
        theDouble: {
          date: 'October 8, 1995',
          opponent: 'New York Yankees',
          situation: 'Game 5 ALDS, bottom 11th, bases loaded, 2 outs',
          call: 'Swung on and lined down the left field line for a base hit! Here comes Joey! Here comes Junior to third! They\'re gonna wave him in! The throw to the plate will be... LATE! The Mariners are going to play for the American League Championship! I don\'t believe it! It just continues! My oh my!',
          announcer: 'Dave Niehaus',
          result: 'Mariners win 6-5, advance to ALCS',
        },
      },
      {
        year: 1997,
        record: '90-72',
        finish: 'Wild Card',
        playoffs: 'Lost ALDS to Baltimore 3-1',
        highlights: [
          'Randy Johnson 20-4, 2.28 ERA',
          'Ken Griffey Jr. 56 HR, 147 RBI, AL MVP',
          'Edgar Martinez .330, 28 HR, 108 RBI',
        ],
        keyPlayers: ['Ken Griffey Jr.', 'Randy Johnson', 'Edgar Martinez', 'Jay Buhner'],
      },
      {
        year: 2000,
        record: '91-71',
        finish: 'Wild Card',
        playoffs: 'Lost ALCS to Yankees 4-2',
        highlights: [
          'Alex Rodriguez final year (41 HR, .316)',
          'John Olerud .293, 14 HR',
          'Kazuhiro Sasaki 37 saves, ROY',
        ],
        keyPlayers: ['Alex Rodriguez', 'Edgar Martinez', 'John Olerud', 'Kazuhiro Sasaki'],
      },
      {
        year: 2001,
        record: '116-46',
        finish: 'AL West Champions',
        playoffs: 'Lost ALCS to Yankees 4-1',
        highlights: [
          'Tied 1906 Cubs for most wins in MLB history',
          'Ichiro debut: .350, 242 hits, MVP, ROY',
          'Bret Boone: 37 HR, 141 RBI (career year)',
          'Won 20 of first 24 games',
          'Only lost more than 2 games in a row once all season',
          '59-22 at home, 57-24 on road',
          'Heartbreaking ALCS loss to Yankees post-9/11',
        ],
        keyPlayers: ['Ichiro Suzuki', 'Bret Boone', 'Edgar Martinez', 'Jamie Moyer', 'Freddy Garcia', 'Kazuhiro Sasaki'],
        monthlyRecords: {
          april: '20-5',
          may: '20-7',
          june: '20-7',
          july: '17-8',
          august: '20-9',
          september: '19-10',
        },
      },
      {
        year: 2022,
        record: '90-72',
        finish: 'Wild Card',
        playoffs: 'Lost Wild Card Series to Houston 2-0',
        highlights: [
          'Ended 21-year playoff drought (longest in MLB)',
          'Julio Rodriguez ROY runner-up (.284, 28 HR)',
          'Cal Raleigh 27 HR (catcher record for team)',
          'Wild card clinching celebration was electric',
        ],
        keyPlayers: ['Julio Rodriguez', 'Cal Raleigh', 'Ty France', 'Eugenio Suarez', 'Luis Castillo'],
      },
      {
        year: 2024,
        record: '85-77',
        finish: 'Wild Card',
        playoffs: 'TBD',
        highlights: [
          'Second playoff appearance in 3 years',
          'Strong pitching staff',
          'Julio Rodriguez emerging superstar',
        ],
        keyPlayers: ['Julio Rodriguez', 'Cal Raleigh', 'George Kirby', 'Logan Gilbert'],
      },
    ],
    playoffDrought: {
      years: '2002-2021',
      length: '21 seasons',
      longestInMLB: true,
      ended: 'October 7, 2022 vs Cleveland',
      clinchingMoment: 'Cal Raleigh walk-off home run',
    },
  },
};

// ============================================
// FRANCHISE RECORDS
// ============================================
export const franchiseRecords: HistoricalRecord = {
  category: 'franchise_records',
  data: {
    singleSeason: {
      batting: [
        { record: 'Hits', value: 262, player: 'Ichiro Suzuki', year: 2004, note: 'MLB Record' },
        { record: 'Home Runs', value: 56, player: 'Ken Griffey Jr.', year: 1997 },
        { record: 'RBI', value: 147, player: 'Ken Griffey Jr.', year: 1997 },
        { record: 'Batting Average', value: '.372', player: 'Ichiro Suzuki', year: 2004 },
        { record: 'Stolen Bases', value: 60, player: 'Harold Reynolds', year: 1987 },
        { record: 'Runs', value: 141, player: 'Alex Rodriguez', year: 1996 },
        { record: 'Doubles', value: 54, player: 'Edgar Martinez', year: 1995 },
        { record: 'Walks', value: 123, player: 'Edgar Martinez', year: 1996 },
      ],
      pitching: [
        { record: 'Wins', value: 21, player: 'Jamie Moyer', year: 2003 },
        { record: 'Strikeouts', value: 308, player: 'Randy Johnson', year: 1993 },
        { record: 'ERA (min 162 IP)', value: '2.27', player: 'Randy Johnson', year: 1997 },
        { record: 'Saves', value: 45, player: 'Kazuhiro Sasaki', year: 2001 },
        { record: 'Innings Pitched', value: '271.2', player: 'Randy Johnson', year: 1993 },
        { record: 'Complete Games', value: 14, player: 'Randy Johnson', year: 1994 },
        { record: 'Shutouts', value: 5, player: 'Randy Johnson', year: 1994 },
      ],
    },
    career: {
      batting: [
        { record: 'Games', value: 2055, player: 'Edgar Martinez' },
        { record: 'At Bats', value: 7213, player: 'Edgar Martinez' },
        { record: 'Hits', value: 2542, player: 'Ichiro Suzuki' },
        { record: 'Home Runs', value: 417, player: 'Ken Griffey Jr.' },
        { record: 'RBI', value: 1261, player: 'Edgar Martinez' },
        { record: 'Runs', value: 1219, player: 'Edgar Martinez' },
        { record: 'Stolen Bases', value: 438, player: 'Ichiro Suzuki' },
        { record: 'Batting Average', value: '.322', player: 'Ichiro Suzuki', note: 'min 2000 PA' },
        { record: 'Doubles', value: 514, player: 'Edgar Martinez' },
        { record: 'Walks', value: 1283, player: 'Edgar Martinez' },
      ],
      pitching: [
        { record: 'Wins', value: 169, player: 'Felix Hernandez' },
        { record: 'Strikeouts', value: 2524, player: 'Felix Hernandez' },
        { record: 'Games', value: 670, player: 'Felix Hernandez' },
        { record: 'Innings Pitched', value: 2729.2, player: 'Felix Hernandez' },
        { record: 'Saves', value: 129, player: 'Kazuhiro Sasaki' },
        { record: 'Games Started', value: 418, player: 'Felix Hernandez' },
      ],
    },
  },
};

// ============================================
// MEMORABLE MOMENTS
// ============================================
export const memorableMoments: HistoricalRecord = {
  category: 'memorable_moments',
  data: {
    topMoments: [
      {
        rank: 1,
        name: 'The Double',
        date: 'October 8, 1995',
        description: 'Edgar Martinez doubles off Jack McDowell, scoring Joey Cora and Ken Griffey Jr. to beat Yankees in ALDS Game 5.',
        significance: 'Saved baseball in Seattle, led to Safeco Field construction',
      },
      {
        rank: 2,
        name: '116 Wins',
        date: '2001 Season',
        description: 'Mariners tie MLB record with 116 regular season wins',
        significance: 'Greatest regular season in modern MLB history',
      },
      {
        rank: 3,
        name: 'Felix\'s Perfect Game',
        date: 'August 15, 2012',
        description: 'Felix Hernandez throws 23rd perfect game in MLB history vs Tampa Bay Rays',
        significance: 'Only perfect game in Mariners history, 12 strikeouts',
      },
      {
        rank: 4,
        name: 'Playoff Drought Ends',
        date: 'October 7, 2022',
        description: 'Cal Raleigh walk-off home run clinches first playoff berth in 21 years',
        significance: 'Ended longest playoff drought in MLB history',
      },
      {
        rank: 5,
        name: 'Ichiro\'s 262',
        date: 'October 1, 2004',
        description: 'Ichiro Suzuki breaks George Sisler\'s 84-year-old hits record with his 258th hit, finishes with 262',
        significance: 'MLB single-season hits record',
      },
      {
        rank: 6,
        name: 'Griffey Returns',
        date: 'February 18, 2009',
        description: 'Ken Griffey Jr. signs to return to Seattle after 10 years away',
        significance: 'Beloved prodigal son returns for farewell tour',
      },
      {
        rank: 7,
        name: 'Ichiro\'s Debut',
        date: 'April 2, 2001',
        description: 'Ichiro gets first MLB hit, beginning legendary career',
        significance: 'Started 10 consecutive 200-hit seasons, won MVP and ROY',
      },
      {
        rank: 8,
        name: 'Randy\'s 19 Strikeouts',
        date: 'September 27, 1992',
        description: 'Randy Johnson strikes out 19 Oakland A\'s in a complete game',
        significance: 'Franchise single-game strikeout record',
      },
      {
        rank: 9,
        name: 'One-Game Playoff',
        date: 'October 2, 1995',
        description: 'Randy Johnson dominates Angels in tiebreaker game, Mariners win AL West',
        significance: 'Set up magical playoff run, "Refuse to Lose"',
      },
      {
        rank: 10,
        name: 'First Opening Day',
        date: 'April 6, 1977',
        description: 'Mariners play first game in franchise history vs California Angels',
        significance: 'Birth of Seattle major league baseball',
      },
    ],
    perfectGamesNoHitters: [
      {
        type: 'Perfect Game',
        pitcher: 'Felix Hernandez',
        date: 'August 15, 2012',
        opponent: 'Tampa Bay Rays',
        score: '1-0',
        strikeouts: 12,
      },
      {
        type: 'No-Hitter',
        pitcher: 'Randy Johnson',
        date: 'June 2, 1990',
        opponent: 'Detroit Tigers',
        score: '2-0',
        strikeouts: 8,
      },
      {
        type: 'Combined No-Hitter',
        pitchers: ['Kevin Millwood', 'Charlie Furbush', 'Stephen Pryor', 'Lucas Luetge', 'Brandon League', 'Tom Wilhelmsen'],
        date: 'June 8, 2012',
        opponent: 'Los Angeles Dodgers',
        score: '1-0',
      },
    ],
  },
};

// ============================================
// NOTABLE TRADES & TRANSACTIONS
// ============================================
export const notableTrades: HistoricalRecord = {
  category: 'notable_trades',
  data: {
    bestTrades: [
      {
        date: 'July 31, 1989',
        acquired: 'Ken Griffey Jr. (Draft Pick)',
        type: '1st Overall Pick, 1987 Draft',
        result: 'Hall of Fame career, face of franchise',
      },
      {
        date: 'May 25, 1989',
        acquired: 'Randy Johnson',
        gave: 'Mark Langston',
        tradedTo: 'Montreal Expos',
        result: 'Hall of Fame pitcher, 1995 Cy Young',
      },
      {
        date: 'November 2, 2000',
        acquired: 'Ichiro Suzuki',
        type: 'Posted from Orix BlueWave (NPB)',
        result: '10x All-Star, 3,000+ hits, Hall of Fame',
      },
      {
        date: 'July 29, 2022',
        acquired: 'Luis Castillo',
        gave: 'Noelvi Marte, Edwin Arroyo, Levi Stoudt, Andrew Moore',
        tradedTo: 'Cincinnati Reds',
        result: 'Ace acquisition for playoff push',
      },
    ],
    worstTrades: [
      {
        date: 'December 11, 2000',
        lost: 'Alex Rodriguez',
        type: 'Free Agency',
        wentTo: 'Texas Rangers',
        result: '10-year, $252M contract - biggest in sports history at time',
      },
      {
        date: 'February 10, 2000',
        lost: 'Ken Griffey Jr.',
        acquired: 'Mike Cameron, Brett Tomko, Antonio Perez, Jake Meyer',
        tradedTo: 'Cincinnati Reds',
        result: 'Griffey demanded trade to be closer to family',
      },
      {
        date: 'July 31, 1998',
        lost: 'Randy Johnson',
        acquired: 'Carlos Guillen, Freddy Garcia, John Halama',
        tradedTo: 'Houston Astros',
        result: 'Got some value, but lost all-time great',
      },
    ],
    draftSuccesses: [
      { year: 1987, pick: '1st Overall', player: 'Ken Griffey Jr.' },
      { year: 1993, pick: '1st Round', player: 'Alex Rodriguez' },
      { year: 2002, pick: '1st Round', player: 'John Mayberry Jr.' },
      { year: 2009, pick: '2nd Round', player: 'Kyle Seager' },
      { year: 2019, pick: '1st Round', player: 'George Kirby' },
      { year: 2019, pick: '21st Overall', player: 'Julio Rodriguez (International)' },
    ],
  },
};

// ============================================
// CURRENT ERA (2020s)
// ============================================
export const currentEra: HistoricalRecord = {
  category: 'current_era',
  data: {
    corePlayersAs2024: [
      {
        name: 'Julio Rodriguez',
        nickname: 'J-Rod',
        position: 'CF',
        acquired: '2019 International Signing',
        achievements: ['2022 AL ROY runner-up', 'All-Star', '14-year extension'],
        notes: 'Face of franchise, elite tools, exciting player',
      },
      {
        name: 'Cal Raleigh',
        nickname: 'Big Dumper',
        position: 'C',
        acquired: '2018 Draft (3rd Round)',
        achievements: ['Franchise record HR for catcher', 'Playoff drought-ending HR'],
        notes: 'Power-hitting catcher, fan favorite nickname',
      },
      {
        name: 'George Kirby',
        position: 'SP',
        acquired: '2019 Draft (1st Round)',
        achievements: ['Elite strike-thrower', 'All-Star'],
        notes: 'Pinpoint control, rising ace',
      },
      {
        name: 'Logan Gilbert',
        position: 'SP',
        acquired: '2018 Draft (1st Round)',
        achievements: ['200+ strikeouts', 'Workhorse'],
        notes: 'Tall right-hander, power stuff',
      },
      {
        name: 'Luis Castillo',
        position: 'SP',
        acquired: '2022 Trade from Reds',
        achievements: ['All-Star', 'Extension signed'],
        notes: 'Ace acquisition, leader of rotation',
      },
    ],
    recentHistory: {
      '2020': { record: '27-33', notes: 'COVID shortened season' },
      '2021': { record: '90-72', notes: 'Just missed playoffs, exciting finish' },
      '2022': { record: '90-72', notes: 'ENDED 21-YEAR PLAYOFF DROUGHT', playoff: 'Lost WC to Houston' },
      '2023': { record: '88-74', notes: 'Missed playoffs, rotation struggles' },
      '2024': { record: '85-77', notes: 'Wild Card berth', playoff: 'TBD' },
    },
    fanCulture: [
      'Big Dumper nickname for Cal Raleigh',
      'Julio chants and J-Rod Squad',
      'King\'s Court for Felix Hernandez (historic)',
      'Supreme Court section proposed for pitchers',
      'Hydroplane races and other ballpark traditions',
      'Moose mascot shenanigans',
    ],
  },
};

// ============================================
// STADIUM HISTORY
// ============================================
export const stadiumHistory: HistoricalRecord = {
  category: 'stadium_history',
  data: {
    kingdome: {
      name: 'Kingdome',
      years: '1977-1999',
      capacity: 59166,
      address: '201 S King St, Seattle, WA',
      demolished: 'March 26, 2000',
      notableEvents: [
        '1979 MLB All-Star Game',
        '1995 Division Series - The Double',
        'Ceiling tiles fell 1994, led to road trip',
        'Final game: June 27, 1999',
      ],
    },
    tMobilePark: {
      name: 'T-Mobile Park',
      formerNames: ['Safeco Field (1999-2018)'],
      years: '1999-present',
      capacity: 47929,
      address: '1250 1st Avenue S, Seattle, WA',
      openingDay: 'July 15, 1999',
      cost: '$517 million',
      features: [
        'Retractable roof (does not fully enclose)',
        'Natural grass',
        'Spectacular views of downtown Seattle',
        'Hall of Fame museum',
        'Edgar Martinez statue',
        'Ken Griffey Jr. statue',
        'Premium craft beer selection',
        'Garlic fries are famous',
      ],
      notableEvents: [
        'First game: July 15, 1999 vs Padres',
        '2001 MLB All-Star Game',
        'Felix Perfect Game: August 15, 2012',
        '2023 MLB All-Star Game',
        'Ichiro\'s 3,000th hit (2016, as visitor)',
      ],
    },
  },
};

// ============================================
// BROADCASTERS & MEDIA
// ============================================
export const broadcastHistory: HistoricalRecord = {
  category: 'broadcast_history',
  data: {
    legendaryVoices: [
      {
        name: 'Dave Niehaus',
        years: '1977-2010',
        signature: 'My, oh my!',
        otherCalls: [
          'Get out the rye bread and mustard, Grandma, it\'s grand salami time!',
          'It will fly away!',
          'Swung on and belted!',
        ],
        achievements: [
          'Ford C. Frick Award (Hall of Fame) 2008',
          'Voice of The Double',
          'Called first Mariners game ever',
          'Beloved by all Seattle fans',
        ],
        legacy: 'Statue at T-Mobile Park, plaza named after him',
      },
      {
        name: 'Rick Rizzs',
        years: '1983-1994, 2006-present',
        notes: 'Long-time radio voice, partnered with Niehaus',
      },
      {
        name: 'Aaron Goldsmith',
        years: '2013-present',
        role: 'TV Play-by-play',
        notes: 'Current primary TV voice',
      },
    ],
    mediaOutlets: [
      'ROOT Sports Northwest (TV)',
      'Seattle Sports 710 (Radio)',
      'MLB.tv streaming',
    ],
  },
};

// ============================================
// HELPER FUNCTION TO GET ALL HISTORY
// ============================================
export function getAllMarinersHistory(): HistoricalRecord[] {
  return [
    franchiseInfo,
    legendaryPlayers,
    historicSeasons,
    franchiseRecords,
    memorableMoments,
    notableTrades,
    currentEra,
    stadiumHistory,
    broadcastHistory,
  ];
}

// ============================================
// GENERATE CONTEXT FOR BOTS
// ============================================
export function generateBotContext(): string {
  // History data is available via getAllMarinersHistory() for database seeding
  // For bot context, we use a condensed summary below

  const context = `
SEATTLE MARINERS COMPREHENSIVE KNOWLEDGE BASE
==============================================

FRANCHISE OVERVIEW:
- Established: 1977
- Stadium: T-Mobile Park (formerly Safeco Field)
- Division: AL West
- Playoff Appearances: 1995, 1997, 2000, 2001, 2022, 2024
- World Series: 0 (Mariners have never been to World Series)
- Notable: 116-win season in 2001 (tied MLB record)

HALL OF FAMERS:
1. Ken Griffey Jr. (The Kid) - 417 HR with SEA, sweetest swing ever
2. Randy Johnson (Big Unit) - 6'10" lefty, 1995 Cy Young with SEA
3. Edgar Martinez - "The Double" hero, DH Award named after him
4. Ichiro Suzuki - 262 hits in 2004 (MLB record), 10 straight 200-hit seasons

FRANCHISE LEGENDS (Not HOF but beloved):
- Felix Hernandez (King Felix) - Perfect game 2012, most wins in franchise history
- Jay Buhner (Bone) - 90s power hitter, Seinfeld reference
- Dan Wilson - Catcher, caught for Randy & Felix
- Jamie Moyer - Crafty lefty, pitched until 49
- Alvin Davis - "Mr. Mariner", first real star

THE DOUBLE (Most important moment in franchise history):
- October 8, 1995, ALDS Game 5 vs Yankees
- Edgar Martinez doubles, Ken Griffey Jr. scores from first
- Dave Niehaus call: "The Mariners are going to play for the American League Championship! I don't believe it!"
- This moment saved baseball in Seattle and led to new stadium

2001 SEASON (Greatest regular season ever):
- 116-46 record (tied 1906 Cubs for most wins)
- Ichiro: .350, 242 hits, MVP, ROY
- Bret Boone: 37 HR, 141 RBI
- Lost ALCS to Yankees after 9/11

21-YEAR PLAYOFF DROUGHT:
- 2002-2021: Longest drought in MLB history
- Ended October 7, 2022: Cal Raleigh walk-off HR
- Emotional moment for long-suffering fans

CURRENT CORE (2024):
- Julio Rodriguez: Face of franchise, CF, exciting player
- Cal Raleigh: "Big Dumper", power-hitting catcher
- George Kirby: Elite control, rising ace
- Logan Gilbert: Power right-hander
- Luis Castillo: Acquired 2022, ace of staff

SINGLE-SEASON RECORDS:
- Hits: 262 (Ichiro, 2004) - MLB RECORD
- HR: 56 (Griffey, 1997)
- RBI: 147 (Griffey, 1997)
- Wins: 21 (Moyer, 2003)
- Strikeouts: 308 (Randy Johnson, 1993)

CAREER RECORDS:
- Hits: 2,542 (Ichiro)
- HR: 417 (Griffey)
- Wins: 169 (Felix Hernandez)
- Strikeouts: 2,524 (Felix Hernandez)

RETIRED NUMBERS:
#11 Edgar Martinez
#24 Ken Griffey Jr.
#42 Jackie Robinson (league-wide)
#51 Randy Johnson & Ichiro

T-MOBILE PARK:
- Opened 1999 (as Safeco Field)
- Retractable roof, natural grass
- Famous for garlic fries
- Statues of Griffey, Edgar, Dave Niehaus

DAVE NIEHAUS (Legendary Broadcaster):
- Voice of Mariners 1977-2010
- Calls: "My, oh my!", "Get out the rye bread!"
- Ford Frick Award 2008 (HOF)
- Called The Double, beloved by all fans

FAN CULTURE:
- "Big Dumper" for Cal Raleigh
- "King's Court" for Felix (yellow K cards)
- Moose mascot antics
- Long-suffering but loyal fanbase
- "Refuse to Lose" from 1995
- "True to the Blue"
`;

  return context;
}

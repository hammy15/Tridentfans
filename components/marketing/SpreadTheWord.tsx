'use client';

import { buildTwitterShareUrl, buildRedditShareUrl, nativeShare, isNativeShareSupported } from '@/lib/share';

const SHARE_DATA = {
  title: 'TridentFans - Seattle Mariners Fan Community',
  text: 'Found this Mariners fan community. Forum, predictions, live game threads. Actually pretty cool.',
  url: 'https://tridentfans.com',
  hashtags: ['Mariners', 'SeaUsRise', 'TridentFans'],
};

export function SpreadTheWord() {
  const handleShare = async () => {
    if (isNativeShareSupported()) {
      await nativeShare(SHARE_DATA);
    } else {
      window.open(buildTwitterShareUrl(SHARE_DATA), '_blank');
    }
  };

  return (
    <div className="bg-gradient-to-r from-mariners-navy to-mariners-teal rounded-xl p-6 text-white">
      <h3 className="text-lg font-bold mb-2">Help us grow</h3>
      <p className="text-white/80 text-sm mb-4">
        TridentFans is brand new. If you like what we&apos;re building, tell a friend. Share it.
        Every Mariners fan who joins makes this place better.
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={handleShare}
          className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          Share TridentFans
        </button>
        <a
          href={buildTwitterShareUrl(SHARE_DATA)}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          Post on X
        </a>
        <a
          href={buildRedditShareUrl({
            ...SHARE_DATA,
            text: 'New Mariners fan community - TridentFans. Forum, AI predictions, live game threads.',
          })}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          Share on Reddit
        </a>
      </div>
    </div>
  );
}

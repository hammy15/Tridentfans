import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t bg-mariners-navy text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="grid gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-mariners-teal text-lg">
                🔱
              </div>
              <span className="text-lg font-bold">TridentFans</span>
            </div>
            <p className="text-sm text-white/70">
              The ultimate Seattle Mariners fan community. Connect, predict, and celebrate with
              fellow fans.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="font-semibold">Quick Links</h4>
            <ul className="space-y-2 text-sm text-white/70">
              <li>
                <Link href="/predictions" className="hover:text-white">
                  Predictions
                </Link>
              </li>
              <li>
                <Link href="/forum" className="hover:text-white">
                  Forum
                </Link>
              </li>
              <li>
                <Link href="/news" className="hover:text-white">
                  News
                </Link>
              </li>
              <li>
                <Link href="/roster" className="hover:text-white">
                  Roster
                </Link>
              </li>
            </ul>
          </div>

          {/* The Team */}
          <div className="space-y-4">
            <h4 className="font-semibold">The Team</h4>
            <ul className="space-y-2 text-sm text-white/70">
              <li className="flex items-center gap-2">
                <span>⚓</span>
                <span>Mark - Owner & Operator</span>
              </li>
              <li className="flex items-center gap-2">
                <span>🧢</span>
                <span>Captain Hammy - Founding Member</span>
              </li>
              <li className="flex items-center gap-2">
                <span>⚔️</span>
                <span>Spartan - Resident Debater</span>
              </li>
            </ul>
          </div>

          {/* Mariners */}
          <div className="space-y-4">
            <h4 className="font-semibold">Seattle Mariners</h4>
            <ul className="space-y-2 text-sm text-white/70">
              <li>
                <a
                  href="https://www.mlb.com/mariners"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white"
                >
                  Official Website
                </a>
              </li>
              <li>
                <a
                  href="https://www.mlb.com/mariners/schedule"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white"
                >
                  Schedule
                </a>
              </li>
              <li>
                <a
                  href="https://www.reddit.com/r/Mariners"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white"
                >
                  r/Mariners
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-white/10 pt-8 text-center text-sm text-white/50">
          <p>
            TridentFans is a fan community and is not affiliated with the Seattle Mariners or Major
            League Baseball.
          </p>
          <p className="mt-2">Go Mariners! 🔱</p>
        </div>
      </div>
    </footer>
  );
}

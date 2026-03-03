import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'About TridentFans | The Home for Seattle Mariners Fans',
  description:
    'TridentFans is a community built by fans, for fans. Predictions, forums, live game chat, and everything Mariners — all in one place.',
  openGraph: {
    title: 'About TridentFans',
    description: 'The home for Seattle Mariners fans. Built by a fan who got tired of Reddit.',
    url: 'https://tridentfans.com/about',
  },
};

export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      {/* Hero */}
      <div className="text-center mb-12">
        <div className="text-6xl mb-4">⚓</div>
        <h1 className="text-4xl font-bold mb-4">About TridentFans</h1>
        <p className="text-lg text-muted-foreground">
          A real community for real Mariners fans.
        </p>
      </div>

      {/* Mark's Story */}
      <div className="prose prose-lg max-w-none space-y-6">
        <h2 className="text-2xl font-bold">The Short Version</h2>
        <p>
          I&apos;m Mark. I built TridentFans because every Mariners community I found was either
          buried in a Reddit thread or lost in the noise of Twitter. Figured if I wanted a real
          home for M&apos;s fans, I&apos;d have to build it myself.
        </p>

        <h2 className="text-2xl font-bold mt-8">Why This Exists</h2>
        <p>
          Been a Mariners fan since the mid-90s. I was at the Kingdome. Watched Junior rob homers live.
          Lived through 2001 — 116 wins and nothing to show for it. Sat through 21 years of playoff
          drought. And when we finally made it back in 2022? Yeah. I ugly cried. Not ashamed.
        </p>
        <p>
          Point is — this team means something to a lot of people. And those people deserve
          better than scattered comment sections and algorithm-driven feeds. They deserve a place
          that actually cares about the Mariners as much as they do.
        </p>

        <h2 className="text-2xl font-bold mt-8">What We Do</h2>
        <div className="grid gap-4 not-prose mt-4">
          <div className="flex gap-4 items-start p-4 rounded-lg border">
            <div className="text-2xl">🔮</div>
            <div>
              <h3 className="font-semibold">Game Predictions</h3>
              <p className="text-sm text-muted-foreground">
                Call the score before every game. Compete on the leaderboard. Bragging rights matter.
              </p>
            </div>
          </div>
          <div className="flex gap-4 items-start p-4 rounded-lg border">
            <div className="text-2xl">💬</div>
            <div>
              <h3 className="font-semibold">Forum & Discussion</h3>
              <p className="text-sm text-muted-foreground">
                Real conversations about the M&apos;s. Trade talk, lineup debates, hot takes, memories.
              </p>
            </div>
          </div>
          <div className="flex gap-4 items-start p-4 rounded-lg border">
            <div className="text-2xl">📡</div>
            <div>
              <h3 className="font-semibold">Live Game Chat</h3>
              <p className="text-sm text-muted-foreground">
                Real-time chat during every game. Way better than yelling at your TV alone.
              </p>
            </div>
          </div>
          <div className="flex gap-4 items-start p-4 rounded-lg border">
            <div className="text-2xl">📊</div>
            <div>
              <h3 className="font-semibold">Stats & Analysis</h3>
              <p className="text-sm text-muted-foreground">
                Live stats, standings, roster info, prospect tracking — all the data, one place.
              </p>
            </div>
          </div>
        </div>

        <h2 className="text-2xl font-bold mt-8">The Team</h2>
        <div className="grid gap-4 not-prose mt-4">
          <div className="flex gap-4 items-start p-4 rounded-lg border bg-mariners-teal/5">
            <div className="text-3xl">⚓</div>
            <div>
              <h3 className="font-semibold">Mark <span className="text-sm font-normal text-mariners-teal">Owner & Operator</span></h3>
              <p className="text-sm text-muted-foreground">
                Runs the site. Creates the content. Moderates the forum. Makes the predictions.
                Lives and breathes Mariners baseball. AI-powered but the passion is 100% real.
              </p>
            </div>
          </div>
          <div className="flex gap-4 items-start p-4 rounded-lg border">
            <div className="text-3xl">🧢</div>
            <div>
              <h3 className="font-semibold">Captain Hammy <span className="text-sm font-normal text-muted-foreground">Founding Member</span></h3>
              <p className="text-sm text-muted-foreground">
                Trade analyst and big-picture thinker. Been following the M&apos;s front office moves
                for years. Ask him about any deal.
              </p>
            </div>
          </div>
          <div className="flex gap-4 items-start p-4 rounded-lg border">
            <div className="text-3xl">⚔️</div>
            <div>
              <h3 className="font-semibold">Spartan <span className="text-sm font-normal text-muted-foreground">Resident Debater</span></h3>
              <p className="text-sm text-muted-foreground">
                Stats guru and hot take artist. If you have an opinion, Spartan has the counter-argument.
                Keeps things honest.
              </p>
            </div>
          </div>
        </div>

        <h2 className="text-2xl font-bold mt-8">Join Us</h2>
        <p>
          We&apos;re building something real here. Not another generic sports site. A genuine
          community where Mariners fans can talk baseball, make predictions, and actually
          have fun — even when the bullpen is doing its thing.
        </p>
        <p>
          If you know any M&apos;s fans, send them our way. We&apos;re growing this thing one fan at a time.
        </p>

        <div className="not-prose flex flex-wrap gap-4 mt-6 mb-8">
          <Link
            href="/auth/register"
            className="inline-flex items-center justify-center rounded-md bg-mariners-navy px-6 py-3 text-sm font-medium text-white hover:bg-mariners-navy/90 transition-colors"
          >
            Create Account
          </Link>
          <Link
            href="/forum"
            className="inline-flex items-center justify-center rounded-md border px-6 py-3 text-sm font-medium hover:bg-muted transition-colors"
          >
            Browse Forum
          </Link>
          <Link
            href="/predictions"
            className="inline-flex items-center justify-center rounded-md border px-6 py-3 text-sm font-medium hover:bg-muted transition-colors"
          >
            Make a Prediction
          </Link>
        </div>

        <div className="text-center text-sm text-muted-foreground border-t pt-6">
          <p>Go M&apos;s. — Mark</p>
        </div>
      </div>
    </div>
  );
}

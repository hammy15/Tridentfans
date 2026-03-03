'use client';

import { useState, useEffect } from 'react';
import { Trophy, MessageSquare, Bot, Newspaper, Users, ChevronRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

const SPLASH_KEY = 'tridentfans_splash_seen';

const features = [
  {
    icon: Trophy,
    title: 'Predictions',
    description: 'Compete daily with 10 picks per game',
    href: '/predictions',
    color: 'from-yellow-400 to-orange-500',
    iconBg: 'bg-yellow-500',
  },
  {
    icon: Bot,
    title: 'AI Experts',
    description: 'Talk to Mark & the team',
    href: '/bots',
    color: 'from-emerald-400 to-teal-500',
    iconBg: 'bg-emerald-500',
  },
  {
    icon: MessageSquare,
    title: 'Forum',
    description: 'Join the conversation with fans',
    href: '/forum',
    color: 'from-blue-400 to-indigo-500',
    iconBg: 'bg-blue-500',
  },
  {
    icon: Newspaper,
    title: 'News',
    description: 'Latest Mariners updates',
    href: '/news',
    color: 'from-purple-400 to-pink-500',
    iconBg: 'bg-purple-500',
  },
];

export function AnimatedSplash() {
  const [isVisible, setIsVisible] = useState(false);
  const [stage, setStage] = useState(0); // 0: logo, 1: title, 2: features, 3: ready

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const seen = localStorage.getItem(SPLASH_KEY);
    if (!seen) {
      setIsVisible(true);
      // Animate through stages
      setTimeout(() => setStage(1), 500);
      setTimeout(() => setStage(2), 1200);
      setTimeout(() => setStage(3), 2000);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem(SPLASH_KEY, 'true');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-mariners-navy via-[#0a2342] to-mariners-teal">
        {/* Animated particles */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-white/10 animate-pulse"
              style={{
                width: Math.random() * 10 + 5,
                height: Math.random() * 10 + 5,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${Math.random() * 3 + 2}s`,
              }}
            />
          ))}
        </div>

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
      </div>

      {/* Content */}
      <div className="relative h-full flex flex-col items-center justify-center px-6 py-12">
        {/* Animated Trident Logo */}
        <div
          className={`transition-all duration-1000 ease-out ${
            stage >= 0 ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
          }`}
        >
          <div className="relative">
            {/* Glow effect */}
            <div className="absolute inset-0 blur-3xl bg-mariners-teal/30 rounded-full scale-150" />

            {/* Trident */}
            <div className="relative text-8xl md:text-9xl animate-[bounce-slow_3s_ease-in-out_infinite]">
              🔱
            </div>

            {/* Sparkles */}
            <Sparkles
              className={`absolute -top-2 -right-2 h-8 w-8 text-yellow-400 transition-all duration-500 ${
                stage >= 1 ? 'opacity-100 rotate-12' : 'opacity-0 rotate-0'
              }`}
            />
          </div>
        </div>

        {/* Title */}
        <div
          className={`mt-8 text-center transition-all duration-700 ease-out ${
            stage >= 1 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <h1 className="text-5xl md:text-6xl font-black text-white tracking-tight">
            TRIDENT
            <span className="text-mariners-teal">FANS</span>
          </h1>
          <p className="mt-3 text-xl text-white/80 font-medium">
            The Ultimate Mariners Community
          </p>
          <div className="mt-2 flex items-center justify-center gap-2 text-white/60">
            <Users className="h-4 w-4" />
            <span className="text-sm">Join thousands of fans</span>
          </div>
        </div>

        {/* Feature Cards */}
        <div
          className={`mt-10 w-full max-w-lg transition-all duration-700 ease-out ${
            stage >= 2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
          }`}
        >
          <div className="grid grid-cols-2 gap-3">
            {features.map((feature, index) => (
              <Link
                key={feature.title}
                href={feature.href}
                onClick={handleDismiss}
                className={`group relative overflow-hidden rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 p-4 transition-all duration-300 hover:scale-105 hover:bg-white/20`}
                style={{
                  transitionDelay: `${index * 100}ms`,
                }}
              >
                {/* Gradient accent */}
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-20 transition-opacity`} />

                <div className="relative">
                  <div className={`h-10 w-10 rounded-xl ${feature.iconBg} flex items-center justify-center mb-3 shadow-lg`}>
                    <feature.icon className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="font-bold text-white text-lg">{feature.title}</h3>
                  <p className="text-white/70 text-sm mt-1">{feature.description}</p>
                </div>

                <ChevronRight className="absolute bottom-4 right-4 h-5 w-5 text-white/40 group-hover:text-white/80 group-hover:translate-x-1 transition-all" />
              </Link>
            ))}
          </div>
        </div>

        {/* CTA Button */}
        <div
          className={`mt-10 w-full max-w-lg transition-all duration-700 ease-out ${
            stage >= 3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <Button
            onClick={handleDismiss}
            className="w-full h-14 text-lg font-bold bg-white text-mariners-navy hover:bg-white/90 rounded-2xl shadow-2xl shadow-white/20 transition-all hover:scale-105"
          >
            Enter TridentFans
            <ChevronRight className="ml-2 h-5 w-5" />
          </Button>

          <p className="mt-4 text-center text-white/50 text-sm">
            Sea Us Rise! ⚾
          </p>
        </div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-mariners-navy to-transparent pointer-events-none" />
    </div>
  );
}

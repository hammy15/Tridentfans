'use client';

import { useState, useEffect } from 'react';
import { X, Trophy, MessageSquare, Bot, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

const ONBOARDING_KEY = 'tridentfans_onboarding_complete';

interface Step {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: { label: string; href: string };
}

const steps: Step[] = [
  {
    icon: <Sparkles className="h-8 w-8 text-mariners-teal" />,
    title: 'Welcome to TridentFans!',
    description:
      "You've joined the ultimate Seattle Mariners fan community. Let's show you around!",
  },
  {
    icon: <Trophy className="h-8 w-8 text-yellow-500" />,
    title: 'Make Predictions',
    description:
      'Predict game outcomes and compete on the leaderboard. Earn points for accuracy and climb the ranks!',
    action: { label: 'Make a Prediction', href: '/predictions' },
  },
  {
    icon: <Bot className="h-8 w-8 text-mariners-teal" />,
    title: 'Chat with Mark & the Team',
    description:
      'Meet Mark (the owner), Captain Hammy, and Spartan — talk Mariners, ask questions, or debate hot takes!',
    action: { label: 'Start Chatting', href: '/bots' },
  },
  {
    icon: <MessageSquare className="h-8 w-8 text-blue-500" />,
    title: 'Join the Discussion',
    description:
      'Connect with fellow fans in our forums. Share hot takes, analysis, and game day reactions!',
    action: { label: 'Browse Forum', href: '/forum' },
  },
];

export function WelcomeModal() {
  const { user, profile } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    // Only show for authenticated users who haven't completed onboarding
    if (user && typeof window !== 'undefined') {
      const completed = localStorage.getItem(ONBOARDING_KEY);
      if (!completed) {
        // Delay showing modal slightly to not interrupt initial page load
        const timer = setTimeout(() => setIsOpen(true), 1500);
        return () => clearTimeout(timer);
      }
    }
  }, [user]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleComplete = () => {
    localStorage.setItem(ONBOARDING_KEY, 'true');
    setIsOpen(false);
  };

  if (!isOpen) return null;

  const step = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <Card className="w-full max-w-md mx-4 animate-in fade-in zoom-in duration-300">
        <CardContent className="p-6">
          {/* Close button */}
          <button
            onClick={handleSkip}
            className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Progress dots */}
          <div className="flex justify-center gap-2 mb-6">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`h-2 w-2 rounded-full transition-colors ${
                  index === currentStep
                    ? 'bg-mariners-teal'
                    : index < currentStep
                      ? 'bg-mariners-teal/50'
                      : 'bg-muted'
                }`}
              />
            ))}
          </div>

          {/* Content */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                {step.icon}
              </div>
            </div>

            {currentStep === 0 && profile?.username && (
              <p className="text-sm text-mariners-teal font-medium mb-2">
                Hey, {profile.username}!
              </p>
            )}

            <h2 className="text-xl font-bold mb-2">{step.title}</h2>
            <p className="text-muted-foreground">{step.description}</p>

            {step.action && (
              <Link href={step.action.href} onClick={handleComplete}>
                <Button variant="mariners" className="mt-4">
                  {step.action.label}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            )}
          </div>

          {/* Navigation */}
          <div className="flex justify-between items-center">
            <button
              onClick={handleSkip}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Skip tour
            </button>

            <div className="flex gap-2">
              {currentStep > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentStep(prev => prev - 1)}
                >
                  Back
                </Button>
              )}
              <Button variant="mariners" size="sm" onClick={handleNext}>
                {isLastStep ? "Let's Go!" : 'Next'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

'use client';

import confetti from 'canvas-confetti';
import { Button } from '@/components/ui/button';

// Mariners colors
const MARINERS_COLORS = ['#0C2C56', '#005C5C', '#C4CED4', '#FFFFFF'];

interface ConfettiOptions {
  particleCount?: number;
  spread?: number;
  origin?: { x: number; y: number };
  colors?: string[];
}

/**
 * Triggers a confetti celebration with Mariners colors.
 * Call this function to launch confetti from the center of the screen.
 */
export function triggerConfetti(options: ConfettiOptions = {}) {
  const {
    particleCount = 100,
    spread = 70,
    origin = { x: 0.5, y: 0.6 },
    colors = MARINERS_COLORS,
  } = options;

  // First burst
  confetti({
    particleCount,
    spread,
    origin,
    colors,
    zIndex: 9999,
  });

  // Second burst with slight delay for more effect
  setTimeout(() => {
    confetti({
      particleCount: Math.floor(particleCount * 0.6),
      spread: spread * 1.2,
      origin: { x: origin.x - 0.1, y: origin.y },
      colors,
      zIndex: 9999,
    });
  }, 150);

  setTimeout(() => {
    confetti({
      particleCount: Math.floor(particleCount * 0.6),
      spread: spread * 1.2,
      origin: { x: origin.x + 0.1, y: origin.y },
      colors,
      zIndex: 9999,
    });
  }, 300);
}

/**
 * Triggers a more elaborate victory confetti with multiple bursts
 */
export function triggerVictoryConfetti() {
  const duration = 3000;
  const end = Date.now() + duration;

  const frame = () => {
    confetti({
      particleCount: 3,
      angle: 60,
      spread: 55,
      origin: { x: 0 },
      colors: MARINERS_COLORS,
      zIndex: 9999,
    });
    confetti({
      particleCount: 3,
      angle: 120,
      spread: 55,
      origin: { x: 1 },
      colors: MARINERS_COLORS,
      zIndex: 9999,
    });

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  };

  frame();
}

/**
 * Triggers confetti that falls like snow/rain
 */
export function triggerSnowConfetti() {
  const duration = 5000;
  const end = Date.now() + duration;

  const frame = () => {
    confetti({
      particleCount: 1,
      startVelocity: 0,
      ticks: 300,
      origin: {
        x: Math.random(),
        y: Math.random() * 0.2,
      },
      colors: MARINERS_COLORS,
      shapes: ['circle'],
      gravity: 0.5,
      scalar: 1.2,
      drift: Math.random() - 0.5,
      zIndex: 9999,
    });

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  };

  frame();
}

interface ConfettiButtonProps {
  children?: React.ReactNode;
  variant?: 'default' | 'victory' | 'snow';
  className?: string;
}

/**
 * A button component for testing confetti effects.
 * Useful for development and demonstration purposes.
 */
export function ConfettiButton({
  children = 'Celebrate!',
  variant = 'default',
  className = ''
}: ConfettiButtonProps) {
  const handleClick = () => {
    switch (variant) {
      case 'victory':
        triggerVictoryConfetti();
        break;
      case 'snow':
        triggerSnowConfetti();
        break;
      default:
        triggerConfetti();
    }
  };

  return (
    <Button
      onClick={handleClick}
      variant="mariners"
      className={className}
    >
      {children}
    </Button>
  );
}

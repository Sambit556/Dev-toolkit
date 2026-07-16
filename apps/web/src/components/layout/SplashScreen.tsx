'use client';

import React, { useEffect, useRef, useState } from 'react';

const INTRO_MS = 450;
const ANTICIPATION_MS = 200;
const TRAVEL_MS = 450;
const BACKDROP_FADE_MS = 200;
const REDUCED_MOTION_VISIBLE_MS = 200;
const REDUCED_MOTION_FADE_MS = 250;

type Phase = 'intro' | 'anticipation' | 'traveling' | 'done';

export function SplashScreen() {
  const [phase, setPhase] = useState<Phase>('intro');
  const [backdropFading, setBackdropFading] = useState(false);
  const [progressActive, setProgressActive] = useState(false);
  const logoRef = useRef<HTMLDivElement>(null);
  const [logoStyle, setLogoStyle] = useState<React.CSSProperties>({});

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const root = document.documentElement;
    const prevOverflow = root.style.overflow;
    root.style.overflow = 'hidden';

    const timers: ReturnType<typeof setTimeout>[] = [];
    const schedule = (fn: () => void, ms: number) => timers.push(setTimeout(fn, ms));

    const finish = (fadeMs: number) => {
      setBackdropFading(true);
      schedule(() => {
        setPhase('done');
        root.style.overflow = prevOverflow;
        root.classList.remove('splash-phase-intro', 'splash-phase-traveling');
        root.classList.add('splash-phase-done');
        // Clean up the done class after animations complete to prevent memory or transition lockups
        schedule(() => {
          root.classList.remove('splash-phase-done');
        }, 500);
      }, fadeMs);
    };

    if (prefersReducedMotion) {
      schedule(() => finish(REDUCED_MOTION_FADE_MS), REDUCED_MOTION_VISIBLE_MS);
    } else {
      // 1. Initial State
      root.classList.add('splash-phase-intro');
      requestAnimationFrame(() => {
        setProgressActive(true);
      });

      // 2. Transition to Anticipation (when load completes)
      schedule(() => {
        setPhase('anticipation');

        // 3. Transition to Flight / Travel
        schedule(() => {
          const logoEl = logoRef.current;
          const targetEl = document.getElementById('header-logo-mark');

          if (!logoEl || !targetEl) {
            finish(BACKDROP_FADE_MS);
            return;
          }

          const startRect = logoEl.getBoundingClientRect();
          const targetRect = targetEl.getBoundingClientRect();

          // Apply FLIP layout freeze
          setLogoStyle({
            position: 'fixed',
            top: startRect.top,
            left: startRect.left,
            width: startRect.width,
            height: startRect.height,
            margin: 0,
            transformOrigin: 'top left',
            transition: `transform ${TRAVEL_MS}ms cubic-bezier(0.16, 1, 0.3, 1), 
                         border-radius ${TRAVEL_MS}ms cubic-bezier(0.16, 1, 0.3, 1), 
                         box-shadow ${TRAVEL_MS}ms cubic-bezier(0.16, 1, 0.3, 1)`,
            transform: 'translate(0px, 0px) scale(1, 1) rotateX(0deg) rotateY(0deg)',
            zIndex: 1000,
            borderRadius: '16px',
            perspective: '1000px',
          });

          setPhase('traveling');
          root.classList.remove('splash-phase-intro');
          root.classList.add('splash-phase-traveling');

          // Trigger flight on next animation frame
          requestAnimationFrame(() => {
            const dx = targetRect.left - startRect.left;
            const dy = targetRect.top - startRect.top;
            const sx = targetRect.width / startRect.width;
            const sy = targetRect.height / startRect.height;
            
            // Add slight 3D rotate to simulate physical camera perspective shift during flight
            setLogoStyle((prev) => ({
              ...prev,
              transform: `translate(${dx}px, ${dy}px) scale(${sx}, ${sy}) rotateX(6deg) rotateY(-10deg)`,
              borderRadius: '6px',
              boxShadow: '0 4px 12px rgba(59, 130, 246, 0.15)',
            }));
          });

          // 4. Trigger Landing and finish
          schedule(() => {
            window.dispatchEvent(new CustomEvent('splash-landed'));
            finish(BACKDROP_FADE_MS);
          }, TRAVEL_MS);

        }, ANTICIPATION_MS);

      }, INTRO_MS);
    }

    return () => {
      timers.forEach(clearTimeout);
      root.style.overflow = prevOverflow;
      root.classList.remove('splash-phase-intro', 'splash-phase-traveling', 'splash-phase-done');
    };
  }, []);

  if (phase === 'done') return null;

  const traveling = phase === 'traveling';
  const anticipation = phase === 'anticipation';

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed inset-0 z-[999] flex flex-col items-center justify-center bg-background/98 backdrop-blur-2xl transition-all duration-300 ease-out ${
        backdropFading || traveling ? 'opacity-0 pointer-events-none backdrop-blur-none bg-background/0' : 'opacity-100'
      }`}
      style={{
        transitionDuration: traveling ? `${TRAVEL_MS}ms` : `${BACKDROP_FADE_MS}ms`,
        transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      {/* Ambient brand glow - visionOS light leak portal effect */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-tr from-blue-500/25 via-purple-500/20 to-transparent blur-3xl transition-all"
        style={{
          transform: `translate(-50%, -50%) ${
            anticipation
              ? 'scale(1.15)'
              : traveling || backdropFading
              ? 'scale(1.4)'
              : 'scale(1)'
          }`,
          opacity: traveling || backdropFading ? 0 : anticipation ? 0.9 : 0.6,
          transitionDuration: traveling ? `${TRAVEL_MS}ms` : '300ms',
          transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      />

      <div className="relative flex flex-col items-center gap-5">
        {/* Logo mark — this exact element travels into the header on exit */}
        <div
          ref={logoRef}
          style={logoStyle}
          className={`relative flex h-16 w-16 items-center justify-center overflow-hidden bg-gradient-to-br from-blue-600 via-blue-500 to-purple-600 text-[27.4px] font-black text-white shadow-lg shadow-blue-500/30 ${
            phase === 'intro'
              ? 'rounded-2xl motion-safe:animate-premium-logo-in'
              : phase === 'anticipation'
              ? 'rounded-2xl animate-premium-logo-squeeze'
              : 'shadow-md'
          }`}
        >
          <span className="relative z-10 select-none">DK</span>
          {phase === 'intro' && (
            <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent animate-premium-splash-shimmer" />
          )}
        </div>

        {/* Wordmark and tagline */}
        <div
          className={`flex flex-col items-center gap-1.5 transition-all ${
            phase === 'intro'
              ? 'motion-safe:animate-premium-text-in'
              : 'animate-premium-element-out'
          }`}
        >
          <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-500 bg-clip-text text-xl font-bold tracking-tight text-transparent select-none">
            DevKits
          </span>
          <span className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground select-none">
            Developer Utility Suite
          </span>
        </div>

        {/* Loading bar progresses from 0% to 100% dynamically */}
        <div
          className={`mt-1 h-[3px] w-28 overflow-hidden rounded-full bg-muted/60 transition-all ${
            phase === 'intro' ? 'opacity-100' : 'animate-premium-element-out'
          }`}
        >
          <div
            className="h-full rounded-full bg-gradient-to-r from-blue-600 via-purple-600 to-blue-500 transition-all ease-out"
            style={{
              width: progressActive ? '100%' : '0%',
              transitionDuration: `${INTRO_MS}ms`,
            }}
          />
        </div>
      </div>

      <span className="sr-only">Loading DevKits developer tools…</span>
    </div>
  );
}

import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { homepageAPI } from '../services/api';

const AUTO_SLIDE_MS = 5000;

// ── Skeleton — exact same dimensions as the live slider ──────────────────────
export const HeroSkeleton = () => (
  <section className="relative w-full h-[60vh] min-h-[400px] bg-[#EEEBE8] overflow-hidden">
    {/* Shimmer sweep */}
    <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.6s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
    {/* Ghost text block */}
    <div className="absolute inset-0 flex items-center">
      <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 w-full space-y-4">
        <div className="h-2.5 w-20 rounded-full bg-white/30" />
        <div className="h-8 w-64 rounded-xl bg-white/30" />
        <div className="h-8 w-48 rounded-xl bg-white/25" />
        <div className="h-4 w-72 rounded-lg bg-white/20 mt-2" />
        <div className="h-10 w-32 rounded-full bg-white/30 mt-4" />
      </div>
    </div>
  </section>
);

// ── Empty state — no slides configured ───────────────────────────────────────
const HeroEmpty = () => (
  <section className="relative w-full h-[60vh] min-h-[400px] bg-[#F0EDEA] flex items-center justify-center overflow-hidden">
    <div className="text-center px-4">
      <p className="text-[10px] tracking-[0.35em] uppercase text-[#9CA3AF] mb-3">Hero Slider</p>
      <p className="text-lg font-light text-[#6B7280] tracking-tight">
        Slider content coming soon
      </p>
    </div>
  </section>
);

// ── Main slider ───────────────────────────────────────────────────────────────
const HeroSlider = ({ slides = [], loading = false }) => {
  const [current, setCurrent] = useState(0);
  const timerRef = useRef(null);
  const total = slides.length;

  const goTo = useCallback((index) => {
    setCurrent((index + total) % total);
  }, [total]);

  const next = useCallback(() => goTo(current + 1), [current, goTo]);
  const prev = useCallback(() => goTo(current - 1), [current, goTo]);

  // Auto-slide
  useEffect(() => {
    if (total <= 1) return;
    timerRef.current = setInterval(next, AUTO_SLIDE_MS);
    return () => clearInterval(timerRef.current);
  }, [next, total]);

  // Preload first image as soon as slides arrive
  useEffect(() => {
    if (slides[0]?.image) {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = slides[0].image;
      document.head.appendChild(link);
      return () => document.head.removeChild(link);
    }
  }, [slides]);

  if (loading) return <HeroSkeleton />;
  if (total === 0) return <HeroEmpty />;

  return (
    <section className="relative w-full h-[60vh] min-h-[400px] overflow-hidden bg-[#F0EDEA]">
      {slides.map((s, i) => (
        <div
          key={s._id}
          aria-hidden={i !== current}
          className={`absolute inset-0 transition-opacity duration-700 ${
            i === current ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
          }`}
        >
          <img
            src={s.image}
            alt={s.title}
            loading={i === 0 ? 'eager' : 'lazy'}
            fetchpriority={i === 0 ? 'high' : 'auto'}
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/20 to-transparent" />

          <div className="relative z-10 h-full flex items-center">
            <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 w-full">
              <div className="max-w-lg">
                <p className="text-[10px] tracking-[0.35em] uppercase text-white/70 mb-3">
                  New Collection
                </p>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-light text-white leading-[1.1] tracking-tight mb-4 whitespace-pre-line drop-shadow-sm">
                  {s.title}
                </h1>
                {s.subtitle && (
                  <p className="text-sm text-white/80 leading-relaxed mb-6 max-w-xs">
                    {s.subtitle}
                  </p>
                )}
                {s.buttonText && s.link && (
                  <Link
                    to={s.link}
                    onClick={() => homepageAPI.trackClick(s._id).catch(() => {})}
                    className="inline-flex items-center gap-2 bg-white text-[#1A1A1A] text-xs tracking-widest uppercase px-7 py-3 rounded-full hover:bg-white/90 transition duration-300 shadow-sm"
                  >
                    {s.buttonText}
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}

      {total > 1 && (
        <>
          <button
            onClick={prev}
            aria-label="Previous slide"
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white/20 hover:bg-white/40 backdrop-blur-sm flex items-center justify-center transition duration-300"
          >
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={next}
            aria-label="Next slide"
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white/20 hover:bg-white/40 backdrop-blur-sm flex items-center justify-center transition duration-300"
          >
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 flex gap-2">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                aria-label={`Go to slide ${i + 1}`}
                className={`rounded-full transition-all duration-300 ${
                  i === current ? 'w-6 h-2 bg-white' : 'w-2 h-2 bg-white/40 hover:bg-white/70'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
};

export default HeroSlider;

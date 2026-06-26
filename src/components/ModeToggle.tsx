import { useState, useEffect } from 'react';

export default function ModeToggle() {
  const [mode, setMode] = useState<'photography' | 'programming'>(() => {
    if (typeof window !== 'undefined') {
      return window.location.pathname.startsWith('/programming')
        ? 'programming'
        : 'photography';
    }
    return 'photography';
  });

  useEffect(() => {
    const updateMode = () => {
      setMode(
        window.location.pathname.startsWith('/programming')
          ? 'programming'
          : 'photography'
      );
    };

    updateMode();
    document.addEventListener('astro:after-swap', updateMode);
    return () => document.removeEventListener('astro:after-swap', updateMode);
  }, []);

  const isPhotography = mode === 'photography';
  const targetHref = isPhotography ? '/programming' : '/photography';
  const targetLabel = isPhotography ? 'Programming' : 'Photography';

  return (
    <a
      href={targetHref}
      className="relative flex items-center gap-3 px-4 py-2 rounded-full border transition-all duration-300 hover:scale-105"
      style={{
        borderColor: 'var(--color-border)',
        color: 'var(--color-text)',
      }}
    >
      <span className="text-sm font-medium">{targetLabel}</span>
      <span
        className="w-3 h-3 rounded-full"
        style={{
          backgroundColor: isPhotography ? '#0a0a0a' : '#ffffff',
        }}
      />
    </a>
  );
}

import { useEffect, useRef } from 'react';

interface UseKeyPressProps {
  onKeyPress: () => void;
  enabled?: boolean;
  debounceMs?: number;
}

export function useKeyPress({
  onKeyPress,
  enabled = true,
  debounceMs = 50,
}: UseKeyPressProps) {
  const lastPressRef = useRef<number>(0);

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code !== 'Space' && e.key !== ' ') return;
      if (e.repeat) return;

      e.preventDefault();
      e.stopPropagation();

      const now = performance.now();
      if (now - lastPressRef.current < debounceMs) return;
      lastPressRef.current = now;

      onKeyPress();
    };

    window.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => {
      window.removeEventListener('keydown', handleKeyDown, { capture: true });
    };
  }, [onKeyPress, enabled, debounceMs]);
}

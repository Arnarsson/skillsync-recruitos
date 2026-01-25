import { useState, useEffect, useRef } from 'react';

export function usePersistedState<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] {
  // Store the last serialized value to avoid unnecessary writes
  // Initialized to null; will be set in useEffect on mount
  const lastSerializedRef = useRef<string | null>(null);
  const isInitializedRef = useRef(false);

  // Initialize state from localStorage (SSR-safe, no ref access during render)
  const [state, setState] = useState<T>(() => {
    if (typeof window === 'undefined') return initialValue;
    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        return JSON.parse(item);
      }
      return initialValue;
    } catch (error: unknown) {
      if (process.env.NODE_ENV === 'development') {
        console.warn(`Error reading localStorage key "${key}":`, error);
      }
      return initialValue;
    }
  });

  // Sync ref with current serialized value on mount and state changes
  useEffect(() => {
    try {
      const serialized = JSON.stringify(state);

      // On initial mount, just capture the current serialized value
      if (!isInitializedRef.current) {
        lastSerializedRef.current = serialized;
        isInitializedRef.current = true;
        return;
      }

      // Only write if the value actually changed
      if (serialized !== lastSerializedRef.current) {
        window.localStorage.setItem(key, serialized);
        lastSerializedRef.current = serialized;
      }
    } catch (error: unknown) {
      if (process.env.NODE_ENV === 'development') {
        console.warn(`Error writing localStorage key "${key}":`, error);
      }
    }
  }, [key, state]);

  return [state, setState];
}
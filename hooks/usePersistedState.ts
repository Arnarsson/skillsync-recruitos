import { useState, useEffect, useRef } from 'react';

export function usePersistedState<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] {
  // Store the last serialized value to avoid unnecessary writes
  const lastSerializedRef = useRef<string | null>(null);

  // Initialize state function to avoid reading localStorage on every render
  const [state, setState] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        lastSerializedRef.current = item;
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

  useEffect(() => {
    try {
      const serialized = JSON.stringify(state);
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
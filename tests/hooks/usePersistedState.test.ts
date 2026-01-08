import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePersistedState } from '../../hooks/usePersistedState';

beforeEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
});

describe('usePersistedState', () => {
  it('should initialize with initial value when localStorage is empty', () => {
    const { result } = renderHook(() => usePersistedState('test-key', 'initial'));

    expect(result.current[0]).toBe('initial');
  });

  it('should initialize with value from localStorage if it exists', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (localStorage.getItem as any).mockReturnValue(JSON.stringify('stored'));

    const { result } = renderHook(() => usePersistedState('test-key', 'initial'));

    expect(result.current[0]).toBe('stored');
  });

  it('should persist state to localStorage when updated', () => {
    const setItemSpy = vi.spyOn(localStorage, 'setItem');
    const { result } = renderHook(() => usePersistedState('test-key', 'initial'));

    act(() => {
      result.current[1]('updated');
    });

    expect(setItemSpy).toHaveBeenCalledWith('test-key', JSON.stringify('updated'));
    expect(result.current[0]).toBe('updated');
  });

  it('should handle functional updates', () => {
    const { result } = renderHook(() => usePersistedState('test-key', 0));

    act(() => {
      result.current[1](prev => prev + 1);
    });

    expect(result.current[0]).toBe(1);
  });

  it('should handle complex objects', () => {
    const initialObj = { name: 'test', count: 0 };
    const { result } = renderHook(() => usePersistedState('test-key', initialObj));

    act(() => {
      result.current[1]({ name: 'updated', count: 5 });
    });

    expect(result.current[0]).toEqual({ name: 'updated', count: 5 });
  });

  it('should only write to localStorage when value changes', () => {
    const setItemSpy = vi.spyOn(localStorage, 'setItem');
    const { result, rerender } = renderHook(() => usePersistedState('test-key', 'initial'));

    // Initial render should write (sync initial value)
    expect(setItemSpy).toHaveBeenCalledTimes(1);

    act(() => {
      result.current[1]('updated');
    });

    const firstCallCount = setItemSpy.mock.calls.length;
    expect(firstCallCount).toBeGreaterThan(0);

    // Force re-render without changing state
    rerender();

    // Should not write again
    expect(setItemSpy.mock.calls.length).toBe(firstCallCount);
  });
});

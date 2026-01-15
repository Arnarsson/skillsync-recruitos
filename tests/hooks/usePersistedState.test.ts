import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePersistedState } from '../../hooks/usePersistedState';

beforeEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
});

describe('usePersistedState', () => {
  it('should initialize with initial value when localStorage is empty', () => {
    const { result } = renderHook(() => usePersistedState('key-1', 'initial'));
    expect(result.current[0]).toBe('initial');
  });

  it('should initialize with value from localStorage if it exists', () => {
    // Write directly to storage instead of mocking getItem
    localStorage.setItem('key-2', JSON.stringify('stored'));

    const { result } = renderHook(() => usePersistedState('key-2', 'initial'));

    expect(result.current[0]).toBe('stored');
  });

  it('should persist state to localStorage when updated', () => {
    const setItemSpy = vi.spyOn(localStorage, 'setItem');
    const { result } = renderHook(() => usePersistedState('key-3', 'initial'));

    act(() => {
      result.current[1]('updated');
    });

    expect(setItemSpy).toHaveBeenCalledWith('key-3', JSON.stringify('updated'));
    expect(result.current[0]).toBe('updated');
  });

  it('should handle functional updates', () => {
    const { result } = renderHook(() => usePersistedState('key-4', 0));

    act(() => {
      result.current[1](prev => prev + 1);
    });

    expect(result.current[0]).toBe(1);
    expect(localStorage.getItem('key-4')).toBe('1');
  });

  it('should handle complex objects', () => {
    const initialObj = { name: 'test', count: 0 };
    const { result } = renderHook(() => usePersistedState('key-5', initialObj));

    act(() => {
      result.current[1]({ name: 'updated', count: 5 });
    });

    expect(result.current[0]).toEqual({ name: 'updated', count: 5 });
    expect(localStorage.getItem('key-5')).toBe(JSON.stringify({ name: 'updated', count: 5 }));
  });

  it('should optimize writes', () => {
    const setItemSpy = vi.spyOn(localStorage, 'setItem');
    const { result, rerender } = renderHook(() => usePersistedState('key-6', 'initial'));

    // Reset interaction count after initial render effects
    setItemSpy.mockClear();

    // 1. Update with NEW value -> Should write
    act(() => {
      result.current[1]('updated');
    });
    expect(setItemSpy).toHaveBeenCalled();
    const callsAfterUpdate = setItemSpy.mock.calls.length;

    // 2. Force rerender without state change -> Should NOT write
    rerender();
    expect(setItemSpy.mock.calls.length).toBe(callsAfterUpdate);
  });
});

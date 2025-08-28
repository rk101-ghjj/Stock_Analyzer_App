import { useState, useEffect, useCallback } from "react";

/**
 * useLocalCache(key, initial)
 * - returns [value, setValue]
 * - persists updates to localStorage
 */
export default function useLocalCache(key, initialValue) {
  const [state, setState] = useState(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw !== null) return JSON.parse(raw);
    } catch (e) {
      // ignore parse errors
    }
    return typeof initialValue === "function" ? initialValue() : initialValue;
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch (e) {
      // ignore quota errors
    }
  }, [key, state]);

  const setAndPersist = useCallback(
    (next) => {
      setState((prev) => {
        const value = typeof next === "function" ? next(prev) : next;
        try {
          localStorage.setItem(key, JSON.stringify(value));
        } catch (e) {
          // ignore
        }
        return value;
      });
    },
    [key]
  );

  return [state, setAndPersist];
}
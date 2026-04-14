'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from 'react';
import { getDictionary, type Dictionary, type Locales } from '../dictionary';

type DictionaryContextValue = {
  dict: Dictionary | null;
  locale: Locales;
  isLoading: boolean;
  error: Error | null;
  setLocale: (nextLocale: Locales) => void;
  refresh: () => Promise<void>;
};

type State = {
  dict: Dictionary | null;
  locale: Locales;
  isLoading: boolean;
  error: Error | null;
};

type Action =
  | { type: 'LOAD_START' }
  | { type: 'LOAD_SUCCESS'; payload: Dictionary }
  | { type: 'LOAD_ERROR'; payload: Error }
  | { type: 'SET_LOCALE'; payload: Locales };

const initialState: State = {
  dict: null,
  locale: 'en',
  isLoading: true,
  error: null,
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'LOAD_START':
      return { ...state, isLoading: true, error: null };
    case 'LOAD_SUCCESS':
      return { ...state, isLoading: false, dict: action.payload, error: null };
    case 'LOAD_ERROR':
      return { ...state, isLoading: false, dict: null, error: action.payload };
    case 'SET_LOCALE':
      return { ...state, locale: action.payload };
    default:
      return state;
  }
}

const DictionaryContext = createContext<DictionaryContextValue | null>(null);

type DictionaryProviderProps = {
  children: ReactNode;
};

export function DictionaryProvider({ children }: DictionaryProviderProps) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const loadDictionary = useCallback(async () => {
    dispatch({ type: 'LOAD_START' });

    try {
      const data = await getDictionary(state.locale);
      dispatch({ type: 'LOAD_SUCCESS', payload: data });
    } catch (err) {
      const resolvedError = err instanceof Error ? err : new Error('Failed to load dictionary');
      dispatch({ type: 'LOAD_ERROR', payload: resolvedError });
    }
  }, [state.locale]);

  useEffect(() => {
    loadDictionary();
  }, [loadDictionary]);

  const setLocale = useCallback((nextLocale: Locales) => {
    dispatch({ type: 'SET_LOCALE', payload: nextLocale });
  }, []);

  const value = useMemo<DictionaryContextValue>(
    () => ({
      dict: state.dict,
      locale: state.locale,
      isLoading: state.isLoading,
      error: state.error,
      setLocale,
      refresh: loadDictionary,
    }),
    [state, setLocale, loadDictionary],
  );

  return <DictionaryContext.Provider value={value}>{children}</DictionaryContext.Provider>;
}

export function useDictionary() {
  const context = useContext(DictionaryContext);
  if (!context) {
    throw new Error('useDictionary must be used within a DictionaryProvider');
  }

  return context;
}

export function useDictionaryText() {
  const { dict } = useDictionary();

  return useCallback(
    (key: keyof Dictionary, fallback = '') => {
      if (!dict) {
        return fallback;
      }

      return dict[key] ?? fallback;
    },
    [dict],
  );
}

import { useEffect, useReducer } from 'react';

interface UseFetchResult<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
}

interface UseFetchState<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
}

type UseFetchAction<T> =
  | { type: 'start' }
  | { type: 'success'; payload: T }
  | { type: 'error'; payload: string }
  | { type: 'idle' };

function createInitialState<T>(url: string | null): UseFetchState<T> {
  return {
    data: null,
    isLoading: Boolean(url),
    error: null,
  };
}

function useFetchReducer<T>(state: UseFetchState<T>, action: UseFetchAction<T>): UseFetchState<T> {
  switch (action.type) {
    case 'start':
      return {
        ...state,
        isLoading: true,
        error: null,
      };
    case 'success':
      return {
        data: action.payload,
        isLoading: false,
        error: null,
      };
    case 'error':
      return {
        ...state,
        isLoading: false,
        error: action.payload,
      };
    case 'idle':
      return {
        ...state,
        isLoading: false,
        error: null,
      };
    default:
      return state;
  }
}

export function useFetch<T>(url: string | null): UseFetchResult<T> {
  const [state, dispatch] = useReducer(useFetchReducer<T>, createInitialState<T>(url));

  useEffect(() => {
    if (!url) {
      dispatch({ type: 'idle' });
      return;
    }

    const requestUrl = url;
    const abortController = new AbortController();
    dispatch({ type: 'start' });

    async function fetchData() {
      try {
        const response = await fetch(requestUrl, { signal: abortController.signal });
        if (!response.ok) {
          throw new Error('Error al obtener los datos: ' + response.status);
        }
        const responseData = await response.json() as T;
        dispatch({ type: 'success', payload: responseData });
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === 'AbortError') {
          return;
        }
        dispatch({
          type: 'error',
          payload: err instanceof Error ? err.message : 'Error inesperado',
        });
      }
    }

    fetchData();

    return () => {
      abortController.abort();
    };
  }, [url]);

  return state;
}

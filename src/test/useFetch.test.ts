import { renderHook, waitFor } from '@testing-library/react';
import { useFetch } from '../hooks/useFetch';

describe('useFetch', () => {
  beforeEach(() => {
    vi.spyOn(globalThis, 'fetch');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shows loading state at start', () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockImplementation(
      () => new Promise(() => {})
    );

    const { result } = renderHook(() => useFetch('http://test.com/api'));
    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeNull();
  });

  it('retorna data ok', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ name: 'libro' }),
    });
    const { result } = renderHook(() => useFetch('http://test.com/api'));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.data).toEqual({ name: 'libro' });
    expect(result.current.error).toBeNull();
  });

  it('maneja err', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      status: 404,
    });
    const { result } = renderHook(() => useFetch('http://test.com/api'));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.error).toBeTruthy();
    expect(result.current.data).toBeNull();
  });

  it('null url - no fetch', () => {
    const { result } = renderHook(() => useFetch(null));
    expect(result.current.isLoading).toBe(false);
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });
});

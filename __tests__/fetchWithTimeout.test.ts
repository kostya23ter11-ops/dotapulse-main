import { fetchWithTimeout } from '../lib/fetchWithTimeout';

describe('fetchWithTimeout', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('calls fetch with the given URL and options', async () => {
    const mockResponse = { ok: true, json: async () => ({}) };
    global.fetch = jest.fn().mockResolvedValue(mockResponse);

    const result = await fetchWithTimeout('https://example.com', { method: 'GET' });

    expect(global.fetch).toHaveBeenCalledWith(
      'https://example.com',
      expect.objectContaining({ method: 'GET', signal: expect.any(AbortSignal) })
    );
    expect(result).toBe(mockResponse);
  });

  it('aborts after timeout', async () => {
    jest.useFakeTimers();

    const mockAbortController = {
      signal: { addEventListener: (_event: string, _handler: () => void) => {} },
      abort: jest.fn(),
    } as unknown as AbortController;
    jest.spyOn(global, 'AbortController').mockReturnValue(mockAbortController);

    global.fetch = jest.fn().mockImplementation(() => new Promise(() => {}));

    const promise = fetchWithTimeout('https://example.com', {}, 1000);

    jest.advanceTimersByTime(1000);

    await expect(promise).rejects.toThrow('Request timed out after 1000ms');
    expect(mockAbortController.abort).toHaveBeenCalled();

    jest.useRealTimers();
  });

  it('clears timeout on successful response', async () => {
    jest.useFakeTimers();
    const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');

    global.fetch = jest.fn().mockResolvedValue({ ok: true });

    await fetchWithTimeout('https://example.com', {}, 5000);

    expect(clearTimeoutSpy).toHaveBeenCalled();

    jest.useRealTimers();
  });

  it('clears timeout on error', async () => {
    jest.useFakeTimers();
    const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');

    global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

    await expect(fetchWithTimeout('https://example.com')).rejects.toThrow('Network error');
    expect(clearTimeoutSpy).toHaveBeenCalled();

    jest.useRealTimers();
  });
});

import { _resetMemoryStore, isKvConfigured, kvGet, kvSet } from '../lib/kv';

beforeEach(() => {
  _resetMemoryStore();
});

describe('kv memory fallback', () => {
  it('returns false when KV env is not configured', () => {
    expect(isKvConfigured()).toBe(false);
  });

  it('stores and retrieves JSON values', async () => {
    await kvSet('test:heroes', { id: 1, name: 'Pudge' }, 60);
    const value = await kvGet<{ id: number; name: string }>('test:heroes');
    expect(value).toEqual({ id: 1, name: 'Pudge' });
  });

  it('returns null for missing keys', async () => {
    const value = await kvGet('test:missing');
    expect(value).toBeNull();
  });
});
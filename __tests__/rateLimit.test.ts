import { _resetMemoryStore } from '../lib/kv';
import { checkRateLimit } from '../lib/rateLimit';

beforeEach(() => {
  _resetMemoryStore();
});

describe('checkRateLimit', () => {
  it('allows requests within limit', async () => {
    const key = 'test:user:1';
    for (let i = 0; i < 5; i++) {
      const result = await checkRateLimit(key, 5, 60);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(5 - (i + 1));
    }
  });

  it('blocks requests over limit', async () => {
    const key = 'test:user:2';
    for (let i = 0; i < 3; i++) {
      await checkRateLimit(key, 3, 60);
    }
    const blocked = await checkRateLimit(key, 3, 60);
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
  });

  it('tracks different keys independently', async () => {
    await checkRateLimit('test:a', 1, 60);
    const b = await checkRateLimit('test:b', 1, 60);
    expect(b.allowed).toBe(true);
  });
});
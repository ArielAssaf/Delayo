import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  getDelaySettings,
  getOnboardingCompleted,
  normalizeLanguageCode,
  setSavedLanguage,
} from './extensionStorage';

function createLocalStorageMock(): Storage {
  let store = new Map<string, string>();

  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => {
      store = new Map<string, string>();
    },
    key: (index: number) => [...store.keys()][index] ?? null,
    get length() {
      return store.size;
    },
  };
}

describe('extensionStorage', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', createLocalStorageMock());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('normalizes supported language codes', () => {
    expect(normalizeLanguageCode('en-US')).toBe('en');
    expect(normalizeLanguageCode('pt-BR')).toBeNull();
    expect(normalizeLanguageCode('de-DE')).toBeNull();
  });

  it('normalizes partial delay settings with defaults', async () => {
    localStorage.setItem('delaySettings', JSON.stringify({ laterToday: 5 }));

    await expect(getDelaySettings()).resolves.toEqual(
      expect.objectContaining({
        laterToday: 5,
        nextMonthSameDay: true,
      })
    );
  });

  it('writes saved language through the storage adapter', async () => {
    await setSavedLanguage('en');

    expect(localStorage.getItem('savedLanguage')).toBe('"en"');
  });

  it('reads onboarding completion through the shared adapter', async () => {
    localStorage.setItem('onboardingCompleted', 'true');

    await expect(getOnboardingCompleted()).resolves.toBe(true);
  });
});

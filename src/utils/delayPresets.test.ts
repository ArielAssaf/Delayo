import { describe, expect, it } from 'vitest';

import {
  calculateLaterTodayWakeTime,
  calculateNextMonthWakeTime,
  calculateNextWeekWakeTime,
  calculateOneWeekWakeTime,
  calculateTomorrowWakeTime,
  createPresetDelayOptions,
} from './delayPresets';

describe('delayPresets', () => {
  it('schedules next week on the coming Sunday at the same local time', () => {
    const now = new Date(2026, 2, 18, 10, 15);

    const wakeTime = calculateNextWeekWakeTime(now);
    const wakeDate = new Date(wakeTime);

    expect(wakeDate.getDay()).toBe(0);
    expect(wakeDate.getDate()).toBe(22);
    expect(wakeDate.getHours()).toBe(10);
    expect(wakeDate.getMinutes()).toBe(15);
  });

  it('schedules one week from now at the same local time', () => {
    const now = new Date(2026, 2, 18, 10, 15);
    const wakeDate = new Date(calculateOneWeekWakeTime(now));

    expect(wakeDate.getDate()).toBe(25);
    expect(wakeDate.getHours()).toBe(10);
    expect(wakeDate.getMinutes()).toBe(15);
  });

  it('clamps next month to the last valid day when needed', () => {
    const now = new Date(2026, 0, 31, 8, 30);

    const wakeTime = calculateNextMonthWakeTime(now, true);

    expect(wakeTime).toBe(new Date(2026, 1, 28, 8, 30).getTime());
  });

  it('schedules for today morning when user is in early morning (madrugada)', () => {
    const earlyMorning = new Date(2026, 5, 15, 2, 0); // 02:00 AM
    const wakeTime = calculateTomorrowWakeTime(earlyMorning, '09:00');
    const wakeDate = new Date(wakeTime);

    expect(wakeDate.getDate()).toBe(15); // Same day morning
    expect(wakeDate.getHours()).toBe(9);
    expect(wakeDate.getMinutes()).toBe(0);
  });

  it('schedules for next day morning when called during the day', () => {
    const daytime = new Date(2026, 5, 15, 14, 0); // 14:00
    const wakeTime = calculateTomorrowWakeTime(daytime, '09:00');
    const wakeDate = new Date(wakeTime);

    expect(wakeDate.getDate()).toBe(16); // Next day
    expect(wakeDate.getHours()).toBe(9);
    expect(wakeDate.getMinutes()).toBe(0);
  });

  it('calculates later today correctly', () => {
    const now = new Date(2026, 5, 15, 10, 0);
    const wakeTime = calculateLaterTodayWakeTime(now, 3);
    const wakeDate = new Date(wakeTime);

    expect(wakeDate.getHours()).toBe(13);
  });

  it('builds the preset list with all default delay options', () => {
    const options = createPresetDelayOptions({
      locale: 'en',
      settings: {
        laterToday: 3,
        tomorrowTime: '09:00',
        weekendDay: 'saturday',
        weekendTime: '09:00',
        nextMonthSameDay: true,
      },
      translate: (key, values) =>
        `${key}${values ? JSON.stringify(values) : ''}`,
    });

    expect(options).toHaveLength(6);
    expect(options.map((option) => option.id)).toEqual([
      'later_today',
      'tomorrow',
      'weekend',
      'next_week',
      'one_week',
      'next_month',
    ]);
  });
});

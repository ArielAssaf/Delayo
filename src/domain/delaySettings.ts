import { DelaySettings } from '@types';

export const defaultDelaySettings: DelaySettings = {
  laterToday: 3,
  tomorrowTime: '09:00',
  weekendDay: 'saturday',
  weekendTime: '09:00',
  nextMonthSameDay: true,
};

export function normalizeDelaySettings(
  settings?: Partial<DelaySettings> | null
): DelaySettings {
  return {
    ...defaultDelaySettings,
    ...settings,
  };
}

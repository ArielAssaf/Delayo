export const SUPPORTED_LANGUAGES = ['en'] as const;

export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];
export type TabSelectionMode = 'active' | 'highlighted' | 'window';
export type ThemePreference = 'light' | 'dark';

export interface DelaySettings {
  laterToday: number;
  tomorrowTime: string;
  weekendDay: 'saturday' | 'sunday';
  weekendTime: string;
  nextMonthSameDay: boolean;
}

export interface DelayOption {
  id: string;
  label: string;
  hours?: number;
  days?: number;
  custom?: boolean;
  calculateTime?: () => number;
}

export interface RecurrencePattern {
  type: 'daily' | 'weekdays' | 'weekly' | 'monthly' | 'custom';
  daysOfWeek?: number[];
  dayOfMonth?: number;
  time: string;
  endDate?: number;
}

export interface DelayedTab {
  id: string;
  url?: string;
  title?: string;
  favicon?: string;
  createdAt: number;
  wakeTime: number;
  status?: 'scheduled' | 'waking';
  isRecurring?: boolean;
  recurrencePattern?: RecurrencePattern;
  windowSessionId?: string;
  windowIndex?: number;
}

export interface ScheduleTabsMessage {
  action: 'schedule-tabs';
  tabs: chrome.tabs.Tab[];
  wakeTime: number;
  recurrencePattern?: RecurrencePattern;
  groupAsWindow?: boolean;
}

export interface WakeTabsMessage {
  action: 'wake-tabs';
  tabIds: string[];
}

export interface RemoveTabsMessage {
  action: 'remove-tabs';
  tabIds: string[];
}

export interface ReconcileDelayedTabsMessage {
  action: 'reconcile-delayed-tabs';
}

export type DelayedTabsRuntimeMessage =
  | ScheduleTabsMessage
  | WakeTabsMessage
  | RemoveTabsMessage
  | ReconcileDelayedTabsMessage;

export interface DelayedTabsRuntimeResponse {
  success: boolean;
  delayedTabs?: DelayedTab[];
  error?: string;
}

export interface AnalyticsStats {
  totalDelayedTabs: number;
  presetUsageCount: Record<string, number>;
  modeUsageCount: Record<TabSelectionMode, number>;
  totalWokenTabs: number;
  totalDeletedTabs: number;
  supportModalOpened: number;
  pixKeyCopied: number;
  firstUsedAt?: number;
  lastUsedAt?: number;
}

export interface ExtensionStorageSchema {
  delayedTabs: DelayedTab[];
  delaySettings: DelaySettings;
  selectedMode: TabSelectionMode;
  savedLanguage: SupportedLanguage;
  theme: ThemePreference;
  onboardingCompleted: boolean;
  analyticsStats: AnalyticsStats;
  analyticsEnabled: boolean;
}

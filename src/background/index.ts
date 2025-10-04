import { DelayedTab, RecurrencePattern } from '@types';
import generateUniqueTabId from '@utils/generateUniqueTabId';
import normalizeDelayedTabs from '@utils/normalizeDelayedTabs';

chrome.runtime.onInstalled.addListener(({ reason }) => {
  if (reason === 'install') {
    chrome.storage.local.set({ delayedTabs: [] });

    chrome.contextMenus.create({
      id: 'delay-tab',
      title: 'Delay this tab',
      contexts: ['page'],
    });
  }
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'delay-tab' && tab?.id) {
    chrome.action.openPopup();
  }
});

function calculateNextWakeTime(
  recurrencePattern: RecurrencePattern
): number | null {
  const now = new Date();
  const [hours, minutes] = recurrencePattern.time.split(':').map(Number);

  if (recurrencePattern.endDate && now.getTime() >= recurrencePattern.endDate) {
    return null;
  }

  const nextWakeTime = new Date();
  nextWakeTime.setHours(hours, minutes, 0, 0);

  switch (recurrencePattern.type) {
    case 'daily':
      if (nextWakeTime.getTime() <= now.getTime()) {
        nextWakeTime.setDate(nextWakeTime.getDate() + 1);
      }
      break;

    case 'weekdays': {
      nextWakeTime.setDate(nextWakeTime.getDate() + 1);
      while (nextWakeTime.getDay() === 0 || nextWakeTime.getDay() === 6) {
        nextWakeTime.setDate(nextWakeTime.getDate() + 1);
      }
      break;
    }

    case 'weekly':
    case 'custom': {
      if (
        !recurrencePattern.daysOfWeek ||
        recurrencePattern.daysOfWeek.length === 0
      ) {
        return null;
      }

      const currentDay = now.getDay();
      const sortedDays = [...recurrencePattern.daysOfWeek].sort(
        (a, b) => a - b
      );

      const nextDayIndex = sortedDays.findIndex((day) => day > currentDay);

      if (nextDayIndex !== -1) {
        const daysToAdd = sortedDays[nextDayIndex] - currentDay;
        nextWakeTime.setDate(now.getDate() + daysToAdd);
      } else {
        const daysToAdd = 7 - currentDay + sortedDays[0];
        nextWakeTime.setDate(now.getDate() + daysToAdd);
      }

      if (
        nextWakeTime.getDay() === currentDay &&
        nextWakeTime.getTime() <= now.getTime()
      ) {
        nextWakeTime.setDate(nextWakeTime.getDate() + 7);
      }
      break;
    }

    case 'monthly': {
      nextWakeTime.setDate(recurrencePattern.dayOfMonth || 1);

      if (nextWakeTime.getTime() <= now.getTime()) {
        nextWakeTime.setMonth(nextWakeTime.getMonth() + 1);
      }
      break;
    }

    default:
      // Default case
      return null;
  }

  return nextWakeTime.getTime();
}

async function handleSingleTabWake(
  delayedTab: DelayedTab,
  allTabs: DelayedTab[]
): Promise<DelayedTab[]> {
  if (delayedTab.url) {
    await chrome.tabs.create({ url: delayedTab.url });
  }

  await chrome.notifications.create({
    type: 'basic',
    iconUrl: delayedTab.favicon || 'icons/icon128.png',
    title: 'Tab Awakened!',
    message: `Your ${delayedTab.isRecurring ? 'recurring' : 'delayed'} tab "${delayedTab.title}" is now open.`,
  });

  await chrome.alarms.clear(`delayed-tab-${delayedTab.id}`);

  let updatedTabs = allTabs.filter((tab) => tab.id !== delayedTab.id);

  if (delayedTab.isRecurring && delayedTab.recurrencePattern) {
    const nextWakeTime = calculateNextWakeTime(delayedTab.recurrencePattern);

    if (nextWakeTime) {
      const newTabId = generateUniqueTabId();
      const updatedTab = {
        ...delayedTab,
        id: newTabId,
        wakeTime: nextWakeTime,
      };

      updatedTabs.push(updatedTab);

      await chrome.alarms.create(`delayed-tab-${newTabId}`, {
        when: nextWakeTime,
      });
    }
  }

  return updatedTabs;
}

async function handleWindowWake(
  windowTabs: DelayedTab[],
  allTabs: DelayedTab[]
): Promise<DelayedTab[]> {
  if (windowTabs.length === 0) {
    return allTabs;
  }

  const sortedTabs = [...windowTabs].sort((a, b) => {
    const indexA = typeof a.windowIndex === 'number' ? a.windowIndex : 0;
    const indexB = typeof b.windowIndex === 'number' ? b.windowIndex : 0;
    return indexA - indexB;
  });

  const urls = sortedTabs
    .map((tab) => tab.url)
    .filter((url): url is string => Boolean(url));

  if (urls.length > 0) {
    await chrome.windows.create({ url: urls });
  }

  const firstTab = sortedTabs[0];

  await chrome.notifications.create({
    type: 'basic',
    iconUrl: firstTab.favicon || 'icons/icon128.png',
    title: 'Window Awakened!',
    message: `Your ${firstTab.isRecurring ? 'recurring' : 'delayed'} window with ${sortedTabs.length} tab${
      sortedTabs.length === 1 ? '' : 's'
    } is now open.`,
  });

  for (const tab of sortedTabs) {
    await chrome.alarms.clear(`delayed-tab-${tab.id}`);
  }

  let updatedTabs = allTabs.filter(
    (tab) => !sortedTabs.some((windowTab) => windowTab.id === tab.id)
  );

  const recurringTabs = sortedTabs.filter(
    (tab) => tab.isRecurring && tab.recurrencePattern
  );

  if (recurringTabs.length > 0) {
    const newWindowSessionId = generateUniqueTabId();

    for (const tab of recurringTabs) {
      const nextWakeTime = tab.recurrencePattern
        ? calculateNextWakeTime(tab.recurrencePattern)
        : null;

      if (!nextWakeTime) {
        continue;
      }

      const newTabId = generateUniqueTabId();
      const updatedTab = {
        ...tab,
        id: newTabId,
        wakeTime: nextWakeTime,
        windowSessionId: tab.windowSessionId ? newWindowSessionId : tab.windowSessionId,
      };

      updatedTabs.push(updatedTab);

      await chrome.alarms.create(`delayed-tab-${newTabId}`, {
        when: nextWakeTime,
      });
    }
  }

  return updatedTabs;
}

async function wakeTabsInternal(
  tabsToWake: DelayedTab[],
  normalizedTabs: DelayedTab[]
): Promise<DelayedTab[]> {
  let updatedTabs = [...normalizedTabs];
  const processedWindowSessions = new Set<string>();

  for (const tab of tabsToWake) {
    if (tab.windowSessionId) {
      if (processedWindowSessions.has(tab.windowSessionId)) {
        continue;
      }

      processedWindowSessions.add(tab.windowSessionId);

      const windowTabs = normalizedTabs.filter(
        (item) =>
          item.windowSessionId === tab.windowSessionId &&
          item.wakeTime === tab.wakeTime
      );

      updatedTabs = await handleWindowWake(windowTabs, updatedTabs);
    } else {
      updatedTabs = await handleSingleTabWake(tab, updatedTabs);
    }
  }

  return updatedTabs;
}

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name.startsWith('delayed-tab-')) {
    try {
      const tabId = alarm.name.replace('delayed-tab-', '');

      const { delayedTabs = [] } =
        await chrome.storage.local.get('delayedTabs');
      const normalizedTabs = normalizeDelayedTabs(delayedTabs);

      const delayedTab = normalizedTabs.find(
        (tab: DelayedTab) => tab.id === tabId
      );

      if (delayedTab) {
        const updatedTabs = await wakeTabsInternal(
          [delayedTab],
          normalizedTabs
        );

        await chrome.storage.local.set({ delayedTabs: updatedTabs });
      }
    } catch (error) {
      // Handle errors waking the tab
      if (chrome.runtime.lastError) {
        // Log runtime errors for debugging
      }
    }
  }
});

chrome.runtime.onStartup.addListener(async () => {
  try {
    const { delayedTabs = [] } = await chrome.storage.local.get('delayedTabs');
    const normalizedTabs = normalizeDelayedTabs(delayedTabs);
    const now = Date.now();

    const tabsToWake = normalizedTabs.filter(
      (tab: DelayedTab) => tab.wakeTime <= now
    );

    const updatedTabs = await wakeTabsInternal(tabsToWake, normalizedTabs);

    await chrome.storage.local.set({ delayedTabs: updatedTabs });

    await Promise.all(
      updatedTabs
        .filter((tab: DelayedTab) => tab.wakeTime > now)
        .map((tab: DelayedTab) =>
          chrome.alarms.create(`delayed-tab-${tab.id}`, {
            when: tab.wakeTime,
          })
        )
    );
  } catch (error) {
    // Handle errors during startup wake process
    if (chrome.runtime.lastError) {
      // Log runtime errors for debugging
    }
  }
});

chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request.action === 'wake-tabs' && Array.isArray(request.tabIds)) {
    const wakeTabs = async (): Promise<void> => {
      try {
        const { delayedTabs = [] } = await chrome.storage.local.get('delayedTabs');
        const normalizedTabs = normalizeDelayedTabs(delayedTabs);

        const tabsToWake = normalizedTabs.filter((tab: DelayedTab) =>
          request.tabIds.includes(tab.id)
        );

        const updatedTabs = await wakeTabsInternal(tabsToWake, normalizedTabs);

        await chrome.storage.local.set({ delayedTabs: updatedTabs });

        sendResponse({ success: true });
      } catch (error) {
        sendResponse({ success: false, error });
      }
    };

    wakeTabs();
    return true; // keep the message channel open for async response
  }
  return undefined;
});
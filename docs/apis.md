# APIs & Integrations

Delayo only relies on Chrome Extension APIs. No third-party web services are required.

## chrome.storage.local
- **Purpose:** Persist delayed tab definitions and user preferences.
- **Auth:** Implicit extension permissions handled via manifest.
- **Key Data:** `{ id, url, title, wakeTime, windowSessionId, windowIndex, recurrencePattern }`.
- **Usage Example:**
  ```ts
  const { delayedTabs = [] } = await chrome.storage.local.get('delayedTabs');
  await chrome.storage.local.set({ delayedTabs: updated });
  ```
- **Limits:** Chrome quotas apply (~10 MB sync limit, higher for local). Operations are async and can reject on quota errors.

## chrome.runtime.sendMessage
- **Purpose:** Popup triggers background actions such as waking snoozed tabs or windows.
- **Auth:** Available to all extension components.
- **Message Contract:** `{ action: 'wake-tabs', tabIds: string[] }` wakes the specified IDs.
- **Example:**
  ```ts
  await chrome.runtime.sendMessage({ action: 'wake-tabs', tabIds });
  ```

## chrome.alarms
- **Purpose:** Schedule wake times for snoozed tabs and recurring windows.
- **Auth:** Declared in manifest permissions.
- **Example:**
  ```ts
  chrome.alarms.create(`delayed-tab-${tab.id}`, { when: wakeTime });
  ```
- **Limits:** Minimum granularity is one minute; alarms can be throttled if many are created simultaneously.

## chrome.windows / chrome.tabs
- **Purpose:** Background script recreates tabs or entire windows when alarms fire.
- **Notes:** Windows reopen with original ordering using `windowSessionId` and `windowIndex` metadata captured at snooze time.
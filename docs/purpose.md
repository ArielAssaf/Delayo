# Purpose & Functionality

Delayo is a browser extension that lets people schedule tabs to reopen later so their current windows stay focused. Power users can snooze individual tabs or entire browser windows, then bring them back automatically or on demand from the popup.

## Core Features
- Schedule any active tab or whole window to wake at a future date and time.
- View all snoozed items in the **Sleeping Tabs** popup, grouped by original window session for clarity.
- Restore a full window in one click, wake individual tabs, or adjust the scheduled wake time for an entire group.
- Remove delayed tabs or windows before they trigger, with support for multi-select bulk actions.
- Create recurring wake schedules directly from the popup scheduling views.

## Audience
Delayo serves multitaskers and knowledge workers juggling many browser sessions who need a lightweight way to defer work without losing context.

## Data Flow
- The popup writes snoozed-tab metadata (URL, title, wake time, window identifiers) into `chrome.storage.local`.
- `chrome.alarms` drives wake notifications; when an alarm fires the background script recreates the delayed tab or rebuilds the original window.
- The popup queries storage to render grouped windows, letting users manually wake or delete entries before alarms trigger.
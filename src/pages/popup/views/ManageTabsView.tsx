import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Link } from '@tanstack/react-router';
import { DelayedTab } from '@types';
import normalizeDelayedTabs from '@utils/normalizeDelayedTabs';
import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import useTheme from '../../../utils/useTheme';

type TabGroup = {
  id: string;
  wakeTime: number;
  isWindowGroup: boolean;
  tabs: DelayedTab[];
};

function ManageTabsView(): React.ReactElement {
  const [delayedTabs, setDelayedTabs] = useState<DelayedTab[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
  const [selectMode, setSelectMode] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { t } = useTranslation();

  useEffect(() => {
    const loadDelayedTabs = async (): Promise<void> => {
      try {
        setLoading(true);
        const { delayedTabs: storedTabs = [] } = await chrome.storage.local.get('delayedTabs');
        const normalizedTabs = normalizeDelayedTabs(storedTabs);
        const sortedTabs = [...normalizedTabs].sort(
          (a, b) => a.wakeTime - b.wakeTime
        );
        setDelayedTabs(sortedTabs);
      } catch (error) {
        console.error('Error loading delayed tabs:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDelayedTabs();
  }, []);

  const tabGroups = useMemo<TabGroup[]>(() => {
    const groupMap = new Map<string, TabGroup>();
    const groups: TabGroup[] = [];

    delayedTabs.forEach((tab) => {
      const key = tab.windowSessionId
        ? `${tab.windowSessionId}-${tab.wakeTime}`
        : tab.id;

      let group = groupMap.get(key);

      if (!group) {
        group = {
          id: key,
          wakeTime: tab.wakeTime,
          isWindowGroup: Boolean(tab.windowSessionId),
          tabs: [],
        };
        groupMap.set(key, group);
        groups.push(group);
      }

      group.tabs.push(tab);
    });

    groups.forEach((group) => {
      if (group.isWindowGroup) {
        group.tabs.sort(
          (a, b) => (a.windowIndex ?? 0) - (b.windowIndex ?? 0)
        );
      }
    });

    return groups;
  }, [delayedTabs]);

  const collectTabIds = (groupId: string): string[] => {
    const group = tabGroups.find((item) => item.id === groupId);
    if (!group) {
      return [];
    }

    return group.tabs.map((tab) => tab.id);
  };

  const wakeGroupNow = async (groupId: string): Promise<void> => {
    try {
      const tabIds = collectTabIds(groupId);

      if (tabIds.length === 0) {
        return;
      }

      await chrome.runtime.sendMessage({
        action: 'wake-tabs',
        tabIds,
      });

      const updatedTabs = delayedTabs.filter(
        (item) => !tabIds.includes(item.id)
      );

      setDelayedTabs(updatedTabs);
      setSelectedGroupIds((prev) =>
        prev.filter((id) => id !== groupId)
      );
    } catch (error) {
      console.error('Error waking group:', error);
    }
  };

  const removeGroup = async (groupId: string): Promise<void> => {
    try {
      const tabIds = collectTabIds(groupId);

      if (tabIds.length === 0) {
        return;
      }

      const updatedTabs = delayedTabs.filter(
        (item) => !tabIds.includes(item.id)
      );

      await chrome.storage.local.set({ delayedTabs: updatedTabs });
      await Promise.all(
        tabIds.map((tabId) => chrome.alarms.clear(`delayed-tab-${tabId}`))
      );

      setDelayedTabs(updatedTabs);
      setSelectedGroupIds((prev) =>
        prev.filter((id) => id !== groupId)
      );
    } catch (error) {
      console.error('Error removing group:', error);
    }
  };

  const toggleSelectMode = (): void => {
    setSelectMode((prev) => {
      if (prev) {
        setSelectedGroupIds([]);
      }

      return !prev;
    });
  };

  const toggleSelectAll = (): void => {
    const allSelected =
      tabGroups.length > 0 &&
      tabGroups.every((group) => selectedGroupIds.includes(group.id));

    if (allSelected) {
      setSelectedGroupIds([]);
    } else {
      setSelectedGroupIds(tabGroups.map((group) => group.id));
    }
  };

  const toggleSelectGroup = (groupId: string): void => {
    setSelectedGroupIds((prev) => {
      if (prev.includes(groupId)) {
        return prev.filter((id) => id !== groupId);
      }

      return [...prev, groupId];
    });
  };

  const wakeSelectedTabs = async (): Promise<void> => {
    try {
      const tabIds = Array.from(
        new Set(
          selectedGroupIds.flatMap((groupId) => collectTabIds(groupId))
        )
      );

      if (tabIds.length === 0) {
        return;
      }

      await chrome.runtime.sendMessage({
        action: 'wake-tabs',
        tabIds,
      });

      const updatedTabs = delayedTabs.filter(
        (tab) => !tabIds.includes(tab.id)
      );

      setDelayedTabs(updatedTabs);
      setSelectedGroupIds([]);
    } catch (error) {
      console.error('Error waking selected tabs:', error);
    }
  };

  const removeSelectedTabs = async (): Promise<void> => {
    try {
      const tabIds = Array.from(
        new Set(
          selectedGroupIds.flatMap((groupId) => collectTabIds(groupId))
        )
      );

      const updatedTabs = delayedTabs.filter(
        (tab) => !tabIds.includes(tab.id)
      );

      await chrome.storage.local.set({ delayedTabs: updatedTabs });

      await Promise.all(
        tabIds.map((tabId) => chrome.alarms.clear(`delayed-tab-${tabId}`))
      );

      setDelayedTabs(updatedTabs);
      setSelectedGroupIds([]);
    } catch (error) {
      console.error('Error removing selected tabs:', error);
    }
  };

  const formatDate = (timestamp: number): string => {
    const locale = document.documentElement.lang || navigator.language || 'pt-BR';

    const isEnglish = locale.startsWith('en');

    const date = new Date(timestamp);

    return date.toLocaleString(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: isEnglish,
    });
  };

  const calculateTimeLeft = (wakeTime: number): string => {
    const now = Date.now();
    const diff = wakeTime - now;
    if (diff <= 0) return t('manageTabs.now', 'Now');
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const allGroupsSelected =
    tabGroups.length > 0 &&
    tabGroups.every((group) => selectedGroupIds.includes(group.id));

  if (loading) {
    return (
      <div className='flex min-h-[300px] items-center justify-center'>
        <span className='loading loading-spinner loading-lg' />
      </div>
    );
  }

  return (
    <div className='card w-[40rem] rounded-none bg-base-300 shadow-md'>
      <div className='card-body p-6'>
        <div className='mb-5 flex items-center justify-between'>
          <div className='flex items-center'>
            <Link
              to='/'
              className='btn btn-circle btn-ghost btn-sm mr-3 transition-all duration-200 hover:bg-base-100'
              viewTransition={{ types: ['slide-right'] }}
            >
              <FontAwesomeIcon icon='arrow-left' />
            </Link>
            <h2 className='card-title font-bold text-delayo-orange'>
              {t('manageTabs.title')}
            </h2>
          </div>
          <button
            type='button'
            className='btn btn-circle btn-ghost btn-sm transition-all duration-200 hover:bg-base-100'
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            <FontAwesomeIcon
              icon={theme === 'light' ? 'moon' : 'sun'}
              className={
                theme === 'light' ? 'text-delayo-purple' : 'text-delayo-yellow'
              }
            />
          </button>
        </div>

        {tabGroups.length === 0 ? (
          <div className='flex flex-col items-center justify-center p-8 text-center'>
            <FontAwesomeIcon
              icon='hourglass-empty'
              className='mb-4 h-12 w-12 text-neutral-400'
            />
            <h3 className='mb-2 text-lg font-medium'>{t('manageTabs.noTabs')}</h3>
            <p className='text-sm text-base-content/70'>
              {t('manageTabs.noDelayedTabs')}
            </p>
          </div>
        ) : (
          <div className='overflow-y-auto max-h-[400px]'>
            <div className='flex items-center justify-between mb-3'>
              <div className='flex items-center'>
                <button
                  type='button'
                  className={`btn btn-sm ${selectMode ? 'btn-outline' : ''}`}
                  style={!selectMode ? { backgroundColor: '#ffb26f', color: '#3B1B00' } : {}}
                  onClick={toggleSelectMode}
                  title={selectMode ? t('manageTabs.cancelSelection') : t('manageTabs.selectMode')}
                >
                  <FontAwesomeIcon
                    icon={selectMode ? 'times' : 'check-square'}
                    className='mr-2'
                  />
                  {selectMode ? t('manageTabs.cancel') : t('manageTabs.select')}
                </button>
                {selectMode && (
                  <button
                    type='button'
                    className='btn btn-sm btn-ghost ml-2'
                    onClick={toggleSelectAll}
                  >
                    {allGroupsSelected ? t('manageTabs.deselectAll') : t('manageTabs.selectAll')}
                  </button>
                )}
              </div>
              {selectMode && selectedGroupIds.length > 0 && (
                <div className='flex space-x-2'>
                  <button
                    type='button'
                    className='btn btn-sm'
                    style={{ backgroundColor: '#ffb26f', color: '#3B1B00' }}
                    onClick={wakeSelectedTabs}
                  >
                    {t('manageTabs.wakeUp')} ({selectedGroupIds.length})
                  </button>
                  <button
                    type='button'
                    className='btn btn-outline btn-error btn-sm'
                    onClick={removeSelectedTabs}
                  >
                    {t('manageTabs.remove')} ({selectedGroupIds.length})
                  </button>
                </div>
              )}
            </div>
            <div className='space-y-3'>
              {tabGroups.map((group) => {
                const isSelected = selectedGroupIds.includes(group.id);
                const primaryTab = group.tabs[0];

                return (
                  <div
                    key={group.id}
                    className='rounded-lg bg-base-100/70 p-4 shadow-sm transition-all duration-200 hover:bg-base-100'
                  >
                    <div className='flex items-start justify-between'>
                      <div className='flex items-start'>
                        {selectMode && (
                          <button
                            type='button'
                            className='mr-3 mt-1 cursor-pointer text-left'
                            onClick={() => toggleSelectGroup(group.id)}
                            aria-pressed={isSelected}
                          >
                            <FontAwesomeIcon
                              icon={isSelected ? 'check-square' : 'square'}
                              className={isSelected ? 'text-delayo-orange' : 'text-base-content/50'}
                              style={{ fontSize: 'large' }}
                            />
                          </button>
                        )}
                        <div className='mr-3 flex h-9 w-9 items-center justify-center rounded-md bg-base-200'>
                          {group.isWindowGroup ? (
                            <FontAwesomeIcon
                              icon='window-restore'
                              className='text-base-content/70'
                            />
                          ) : (
                            primaryTab?.favicon ? (
                              <img
                                src={primaryTab.favicon}
                                alt='Tab favicon'
                                className='h-5 w-5 rounded-sm'
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                            ) : (
                              <FontAwesomeIcon
                                icon='globe'
                                className='text-base-content/50'
                              />
                            )
                          )}
                        </div>
                        <div className='mr-4 max-w-[220px]'>
                          <div className='truncate text-sm font-medium text-base-content/80'>
                            {group.isWindowGroup
                              ? t('manageTabs.windowGroup', {
                                  count: group.tabs.length,
                                })
                              : primaryTab?.title || t('manageTabs.untitledTab')}
                          </div>
                          <div className='truncate text-xs text-base-content/60'>
                            {formatDate(group.wakeTime)} ({calculateTimeLeft(group.wakeTime)})
                          </div>
                        </div>
                      </div>
                      {!selectMode && (
                        <div className='flex space-x-2'>
                          <button
                            type='button'
                            className='btn btn-sm'
                            style={{ backgroundColor: '#ffb26f', color: '#3B1B00' }}
                            onClick={() => wakeGroupNow(group.id)}
                          >
                            {t('manageTabs.wakeUp')}
                          </button>
                          <button
                            type='button'
                            className='btn btn-outline btn-error btn-sm'
                            onClick={() => removeGroup(group.id)}
                          >
                            {t('manageTabs.remove')}
                          </button>
                        </div>
                      )}
                    </div>
                    {group.isWindowGroup && (
                      <div className='mt-3 border-t border-base-200 pt-3'>
                        <ul className='space-y-2'>
                          {group.tabs.map((tab) => (
                            <li
                              key={tab.id}
                              className='flex items-center text-xs text-base-content/70'
                            >
                              {tab.favicon && (
                                <img
                                  src={tab.favicon}
                                  alt='Tab favicon'
                                  className='mr-2 h-4 w-4 rounded-sm'
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                  }}
                                />
                              )}
                              <span className='truncate'>
                                {tab.title || t('manageTabs.untitledTab')}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ManageTabsView;

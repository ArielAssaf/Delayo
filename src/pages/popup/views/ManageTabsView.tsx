import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Link } from '@tanstack/react-router';
import { DelayedTab } from '@types';
import normalizeDelayedTabs from '@utils/normalizeDelayedTabs';
import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import useTheme from '../../../utils/useTheme';

type TabGroup = {
  id: string;
  tabs: DelayedTab[];
  wakeTime: number;
  windowSessionId?: string;
  windowIndex?: number;
};

function ManageTabsView(): React.ReactElement {
  const [delayedTabs, setDelayedTabs] = useState<DelayedTab[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [selectMode, setSelectMode] = useState(false);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editingWakeTime, setEditingWakeTime] = useState<string>('');
  const [editError, setEditError] = useState<string | null>(null);
  const [savingGroupEdit, setSavingGroupEdit] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { t } = useTranslation();

  useEffect(() => {
    const loadDelayedTabs = async (): Promise<void> => {
      try {
        setLoading(true);
        const { delayedTabs: storedTabs = [] } =
          await chrome.storage.local.get('delayedTabs');
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
    const groups = new Map<string, TabGroup>();

    delayedTabs.forEach((tab) => {
      const groupId = tab.windowSessionId
        ? `${tab.windowSessionId}-${tab.wakeTime}`
        : tab.id;

      if (!groups.has(groupId)) {
        groups.set(groupId, {
          id: groupId,
          tabs: [],
          wakeTime: tab.wakeTime,
          windowSessionId: tab.windowSessionId,
          windowIndex: tab.windowIndex,
        });
      }

      groups.get(groupId)?.tabs.push(tab);
    });

    return Array.from(groups.values()).sort((a, b) => {
      if (a.wakeTime === b.wakeTime) {
        return (a.windowIndex ?? 0) - (b.windowIndex ?? 0);
      }
      return a.wakeTime - b.wakeTime;
    });
  }, [delayedTabs]);

  useEffect(() => {
    setSelectedGroups((prev) =>
      prev.filter((id) => tabGroups.some((group) => group.id === id))
    );
  }, [tabGroups]);

  useEffect(() => {
    if (editingGroupId && !tabGroups.some((group) => group.id === editingGroupId)) {
      setEditingGroupId(null);
      setEditError(null);
    }
  }, [editingGroupId, tabGroups]);

  const formatDateTimeLocal = (timestamp: number): string => {
    const date = new Date(timestamp);
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    const hours = `${date.getHours()}`.padStart(2, '0');
    const minutes = `${date.getMinutes()}`.padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const wakeGroupNow = async (group: TabGroup): Promise<void> => {
    try {
      const tabIds = group.tabs.map((tab) => tab.id);

      if (tabIds.length === 0) {
        return;
      }

      await chrome.runtime.sendMessage({
        action: 'wake-tabs',
        tabIds,
      });

      const updatedTabs = delayedTabs.filter((item) => !tabIds.includes(item.id));

      setDelayedTabs(updatedTabs);
      setSelectedGroups((prev) => prev.filter((id) => id !== group.id));
      setEditingGroupId((prev) => (prev === group.id ? null : prev));
    } catch (error) {
      console.error('Error waking group:', error);
    }
  };

  const wakeTab = async (tab: DelayedTab): Promise<void> => {
    try {
      await chrome.runtime.sendMessage({
        action: 'wake-tabs',
        tabIds: [tab.id],
      });

      const updatedTabs = delayedTabs.filter((item) => item.id !== tab.id);
      setDelayedTabs(updatedTabs);

      const groupId = tab.windowSessionId
        ? `${tab.windowSessionId}-${tab.wakeTime}`
        : tab.id;

      setEditingGroupId((prev) => (prev === groupId ? null : prev));
    } catch (error) {
      console.error('Error waking tab:', error);
    }
  };

  const removeTab = async (tab: DelayedTab): Promise<void> => {
    try {
      const updatedTabs = delayedTabs.filter((item) => item.id !== tab.id);
      await chrome.storage.local.set({ delayedTabs: updatedTabs });
      await chrome.alarms.clear(`delayed-tab-${tab.id}`);
      setDelayedTabs(updatedTabs);
    } catch (error) {
      console.error('Error removing tab:', error);
    }
  };

  const toggleSelectMode = (): void => {
    setSelectMode((prev) => {
      if (prev) {
        setSelectedGroups([]);
      } else {
        setEditingGroupId(null);
        setEditError(null);
      }
      return !prev;
    });
  };

  const toggleSelectAll = (): void => {
    if (selectedGroups.length === tabGroups.length) {
      setSelectedGroups([]);
    } else {
      setSelectedGroups(tabGroups.map((group) => group.id));
    }
  };

  const toggleSelectGroup = (groupId: string): void => {
    setSelectedGroups((prev) =>
      prev.includes(groupId)
        ? prev.filter((id) => id !== groupId)
        : [...prev, groupId]
    );
  };

  const wakeSelectedTabs = async (): Promise<void> => {
    try {
      const tabIds = selectedGroups
        .flatMap((groupId) =>
          tabGroups.find((group) => group.id === groupId)?.tabs ?? []
        )
        .map((tab) => tab.id);

      if (tabIds.length === 0) {
        return;
      }

      await chrome.runtime.sendMessage({
        action: 'wake-tabs',
        tabIds,
      });

      const updatedTabs = delayedTabs.filter((tab) => !tabIds.includes(tab.id));

      setDelayedTabs(updatedTabs);
      setSelectedGroups([]);
    } catch (error) {
      console.error('Error waking selected tabs:', error);
    }
  };

  const removeSelectedTabs = async (): Promise<void> => {
    try {
      const selectedIds = new Set(
        selectedGroups.flatMap((groupId) =>
          tabGroups
            .find((group) => group.id === groupId)?.tabs.map((tab) => tab.id) ?? []
        )
      );

      const updatedTabs = delayedTabs.filter((tab) => !selectedIds.has(tab.id));
      await chrome.storage.local.set({ delayedTabs: updatedTabs });

      await Promise.all(
        Array.from(selectedIds).map((tabId) =>
          chrome.alarms.clear(`delayed-tab-${tabId}`)
        )
      );

      setDelayedTabs(updatedTabs);
      setSelectedGroups([]);
    } catch (error) {
      console.error('Error removing selected tabs:', error);
    }
  };

  const removeGroup = async (group: TabGroup): Promise<void> => {
    try {
      const tabIds = group.tabs.map((tab) => tab.id);
      const updatedTabs = delayedTabs.filter((tab) => !tabIds.includes(tab.id));

      await chrome.storage.local.set({ delayedTabs: updatedTabs });

      await Promise.all(
        tabIds.map((tabId) => chrome.alarms.clear(`delayed-tab-${tabId}`))
      );

      setDelayedTabs(updatedTabs);
      setSelectedGroups((prev) => prev.filter((id) => id !== group.id));
      setEditingGroupId((prev) => (prev === group.id ? null : prev));
    } catch (error) {
      console.error('Error removing group:', error);
    }
  };

  const startEditingGroup = (group: TabGroup): void => {
    setEditingGroupId(group.id);
    setEditingWakeTime(formatDateTimeLocal(group.wakeTime));
    setEditError(null);
  };

  const cancelEditingGroup = (): void => {
    setEditingGroupId(null);
    setEditingWakeTime('');
    setEditError(null);
  };

  const saveGroupSchedule = async (): Promise<void> => {
    if (!editingGroupId) {
      return;
    }

    const group = tabGroups.find((item) => item.id === editingGroupId);
    if (!group) {
      cancelEditingGroup();
      return;
    }

    if (!editingWakeTime) {
      setEditError(t('manageTabs.invalidWakeTime'));
      return;
    }

    const newWakeTime = new Date(editingWakeTime).getTime();
    if (Number.isNaN(newWakeTime) || newWakeTime <= Date.now()) {
      setEditError(t('manageTabs.invalidWakeTime'));
      return;
    }

    try {
      setSavingGroupEdit(true);
      const groupTabIds = new Set(group.tabs.map((tab) => tab.id));

      const updatedTabs = delayedTabs.map((tab) =>
        groupTabIds.has(tab.id) ? { ...tab, wakeTime: newWakeTime } : tab
      );

      await chrome.storage.local.set({ delayedTabs: updatedTabs });

      await Promise.all(
        group.tabs.map((tab) => chrome.alarms.clear(`delayed-tab-${tab.id}`))
      );

      group.tabs.forEach((tab) => {
        chrome.alarms.create(`delayed-tab-${tab.id}`, { when: newWakeTime });
      });

      setDelayedTabs(updatedTabs);
      setEditingGroupId(null);
      setEditingWakeTime('');
      setEditError(null);
    } catch (error) {
      console.error('Error updating group schedule:', error);
      setEditError(t('manageTabs.updateError'));
    } finally {
      setSavingGroupEdit(false);
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
            <div className='mb-3 flex items-center justify-between'>
              <div className='flex items-center'>
                <button
                  type='button'
                  className={`btn btn-sm ${selectMode ? 'btn-outline' : ''}`}
                  style={
                    !selectMode
                      ? { backgroundColor: '#ffb26f', color: '#3B1B00' }
                      : {}
                  }
                  onClick={toggleSelectMode}
                  title={
                    selectMode
                      ? t('manageTabs.cancelSelection')
                      : t('manageTabs.selectMode')
                  }
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
                    {selectedGroups.length === tabGroups.length
                      ? t('manageTabs.deselectAll')
                      : t('manageTabs.selectAll')}
                  </button>
                )}
              </div>
              {selectMode && selectedGroups.length > 0 && (
                <div className='flex space-x-2'>
                  <button
                    type='button'
                    className='btn btn-sm'
                    style={{ backgroundColor: '#ffb26f', color: '#3B1B00' }}
                    onClick={wakeSelectedTabs}
                  >
                    {t('manageTabs.wakeUp')} ({selectedGroups.length})
                  </button>
                  <button
                    type='button'
                    className='btn btn-outline btn-error btn-sm'
                    onClick={removeSelectedTabs}
                  >
                    {t('manageTabs.remove')} ({selectedGroups.length})
                  </button>
                </div>
              )}
            </div>
            <div className='space-y-3'>
              {tabGroups.map((group) => {
                const isWindowGroup = Boolean(group.windowSessionId);
                const firstTab = group.tabs[0];
                const groupTitle = isWindowGroup
                  ? group.windowIndex !== undefined
                    ? t('manageTabs.windowWithIndex', {
                        index: (group.windowIndex ?? 0) + 1,
                      })
                    : t('manageTabs.window')
                  : firstTab?.title || t('manageTabs.untitledTab');

                return (
                  <div
                    key={group.id}
                    className='rounded-lg bg-base-100/70 p-4 shadow-sm transition-all duration-200 hover:bg-base-100'
                  >
                    <div className='flex items-start justify-between gap-4'>
                      <div className='flex w-full items-start gap-3'>
                        {selectMode && (
                          <button
                            type='button'
                            className='mt-1 text-left'
                            onClick={() => toggleSelectGroup(group.id)}
                          >
                            <FontAwesomeIcon
                              icon={
                                selectedGroups.includes(group.id)
                                  ? 'check-square'
                                  : 'square'
                              }
                              className={
                                selectedGroups.includes(group.id)
                                  ? 'text-delayo-orange'
                                  : 'text-base-content/50'
                              }
                              style={{ fontSize: 'large' }}
                            />
                          </button>
                        )}
                        <div className='min-w-0'>
                          <div className='flex items-center gap-2'>
                            {firstTab?.favicon && (
                              <img
                                src={firstTab.favicon}
                                alt='Tab favicon'
                                className='h-5 w-5 rounded-sm'
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                            )}
                            <div className='truncate text-sm font-semibold text-base-content/90'>
                              {groupTitle}
                            </div>
                          </div>
                          <div className='mt-1 text-xs text-base-content/60'>
                            {formatDate(group.wakeTime)} ({calculateTimeLeft(group.wakeTime)})
                          </div>
                          {isWindowGroup && (
                            <div className='mt-1 text-xs text-base-content/60'>
                              {t('manageTabs.tabCount', { count: group.tabs.length })}
                            </div>
                          )}
                        </div>
                      </div>
                      {!selectMode && (
                        <div className='flex flex-shrink-0 space-x-2'>
                          <button
                            type='button'
                            className='btn btn-sm'
                            style={{ backgroundColor: '#ffb26f', color: '#3B1B00' }}
                            onClick={() => wakeGroupNow(group)}
                          >
                            {isWindowGroup
                              ? t('manageTabs.wakeWindow')
                              : t('manageTabs.wakeUp')}
                          </button>
                          <button
                            type='button'
                            className='btn btn-outline btn-sm'
                            onClick={() => startEditingGroup(group)}
                          >
                            {t('manageTabs.editSchedule')}
                          </button>
                          <button
                            type='button'
                            className='btn btn-outline btn-error btn-sm'
                            onClick={() => removeGroup(group)}
                          >
                            {isWindowGroup
                              ? t('manageTabs.removeWindow')
                              : t('manageTabs.remove')}
                          </button>
                        </div>
                      )}
                    </div>
                    {editingGroupId === group.id && (
                      <div className='mt-3 rounded-md bg-base-200/60 p-3 space-y-3'>
                        <label className='flex flex-col gap-1 text-xs text-base-content/70'>
                          <span className='font-medium'>
                            {t('manageTabs.newWakeTimeLabel')}
                          </span>
                          <input
                            type='datetime-local'
                            className='input input-bordered input-sm'
                            value={editingWakeTime}
                            min={formatDateTimeLocal(Date.now() + 60 * 1000)}
                            onChange={(event) => setEditingWakeTime(event.target.value)}
                          />
                        </label>
                        {editError && (
                          <p className='text-xs text-error'>{editError}</p>
                        )}
                        <div className='flex justify-end gap-2'>
                          <button
                            type='button'
                            className='btn btn-ghost btn-sm'
                            onClick={cancelEditingGroup}
                          >
                            {t('manageTabs.cancel')}
                          </button>
                          <button
                            type='button'
                            className='btn btn-sm'
                            style={{ backgroundColor: '#ffb26f', color: '#3B1B00' }}
                            onClick={saveGroupSchedule}
                            disabled={savingGroupEdit}
                          >
                            {savingGroupEdit
                              ? t('manageTabs.saving')
                              : t('manageTabs.saveChanges')}
                          </button>
                        </div>
                      </div>
                    )}
                    {group.tabs.length > 1 && (
                      <div className='mt-3 space-y-2 border-l border-base-200 pl-3'>
                        {group.tabs.map((tab) => (
                          <div
                            key={tab.id}
                            className='flex items-center justify-between gap-3 text-sm text-base-content/80'
                          >
                            <div className='flex min-w-0 items-center gap-2'>
                              {tab.favicon && (
                                <img
                                  src={tab.favicon}
                                  alt='Tab favicon'
                                  className='h-4 w-4 rounded-sm'
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                  }}
                                />
                              )}
                              <span className='truncate'>
                                {tab.title || t('manageTabs.untitledTab')}
                              </span>
                            </div>
                            {!selectMode && (
                              <div className='flex items-center gap-2 text-xs font-medium'>
                                <button
                                  type='button'
                                  className='text-delayo-orange hover:underline'
                                  onClick={() => wakeTab(tab)}
                                >
                                  {t('manageTabs.wakeTab')}
                                </button>
                                <span className='text-base-content/40'>|</span>
                                <button
                                  type='button'
                                  className='text-error hover:underline'
                                  onClick={() => removeTab(tab)}
                                >
                                  {t('manageTabs.remove')}
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
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

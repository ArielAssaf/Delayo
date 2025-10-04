import { DelayedTab } from '@types';
import normalizeDelayedTabs from '@utils/normalizeDelayedTabs';
import {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

interface UseDelayedTabsStorageResult {
  delayedTabs: DelayedTab[];
  setDelayedTabs: Dispatch<SetStateAction<DelayedTab[]>>;
  loading: boolean;
  reload: () => Promise<void>;
}

export default function useDelayedTabsStorage(): UseDelayedTabsStorageResult {
  const [delayedTabs, setDelayedTabs] = useState<DelayedTab[]>([]);
  const [loading, setLoading] = useState(true);
  const isMountedRef = useRef(true);

  const loadDelayedTabs = useCallback(async () => {
    try {
      if (isMountedRef.current) {
        setLoading(true);
      }

      const { delayedTabs: storedTabs = [] } = await chrome.storage.local.get(
        'delayedTabs'
      );
      const normalizedTabs = normalizeDelayedTabs(storedTabs);
      const sortedTabs = [...normalizedTabs].sort(
        (a, b) => a.wakeTime - b.wakeTime
      );

      if (isMountedRef.current) {
        setDelayedTabs(sortedTabs);
      }
    } catch (error) {
      if (isMountedRef.current) {
        console.error('Error loading delayed tabs:', error);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;

    loadDelayedTabs();

    const handleStorageChange = (
      changes: Record<string, chrome.storage.StorageChange>,
      areaName: string
    ): void => {
      if (areaName === 'local' && changes.delayedTabs) {
        void loadDelayedTabs();
      }
    };

    chrome.storage.onChanged.addListener(handleStorageChange);

    return () => {
      isMountedRef.current = false;
      chrome.storage.onChanged.removeListener(handleStorageChange);
    };
  }, [loadDelayedTabs]);

  return {
    delayedTabs,
    setDelayedTabs,
    loading,
    reload: loadDelayedTabs,
  };
}

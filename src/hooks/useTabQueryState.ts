import { useSearchParams } from 'react-router-dom';

export function useTabQueryState<T extends string>(
  defaultTab: T,
  validTabs?: T[],
  paramName: string = 'tab'
): [T, (tabId: T) => void] {
  const [searchParams, setSearchParams] = useSearchParams();
  const rawParam = searchParams.get(paramName) as T | null;

  const activeTab: T =
    rawParam && (!validTabs || validTabs.includes(rawParam))
      ? rawParam
      : defaultTab;

  const setActiveTab = (tabId: T) => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set(paramName, tabId);
    setSearchParams(nextParams, { replace: true });
  };

  return [activeTab, setActiveTab];
}

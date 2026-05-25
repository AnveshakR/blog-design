"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { useRouter, usePathname } from "next/navigation";

export interface Tab {
  href: string;
  title: string;
}

interface TabsContextType {
  tabs: Tab[];
  openTab: (tab: Tab) => void;
  closeTab: (href: string) => void;
}

const TabsContext = createContext<TabsContextType>({
  tabs: [],
  openTab: () => {},
  closeTab: () => {},
});

function hrefToTitle(href: string): string {
  if (href === "/") return "welcome.md";
  const segments = href.split("/");
  const last = segments[segments.length - 1];
  return last ? `${last}.md` : "index.md";
}

export function TabsProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const [tabs, setTabs] = useState<Tab[]>(() => {
    return [{ href: pathname, title: hrefToTitle(pathname) }];
  });

  // Restore tabs from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("blog-tabs");
      if (saved) {
        const parsed: Tab[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Ensure current page is included
          const hasCurrent = parsed.some((t) => t.href === pathname);
          const next = hasCurrent
            ? parsed
            : [...parsed, { href: pathname, title: hrefToTitle(pathname) }];
          setTabs(next);
          return;
        }
      }
    } catch {}
    setTabs([{ href: pathname, title: hrefToTitle(pathname) }]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const persist = useCallback((next: Tab[]) => {
    localStorage.setItem("blog-tabs", JSON.stringify(next));
  }, []);

  const openTab = useCallback(
    (tab: Tab) => {
      setTabs((prev) => {
        const exists = prev.some((t) => t.href === tab.href);
        const next = exists ? prev : [...prev, tab];
        persist(next);
        return next;
      });
      router.push(tab.href);
    },
    [router, persist]
  );

  const closeTab = useCallback(
    (href: string) => {
      setTabs((prev) => {
        if (prev.length === 1) return prev; // keep at least one tab
        const idx = prev.findIndex((t) => t.href === href);
        const next = prev.filter((t) => t.href !== href);
        persist(next);

        // Navigate away if closing the active tab
        if (href === pathname) {
          const adjacent = next[Math.max(0, idx - 1)];
          router.push(adjacent.href);
        }

        return next;
      });
    },
    [pathname, router, persist]
  );

  return (
    <TabsContext.Provider value={{ tabs, openTab, closeTab }}>
      {children}
    </TabsContext.Provider>
  );
}

export function useTabs() {
  return useContext(TabsContext);
}

"use client";

import {useEffect,useRef,useState,} from "react";
import "./Tabs.css";

export type TabItem = {
  id: string;
  label: string;
  content: string;
};

export type TabsContent = {
  content_id: string;
  type: "tabs";
  title: string;
  tabs: TabItem[];
};

export type TabsInteraction = {
  interaction_type: "tabs_session";

  started_at: string;
  engagement_end: string;

  metadata: {
    tabs_viewed: number;
    viewed_tab_ids: string[];
    tab_switch_count: number;
    completed: boolean;

    engagement_mode: "visibility_based";
    visible_duration_ms: number;
  };
};

type TabsProps = {
  content: TabsContent;
  onInteraction?: (
    interaction: TabsInteraction
  ) => void;
};

const VISIBILITY_THRESHOLD = 0.5;
const MIN_DWELL_TIME_MS = 1000;

const Tabs = ({content,onInteraction,}: TabsProps) => {
  const [activeTabId, setActiveTabId] =useState(content.tabs[0]?.id);

  const containerRef =useRef<HTMLDivElement | null>(null);
  const startedAtRef = useRef<number | null>(null);

  const dwellTimerRef =useRef<number | null>(null);

  const hasLoggedRef = useRef(false);

  const viewedTabsRef = useRef<Set<string>>( new Set());

  const switchCountRef = useRef(0);

  const handleTabClick = (tabId: string) => {
    if (tabId !== activeTabId) {
      switchCountRef.current += 1;
    }

    viewedTabsRef.current.add(tabId);

    setActiveTabId(tabId);
  };

  const activeTab = content.tabs.find(
    (tab) => tab.id === activeTabId
  );

  useEffect(() => {
    const node = containerRef.current;

    if (!node) return;

    const observer = new IntersectionObserver(([entry]) => {
        if (
          entry.isIntersecting &&
          entry.intersectionRatio >= VISIBILITY_THRESHOLD
        ) {
          if (!dwellTimerRef.current) {
            dwellTimerRef.current =window.setTimeout(() => {
                if (!startedAtRef.current) {
                  startedAtRef.current =Date.now();

                  if (activeTabId) {
                    viewedTabsRef.current.add(activeTabId);
                  }
                }
              }, MIN_DWELL_TIME_MS);
          }
        } else {
          if (dwellTimerRef.current) {
            clearTimeout(
              dwellTimerRef.current
            );

            dwellTimerRef.current = null;
          }
        }
      },
      {
        threshold: VISIBILITY_THRESHOLD,
      }
    );

    observer.observe(node);

    return () => {
      observer.disconnect();

      if (dwellTimerRef.current) {
        clearTimeout(dwellTimerRef.current);
      }

      if (!startedAtRef.current) return;

      if (hasLoggedRef.current) return;

      hasLoggedRef.current = true;

      const engagementEnd = Date.now();

      const interaction: TabsInteraction = {
        interaction_type: "tabs_session",

        started_at: new Date(startedAtRef.current).toISOString(),

        engagement_end: new Date(engagementEnd).toISOString(),

        metadata: {
          tabs_viewed: viewedTabsRef.current.size,

          viewed_tab_ids: Array.from(viewedTabsRef.current),

          tab_switch_count:switchCountRef.current,

          completed:viewedTabsRef.current.size ===content.tabs.length,

          engagement_mode:"visibility_based",

          visible_duration_ms: engagementEnd - startedAtRef.current,
        },
      };

      onInteraction?.(interaction);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="tabs-block"
    >
      <div className="tabs-header">
        <h3 className="tabs-title">
          {content.title}
        </h3>
      </div>

      <div className="tabs-nav">
        {content.tabs.map((tab) => {
          const active =
            tab.id === activeTabId;

          return (
            <button
              key={tab.id}
              className={`tabs-trigger ${active ? "active" : ""}`}
              onClick={() =>
                handleTabClick(tab.id)
              }
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="tabs-panel">
        <div className="tabs-panel-content">
          {activeTab?.content}
        </div>
      </div>
    </div>
  );
};

export default Tabs;

"use client";

import { useEffect, useRef, useState } from "react";
import "./Tabs.css";

import {
  useFinalize,
  type AttemptPayload,
} from "../EngagementWrapper/EngagementWrapper";

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

type TabsProps = {
  content: TabsContent;
  onInteraction?: (payload: AttemptPayload) => void | Promise<void>;
};

const Tabs = ({ content, onInteraction }: TabsProps) => {
  const [activeTabId, setActiveTabId] = useState(content.tabs[0]?.id);

  const viewedTabsRef = useRef<Set<string>>(new Set());
  const switchCountRef = useRef(0);

  // Initial tab counts as viewed once mounted.
  useEffect(() => {
    if (activeTabId) {
      viewedTabsRef.current.add(activeTabId);
    }
  }, []);

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

  const hasLoggedRef = useRef(false);
  useFinalize(() => {
    if (hasLoggedRef.current) return;
    hasLoggedRef.current = true;
    onInteraction?.({
      interaction_type: "tabs_session",
      attempt_number: 0,
      metadata: {
        tabs_viewed: viewedTabsRef.current.size,
        viewed_tab_ids: Array.from(viewedTabsRef.current),
        tab_switch_count: switchCountRef.current,
        completed:
          viewedTabsRef.current.size === content.tabs.length,
      },
    });
  });

  return (
    <div className="tabs-block">
      <div className="tabs-header">
        <h3 className="tabs-title">
          {content.title}
        </h3>
      </div>

      <div className="tabs-nav">
        {content.tabs.map((tab) => {
          const active = tab.id === activeTabId;

          return (
            <button
              key={tab.id}
              className={`tabs-trigger ${active ? "active" : ""}`}
              onClick={() => handleTabClick(tab.id)}
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

"use client";

import { useState, useRef } from "react";
import "./Accordion.css";

import {
  useFinalize,
  type AttemptPayload,
} from "../EngagementWrapper/EngagementWrapper";

type AccordionItem = {
  id: string;
  title: string;
  content: string;
};

type AccordionContent = {
  content_id: string;
  type: string;
  items: AccordionItem[];
};

type AccordionProps = {
  content: AccordionContent;
  onInteraction?: (payload: AttemptPayload) => void | Promise<void>;
};

const Accordion = ({ content, onInteraction }: AccordionProps) => {
  const openedItemsRef = useRef<Set<string>>(new Set());
  const totalOpensRef = useRef(0);

  const [openId, setOpenId] = useState<string | null>(null);

  const handleToggle = (id: string) => {
    setOpenId((prev) => {
      const isOpening = prev !== id;

      if (isOpening) {
        openedItemsRef.current.add(id);
        totalOpensRef.current += 1;
      }

      return isOpening ? id : null;
    });
  };

  const hasLoggedRef = useRef(false);
  useFinalize(() => {
    if (hasLoggedRef.current) return;
    hasLoggedRef.current = true;
    onInteraction?.({
      interaction_type: "accordion_exploration",
      attempt_number: 0,
      metadata: {
        items_opened: Array.from(openedItemsRef.current),
        unique_opens: openedItemsRef.current.size,
        total_opens: totalOpensRef.current,
      },
    });
  });

  return (
    <div className="accordion-block">
      <h3 className="accordion-title">Explore Concepts</h3>

      <div className="accordion-container">
        {content.items.map((item) => {
          const isOpen = openId === item.id;

          return (
            <div key={item.id} className="accordion-item">
              <button
                className={`accordion-header ${isOpen ? "open" : ""}`}
                onClick={() => handleToggle(item.id)}
              >
                <span>{item.title}</span>
                <span className="accordion-icon">
                  {isOpen ? "−" : "+"}
                </span>
              </button>

              <div
                className={`accordion-content ${
                  isOpen ? "open" : ""
                }`}
              >
                <p>{item.content}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Accordion;

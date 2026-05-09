"use client";

import { useState,useRef,useEffect } from "react";
import "./Accordion.css";

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

export type AccordionInteraction={
  interaction_type:string;
  started_at:string,
  engagement_end:string,
  metadata?:any;
}

type AccordionProps={
  content:AccordionContent;
  onInteraction?:(interaction: AccordionInteraction)=>void;
}

const Accordion = ({content,onInteraction}:AccordionProps) => {
  const startedAtRef = useRef<number | null>(null);
  const lastActivityRef = useRef<number | null>(null);

  const openedItemsRef = useRef<Set<string>>(new Set());
  const totalOpensRef = useRef(0);

  const [openId, setOpenId] = useState<string | null>(null);

  const markActivity = (itemId: string) => {
  const now = Date.now();

  if (!startedAtRef.current) {
    startedAtRef.current = now;
  }

  lastActivityRef.current = now;

  openedItemsRef.current.add(itemId);
  totalOpensRef.current += 1;
};

const handleToggle = (id: string) => {
  setOpenId((prev) => {
    const isOpening = prev !== id;

    if (isOpening) {
      markActivity(id);
    }

    return isOpening ? id : null;
  });
};

const finalize = () => {
  if (!startedAtRef.current) return;

  const engagementEnd = lastActivityRef.current || Date.now();

  const interaction:AccordionInteraction = {
    interaction_type: "accordion_exploration",

    started_at: new Date(startedAtRef.current).toISOString(),
    // submitted_at: null,
    engagement_end: new Date(engagementEnd).toISOString(),

    metadata: {
      items_opened: Array.from(openedItemsRef.current),
      unique_opens: openedItemsRef.current.size,
      total_opens: totalOpensRef.current,
    }
  };

  // console.log("Accordion Interaction:", interaction);
  onInteraction?.(interaction)
};

  useEffect(() => {
    return () => finalize();
  }, []);

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
import { useState } from "react";

import Accordion from "./Accordion/Accordion";
import type { AccordionInteraction } from "./Accordion/Accordion";

import FlashCards from "./FlashCards/FlashCards";
import type { FlashCardsInteraction } from "./FlashCards/FlashCards";

import Game from "./Game/Game";
import type { GameInteraction } from "./Game/Game";
import { gameHTML } from "./Game/fakeGame";

const cards = [
  { id: "1", front: "What is yeast?", back: "A microorganism used in baking." },
  { id: "2", front: "What does yeast produce?", back: "Carbon dioxide gas." },
  { id: "3", front: "Why is CO₂ important?", back: "It makes dough fluffy." },
];

// 🧪 Fake data (replace later with backend)
const accordionContent = {
  content_id: "accordion_1",
  type: "accordion",
  items: [
    {
      id: "1",
      title: "What is yeast?",
      content:
        "Yeast is a microorganism used in baking. It consumes sugar and produces carbon dioxide, which helps dough rise.",
    },
    {
      id: "2",
      title: "Why is yeast important?",
      content:
        "It creates air bubbles in dough, giving bread and donuts their soft and fluffy texture.",
    },
    {
      id: "3",
      title: "What happens without yeast?",
      content:
        "The dough will not rise, resulting in dense and flat baked goods.",
    },
  ],
};

const TestWrapper = () => {
  const [showGame, setShowGame] = useState(true);
  const [showFlashCard,setShowFlashCard]=useState(true);
  const [showAccordion, setShowAccordion]=useState(true);

  const handleFlashCardInteraction =(interaction:FlashCardsInteraction)=>{
      const payload = {
          user_id: "123",
          session_id: "abc",
          content_id: "flashcard-1",

          content_type: "accordion",

          ...interaction,
    };

    console.log("FINAL PAYLOAD", payload);
  }
  const handleGameInteraction = (interaction: GameInteraction) => {
    const payload = {
      user_id: "123",
      session_id: "abc",
      content_id: "game-1",

      content_type: "game",

      ...interaction,
    };

    console.log("FINAL PAYLOAD", payload);

  // future:
  // await fetch(...)
  };

  const handleAccordionInteraction =(interaction:AccordionInteraction)=>{
    const payload={
      user_id: "123",
      session_id: "abc",
      content_id: "accordion-1",

      content_type: "accordion",
      ...interaction
    }
    console.log("FINAL PAYLOAD", payload)
  }

  return (
    <div>
      <div className="show-flashcard">
        <button
          onClick={()=>{setShowFlashCard(prev=>!prev)}}
        >
          Show Flashcard
        </button>
        {
          showFlashCard && 
            <FlashCards
              cards={cards}
              onInteraction={handleFlashCardInteraction}
            />
        }
      </div>
      <div className="game-container">
      <button onClick={() => setShowGame((s) => !s)}>
        Toggle Game
      </button>

      {showGame && 
        <Game
          htmlContent={gameHTML}
          onInteraction={handleGameInteraction}
         />
      }
      </div>
      <div className="accordions-container">
        <button
          onClick={()=>setShowAccordion(prev=>!prev)}
        >Toggle Accordion</button>
        {
          showAccordion &&
          <Accordion
            content={accordionContent}
            onInteraction={handleAccordionInteraction}
          />
        }
      </div>
    </div>
  );
};

export default TestWrapper
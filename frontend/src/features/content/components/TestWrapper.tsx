import { useState } from "react";

import Accordion from "./Accordion/Accordion";
import type { AccordionInteraction } from "./Accordion/Accordion";

import FlashCards from "./FlashCards/FlashCards";
import type { FlashCardsInteraction } from "./FlashCards/FlashCards";

import Game from "./Game/Game";
import type { GameInteraction } from "./Game/Game";
import { gameHTML } from "./Game/fakeGame";

import Steps from "./Steps/Steps";
import type { StepsInteraction } from "./Steps/Steps";

import Tabs from "./Tabs/Tabs";
import type { TabsContent, TabsInteraction } from "./Tabs/Tabs";

import RichContent from "./RichContent/RichContent";
import type { RichContentBlock,RichContentInteraction } from "./RichContent/RichContent";

import CharacterMessage from "./CharacterMessage/CharacterMessage";
import type { CharacterMessageContent,CharacterMessageInteraction} from "./CharacterMessage/CharacterMessage";

import type { RevealBlock, RevealInteraction } from "./Reveal/Reveal";
import Reveal from "./Reveal/Reveal";

import type { ScenarioBlock,ScenarioInteraction} from "./Scenario/Scenario";
import Scenario from "./Scenario/Scenario";

import Diagram from "./Diagram/Diagram";
import type {DiagramBlock,DiagramInteraction} from "./Diagram/Diagram";

import type {DividerBlock,DividerInteraction} from "./Divider/Divider";
import Divider from "./Divider/Divider";

import Video from "./Video/Video";
import type {VideoBlock,VideoInteraction} from "./Video/Video";

export const fakeVideoContent: VideoBlock =
  {
    content_id: "video-001",

    type: "video",

    variant: "featured",

    title:
      "Introduction to Machine Learning",

    description:
      "This video provides a beginner-friendly overview of how machine learning systems learn patterns from data, including examples of supervised learning, neural networks, and real-world AI applications.",

    video_url:
      "https://www.w3schools.com/html/mov_bbb.mp4",

    thumbnail_url:
      "https://images.unsplash.com/photo-1677442136019-21780ecad995",

    caption:
      "An introductory overview of machine learning concepts and workflows.",
  };

export const fakeLineDivider: DividerBlock =
  {
    content_id:
      "divider-line-001",

    type: "divider",

    variant: "line",
  };

export const fakeGradientDivider: DividerBlock =
  {
    content_id:
      "divider-gradient-001",

    type: "divider",

    variant: "gradient",

    label: "Next Section",
  };

export const fakeIconDivider: DividerBlock =
  {
    content_id:
      "divider-icon-001",

    type: "divider",

    variant: "icon",

    icon: "🧠",

    label: "AI Concepts",
  };

export const fakeChapterDivider: DividerBlock =
  {
    content_id:
      "divider-chapter-001",

    type: "divider",

    variant: "chapter",

    label: "Chapter 2",
  };

export const fakeSpacerDivider: DividerBlock =
  {
    content_id:
      "divider-spacer-001",

    type: "divider",

    variant: "spacer",
  };

export const fakeFlowDiagram: DiagramBlock =
  {
    content_id: "diagram-flow-001",

    type: "diagram",

    variant: "flow",

    title:
      "Machine Learning Pipeline",

    nodes: [
      {
        id: "collect",

        title: "Collect Data",

        description:
          "Gather raw training data from multiple sources.",
      },

      {
        id: "clean",

        title: "Clean Data",

        description:
          "Handle missing values and remove inconsistencies.",
      },

      {
        id: "train",

        title: "Train Model",

        description:
          "Use algorithms to learn patterns from data.",
      },

      {
        id: "evaluate",

        title: "Evaluate",

        description:
          "Measure model performance using validation metrics.",
      },
    ],
  };

export const fakeTimelineDiagram: DiagramBlock =
  {
    content_id:
      "diagram-timeline-001",

    type: "diagram",

    variant: "timeline",

    title:
      "Major Milestones in AI History",

    nodes: [
      {
        id: "1950",

        title: "1950 — Turing Test",

        description:
          "Alan Turing proposes a test for machine intelligence.",
      },

      {
        id: "1986",

        title:
          "1986 — Backpropagation",

        description:
          "Neural network training becomes more practical.",
      },

      {
        id: "2012",

        title:
          "2012 — Deep Learning Breakthrough",

        description:
          "AlexNet dramatically improves image recognition performance.",
      },

      {
        id: "2017",

        title:
          "2017 — Transformers",

        description:
          "Attention-based architectures reshape NLP and AI.",
      },
    ],
  };

export const fakeHierarchyDiagram: DiagramBlock =
  {
    content_id:
      "diagram-hierarchy-001",

    type: "diagram",

    variant: "hierarchy",

    title:
      "Neural Network Structure",

    nodes: [
      {
        id: "input",

        title: "Input Layer",

        description:
          "Receives raw input features.",
      },

      {
        id: "hidden",

        title: "Hidden Layers",

        description:
          "Extract increasingly complex representations.",
      },

      {
        id: "output",

        title: "Output Layer",

        description:
          "Produces final prediction results.",
      },
    ],
  };

export const fakeComparisonDiagram: DiagramBlock =
  {
    content_id:
      "diagram-comparison-001",

    type: "diagram",

    variant: "comparison",

    title:
      "Supervised vs Unsupervised Learning",

    comparison_columns: [
      {
        title:
          "Supervised Learning",

        items: [
          "Uses labeled data",
          "Predicts known outputs",
          "Examples: classification and regression",
          "Requires human-labeled datasets",
        ],
      },

      {
        title:
          "Unsupervised Learning",

        items: [
          "Uses unlabeled data",
          "Finds hidden patterns",
          "Examples: clustering and dimensionality reduction",
          "Discovers structure automatically",
        ],
      },
    ],
  };

export const fakeScenarioContent: ScenarioBlock =
  {
    content_id: "scenario-001",

    type: "scenario",

    title:
      "AI Hiring System Decision Scenario",

    scenario:
      "A company is preparing to deploy an AI system to help screen job applicants. Early testing shows that the model performs well overall, but some employees are concerned that the training data may contain historical hiring bias.\n\nAs part of the AI ethics review team, what would you choose to do next?",

    choices: [
      {
        id: "deploy-immediately",

        label:
          "Deploy the AI system immediately to improve hiring efficiency.",

        consequence:
          "The hiring process becomes faster, but several months later the company discovers that the model systematically disadvantages certain applicant groups because historical bias patterns were learned from the training data.",
      },

      {
        id: "audit-dataset",

        label:
          "Pause deployment and audit the training dataset for bias.",

        consequence:
          "The review process delays deployment, but the team identifies major representation imbalances and improves the dataset before retraining the model.",
      },

      {
        id: "human-review",

        label:
          "Keep humans involved in reviewing AI recommendations.",

        consequence:
          "The hiring process remains partially manual, but human reviewers are able to catch suspicious AI recommendations and reduce harmful outcomes.",
      },

      {
        id: "collect-feedback",

        label:
          "Deploy a pilot version and continuously collect fairness feedback from users.",

        consequence:
          "The company gathers real-world evidence about model behavior and gradually improves the system over time, though some risks remain during the pilot phase.",
      },
    ],
  };

export const fakeRevealContent: RevealBlock =
  {
    content_id: "reveal-001",

    type: "reveal",

    headline:
      "Why Do Neural Networks Need Activation Functions?",

    prompt:
      "Think about what would happen if every layer in a neural network only performed simple linear transformations.",

    button_label:
      "Reveal Explanation",

    revealed_content:
      "Without activation functions, a neural network would behave like a single linear equation regardless of how many layers it contains. Activation functions introduce non-linearity, allowing the network to learn complex patterns such as images, language, and decision boundaries.",
  };

export const fakeCharacterMessage: CharacterMessageContent =
  {
    content_id:
      "character-message-001",

    type: "character_message",

    variant: "intro",

    layout: "left",

    character_name: "Nova",

    character_avatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330",

    headline:
      "Welcome to the Lesson!",

    body:
      "In this lesson, we are going to explore how machine learning systems recognize patterns from data. Along the way, you will interact with examples, diagrams, and activities designed to help you build intuition step by step.",
  };

export const richTextContent: RichContentBlock = {
  content_id: "rich-text-001",

  type: "rich_content",
  variant: "summary",

  layout: "text",

  headline: "What Is Machine Learning?",

  body:
    "Machine learning is a branch of artificial intelligence that allows systems to learn patterns from data instead of relying entirely on explicit programming instructions. It is widely used in recommendation systems, image recognition, and natural language processing.",
};

export const richImageTopContent: RichContentBlock = {
  content_id: "rich-image-top-001",

  type: "rich_content",

  layout: "image_top",

  headline: "The Structure of a Neural Network",

  body:
    "Neural networks are inspired by the human brain and consist of layers of interconnected nodes. Each layer extracts increasingly complex features from the input data.",

  image_url:
    "https://images.unsplash.com/photo-1677442136019-21780ecad995",

  image_alt: "AI visualization",

  caption:
    "A conceptual visualization of artificial intelligence and neural networks.",
};

export const richImageLeftContent: RichContentBlock = {
  content_id: "rich-image-left-001",

  type: "rich_content",

  layout: "image_left",

  headline: "How Bread Fermentation Works",

  body:
    "During fermentation, yeast consumes sugars and produces carbon dioxide gas. The gas becomes trapped inside the dough, creating air pockets that help bread rise and become fluffy.",

  image_url:
    "https://images.unsplash.com/photo-1509440159596-0249088772ff",

  image_alt: "Bread dough",

  caption:
    "Fresh dough rising during the fermentation process.",
};

export const richImageRightContent: RichContentBlock = {
  content_id: "rich-image-right-001",

  type: "rich_content",

  layout: "image_right",

  headline: "Solar Energy Conversion",

  body:
    "Solar panels convert sunlight into electricity through photovoltaic cells. When sunlight hits the semiconductor material, electrons become energized and generate electric current.",

  image_url:
    "https://images.unsplash.com/photo-1509391366360-2e959784a276",

  image_alt: "Solar panels",

  caption:
    "Large-scale solar panels generating renewable energy.",
};

export const richHeroContent: RichContentBlock = {
  content_id: "rich-hero-001",

  type: "rich_content",

  layout: "hero",

  headline: "Explore the Future of Artificial Intelligence",

  body:
    "Artificial intelligence is transforming industries ranging from healthcare and education to transportation and scientific research. Understanding its foundations is becoming increasingly important in the modern world.",

  image_url:
    "https://images.unsplash.com/photo-1674027444485-cec3da58eef4",

  image_alt: "Future AI",

  caption:
    "Artificial intelligence and the future of human-computer collaboration.",
};

export const tabsContent: TabsContent = {
  content_id: "tabs-001",

  type: "tabs",

  title: "Types of Machine Learning",

  tabs: [
    {
      id: "supervised",

      label: "Supervised Learning",

      content:
        "Supervised learning uses labeled examples to train models. The system learns relationships between inputs and outputs in order to make predictions on new data.",
    },

    {
      id: "unsupervised",

      label: "Unsupervised Learning",

      content:
        "Unsupervised learning works with unlabeled data. The model attempts to discover hidden patterns, clusters, or structures without predefined answers.",
    },

    {
      id: "reinforcement",

      label: "Reinforcement Learning",

      content:
        "Reinforcement learning trains agents through rewards and penalties. The system learns strategies by interacting with an environment over time.",
    },

    {
      id: "deep-learning",

      label: "Deep Learning",

      content:
        "Deep learning uses multi-layer neural networks to automatically learn complex representations from large amounts of data such as images, text, and audio.",
    },
  ],
};

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

const stepsContent = {
  content_id: "steps-001",

  type: "steps",

  title: "How Bread Fermentation Works",

  steps: [
    {
      id: "step-1",

      title: "Step 1 — Mix Ingredients",

      content:
        "Flour, water, salt, and yeast are combined together to form dough. Warm water helps activate the yeast.",
    },

    {
      id: "step-2",

      title: "Step 2 — Yeast Activation",

      content:
        "The yeast begins consuming sugars inside the dough and starts producing carbon dioxide gas.",
    },

    {
      id: "step-3",

      title: "Step 3 — Dough Expansion",

      content:
        "The gas becomes trapped inside the dough, creating air pockets that make the bread rise and become fluffy.",
    },

    {
      id: "step-4",

      title: "Step 4 — Baking",

      content:
        "Heat causes the gases to expand further while the dough structure hardens, producing the final bread texture.",
    },
  ],
};

const TestWrapper = () => {
  const [showGame, setShowGame] = useState(true);
  const [showFlashCard,setShowFlashCard]=useState(true);
  const [showAccordion, setShowAccordion]=useState(true);
  const [showSteps,setShowSteps]=useState(true)
  const [showTabs,setShowTabs]=useState(true)
  const [showRichContent,setShowRichContent]=useState(true)
  const [showCharactercontnet,setShowCharacterContent]=useState(true)
  const [showReveal,setShowReveal]=useState(true)
  const [showScenario,setShowScenario]=useState(true)
  const [showDiagram,setShowDiagram]=useState(true)
  const [showDivider,setShowDivider]=useState(true)
  const [showVideo,setShowVideo]=useState(true)

  const handleVideoInteraction=(interaction:VideoInteraction)=>{
        const payload = {
          user_id: "123",
          session_id: "abc",
          content_id: "video_1",

          content_type: "video",

          ...interaction,
    };

    console.log("FINAL PAYLOAD", payload);
  }
  const handleDividerInteraction=(interaction:DividerInteraction)=>{
      const payload = {
          user_id: "123",
          session_id: "abc",
          content_id: "divider_1",

          content_type: "divider",

          ...interaction,
    };

    console.log("FINAL PAYLOAD", payload);
  }

  const handleDiagrameInteraction=(interaction:DiagramInteraction)=>{
    const payload = {
          user_id: "123",
          session_id: "abc",
          content_id: "diagrame_1",

          content_type: "diagram",

          ...interaction,
    };

    console.log("FINAL PAYLOAD", payload);
  }

  const handleScenarioInteraction=(interaction:ScenarioInteraction)=>{
    const payload = {
          user_id: "123",
          session_id: "abc",
          content_id: "scenario_1",

          content_type: "scenario",

          ...interaction,
    };

    console.log("FINAL PAYLOAD", payload);
  }

  const handleRevealInteraction=(interaction:RevealInteraction)=>{
    const payload = {
          user_id: "123",
          session_id: "abc",
          content_id: "reveal1",

          content_type: "reveal",

          ...interaction,
    };

    console.log("FINAL PAYLOAD", payload);
  }
  const handleStepsInteraction =(interaction:StepsInteraction)=>{
        const payload = {
          user_id: "123",
          session_id: "abc",
          content_id: "steps1",

          content_type: "steps",

          ...interaction,
    };

    console.log("FINAL PAYLOAD", payload);
  }

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

  const handleTabsInteraction =(interaction:TabsInteraction)=>{
        const payload={
        user_id: "123",
        session_id: "abc",
        content_id: "tabs-1",

        content_type: "tab",
        ...interaction
      }
      console.log("FINAL PAYLOAD", payload)
  }

  const handleRichContentInteraction=(interaction:RichContentInteraction)=>{
            const payload={
        user_id: "123",
        session_id: "abc",
        content_id: "rich content-1",

        content_type: "rich content",
        ...interaction
      }
      console.log("FINAL PAYLOAD", payload)
  }

  const handleCharacterInteraction =(interaction:CharacterMessageInteraction)=>{
      const payload={
        user_id: "123",
        session_id: "abc",
        content_id: "character message 1",

        content_type: "character message",
        ...interaction
      }
      console.log("FINAL PAYLOAD", payload)
  }

  return (
    <div>
      <div className="videos-container">
        <button onClick={()=>{setShowVideo(prev=>!prev)}}>Toggle Video</button>
        {
          showVideo && <Video content={fakeVideoContent} onInteraction={handleVideoInteraction} />
        }
      </div>
      <div className="dividers-container">
        <button onClick={()=>setShowDivider(prev=>!prev)}>Toggle Divider</button>
        {
          showDivider && <Divider content={fakeLineDivider} onInteraction={handleDividerInteraction}/>
        }
      </div>
      <div className="diagrame-container">
        <button onClick={()=>{setShowDiagram(prev=>!prev)}}>Toggle Diagram</button>
        {
          showDiagram && <Diagram content={fakeComparisonDiagram} onInteraction={handleDiagrameInteraction}/>
        }

      </div>
      <div className="scenario-container">
        <button onClick={()=>{setShowScenario(prev=>!prev)}}>toggle scenario</button>
        {
          showScenario && <Scenario content={fakeScenarioContent} onInteraction={handleScenarioInteraction}/>
        }
      </div>
      <div className="reveal-container">
        <button
          onClick={()=>{setShowReveal(prev=>!prev)}}
        >Toggle Reveal</button>
        {
          showReveal &&
          <Reveal
            content={fakeRevealContent}
            onInteraction={handleRevealInteraction}
          />
        }
      </div>
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
      <div className="stepss-container">
        <button 
          onClick={()=>setShowSteps(prev=>!prev)}
        >
          Toggle Steps
        </button>
        {
          showSteps &&
          <Steps
            content={stepsContent}
            onInteraction={handleStepsInteraction}
        />
        }
      </div>
      <div className="tabss-container">
        <button
          onClick={()=>{setShowTabs(prev=>!prev)}}
        >
          toggle tabs
        </button>
        {
          showTabs &&
          <Tabs
            content={tabsContent}
            onInteraction={handleTabsInteraction}
          />

        }
      </div>
      <div className="richcontent-container">
        <button
          onClick={()=>setShowRichContent(prev=>!prev)}
        >Toggle Rich Content</button>
        {
          showRichContent && 
          <RichContent
            content={richTextContent}
            onInteraction={handleRichContentInteraction}
          />
        }
      </div>
      <div className="character-message-container">
        <button
          onClick={()=>{setShowCharacterContent(prev=>!prev)}}
        >
          toggle character message
        </button>
        {
          showCharactercontnet &&
          <CharacterMessage
            content={fakeCharacterMessage}
            onInteraction={handleCharacterInteraction}
          />
        }
      </div>

    </div>
  );
};

export default TestWrapper
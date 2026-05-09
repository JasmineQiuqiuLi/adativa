"use client";

import { useState } from "react";
import "./Chat.css";

type Message={
    id:number;
    role:"user"|"assistant";
    content:string;
}

const initialMessages: Message[] = [
  {
    id: 1,
    role: "assistant",
    content: "Hi! I'm your learning assistant. What would you like help with?",
  },
  {
    id: 2,
    role: "user",
    content: "Can you explain what ingredients are used in donuts?",
  },
  {
    id: 3,
    role: "assistant",
    content:
      "Sure! Donuts typically include flour, sugar, eggs, milk, and yeast. Each ingredient plays a specific role in texture and flavor.",
  },
];

const Chat = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [messages,setMessages] = useState<Message[]>(initialMessages)
  const [input,setInput] = useState("");

  const handleSend=()=>{
    if (!input.trim()) return;
    const newUserMessage:Message={
        id:Date.now(),
        role:"user",
        content:input,
    }

    const fakeAIResponse:Message={
        id:Date.now()+10,
        role:"assistant",
        content:"this is a great question. Let me help you with that"
    }

    setMessages((prev)=>[...prev,newUserMessage,fakeAIResponse])

    setInput("")

  }


  return (
    <aside className={`chat-panel ${collapsed ? "collapsed" : ""}`}>
      <button
        className="panel-toggle right-toggle"
        onClick={() => setCollapsed((prev) => !prev)}
      >
        {collapsed ? "<" : ">"}
      </button>

      {!collapsed && (
        <div className="chat-container">
            <div className="chat-header">Assistant</div>

            <div className="chat-messages">
                {messages.map((msg)=>(
                    <div
                        key={msg.id}
                        className={`chat-message ${msg.role}`}
                    >
                        <div className="chat-bubble">{msg.content}</div>
                    </div>
                ))}
            </div>

            <div className="chat-input">
                <textarea 
                    placeholder="Ask something..."
                    value={input}
                    onChange={(e)=>setInput(e.target.value)}
                    rows={2}
                />
                <button onClick={handleSend}>Send</button>
            </div>
        </div>
      )}
    </aside>
  );
};

export default Chat;
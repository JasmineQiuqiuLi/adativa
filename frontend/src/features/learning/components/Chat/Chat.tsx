import { useState } from "react";
import "./Chat.css";

const Chat = () => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside className={`chat-panel ${collapsed ? "collapsed" : ""}`}>
      <button
        className="panel-toggle right-toggle"
        onClick={() => setCollapsed((prev) => !prev)}
      >
        {collapsed ? "<" : ">"}
      </button>

      {!collapsed && (
        <div className="chat-content">
          <h3>AI Tutor</h3>

          <div className="chat-box">
            <p>
              <strong>AI:</strong> Hi! Ask me anything about your lesson.
            </p>
          </div>

          <input className="chat-input" placeholder="Type your question..." />
        </div>
      )}
    </aside>
  );
};

export default Chat;
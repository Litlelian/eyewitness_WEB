import { useState, useEffect, useRef } from "react";
import "./ChatBox.css";

export default function ChatBox({ messages }) {
  const scrollRef = useRef(null);

  // 當 messages 更新時，自動滾到最上方或最下方
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="chat-container" ref={scrollRef}>
      {messages.map((msg) => (
        <div key={msg.id} className={`chat-message ${msg.type}`}>
          <strong>{msg.sender}：</strong> {msg.text}
        </div>
      ))}
    </div>
  );
}
// src/components/conference/Chat.jsx

import React, { useState, useRef, useEffect } from 'react';

const Chat = ({ messages, onSendMessage }) => {
  const [newMessage, setNewMessage] = useState('');
  const chatBoxRef = useRef(null);

  // Auto-scroll to the bottom when new messages arrive
  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = (event) => {
    event.preventDefault();
    if (newMessage.trim() === '') return;
    onSendMessage(newMessage);
    setNewMessage('');
  };

  return (
    <div className="flex flex-col h-full">
      <h3 className="font-semibold text-black dark:text-white mb-4">Chat</h3>
      <div ref={chatBoxRef} className="flex-grow overflow-y-auto mb-4 pr-2">
        {messages.map((msg, index) => (
          <div key={index} className="mb-2">
            <strong className="text-primary">{msg.origin}:</strong>
            <p className="text-sm text-black dark:text-white break-words">{msg.payload}</p>
          </div>
        ))}
      </div>
      <form onSubmit={handleSubmit} className="flex gap-3">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          className="w-full rounded border-[1.5px] border-stroke bg-transparent py-2 px-4 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
        />
        <button type="submit" className="rounded bg-primary py-2 px-6 font-medium text-gray hover:bg-opacity-90">
          Send
        </button>
      </form>
    </div>
  );
};

export default Chat;
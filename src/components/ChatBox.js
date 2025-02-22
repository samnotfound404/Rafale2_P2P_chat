import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Users, X, Send } from 'lucide-react';

function App() {
  const [socketPort, setSocketPort] = useState('');
  const [flaskPort, setFlaskPort] = useState('');
  const [isConfigured, setIsConfigured] = useState(false);
  const [message, setMessage] = useState('');
  const [targetIP, setTargetIP] = useState('');
  const [targetPort, setTargetPort] = useState('');
  const [messages, setMessages] = useState([]);
  const [peers, setPeers] = useState({});
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isConfigured) {
      const fetchData = async () => {
        try {
          const [messagesRes, peersRes] = await Promise.all([
            fetch(`http://localhost:${flaskPort}/api/messages`),
            fetch(`http://localhost:${flaskPort}/api/query`)
          ]);
          const messagesData = await messagesRes.json();
          const peersData = await peersRes.json();
          setMessages(messagesData);
          setPeers(peersData);
        } catch (error) {
          console.error('Error fetching data:', error);
        }
      };

      const interval = setInterval(fetchData, 1000);
      return () => clearInterval(interval);
    }
  }, [isConfigured, flaskPort]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleConfigure = (e) => {
    e.preventDefault();
    setIsConfigured(true);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!message || !targetIP || !targetPort) return;

    try {
      const response = await fetch(`http://localhost:${flaskPort}/api/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          target_ip: targetIP,
          target_port: parseInt(targetPort),
          message: message,
        }),
      });
      
      if (response.ok) {
        setMessage('');
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleDisconnect = async (peer) => {
    const [ip, port] = peer.split(':');
    try {
      await fetch(`http://localhost:${flaskPort}/api/disconnect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          disconnect_ip: ip,
          disconnect_port: parseInt(port),
        }),
      });
    } catch (error) {
      console.error('Error disconnecting:', error);
    }
  };

  if (!isConfigured) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-gray-800 p-8 rounded-lg shadow-xl w-full max-w-md">
          <h1 className="text-2xl font-bold text-white mb-6">Configure Connection</h1>
          <form onSubmit={handleConfigure} className="space-y-4">
            <div>
              <label className="block text-gray-300 mb-2">Socket Server Port</label>
              <input
                type="number"
                value={socketPort}
                onChange={(e) => setSocketPort(e.target.value)}
                className="w-full bg-gray-700 text-white px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-gray-300 mb-2">Flask API Port</label>
              <input
                type="number"
                value={flaskPort}
                onChange={(e) => setFlaskPort(e.target.value)}
                className="w-full bg-gray-700 text-white px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition duration-200"
            >
              Connect
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex">
      {/* Sidebar */}
      <div className="w-64 bg-gray-800 p-4">
        <div className="flex items-center space-x-2 mb-6">
          <Users className="text-blue-500" />
          <h2 className="text-xl font-semibold text-white">Active Peers</h2>
        </div>
        <div className="space-y-2">
          {Object.entries(peers).map(([peer, status]) => (
            <div key={peer} className="flex items-center justify-between bg-gray-700 p-2 rounded">
              <span className="text-gray-300 text-sm">{peer}</span>
              <button
                onClick={() => handleDisconnect(peer)}
                className="text-red-400 hover:text-red-300"
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Messages */}
        <div className="flex-1 p-4 overflow-y-auto">
          <div className="space-y-4">
            {messages.map((msg, index) => (
              <div key={index} className="bg-gray-800 p-4 rounded-lg">
                <div className="text-blue-400 text-sm mb-1">From: {msg.from}</div>
                <div className="text-white">{msg.message}</div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Message Input */}
        <div className="bg-gray-800 p-4">
          <form onSubmit={handleSendMessage} className="space-y-4">
            <div className="flex space-x-4">
              <input
                type="text"
                placeholder="Target IP"
                value={targetIP}
                onChange={(e) => setTargetIP(e.target.value)}
                className="flex-1 bg-gray-700 text-white px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="number"
                placeholder="Target Port"
                value={targetPort}
                onChange={(e) => setTargetPort(e.target.value)}
                className="w-32 bg-gray-700 text-white px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex space-x-4">
              <input
                type="text"
                placeholder="Type your message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="flex-1 bg-gray-700 text-white px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition duration-200 flex items-center space-x-2"
              >
                <Send size={18} />
                <span>Send</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default App;
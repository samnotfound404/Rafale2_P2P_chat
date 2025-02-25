"use client"
import { useState, useEffect,useRef } from "react"
// import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Users, X, Send, RefreshCw, Link, Link2Off } from 'lucide-react';
export default function Home() {
  const [socketPort, setSocketPort] = useState('');
  const [flaskPort, setFlaskPort] = useState('');
  const [isConfigured, setIsConfigured] = useState(false);
  const [message, setMessage] = useState('');
  const [targetIP, setTargetIP] = useState('');
  const [targetPort, setTargetPort] = useState('');
  const [messages, setMessages] = useState([]);
  const [peers, setPeers] = useState({});
  const [apiResponse, setApiResponse] = useState('');
  const [showPeerModal, setShowPeerModal] = useState(false);
  const [peerAction, setPeerAction] = useState('');
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
      
      const data = await response.json();
      setApiResponse(JSON.stringify(data, null, 2));
      
      if (response.ok) {
        setMessage('');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setApiResponse(JSON.stringify({ error: error.message }, null, 2));
    }
  };

  const handlePeerAction = async (peer) => {
    const [ip, port] = peer.split(':');
    try {
      const endpoint = peerAction === 'connect' ? 'connect' : 'disconnect';
      const body = peerAction === 'connect' 
        ? { target_ip: ip, target_port: parseInt(port) }
        : { disconnect_ip: ip, disconnect_port: parseInt(port) };

      const response = await fetch(`http://localhost:${flaskPort}/api/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      
      const data = await response.json();
      setApiResponse(JSON.stringify(data, null, 2));
      setShowPeerModal(false);
    } catch (error) {
      console.error('Error with peer action:', error);
      setApiResponse(JSON.stringify({ error: error.message }, null, 2));
    }
  };

  if (!isConfigured) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-gray-800 p-8 rounded-lg shadow-xl w-full max-w-md">
          <h1 className="text-2xl font-bold text-white mb-6">Configure P2P Connection</h1>
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
      <div className="w-72 bg-gray-800 p-4 flex flex-col">
        <div className="flex items-center space-x-2 mb-6">
          <Users className="text-blue-500" />
          <h2 className="text-xl font-semibold text-white">Active Peers</h2>
        </div>
        <div className="flex space-x-2 mb-4">
          <button
            onClick={() => {
              setPeerAction('connect');
              setShowPeerModal(true);
            }}
            className="flex items-center space-x-2 bg-green-600 text-white px-3 py-2 rounded hover:bg-green-700 transition duration-200"
          >
            <Link size={16} />
            <span>Connect</span>
          </button>
          <button
            onClick={() => {
              setPeerAction('disconnect');
              setShowPeerModal(true);
            }}
            className="flex items-center space-x-2 bg-red-600 text-white px-3 py-2 rounded hover:bg-red-700 transition duration-200"
          >
            <Link2Off size={16} />
            <span>Disconnect</span>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto space-y-2">
          {Object.entries(peers).map(([peer, status]) => (
            <div key={peer} className="flex items-center justify-between bg-gray-700 p-3 rounded">
              <div className="flex flex-col">
                <span className="text-gray-300 text-sm font-medium">{peer}</span>
                <span className="text-gray-400 text-xs">{status}</span>
              </div>
              <button
                onClick={() => handlePeerAction(peer)}
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

        {/* API Response */}
        {apiResponse && (
          <div className="bg-gray-800 p-4 border-t border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-gray-300 font-medium">Last API Response</h3>
              <button
                onClick={() => setApiResponse('')}
                className="text-gray-400 hover:text-gray-300"
              >
                <X size={16} />
              </button>
            </div>
            <pre className="text-sm text-gray-300 bg-gray-900 p-3 rounded overflow-x-auto">
              {apiResponse}
            </pre>
          </div>
        )}
      </div>

      {/* Peer Action Modal */}
      {showPeerModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg shadow-xl max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-white">
                {peerAction === 'connect' ? 'Connect to Peer' : 'Disconnect from Peer'}
              </h3>
              <button
                onClick={() => setShowPeerModal(false)}
                className="text-gray-400 hover:text-gray-300"
              >
                <X size={20} />
              </button>
            </div>
            <div className="max-h-64 overflow-y-auto">
              {Object.entries(peers).map(([peer, status]) => (
                <button
                  key={peer}
                  onClick={() => handlePeerAction(peer)}
                  className="w-full text-left p-3 my-1 rounded bg-gray-700 hover:bg-gray-600 text-gray-300 transition duration-200"
                >
                  <div className="font-medium">{peer}</div>
                  <div className="text-sm text-gray-400">{status}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import Navbar from "../Components/Navbar.js";

export default function Chatbot() {
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const chatContainerRef = useRef(null);

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSendMessage = async () => {
        if (!inputMessage.trim()) return;

        const userMessage = { sender: "user", text: inputMessage.trim() };
        setMessages((prev) => [...prev, userMessage]);

        setInputMessage("");
        setIsLoading(true);

        try {
            const response = await axios.post("http://localhost:3000/api/chat", {
                prompt: userMessage.text,
            });
            const botMessage = { sender: "bot", text: response.data.response };
            setMessages((prev) => [...prev, botMessage]);
        } catch (error) {
            console.error("Error sending message:", error);
            const errorMessage = {
                sender: "bot",
                text: "Oops! Something went wrong. Please try again later.",
            };
            setMessages((prev) => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleResetChat = async () => {
        try {
            await axios.post("http://localhost:3000/api/chat/reset");
            setMessages([]);
        } catch (error) {
            console.error("Error resetting chat:", error);
            alert("Failed to reset chat. Please try again.");
        }
    };

    return (
        <div
            style={{
                background: 'linear-gradient(135deg, #325672, #d9e3f0)',
                minHeight: '100vh',
                display: 'flex',
                flexDirection: 'column'
            }}
        >
            <Navbar title="Tech Mart IIIT" />

            <div className="flex flex-col flex-1 max-w-4xl mx-auto w-full">
                {/* Chat Container */}
                <div className="flex flex-col flex-1 bg-white/80 backdrop-blur-sm rounded-xl shadow-lg overflow-hidden my-8">
                    {/* Chat Header */}
                    <div className="bg-blue-600 text-white p-4 shadow-lg flex justify-between items-center">
                        <h2 className="text-lg font-bold">IIIT Buy-Sell Chatbot</h2>
                        <button
                            onClick={handleResetChat}
                            className="text-sm bg-red-500 px-3 py-1 rounded-full hover:bg-red-600 transition duration-300"
                        >
                            Reset Chat
                        </button>
                    </div>

                    {/* Chat Messages */}
                    <div
                        ref={chatContainerRef}
                        className="flex-1 overflow-y-auto p-4 space-y-4"
                        style={{
                            maxHeight: '60vh',
                            background: 'rgba(255,255,255,0.7)'
                        }}
                    >
                        {messages.length === 0 && (
                            <div className="text-center text-gray-500 mt-10">
                                Start a conversation with our AI assistant
                            </div>
                        )}

                        {messages.map((msg, index) => (
                            <div
                                key={index}
                                className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                            >
                                <div
                                    className={`p-3 rounded-lg max-w-xs shadow-md ${msg.sender === "user"
                                            ? "bg-blue-500 text-white"
                                            : "bg-gray-200 text-gray-800"
                                        }`}
                                >
                                    {msg.text}
                                </div>
                            </div>
                        ))}

                        {isLoading && (
                            <div className="flex justify-start">
                                <div className="p-3 rounded-lg max-w-xs shadow bg-gray-200 text-gray-800 animate-pulse">
                                    Typing...
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Input Box */}
                    <div className="p-4 bg-gray-100 shadow-inner">
                        <div className="flex items-center space-x-4 max-w-2xl mx-auto">
                            <input
                                type="text"
                                className="flex-1 p-3 rounded-lg shadow focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Type your message..."
                                value={inputMessage}
                                onChange={(e) => setInputMessage(e.target.value)}
                                onKeyPress={(e) => {
                                    if (e.key === "Enter") handleSendMessage();
                                }}
                            />
                            <button
                                onClick={handleSendMessage}
                                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition duration-300"
                            >
                                Send
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
"use client";
import { useState, useEffect } from "react";
import Groq from "groq-sdk";

export default function Home() {
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [theme, setTheme] = useState("light");

  const groq = new Groq({
    apiKey: "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",
    dangerouslyAllowBrowser: true,
  });

  useEffect(() => {
    initChat();
  }, []);

  const initChat = async () => {
    setIsLoading(true);
    try {
      const initialMessage = {
        role: "assistant",
        content:
          "Hello! I'm your chef AI. What ingredients do you have? I'll suggest a recipe based on them.",
      };

      setMessages([
        {
          role: "bot",
          text: initialMessage.content,
          timestamp: new Date(),
        },
      ]);
    } catch (error) {
      console.error("Chat initialization error:", error);
      setError(`Failed to initialize chat: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const getGroqChatCompletion = async (userMessage) => {
    return groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content:
            "You are a helpful chef AI that suggests recipes based on ingredients. When I provide ingredients, suggest a recipe using those ingredients. Keep your responses concise and focused on the recipe suggestion.",
        },
        ...messages.map((msg) => ({
          role: msg.role === "bot" ? "assistant" : "user",
          content: msg.text,
        })),
        { role: "user", content: userMessage },
      ],
      model: "llama3-8b-8192",
      temperature: 0.9,
      max_tokens: 1024,
    });
  };

  const handleSendMessage = async () => {
    if (isLoading || !userInput.trim()) {
      return;
    }

    setIsLoading(true);
    const userMessage = {
      role: "user",
      text: userInput,
      timestamp: new Date(),
    };

    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setUserInput("");

    try {
      const chatCompletion = await getGroqChatCompletion(userInput);
      const assistantMessage = {
        role: "bot",
        text:
          chatCompletion.choices[0]?.message?.content ||
          "Sorry, I couldn't generate a response.",
        timestamp: new Date(),
      };

      setMessages((prevMessages) => [...prevMessages, assistantMessage]);
    } catch (error) {
      console.error("Error sending message:", error);
      setError("Failed to send message. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle theme change
  const handleThemeChange = (e) => {
    setTheme(e.target.value);
  };

  // Get the theme colors based on the theme state
  const getThemeColors = () => {
    switch (theme) {
      case "light":
        return {
          primary: "bg-white",
          secondary: "bg-gray-100",
          accent: "bg-blue-500",
          text: "text-gray-800",
        };
      case "dark":
        return {
          primary: "bg-gray-900",
          secondary: "bg-gray-800",
          accent: "bg-yellow-500",
          text: "text-gray-100",
        };
      default:
        return {
          primary: "bg-white",
          secondary: "bg-gray-100",
          accent: "bg-blue-500",
          text: "text-gray-800",
        };
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const { primary, secondary, accent, text } = getThemeColors();

  return (
    <div className={`flex flex-col h-screen p-4 ${primary}`}>
      <div className="flex justify-between items-center mb-4">
        <h1 className={`text-2xl font-bold ${text}`}>Recipe Suggester AI</h1>
        <div className="flex space-x-2">
          <label htmlFor="theme" className={`text-sm ${text}`}>
            Theme:
          </label>
          <select
            id="theme"
            value={theme}
            onChange={handleThemeChange}
            className={`p-1 rounded-md border ${text}`}
          >
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </div>
      </div>

      {isLoading && (
        <div className={`text-center ${text} my-4`}>
          Initializing chef AI... Please wait.
        </div>
      )}

      <div className={`flex-1 overflow-y-auto ${secondary} rounded-md p-2`}>
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`mb-4 ${
              msg.role === "user" ? "text-right" : "text-left"
            }`}
            style={{ lineHeight: "1.6" }} // Added lineHeight style here
          >
            <span
              className={`p-2 rounded-lg ${
                msg.role === "user"
                  ? `${accent} text-white`
                  : `${primary} ${text}`
              }`}
            >
              {msg.text}
            </span>
            <p className={`text-xs ${text} mt-1`}>
              {msg.role === "bot" ? "Bot" : "You"} -{" "}
              {msg.timestamp.toLocaleTimeString()}
            </p>
          </div>
        ))}
      </div>
      {error && <div className="text-red-500 text-sm mb-4">{error}</div>}
      <div className="flex items-center mt-4">
        <input
          type="text"
          placeholder="Enter ingredients (e.g., chicken, rice, tomatoes)..."
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          onKeyDown={handleKeyPress}
          disabled={isLoading}
          className={`flex-1 p-2 rounded-l-md border-t border-b border-l
    focus:outline-none focus:border-${accent} ${isLoading ? "opacity-50" : ""}`}
          style={{ lineHeight: "1.6" }}
        />
        <button
          onClick={handleSendMessage}
          disabled={isLoading}
          className={`p-2 ${accent} text-white rounded-r-md hover:bg-opacity-80 
    focus:outline-none ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          Send
        </button>
      </div>
    </div>
  );
}

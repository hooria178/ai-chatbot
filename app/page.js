"use client";
import { useState, useEffect } from "react";
import { Groq } from "groq-sdk";
import Image from "next/image";

// Loading component
const LoadingScreen = () => (
  <div className="flex flex-col items-center justify-center h-screen bg-yellow">
    <Image
      src="/favicon.ico" // Replace with your icon's path
      alt="Loading Icon"
      width={100}
      height={100}
    />
    <p className="mt-4 text-gray-800 text-xl">
      Marcello - Chef AI is getting ready...
    </p>
  </div>
);

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
    // Simulate loading time
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
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
            "You are a helpful chef AI that suggests recipes based on ingredients. When I provide ingredients, suggest a recipe using those ingredients. Keep your responses concise and focused on the recipe suggestion. Format your response as follows:\n\n" +
            "1. Start with the recipe title enclosed in '**' on its own line.\n" +
            "2. Include separate subtitles for 'Serving:', 'Ingredients:', and 'Preparation Method:', each enclosed in '**' and on their own lines.\n" +
            "3. For both ingredients and preparation steps, use a dash (-) at the start of each line.\n" +
            "4. Ensure each ingredient and step is on its own line.\n" +
            "5. Keep all other text as regular paragraphs.\n\n" +
            "Example format:\n" +
            "**Recipe Title**\n\n" +
            "Brief description if needed.\n\n" +
            "**Serving:**\n" +
            "Number of servings\n\n" +
            "**Ingredients:**\n" +
            "- Ingredient 1\n" +
            "- Ingredient 2\n" +
            "- Ingredient 3\n\n" +
            "**Preparation Method:**\n" +
            "- Step 1\n" +
            "- Step 2\n" +
            "- Step 3\n\n" +
            "Any additional notes or tips.",
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

    // setIsLoading(true);
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

  //Format the bot's response
  const FormattedMessage = ({ text }) => {
    const lines = text.split("\n");
    let inList = false;
    let listType = null;
    let listItems = [];

    const renderList = () => {
      if (listType === "ol") {
        return <ol className="list-decimal pl-8 mb-2">{listItems}</ol>;
      } else if (listType === "ul") {
        return <ul className="list-disc pl-8 mb-2">{listItems}</ul>;
      }
      return null;
    };

    const result = lines.reduce((acc, line, index) => {
      if (line.startsWith("**") && line.endsWith("**")) {
        // Subtitle
        if (inList) {
          acc.push(renderList());
          inList = false;
          listType = null;
          listItems = [];
        }
        acc.push(
          <h3 key={`subtitle-${index}`} className="font-bold mt-4 mb-2">
            {line.slice(2, -2)}
          </h3>
        );
      } else if (line.trim().startsWith("-")) {
        // List item
        const itemText = line.trim().slice(1).trim();
        if (!inList) {
          if (listItems.length > 0) {
            acc.push(renderList());
            listItems = [];
          }
          inList = true;
          // Determine list type based on the context
          listType = line.toLowerCase().includes("ingredients") ? "ul" : "ol";
        }
        listItems.push(<li key={`list-item-${index}`}>{itemText}</li>);
      } else {
        // Regular text
        if (inList) {
          acc.push(renderList());
          inList = false;
          listType = null;
          listItems = [];
        }
        if (line.trim()) {
          acc.push(
            <p key={`text-${index}`} className="mb-2">
              {line.trim()}
            </p>
          );
        }
      }
      return acc;
    }, []);

    if (listItems.length > 0) {
      result.push(renderList());
    }

    return <div className="pl-4">{result}</div>;
  };

  //Colors
  const citrusColors = {
    orange: "bg-orange",
    lemonYellow: "bg-lemon-yellow",
    limeGreen: "bg-lime-green",
    grapefruitPink: "bg-grapefruit-pink",
    tangerine: "bg-tangerine",
    softMint: "bg-soft-mint",
    citrusGreen: "bg-citrus-green",
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
          primary: "bg-yellow",
          secondary: "bg-gray-100",
          accent: citrusColors.citrusGreen,
          text: "text-gray-800",
        };
      case "dark":
        return {
          primary: "bg-gray-900",
          secondary: "bg-gray-800",
          accent: citrusColors.grapefruitPink,
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

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className={`flex flex-col h-screen p-4 ${primary}`}>
      <div className="flex justify-between items-center mb-4">
        <img src="/favicon.ico" alt="Favicon" className="h-8 w-8 mr-2" />
        <h1 className={`text-2xl font-bold ${text}`}>Marcello - Chef AI</h1>
        <div className="flex space-x-2">
          <label htmlFor="theme" className={`text-sm ${text}`}>
            Theme:
          </label>
          <select
            id="theme"
            value={theme}
            onChange={handleThemeChange}
            className={`p-1 rounded-md border ${text}`}
            style={{
              color: theme === "light" ? "#1a202c" : "#1a202c", // dark gray for light theme, white for dark theme
            }}
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
          >
            <div
              className={`p-2 rounded-lg ${
                msg.role === "user"
                  ? `${accent} text-white`
                  : `${primary} ${text}`
              }`}
            >
              {msg.role === "user" ? (
                msg.text
              ) : (
                <FormattedMessage text={msg.text} />
              )}
            </div>
            <p className={`text-xs ${text} mt-1`}>
              {msg.role === "bot" ? "Marcello" : "You"} -{" "}
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
          className={`p-2 ${
            citrusColors.tangerine
          } text-white rounded-r-md hover:bg-opacity-80 
    focus:outline-none ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          Send
        </button>
      </div>
    </div>
  );
}

import React, { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import axios from "axios";
import TypingAnimation from "@/components/ui/loading-typing-lottie";

interface ChatMessage {
  role: "user" | "agent" | "loading";
  content: string;
}

interface FormData {
  message: string;
}

interface ChatBoxProps {
  setChatData: (text: string) => void;
  agent: any;
}

const Sidebar: React.FC = () => {
  return (
    <div className="flex h-screen w-64 flex-col space-y-4 bg-gray-900 p-4 text-white">
      <div className="flex items-center space-x-1">
        <p className="text-sm">Powered by</p>
        <h6 className="text-xl font-bold">AgentAPI</h6>
      </div>

      <nav className="flex-1">
        <ul className="space-y-2">
          <li className="cursor-pointer rounded border p-2 hover:bg-gray-700">
            Learn more
          </li>
        </ul>
        <ul className="mt-2 space-y-2">
          <li
            className="cursor-pointer rounded border p-2 hover:bg-gray-700"
            style={{ height: "auto" }}
          >
            <p>Description</p>
            <p>s safsaf asf asf asf sa fas fa </p>
            <p>s</p>
          </li>
        </ul>
      </nav>

      <div className="text-sm text-gray-400">
        <p>Version 1.0.0</p>
      </div>
    </div>
  );
};

const ChatBox: React.FC<ChatBoxProps> = ({ setChatData, agent }) => {
  const { register, handleSubmit, reset } = useForm<FormData>();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const onSubmit = async (data: FormData) => {
    const userMessage: ChatMessage = { role: "user", content: data.message };

    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setLoading(true);
    reset();

    const loadingMessage: ChatMessage = {
      role: "loading",
      content: "Loading...",
    };
    setMessages((prevMessages) => [...prevMessages, loadingMessage]);

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BASE_URL}/v2/chat/`,
        {
          user_id: "default_user",
          agent_id: agent.id,
          session_id: "test",
          message: data.message,
        },
        {
          headers: {
            "Content-Type": "application/json",
            "x-api-key": "lyzr-etowt023i5234o235i23dfgdfgdfhdfh",
          },
        },
      );

      const agentMessage: ChatMessage = {
        role: "agent",
        content: "",
      };

      setMessages((prevMessages) => [
        ...prevMessages.slice(0, -1),
        agentMessage,
      ]);

      let index = 0;
      const streamInterval = setInterval(() => {
        if (index < response.data.response.length) {
          setMessages((prevMessages) => {
            const lastMessage = prevMessages[prevMessages.length - 1];
            lastMessage.content = response.data.response.slice(0, index + 1);
            return [...prevMessages.slice(0, -1), lastMessage];
          });
          index++;
        } else {
          clearInterval(streamInterval);
          setLoading(false);
        }
      }, 10);
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages((prevMessages) => prevMessages.slice(0, -1));
      setLoading(false);
    }
  };

  const onChangeEvent = (event: React.ChangeEvent<HTMLInputElement>) => {
    setChatData(event.target.value);
  };

  return (
    <div className="flex h-full w-full flex-1 flex-col bg-gray-800 p-4 text-white">
      <div
        ref={chatContainerRef}
        className="w-full flex-1 overflow-y-auto rounded-lg bg-gray-700 p-4"
      >
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`mb-4 ${msg.role === "user" ? "text-right" : "text-left"}`}
          >
            {msg.role === "agent" && (
              <p className="ml-1 text-xs text-gray-400">{agent.name}</p>
            )}
            <div
              className={`inline-block max-w-xs break-words rounded-lg px-4 py-2 ${
                msg.role === "user"
                  ? "self-end bg-blue-600 text-white"
                  : msg.role === "loading"
                    ? "bg-transparent text-gray-400"
                    : "bg-gray-600 text-white"
              }`}
            >
              {msg.role === "loading" ? <TypingAnimation /> : msg.content}
            </div>
          </div>
        ))}
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="mt-4 flex space-x-2">
        <input
          placeholder="Type your message..."
          {...register("message", { required: true })}
          className="flex-1 rounded-lg border-gray-500 bg-gray-600 p-2 text-white"
          onChange={onChangeEvent}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(onSubmit)();
            }
          }}
        />
        <button
          type="submit"
          className="rounded-lg bg-blue-600 px-4 py-2 text-white"
        >
          Send
        </button>
      </form>
    </div>
  );
};

const App: React.FC = () => {
  const [_, setChatData] = useState<string>("");
  const agent = { id: "agent_123", name: "AgentGPT" };

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between bg-gray-900 p-4 text-white">
          <h2 className="text-xl font-semibold">Chat with Agent</h2>
        </header>
        <ChatBox setChatData={setChatData} agent={agent} />
      </div>
    </div>
  );
};

export default App;

// Add CSS for the typing dots animation
const styles = `
.typing-dots {
    display: inline-block;
}

.typing-dots span {
    animation: typing 1s infinite;
    font-size: 1.5em;
}

.typing-dots span:nth-child(1) {
    animation-delay: 0s;
}

.typing-dots span:nth-child(2) {
    animation-delay: 0.02s;
}

.typing-dots span:nth-child(3) {
    animation-delay: 0.2s;
}

@keyframes typing {
    0%, 80%, 100% {
        opacity: 0;
    }
    40% {
        opacity: 1;
    }
}
`;

const styleSheet = document.createElement("style");
styleSheet.type = "text/css";
styleSheet.innerText = styles;
document.head.appendChild(styleSheet);

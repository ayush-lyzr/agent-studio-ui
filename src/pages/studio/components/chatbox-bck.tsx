import { useState } from "react";
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/custom/button";

interface ChatMessage {
  role: "user" | "agent";
  content: string;
}

function ChatBox({ setChatData }: { setChatData: CallableFunction }) {
  const { register, handleSubmit, reset } = useForm<{ message: string }>();
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const onSubmit = (data: { message: string }) => {
    const userMessage: ChatMessage = { role: "user", content: data.message };

    setMessages([...messages, userMessage]);
    reset();

    // Simulate agent response
    setTimeout(() => {
      const agentMessage: ChatMessage = {
        role: "agent",
        content: "This is a simulated response from the agent.",
      };
      setMessages((prevMessages) => [...prevMessages, agentMessage]);
    }, 1000);
  };

  const onChangeEvent = (text: any) => {
    setChatData(text);
  };

  return (
    <div className="w-full">
      <div className="space-y-4">
        <div className="h-64 overflow-y-auto border p-2">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`p-2 ${msg.role === "user" ? "text-right" : "text-left"}`}
            >
              {msg.role === "user" ? (
                <></>
              ) : (
                <p className="ml-1 text-sm">Agent</p>
              )}
              <span
                className={`inline-block rounded px-4 py-2 ${msg.role === "user" ? "border text-black" : "bg-muted text-black"}`}
              >
                {msg.content}
              </span>
            </div>
          ))}
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="flex space-x-2">
          <Input
            placeholder="Type your message..."
            {...register("message", { required: true })}
            className="flex-1"
            onChange={(data) => {
              onChangeEvent(data.target.value);
            }}
          />
          <Button type="submit"> Send </Button>
        </form>
      </div>
    </div>
  );
}

export default ChatBox;

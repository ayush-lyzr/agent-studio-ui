import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowUp, Loader2, X, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import axios from 'axios';
import { toast } from 'sonner';
import useStore from '@/lib/store';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface OGIChatBoxProps {
  agentId?: string;
  sessionId?: string;
}

const baseUrl = import.meta.env.VITE_BASE_URL || 'http://localhost:8001';

export function OGIChatBox({ agentId, sessionId }: OGIChatBoxProps) {
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);

  const { current_user } = useStore((state) => state);
  const userEmail = current_user?.auth?.email || 'user@example.com';

  const handleNewChat = () => {
    setMessages([]);
    setInputValue('');
    toast.success('New chat started');
  };

  const handleCloseChat = () => {
    setMessages([]);
    setInputValue('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userMessage = inputValue.trim();
    setInputValue('');

    // Add user message to chat
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);

    setIsLoading(true);

    try {
      const response = await axios.post(
        `${baseUrl}/v3/inference/chat/`,
        {
          user_id: userEmail,
          agent_id: agentId || '68ed6dfc42ce9cf0b18e821f',
          session_id: sessionId || `${agentId || '68ed6dfc42ce9cf0b18e821f'}-${Date.now()}`,
          message: userMessage,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': 'sk-default-RR9XKMJpwNn1BsgMRh4pnXJGvqfurpny',
          },
        }
      );

      // Add assistant response to chat
      if (response.data) {
        const assistantMessage = response.data.response || response.data.message || 'No response';
        setMessages((prev) => [...prev, { role: 'assistant', content: assistantMessage }]);
      }
    } catch (error) {
      console.error('Chat error:', error);
      toast.error('Failed to get response from agent');
      // Remove the user message if request failed
      setMessages((prev) => prev.slice(0, -1));
      // Restore the input value
      setInputValue(userMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="w-[650px] flex flex-col gap-3"
    >
      {/* Chat Messages */}
      <AnimatePresence>
        {messages.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className={cn(
              'max-h-[calc(100vh-250px)] overflow-y-auto',
              'bg-white/10 dark:bg-gray-900/10 backdrop-blur-3xl',
              'border border-white/10 dark:border-gray-600/10',
              'rounded-2xl shadow-2xl p-4 space-y-3'
            )}
            style={{
              backdropFilter: 'blur(60px) saturate(200%)',
              WebkitBackdropFilter: 'blur(60px) saturate(200%)',
            }}
          >
            {/* Chat Header with Controls */}
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/10 dark:border-gray-600/10">
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                Chat History
              </span>
              <div className="flex items-center gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={handleNewChat}
                  className="h-6 w-6 hover:bg-white/20 dark:hover:bg-gray-800/20"
                  title="New Chat"
                >
                  <RefreshCw className="h-3 w-3 text-gray-600 dark:text-gray-400" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={handleCloseChat}
                  className="h-6 w-6 hover:bg-white/20 dark:hover:bg-gray-800/20"
                  title="Close Chat"
                >
                  <X className="h-3 w-3 text-gray-600 dark:text-gray-400" />
                </Button>
              </div>
            </div>

            {messages.map((msg, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: msg.role === 'user' ? 20 : -20 }}
                animate={{ opacity: 1, x: 0 }}
                className={cn(
                  'flex',
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                <div
                  className={cn(
                    'max-w-[80%] px-4 py-2 rounded-lg',
                    msg.role === 'user'
                      ? 'bg-gray-700 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                  )}
                >
                  {msg.role === 'user' ? (
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  ) : (
                    <div className="text-sm prose prose-sm dark:prose-invert max-w-none">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          code({ className, children, ...props }) {
                            const match = /language-(\w+)/.exec(className || '');
                            const isInline = !match;
                            return !isInline && match ? (
                              <SyntaxHighlighter
                                style={oneDark as any}
                                language={match[1]}
                                PreTag="div"
                                className="rounded-md text-xs"
                              >
                                {String(children).replace(/\n$/, '')}
                              </SyntaxHighlighter>
                            ) : (
                              <code className={cn(
                                'px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-700',
                                'text-xs font-mono',
                                className
                              )} {...props}>
                                {children}
                              </code>
                            );
                          },
                          p({ children }) {
                            return <p className="mb-2 last:mb-0">{children}</p>;
                          },
                          ul({ children }) {
                            return <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>;
                          },
                          ol({ children }) {
                            return <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>;
                          },
                          li({ children }) {
                            return <li className="text-sm">{children}</li>;
                          },
                          h1({ children }) {
                            return <h1 className="text-base font-bold mb-2">{children}</h1>;
                          },
                          h2({ children }) {
                            return <h2 className="text-sm font-bold mb-2">{children}</h2>;
                          },
                          h3({ children }) {
                            return <h3 className="text-sm font-semibold mb-1">{children}</h3>;
                          },
                          blockquote({ children }) {
                            return (
                              <blockquote className="border-l-4 border-gray-300 dark:border-gray-600 pl-3 italic my-2">
                                {children}
                              </blockquote>
                            );
                          },
                          a({ children, href }) {
                            return (
                              <a
                                href={href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 dark:text-blue-400 hover:underline"
                              >
                                {children}
                              </a>
                            );
                          },
                          table({ children }) {
                            return (
                              <div className="overflow-x-auto my-2">
                                <table className="min-w-full border border-gray-300 dark:border-gray-600">
                                  {children}
                                </table>
                              </div>
                            );
                          },
                          th({ children }) {
                            return (
                              <th className="border border-gray-300 dark:border-gray-600 px-2 py-1 bg-gray-100 dark:bg-gray-700 text-xs font-semibold">
                                {children}
                              </th>
                            );
                          },
                          td({ children }) {
                            return (
                              <td className="border border-gray-300 dark:border-gray-600 px-2 py-1 text-xs">
                                {children}
                              </td>
                            );
                          },
                        }}
                      >
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}

            {/* Loading indicator */}
            {isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-start"
              >
                <div className="bg-gray-100 dark:bg-gray-800 px-4 py-2 rounded-lg">
                  <Loader2 className="h-4 w-4 animate-spin text-gray-600 dark:text-gray-400" />
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input Form */}
      <form onSubmit={handleSubmit}>
        <div className={cn(
          'flex items-center gap-2 px-5 py-2.5',
          'bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl',
          'border border-gray-300/60 dark:border-gray-600/60',
          'rounded-lg shadow-lg',
          'transition-all duration-200',
          'hover:border-gray-400/80 dark:hover:border-gray-500/80'
        )}>
          {/* Input Field */}
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask anything"
            disabled={isLoading}
            className={cn(
              'flex-1 border-0 bg-transparent h-9',
              'focus-visible:ring-0 focus-visible:ring-offset-0',
              'text-sm placeholder:text-gray-400 dark:placeholder:text-gray-500',
              'disabled:opacity-50'
            )}
          />

          {/* Submit Button */}
          <Button
            type="submit"
            size="icon"
            disabled={!inputValue.trim() || isLoading}
            className={cn(
              'h-8 w-8 rounded-md flex items-center justify-center p-0',
              'bg-gray-900 dark:bg-gray-100 hover:bg-gray-800 dark:hover:bg-gray-200',
              'disabled:opacity-30 disabled:cursor-not-allowed',
              'transition-all'
            )}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 text-white dark:text-gray-900 shrink-0 animate-spin" />
            ) : (
              <ArrowUp className="h-4 w-4 text-white dark:text-gray-900 shrink-0" />
            )}
          </Button>
        </div>
      </form>
    </motion.div>
  );
}

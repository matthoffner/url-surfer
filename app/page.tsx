"use client";

import styles from './page.module.css';
import { useState } from 'react';
import { useChat } from 'ai/react';
import { FunctionCallHandler, Message, nanoid } from 'ai';
import ReactMarkdown from "react-markdown";
import { Bot, User } from "lucide-react";
import { toast } from 'sonner';
import { FunctionIcon } from './icons';

const Page: React.FC = () => {
  const functionCallHandler: FunctionCallHandler = async (
    chatMessages,
    functionCall,
  ) => {
    let result;
    const response = await fetch("/api/surfer", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: input
      })
    } as any);

    if (!response.ok) {
      const errorText = await response.text();
      toast.error(`Something went wrong: ${errorText}`);
      return;
    }    

    result = await response.text();

    return {
      messages: [
        ...chatMessages,
        {
          id: nanoid(),
          name: functionCall.name,
          role: "function" as const,
          content: result,
        },
      ],
    };
  };
  const { messages, input, setInput, handleSubmit, isLoading } = useChat({
    experimental_onFunctionCall: functionCallHandler,
    onResponse: (response: { status: number; }) => {
      if (response.status === 429) {
        toast.error("You have reached your request limit for the day.");
        return;
      } else {
        console.log("chat initialized");
      }
    },
    onError: (error: any) => {
      console.log(error);
    },
  });
  const [isExpanded, setIsExpanded] = useState(false);
  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const roleUIConfig: {
    [key: string]: {
      avatar: JSX.Element;
      bgColor: string;
      avatarColor: string;
      // eslint-disable-next-line no-unused-vars
      dialogComponent: (message: Message) => JSX.Element;
    };
  } = {
    user: {
      avatar: <User width={20} />,
      bgColor: "bg-white",
      avatarColor: "bg-black",
      dialogComponent: (message: Message) => (
        <ReactMarkdown
          className=""
          components={{
            a: (props) => (
              <a {...props} target="_blank" rel="noopener noreferrer" />
            ),
          }}
        >
          {message.content}
        </ReactMarkdown>
      ),
    },
    assistant: {
      avatar: <Bot width={20} />,
      bgColor: "bg-gray-100",
      avatarColor: "bg-green-500",
      dialogComponent: (message: Message) => (
        <ReactMarkdown
          className=""
          components={{
            a: (props) => (
              <a {...props} target="_blank" rel="noopener noreferrer" />
            ),
          }}
        >
          {message.content}
        </ReactMarkdown>
      ),
    },
    function: {
      avatar: <div className="cursor-pointer" onClick={toggleExpand}><FunctionIcon /></div>,
      bgColor: "bg-gray-200",
      avatarColor: "bg-blue-500",
      dialogComponent: (message: Message) => {
        return (
          <div className="flex flex-col">
            {isExpanded && (
              <div className="py-1">{message.content}</div>
            )}
          </div>
        );
      },
    }    
  };


  return (
    <main className={styles.main}>
      <h1 className={styles.title}>
        🔗 URL Surfer 🏄‍♂️
      </h1>
      <div className={styles.messages}>
        {messages.length > 0 ? (
          messages.map((message, i) => {
            const messageClass = `message ${message.role === 'user' ? 'message-user' : ''}`;
            return (
              <div key={i} className={messageClass}>
                <div className="flex w-full max-w-screen-md items-start space-x-4 px-5 sm:px-0">
                  <div className="avatar">
                    {roleUIConfig[message.role].avatar}
                  </div>
                  {message.content === "" && message.function_call != undefined ? (
                    typeof message.function_call === "object" ? (
                      <div className="flex flex-col">
                        <div>
                          Using{" "}
                          <span className="font-bold">
                            {message.function_call.name}
                          </span>{" "}
                          ...
                        </div>
                        <div className="">
                          {message.function_call.arguments}
                        </div>
                      </div>
                    ) : (
                      <div className="function-call">{message.function_call}</div>
                    )
                  ) : (
                    roleUIConfig[message.role].dialogComponent(message)
                  )}
                </div>
              </div>
            );
        })) : null}
      </div>
      <form onSubmit={handleSubmit} className={styles.form}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Enter URL and Prompt"
          className={styles.input}
        />
        <button type="submit" className={styles.button} disabled={isLoading}>
          {isLoading ? 'Loading...' : 'Submit'}
        </button>
      </form>
    </main>
  );
};

export default Page;

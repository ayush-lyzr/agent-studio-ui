import React from "react";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";

interface ContentRendererProps {
  content: string;
  loading: boolean;
}

const ContentRenderer: React.FC<ContentRendererProps> = ({
  content,
  loading,
}) => {
  content = content.replace("<EXECUTION_COMPLETE>", "");
  content = content.replace("THOUGHT", " __Thought__ ");
  content = content.replace("OBSERVATION", "__Observation__ ");
  content = content.replace("NEXT_ACTION", "__Next Action__ ");
  if (loading) {
    return <p>Loading...</p>;
  }

  try {
    return (
      <ReactMarkdown
        rehypePlugins={[rehypeRaw]} // Allows raw HTML and sanitizes it
        components={{
          code({ node, className, children, ...props }) {
            return (
              // @ts-ignore
              <pre
                {...(props as React.HTMLAttributes<HTMLPreElement>)}
                className={className}
                style={{
                  whiteSpace: "nowrap",
                  maxWidth: "100%",
                  display: "block",
                  margin: 0,
                  padding: "0.5rem", // Optional: Add padding for better aesthetics
                }}
                {...props}
              >
                <code
                  dangerouslySetInnerHTML={{
                    __html:
                      typeof children === "string"
                        ? children
                        : React.Children.toArray(children).join(""),
                  }}
                  style={{
                    display: "inline-block",
                    whiteSpace: "nowrap",
                    padding: 0,
                    margin: 0,
                  }}
                ></code>
              </pre>
            );
          },
          html({ value }: any) {
            return (
              <div
                dangerouslySetInnerHTML={{ __html: value }} // Safely render sanitized HTML
              />
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    );
  } catch (error) {
    console.error("Error rendering content:", error);
    return (
      <p className="text-red-500">
        Failed to render content. Please try again later.
      </p>
    );
  }
};

export default ContentRenderer;

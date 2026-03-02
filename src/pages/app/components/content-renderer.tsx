import MarkdownRenderer from "@/components/custom/markdown";
import React from "react";
// import ReactMarkdown from "react-markdown";

interface Props {
  content: string;
  loading: boolean;
}

const ContentRenderer: React.FC<Props> = ({ content, loading }) => {
  // Function to split the content into Markdown and HTML parts
  const parseContent = (
    content: string,
  ): {
    markdownBeforeHtml: string;
    html: string;
    markdownAfterHtml: string;
  } => {
    const markdownStart = content.indexOf("### Steps Taken:");
    const htmlStart = content.indexOf("<!DOCTYPE html>");
    const htmlEnd = content.indexOf("</html>") + 7; // To include the closing </html> tag

    let markdownBeforeHtml = "";
    let html = "";
    let markdownAfterHtml = "";

    if (markdownStart !== -1 && htmlStart !== -1) {
      markdownBeforeHtml = content.slice(0, htmlStart).trim();
      html = content.slice(htmlStart, htmlEnd).trim();
      markdownAfterHtml = content.slice(htmlEnd).trim();
    } else if (markdownStart !== -1) {
      markdownBeforeHtml = content.trim();
    } else if (htmlStart !== -1) {
      html = content.trim();
    }

    return { markdownBeforeHtml, html, markdownAfterHtml };
  };

  const { markdownBeforeHtml, html, markdownAfterHtml } = parseContent(content);

  return (
    <div className="prose h-full max-w-none overflow-auto rounded bg-white p-4 text-base leading-relaxed shadow">
      {markdownBeforeHtml && (
        <div className="relative">
          {/* <ReactMarkdown className="markdown relative z-10">
            {markdownBeforeHtml}
          </ReactMarkdown> */}
          <MarkdownRenderer content={markdownBeforeHtml} />
        </div>
      )}
      {loading && <div className="mt-4 text-gray-500">Loading...</div>}
      {html && (
        <div className="mt-10" dangerouslySetInnerHTML={{ __html: html }} />
      )}
      {markdownAfterHtml && (
        <div className="relative mt-10">
          {/* <ReactMarkdown className="markdown relative z-10">
            {markdownAfterHtml}
          </ReactMarkdown> */}
          <MarkdownRenderer content={markdownAfterHtml} />
        </div>
      )}
    </div>
  );
};

export default ContentRenderer;

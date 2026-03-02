import React, { useRef, useEffect, useState } from "react";
import { Button } from "../ui/button";
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Link2,
  Code,
  Heading1,
  Heading2,
  Quote,
  Undo,
  Redo,
} from "lucide-react";
import { cn } from "@/lib/utils";
import styles from "./RichTextEditor.module.css";

interface RichTextEditorProps {
  value: string;
  onChange: (markdown: string) => void;
  placeholder?: string;
  className?: string;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = "Start typing...",
  className,
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [selection, setSelection] = useState<Range | null>(null);
  const [history, setHistory] = useState<string[]>([value]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Convert HTML to Markdown
  const htmlToMarkdown = (html: string): string => {
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = html;

    let markdown = "";

    const processNode = (node: Node): string => {
      if (node.nodeType === Node.TEXT_NODE) {
        return node.textContent || "";
      }

      if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node as HTMLElement;
        const tagName = element.tagName.toLowerCase();
        let content = "";

        // Process child nodes
        for (const child of Array.from(element.childNodes)) {
          content += processNode(child);
        }

        // Convert based on tag
        switch (tagName) {
          case "h1":
            return `# ${content}\n\n`;
          case "h2":
            return `## ${content}\n\n`;
          case "h3":
            return `### ${content}\n\n`;
          case "p":
            return content ? `${content}\n\n` : "";
          case "strong":
          case "b":
            return `**${content}**`;
          case "em":
          case "i":
            return `*${content}*`;
          case "code":
            return `\`${content}\``;
          case "pre":
            return `\`\`\`\n${content}\n\`\`\`\n\n`;
          case "ul":
            return content + "\n";
          case "ol":
            return content + "\n";
          case "li":
            const parent = element.parentElement;
            if (parent?.tagName.toLowerCase() === "ul") {
              return `- ${content}\n`;
            } else if (parent?.tagName.toLowerCase() === "ol") {
              const index = Array.from(parent.children).indexOf(element) + 1;
              return `${index}. ${content}\n`;
            }
            return content;
          case "blockquote":
            return (
              content
                .split("\n")
                .map((line) => (line ? `> ${line}` : ">"))
                .join("\n") + "\n\n"
            );
          case "a":
            const href = element.getAttribute("href") || "#";
            return `[${content}](${href})`;
          case "br":
            return "\n";
          case "div":
            return content + (content.endsWith("\n") ? "" : "\n");
          default:
            return content;
        }
      }

      return "";
    };

    for (const child of Array.from(tempDiv.childNodes)) {
      markdown += processNode(child);
    }

    // Clean up extra newlines
    return markdown.replace(/\n{3,}/g, "\n\n").trim();
  };

  // Convert Markdown to HTML for display
  const markdownToHtml = (markdown: string): string => {
    let html = markdown;

    // Headers
    html = html.replace(/^### (.*?)$/gm, "<h3>$1</h3>");
    html = html.replace(/^## (.*?)$/gm, "<h2>$1</h2>");
    html = html.replace(/^# (.*?)$/gm, "<h1>$1</h1>");

    // Bold
    html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");

    // Italic
    html = html.replace(/\*(.*?)\*/g, "<em>$1</em>");

    // Code blocks
    html = html.replace(/```([\s\S]*?)```/g, "<pre><code>$1</code></pre>");

    // Inline code
    html = html.replace(/`(.*?)`/g, "<code>$1</code>");

    // Lists
    // Unordered lists
    html = html.replace(/^- (.*?)$/gm, '<li class="unordered">$1</li>');

    // Ordered lists
    html = html.replace(/^\d+\.\s(.*?)$/gm, '<li class="ordered">$1</li>');

    html = html.replace(
      /(<li class="unordered">.*?<\/li>\n?)+/g,
      (match) => `<ul>${match.replace(/ class="unordered"/g, "")}</ul>`,
    );
    html = html.replace(
      /(<li class="ordered">.*?<\/li>\n?)+/g,
      (match) => `<ol>${match.replace(/ class="ordered"/g, "")}</ol>`,
    );

    // html = html.replace(/^- (.*?)$/gm, '<li>$1</li>');
    // html = html.replace(/(<li>.*?<\/li>\n?)+/g, '<ul>$&</ul>');
    // html = html.replace(/^\d+\. (.*?)$/gm, '<li>$1</li>');

    // Blockquotes
    html = html.replace(/^> (.*?)$/gm, "<blockquote>$1</blockquote>");

    // Links
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

    // Paragraphs
    html = html
      .split("\n\n")
      .map((para) => {
        if (!para.match(/^<[^>]+>/)) {
          return `<p>${para}</p>`;
        }
        return para;
      })
      .join("");

    return html;
  };

  // Initialize editor with markdown content
  useEffect(() => {
    if (
      editorRef.current &&
      value !== htmlToMarkdown(editorRef.current.innerHTML)
    ) {
      editorRef.current.innerHTML = markdownToHtml(value);
    }
  }, [value]);

  // Save selection before blur
  const saveSelection = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      setSelection(sel.getRangeAt(0));
    }
  };

  // Restore selection
  const restoreSelection = () => {
    if (selection) {
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(selection);
    }
  };

  // Execute formatting command
  const executeCommand = (command: string, value?: string) => {
    restoreSelection();
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    handleInput();
  };

  // Handle input changes
  const handleInput = () => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      const markdown = htmlToMarkdown(html);
      onChange(markdown);

      // Update history
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(markdown);
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
    }
  };

  // Handle undo
  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      onChange(history[newIndex]);
    }
  };

  // Handle redo
  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      onChange(history[newIndex]);
    }
  };

  // Insert link
  const insertLink = () => {
    const url = prompt("Enter URL:");
    if (url) {
      executeCommand("createLink", url);
    }
  };

  // Format as heading
  const formatHeading = (level: number) => {
    restoreSelection();
    const tag = `h${level}`;
    document.execCommand("formatBlock", false, tag);
    editorRef.current?.focus();
    handleInput();
  };

  return (
    <div className={cn("overflow-hidden rounded-lg border", className)}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 border-b bg-muted/50 p-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => formatHeading(1)}
          className="h-8 w-8 p-0"
          title="Heading 1"
        >
          <Heading1 className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => formatHeading(2)}
          className="h-8 w-8 p-0"
          title="Heading 2"
        >
          <Heading2 className="h-4 w-4" />
        </Button>
        <div className="mx-1 h-6 w-px bg-border" />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => executeCommand("bold")}
          className="h-8 w-8 p-0"
          title="Bold"
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => executeCommand("italic")}
          className="h-8 w-8 p-0"
          title="Italic"
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => executeCommand("formatBlock", "pre")}
          className="h-8 w-8 p-0"
          title="Code Block"
        >
          <Code className="h-4 w-4" />
        </Button>
        <div className="mx-1 h-6 w-px bg-border" />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => executeCommand("insertUnorderedList")}
          className="h-8 w-8 p-0"
          title="Bullet List"
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => executeCommand("insertOrderedList")}
          className="h-8 w-8 p-0"
          title="Numbered List"
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => executeCommand("formatBlock", "blockquote")}
          className="h-8 w-8 p-0"
          title="Quote"
        >
          <Quote className="h-4 w-4" />
        </Button>
        <div className="mx-1 h-6 w-px bg-border" />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={insertLink}
          className="h-8 w-8 p-0"
          title="Insert Link"
        >
          <Link2 className="h-4 w-4" />
        </Button>
        <div className="mx-1 h-6 w-px bg-border" />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleUndo}
          disabled={historyIndex === 0}
          className="h-8 w-8 p-0"
          title="Undo"
        >
          <Undo className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleRedo}
          disabled={historyIndex === history.length - 1}
          className="h-8 w-8 p-0"
          title="Redo"
        >
          <Redo className="h-4 w-4" />
        </Button>
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        className={cn("min-h-[400px] p-4 focus:outline-none", styles.editor)}
        onInput={handleInput}
        onMouseUp={saveSelection}
        onKeyUp={saveSelection}
        onBlur={saveSelection}
        data-placeholder={placeholder}
        style={{
          minHeight: "400px",
        }}
      />
    </div>
  );
};

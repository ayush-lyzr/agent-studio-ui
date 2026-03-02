import MarkdownRenderer from "..";

export const MarkdownSample: React.FC = () => {
  const sampleMarkdown = `# Advanced Markdown Renderer

This is a **bold** statement and this is *italic* text.

## Code Examples

Here's some JavaScript code:

\`\`\`bash
  curl -X POST 'https://agent.maia.prophet.com/v3/inference/chat/' \

    -H 'Content-Type: application/json' \

    -H 'x-api-key: sk-default-RR9XKMJpwNn1BsgMRh4pnXJGvqfurpny' \

    -d '{
      "user_id": "joel+freeplan1@lyzr.ai",
      "agent_id": "682f8d7932bcc6cf98a456dc",
      "session_id": "682f8d7932bcc6cf98a456dc-mzgxt2633mi",
      "message": ""
    }'
\`\`\`

## Table Examples

### Basic Table
| Name | Age | Role |
|------|-----|------|
| John | 25 | Developer |
| Jane | 30 | Designer |
| Bob | 28 | Manager |

### Table Without Header
| Alice | Engineer | 5 years |
| Carol | Designer | 3 years |
| Dave | Developer | 4 years |

### Table with Inline Formatting
| Feature | Description | Status |
|---------|-------------|--------|
| **Bold** | *Italic* text | \u2705 |
| \`\`\`Code\`\`\` | Inline code | 🔄 |
| [Link](https://example.com) | External link | ⭐ |

## Bullet Points

* First bullet point with **bold** text
* Second bullet point with *italic* text
* Third bullet point with \`code\` inline

## Math Examples


Block math: $$\\sum_{i=1}^{n} i = \\frac{n(n+1)}{2}$$

## Links and Downloads

- [External Link](https://example.com)
- [Download PDF](sample.pdf)
- [Internal Link](#code-examples)

## Emojis

Hey there! :wave: This is :fire: and I :heart: this component! :rocket:

## Mermaid Diagram

\`\`\`mermaid
graph TD
  Start --> Login
  Login -->|Success| Dashboard
  Login -->|Failure| Error
  Dashboard --> Logout
  Error --> Retry
  Retry --> Login
\`\`\`

## Inline Elements

This has \`inline code\` and **bold** and *italic* text mixed together.
`;

  return (
    <div className="mx-auto max-w-4xl p-6">
      <h1 className="mb-6 text-center text-3xl font-bold">
        Markdown Renderer Demo
      </h1>

      <MarkdownRenderer
        content={sampleMarkdown}
        className="rounded-lg bg-background p-6 shadow-lg"
      />
    </div>
  );
};

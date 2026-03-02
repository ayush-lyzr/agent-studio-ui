import { Download, ExternalLink } from "lucide-react";

export const LinkRenderer: React.FC<{
  linkTarget: string;
  href: string;
  children: React.ReactNode;
}> = ({ children, linkTarget, href }) => {
  const isDownload = href.match(/\.(pdf|doc|docx|zip|rar|tar|gz)$/i);
  const isExternal = href.startsWith("http") || href.startsWith("https");
  const isInternal = href.startsWith("#");
  const target = isExternal ? "_blank" : isInternal ? "_self" : linkTarget;

  const handleClick = (event: React.MouseEvent) => {
    event.preventDefault();
    const targetElement = document.querySelector(href);
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <a
      href={href}
      target={target}
      rel={isExternal ? "noopener noreferrer" : undefined}
      onClick={isInternal ? handleClick : undefined}
      className="break-all text-link underline transition-colors"
    >
      {children}
      {isDownload && (
        <Download className="ml-1 inline size-4 -translate-y-0.5" />
      )}
      {isExternal && !isDownload && (
        <ExternalLink className="ml-1 inline size-4 -translate-y-0.5" />
      )}
      {isInternal && <span className="ml-1 text-xs">🔗</span>}
    </a>
  );
};

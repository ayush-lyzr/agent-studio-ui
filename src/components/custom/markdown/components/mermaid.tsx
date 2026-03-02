import mermaid from "mermaid";
import { useEffect, useRef } from "react";

mermaid.initialize({
  themeCSS: `
    .mermaid {
      font-size: 12px !important;
    }
    .mermaid .label {
      font-size: 11px !important;
    }
    .mermaid .nodeLabel {
      font-size: 11px !important;
    }
    .mermaid .edgeLabel {
      font-size: 10px !important;
    }
    .mermaid .messageText {
      font-size: 11px !important;
    }
    .mermaid .titleText {
      font-size: 12px !important;
    }
    /* For flowcharts only */
    .mermaid .flowchart {
      font-size: 10px !important;
    }
    /* For sequence diagrams only */
    .mermaid .sequence {
      font-size: 9px !important;
    }
  `,
});

export const Mermaid = ({ chart, id }: { chart: string; id: string }) => {
  const mermaidRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const initializeMermaid = async () => {
      if (mermaidRef.current) {
        mermaidRef.current.innerHTML = chart;
        const { svg, bindFunctions } = await mermaid.render(
          `mermaid-diagram-${id}`,
          chart,
        );
        mermaidRef.current.innerHTML = svg;
        mermaidRef.current.className = "text-xs";
        bindFunctions?.(mermaidRef.current);
      }
    };

    initializeMermaid();

    // Clean up mermaid instance when unmounting; doing nothing at the momemt
    return () => {};
  }, [id]);

  return <div id={id} ref={mermaidRef}></div>;
};

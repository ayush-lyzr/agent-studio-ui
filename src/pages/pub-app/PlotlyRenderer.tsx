import React, { useEffect, useRef } from "react";

interface PlotlyRendererProps {
  data: string;
}

const PlotlyRenderer: React.FC<PlotlyRendererProps> = ({ data }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const plotlyRef = useRef<any>(null);

  useEffect(() => {
    // Load Plotly from CDN if not already available
    const loadPlotly = async () => {
      if (typeof window !== "undefined" && !(window as any).Plotly) {
        const script = document.createElement("script");
        script.src = "https://cdn.plot.ly/plotly-latest.min.js";
        script.async = true;
        
        await new Promise((resolve, reject) => {
          script.onload = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
        });
      }
      
      plotlyRef.current = (window as any).Plotly;
      renderPlot();
    };

    const renderPlot = () => {
      if (!containerRef.current || !plotlyRef.current) return;

      try {
        // Parse the data - expected format is JSON with data and layout
        const plotData = JSON.parse(data);
        
        // Ensure we have the required structure
        const { data: traces = [], layout = {}, config = {} } = plotData;
        
        // Add responsive layout defaults
        const responsiveLayout = {
          ...layout,
          autosize: true,
          margin: layout.margin || { t: 30, r: 30, b: 30, l: 30 },
        };
        
        // Create the plot
        plotlyRef.current.newPlot(
          containerRef.current,
          traces,
          responsiveLayout,
          {
            responsive: true,
            displayModeBar: true,
            displaylogo: false,
            ...config,
          }
        );
      } catch (error) {
        console.error("Error rendering Plotly chart:", error);
        
        // Display error message
        if (containerRef.current) {
          containerRef.current.innerHTML = `
            <div class="flex items-center justify-center h-full text-red-500">
              <div class="text-center">
                <p class="font-semibold">Error rendering chart</p>
                <p class="text-sm mt-1">Invalid Plotly data format</p>
              </div>
            </div>
          `;
        }
      }
    };

    loadPlotly().catch(console.error);

    // Cleanup
    return () => {
      if (containerRef.current && plotlyRef.current) {
        plotlyRef.current.purge(containerRef.current);
      }
    };
  }, [data]);

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current && plotlyRef.current) {
        plotlyRef.current.Plots.resize(containerRef.current);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div 
      ref={containerRef} 
      className="w-full h-full min-h-[400px]"
      style={{ position: "relative" }}
    />
  );
};

export default PlotlyRenderer;
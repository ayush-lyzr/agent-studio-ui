
import React from 'react';
import { Band, DEFAULT_BANDS } from '../lib/bandSystem';

interface BandIndicatorsProps {
  bands?: Band[];
  show?: boolean;
}

const BandIndicators: React.FC<BandIndicatorsProps> = ({ 
  bands = DEFAULT_BANDS,
  show = true 
}) => {
  if (!show) return null;

  return (
    <div className="absolute inset-0 pointer-events-none z-0">
      {bands.map((band) => (
        <div key={band.id}>
          {/* Horizontal guide line */}
          <div
            className="absolute left-0 right-0 border-t border-border/30"
            style={{ top: band.y }}
          />
          {/* Band label */}
          <div
            className="absolute left-4 px-2 py-1 text-xs text-muted-foreground bg-secondary/80 rounded"
            style={{ top: band.y - 12 }}
          >
            {band.label}
          </div>
        </div>
      ))}
    </div>
  );
};

export default BandIndicators;

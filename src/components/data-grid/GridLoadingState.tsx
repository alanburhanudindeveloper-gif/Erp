import React from 'react';

interface GridLoadingStateProps {
  columnCount: number;
  rowCount?: number;
}

export const GridLoadingState: React.FC<GridLoadingStateProps> = ({
  columnCount,
  rowCount = 8,
}) => {
  return (
    <div className="divide-y divide-slate-100 animate-pulse">
      {Array.from({ length: rowCount }).map((_, rIdx) => (
        <div key={rIdx} className="flex items-center px-4 py-2.5 space-x-3">
          {Array.from({ length: Math.min(columnCount, 8) }).map((_, cIdx) => (
            <div
              key={cIdx}
              className="h-3.5 bg-slate-200/80 rounded"
              style={{
                width: `${Math.max(12, Math.floor(80 / columnCount))}%`,
                opacity: 1 - rIdx * 0.08,
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
};

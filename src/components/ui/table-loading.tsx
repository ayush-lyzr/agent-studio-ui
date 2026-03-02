import React from "react";
import { Skeleton } from "../ui/skeleton";

interface Props {
  columns: number;
}

export const TableLoading: React.FC<Props> = ({ columns }) => {
  const width = 100 / columns;

  const Columns = Array.from({ length: columns }, (_, i) => {
    return <Skeleton key={i} className="h-6" style={{ width: `${width}%` }} />;
  });

  return (
    <div className="w-full space-y-2">
      {Array.from({ length: 10 }, (_, i) => (
        <div className="flex items-center space-x-2" key={i}>
          {Columns}
        </div>
      ))}
    </div>
  );
};

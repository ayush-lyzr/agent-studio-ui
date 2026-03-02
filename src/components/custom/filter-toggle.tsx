import { Dispatch, HTMLAttributes, ReactNode, SetStateAction } from "react";
import type { VariantProps } from "class-variance-authority";

import { ToggleGroup, ToggleGroupItem } from "../ui/toggle-group";
import { toggleVariants } from "../ui/toggle";

interface FilterToggleItem<T> {
  id: T;
  label: string;
  count: number;
  icon?: ReactNode;
}

interface FilterToggleProps<T> {
  items: FilterToggleItem<T>[];
  value: string;
  setValue: Dispatch<SetStateAction<string>>;
  withCount?: boolean;
}

export function FilterToggle<T>({
  withCount = true,
  ...props
}: FilterToggleProps<T> &
  VariantProps<typeof toggleVariants> &
  HTMLAttributes<HTMLDivElement>) {
  return (
    <ToggleGroup
      value={props.value}
      onValueChange={props.setValue}
      variant={props.variant}
      type="single"
      size={props.size}
      className="gap-0"
    >
      {props?.items?.map((item) => (
        <ToggleGroupItem
          key={item.id as string}
          value={item.id as string}
          aria-label={`Toggle ${item.label}`}
          className="text-xs"
        >
          {item.icon && <span className="mr-1">{item.icon}</span>}
          {item.label}{" "}
          {withCount && item.count > 0 && (
            <span className="badge-count">{item.count}</span>
          )}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}

import { Dispatch, ReactNode, SetStateAction, useState } from "react";
import { Search, XCircleIcon } from "lucide-react";

import { Button, buttonVariants } from "@/components/custom/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type ITagsModal<T> = {
  title: string;
  sectionTitle: string;
  open: boolean;
  items: T[];
  onOpen: Dispatch<SetStateAction<boolean>>;
  renderItem: (item: T, index: number) => ReactNode;
};

export function TagsModal<T>({
  title,
  sectionTitle,
  open,
  onOpen,
  items,
  renderItem,
}: ITagsModal<T>) {
  const [searchQuery, setSearchQuery] = useState<string>("");

  return (
    <Dialog open={open} onOpenChange={onOpen}>
      <DialogContent className="grid max-w-xl grid-cols-1 gap-4">
        <DialogHeader>
          <DialogTitle>{sectionTitle}</DialogTitle>
        </DialogHeader>
        <Separator />
        <div>
          <span className="col-span-3 flex items-center rounded-md border border-slate-300 px-2">
            <Search className="size-5" />
            <Input
              placeholder={`Search ${sectionTitle}...`}
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="max-w-xs border-none bg-transparent shadow-none"
            />
            <XCircleIcon
              className={cn(
                "size-4 text-slate-400 transition-all delay-200 duration-200 ease-in-out animate-in animate-out fade-in-0 fade-out-50 hover:text-slate-700",
                searchQuery.length > 0 ? "visible" : "invisible",
              )}
              onClick={() => setSearchQuery("")}
            />
          </span>
        </div>
        <div className="flex flex-col space-y-2">
          <p className="text-sm text-foreground">{title}</p>
          <div className="flex flex-wrap gap-2">
            {items.map((item, index) => renderItem(item, index))}
          </div>
        </div>
        <Separator />
        <DialogFooter>
          <DialogClose
            className={cn(buttonVariants({ variant: "outline" }), "mr-2")}
          >
            Cancel
          </DialogClose>
          <Button>Submit</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default TagsModal;

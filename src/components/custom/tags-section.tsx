import { ReactNode, useLayoutEffect, useRef, useState } from "react";
import { Badge } from "../ui/badge";
import TagsModal from "@/pages/responsible-ai/page/components/tags-modal";

interface ITagsSection<T> {
  title: string;
  sectionTitle: string;
  tags: T[];
  renderItem: (item: T, index: number) => ReactNode;
}

export function TagsSection<T>({
  title,
  sectionTitle,
  tags,
  renderItem,
}: ITagsSection<T>) {
  const containerWidth = 600;
  const containerRef = useRef<HTMLDivElement>(null);
  const [visibleTags, setVisibleTags] = useState<T[]>(tags);
  const [hiddenCount, setHiddenCount] = useState<number>(0);
  const [modalVisible, setModalVisible] = useState<boolean>(false);

  useLayoutEffect(() => {
    const recalculate = () => {
      if (!containerRef.current) return;

      const tagElements = Array.from(containerRef.current.children);
      let totalWidth = 0;
      let lastVisibleIndex = tags.length;

      for (let i = 0; i < tagElements.length; i++) {
        const tagWidth = tagElements[i]?.scrollWidth ?? 0;
        if (totalWidth + tagWidth > containerWidth) {
          lastVisibleIndex = i;
          break;
        }
        totalWidth += tagWidth;
      }

      setVisibleTags(tags.slice(0, lastVisibleIndex));
      setHiddenCount(tags.length - lastVisibleIndex);
    };

    recalculate();
  }, [tags]);

  return (
    <div className="flex flex-col space-y-2">
      <p className="text-sm text-foreground">{title}</p>
      <div className="flex flex-wrap gap-2">
        <div ref={containerRef} className="flex flex-wrap gap-2">
          {visibleTags?.map((item: T, idx: number) => renderItem(item, idx))}
        </div>
        {hiddenCount > 0 && (
          <Badge
            variant="outline"
            className="cursor-pointer rounded-full bg-gray-300 px-3 py-1"
            onClick={() => setModalVisible(true)}
          >
            +{hiddenCount} more
          </Badge>
        )}
      </div>
      <TagsModal<T>
        title={title}
        sectionTitle={sectionTitle}
        items={tags}
        renderItem={renderItem}
        open={modalVisible}
        onOpen={setModalVisible}
      />
    </div>
  );
}

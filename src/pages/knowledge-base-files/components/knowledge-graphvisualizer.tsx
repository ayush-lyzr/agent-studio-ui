import React, { Dispatch, SetStateAction, useRef, useState } from "react";
import { InteractiveNvlWrapper } from "@neo4j-nvl/react";
import { useQuery } from "@tanstack/react-query";
import { AxiosResponse } from "axios";
import type NVL from "@neo4j-nvl/base";
import type { MouseEventCallbacks } from "@neo4j-nvl/react";
import { HitTargets, Node, Relationship } from "@neo4j-nvl/base";
import { Loader2, SearchCheck, ZoomIn, ZoomOut } from "lucide-react";

import { RAG_URL } from "@/lib/constants";
import axios from "@/lib/axios";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { getBlackHex } from "@/lib/utils";

export const KnowledgeGraphVisualizer: React.FC<{
  rag_id: string;
  apiKey: string;
  open: boolean;
  onOpenChange: Dispatch<SetStateAction<boolean>>;
}> = ({ rag_id, apiKey, open, onOpenChange }) => {
  const nvl = useRef<NVL | null>(null);
  const [selectedNode, setSelectedNode] = useState<string>("");

  const { data: graph = [], isFetching: isFetchingGraph } = useQuery({
    queryKey: ["knowledge-graph", rag_id, apiKey],
    queryFn: async () =>
      axios.get(`/v4/knowledge_graph/neo4j/graph/`, {
        baseURL: RAG_URL,
        params: { rag_id },
        headers: { accept: "application/json", "x-api-key": apiKey },
      }),
    select: (res: AxiosResponse) => res.data?.graph_data,
    enabled: !!rag_id && !!apiKey && open,
  });

  const resetZoom = () => {
    nvl.current?.setZoom(0.2);
  };

  const fitNodes = () => {
    nvl.current?.fit(graph?.nodes.map((n: Node) => n.id));
  };

  const mouseEventCallbacks: MouseEventCallbacks = {
    onHover: (
      element: Node | Relationship,
      hitTargets: HitTargets,
      evt: MouseEvent,
    ) => console.log("onHover", element, hitTargets, evt),
    onRelationshipRightClick: (
      rel: Relationship,
      hitTargets: HitTargets,
      evt: MouseEvent,
    ) => console.log("onRelationshipRightClick", rel, hitTargets, evt),
    onNodeClick: (node: Node, hitTargets: HitTargets, evt: MouseEvent) => {
      console.log("onNodeClick", node, hitTargets, evt);
      setSelectedNode(node.id);
    },
    onNodeRightClick: (node: Node, hitTargets: HitTargets, evt: MouseEvent) =>
      console.log("onNodeRightClick", node, hitTargets, evt),
    onNodeDoubleClick: (node: Node, hitTargets: HitTargets, evt: MouseEvent) =>
      console.log("onNodeDoubleClick", node, hitTargets, evt),
    onRelationshipClick: (
      rel: Relationship,
      hitTargets: HitTargets,
      evt: MouseEvent,
    ) => console.log("onRelationshipClick", rel, hitTargets, evt),
    onRelationshipDoubleClick: (
      rel: Relationship,
      hitTargets: HitTargets,
      evt: MouseEvent,
    ) => console.log("onRelationshipDoubleClick", rel, hitTargets, evt),
    onCanvasClick: (evt: MouseEvent) => console.log("onCanvasClick", evt),
    onCanvasDoubleClick: (evt: MouseEvent) =>
      console.log("onCanvasDoubleClick", evt),
    onCanvasRightClick: (evt: MouseEvent) =>
      console.log("onCanvasRightClick", evt),
    onDrag: (nodes: Node[]) => console.log("onDrag", nodes),
    // @ts-ignore
    onPan: (evt: MouseEvent) => console.log("onPan", evt),
    onZoom: (zoomLevel: number) => {
      console.log({ zoomLevel });
    },
  };

  // const selectedGraphNode = graph?.nodes?.find(
  //   (res: any) => res?.id === selectedNode,
  // );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger className={buttonVariants({ variant: "outline" })}>
        Visualize Knowledge Graph
      </DialogTrigger>
      <DialogContent className="flex h-5/6 max-w-screen-lg flex-col">
        <DialogHeader>
          <DialogTitle>Visualize Knowledge Graph</DialogTitle>
          <DialogDescription>
            You can use your mouse to interact with the graph.
          </DialogDescription>
        </DialogHeader>
        <Separator />
        <div className="h-full w-full rounded-lg bg-muted transition-all ease-in-out">
          {/* <div className="relative left-[65%] top-4 z-20 h-36 w-1/4 space-y-4 rounded-lg border bg-card p-2">
            <p className="text-xs">Selected Graph Node</p>
            <Separator />
            <div className="h-full overflow-y-auto">
              <p className="text-md mb-2 font-semibold text-primary">
                {selectedGraphNode?.type}
              </p>
              <p className="text-sm text-muted-foreground">
                {selectedGraphNode?.text ?? selectedGraphNode?.content}
              </p>
            </div>
          </div> */}
          {isFetchingGraph ? (
            <div className="grid h-full place-items-center bg-muted">
              <Loader2 className="size-12 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <InteractiveNvlWrapper
              ref={nvl}
              nodes={graph?.nodes?.map(
                (res: any, idx: number) =>
                  ({
                    id: res?.id,
                    color: getBlackHex(
                      (res?.content?.length ?? res?.text?.length) / 100,
                    ),
                    selected: res?.id === selectedNode,
                    // html: (() => {
                    //   const el = document.createElement("div");
                    //   const title = document.createElement("p");
                    //   title.className = "text-md font-medium";
                    //   title.innerText = "hhhhhh";
                    //   const description = document.createElement("p");
                    //   description.className = "text-sm text-muted-foreground";
                    //   description.innerText = res?.text ?? res?.content;
                    //   el.className = "invisible hover:visible";
                    //   el.appendChild(title);
                    //   el.append(description);

                    //   return el;
                    // })(),
                    captions: [
                      { value: graph?.node_labels?.[idx] },
                      { value: res?.text },
                    ],
                  }) as Node,
              )}
              rels={graph?.edges?.map(
                (res: any) =>
                  ({
                    id: `${res?.source}${res?.target}`,
                    from: res?.source,
                    to: res?.target,
                    captions: [{ value: res?.type }],
                  }) as Relationship,
              )}
              nvlOptions={{
                initialZoom: 1,
                layout: "d3Force",
                minZoom: 0.5,
                maxZoom: 3,
                allowDynamicMinZoom: true,
                styling: {
                  selectedBorderColor: "black",
                  disabledItemColor: "eee",
                },
              }}
              mouseEventCallbacks={mouseEventCallbacks}
            />
          )}
          <div className="group relative bottom-[22%] left-[94%] flex w-fit flex-col items-center rounded-lg bg-background">
            <Button
              size="icon"
              variant="link"
              className="hover:bg-background/80"
              disabled={isFetchingGraph}
              onClick={() => nvl.current?.setZoom(nvl.current.getScale() + 0.1)}
            >
              <ZoomIn className="size-4" />
            </Button>
            <Button
              size="icon"
              variant="link"
              className="hover:bg-background/80"
              disabled={isFetchingGraph}
              onClick={() => nvl.current?.setZoom(nvl.current.getScale() - 0.1)}
            >
              <ZoomOut className="size-4" />
            </Button>
            <Button
              variant="ghost"
              onClick={resetZoom}
              disabled={isFetchingGraph}
            >
              <SearchCheck className="size-4" />
            </Button>
          </div>
        </div>
        <Separator />
        <DialogFooter>
          <Button variant="outline" onClick={fitNodes}>
            Fit to screen
          </Button>
          <DialogClose className={buttonVariants({ variant: "outline" })}>
            Close
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

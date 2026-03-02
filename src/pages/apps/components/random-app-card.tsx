import React, { Dispatch, SetStateAction } from "react";
import { Link } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { Ellipsis, ThumbsUp } from "lucide-react";

import { Button } from "@/components/ui/button";
import axios from "@/lib/axios";
import { AppData } from "@/lib/types";
import { toast } from "@/components/ui/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { MARKETPLACE_URL } from "@/lib/constants";

export const RandomAppCard: React.FC<{
  app: AppData;
  setRandomApps: Dispatch<SetStateAction<AppData[]>>;
}> = ({ app, setRandomApps }) => {
  const { currentUser, userId } = useCurrentUser();
  const { mutateAsync: upvoteRandomApp, isPending: isUpvotingRandomApp } =
    useMutation({
      mutationKey: ["upvoteRandomApp", app.id],
      mutationFn: () =>
        axios.post(
          `/app/${app.id}/upvote`,
          {
            user_email: currentUser?.auth?.email ?? "",
            app_id: app.id,
          },
          { baseURL: MARKETPLACE_URL },
        ),
      onSuccess: () => {
        setRandomApps((prevApps) =>
          prevApps.map((app) =>
            app.id === app.id ? { ...app, upvotes: app.upvotes + 1 } : app,
          ),
        );
        toast({
          title: "Success",
          description: "Successfully upvoted!",
        });
      },
    });

  const onUpvote = async () => await upvoteRandomApp();

  return (
    <Card key={app.id} className="relative col-span-1 hover:shadow-lg">
      <CardHeader>
        <div className="flex justify-between">
          <Link
            to={`/app/${app.id}`}
            target="_blank"
            className={`flex size-10 items-center justify-center rounded-lg bg-muted p-2`}
          >
            <img
              src={`https://api.dicebear.com/9.x/identicon/svg?seed=${app.name}`}
              alt="avatar"
            />
          </Link>
          {userId === app.user_id && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Ellipsis size={18} />
              </DropdownMenuTrigger>
              <DropdownMenuContent side="bottom" align="end" className="w-32">
                <DropdownMenuItem>Save Agent</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        <CardTitle className="h-10">
          <Link
            to={`/app/${app.id}`}
            target="_blank"
            className="line-clamp-2"
            title={app.name}
          >
            {app.name}
          </Link>
        </CardTitle>
        <CardDescription className="line-clamp-2">
          {app.description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mt-2 flex h-16 flex-wrap items-start gap-2 overflow-hidden">
          {app.categories.map((category, index) => (
            <Badge
              key={index}
              variant="secondary"
              className="cursor-default rounded-full bg-neutral-200 px-2 py-1 text-xs text-neutral-500"
            >
              {category}
            </Badge>
          ))}
        </div>
      </CardContent>
      <CardFooter className="flex h-12 items-center justify-between">
        <p className="w-1/2 text-sm text-muted-foreground">
          Created by {app.creator}
        </p>
        <Button
          size="sm"
          variant="outline"
          className={cn(
            "border-none bg-neutral-200 dark:text-black",
            isUpvotingRandomApp && "animate-pulse",
          )}
          onClick={onUpvote}
        >
          <ThumbsUp className="mr-2 size-4" />
          Upvote
        </Button>
      </CardFooter>
    </Card>
  );
};

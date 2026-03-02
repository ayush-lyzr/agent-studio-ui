import { Dispatch, SetStateAction, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useChatStore } from "../chat.store";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/components/ui/use-toast";
import useStore from "@/lib/store";
import { useChatService } from "../chat.api";

const schema = z.object({
  title: z.string().min(1, "Title is required"),
});

type FormValues = z.infer<typeof schema>;

interface RenameSessionDialogProps {
  sessionId: string;
  open: boolean;
  onOpen: Dispatch<SetStateAction<boolean>>;
}

export default function RenameSessionDialog({
  sessionId,
  open,
  onOpen,
}: RenameSessionDialogProps) {
  const { toast } = useToast();
  const { sessions, agent } = useChatStore((state) => state);
  const apiKey = useStore((state) => state.api_key);

  const session = sessions?.find((session) => session.session_id === sessionId);

  const { updateSessionDetails, isUpdatingSessionDetails, refetchSessions } =
    useChatService({
      apiKey,
      session_id: sessionId,
    });

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { title: session?.metadata?.title || "" },
  });

  const onSubmit = async (data: FormValues) => {
    await updateSessionDetails({
      session_id: sessionId,
      agent_id: session?.agent_id ?? "",
      metadata: {
        title: data.title,
        app_id: agent?.id,
        published: true,
      },
    });
    await refetchSessions();
    toast({
      title: "Success",
      description: "Renamed the session successfully!",
    });
    onOpen(false);
  };

  useEffect(() => {
    form.reset({ title: session?.metadata?.title });
  }, [form, session?.metadata?.title]);

  return (
    <Dialog open={open} onOpenChange={onOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rename Session</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Session Title</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Session Title" autoFocus />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="mt-4">
              <DialogClose
                asChild
                className={buttonVariants({ variant: "outline" })}
              >
                Cancel
              </DialogClose>
              <Button type="submit" loading={isUpdatingSessionDetails}>
                {isUpdatingSessionDetails ? "Updating ..." : "Update"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

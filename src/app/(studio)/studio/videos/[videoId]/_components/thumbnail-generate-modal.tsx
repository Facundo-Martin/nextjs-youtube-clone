import { api } from "@/trpc/react";

import z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ResponsiveModal } from "@/components/responsive-dialog";
import { toast } from "sonner";
import { ValueSetter } from "node_modules/date-fns/parse/_lib/Setter";

type Props = {
  videoId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const formSchema = z.object({
  prompt: z.string().min(10),
});

export const ThumbnailGenerationModal = ({
  videoId,
  open,
  onOpenChange,
}: Props) => {
  const utils = api.useUtils();

  const generateThumbnail = api.video.generateThumbnail.useMutation({
    onSuccess: () => {
      toast.success("Background job started", {
        description: "This may take some time",
      });
    },
    onError: () => toast.error("Something went wrong"),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      prompt: "",
    },
  });

  function onSubmit(data: z.infer<typeof formSchema>) {
    generateThumbnail.mutate({ videoId, prompt: data.prompt });
    onOpenChange(false);
  }

  return (
    <ResponsiveModal
      title="Upload a thumbnail"
      open={open}
      onOpenChange={onOpenChange}
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <FormField
            control={form.control}
            name="prompt"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Prompt</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    className="resize-none"
                    cols={30}
                    rows={5}
                    placeholder="A description of desired thumbnail"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="flex justify-end">
            <Button type="submit">Submit</Button>
          </div>
        </form>
      </Form>
    </ResponsiveModal>
  );
};

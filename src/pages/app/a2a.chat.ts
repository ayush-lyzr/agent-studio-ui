import { BASE_URL } from "@/lib/constants";
import axios from "@/lib/axios";
import { useMutation } from "@tanstack/react-query";

export const useA2AChat = ({ apiKey }: { apiKey: string }) => {
  const { mutateAsync: chatA2AAgent, isPending: isChattingA2AAgent } =
    useMutation({
      mutationKey: ["chatA2AAgent"],
      mutationFn: ({
        agent_id,
        message,
      }: {
        agent_id: string;
        message: string;
      }) =>
        axios.post(
          `/v3/a2a/agents/${agent_id}/infer`,
          { message },
          {
            baseURL: BASE_URL,
            headers: { "x-api-key": apiKey },
          },
        ),
    });

  return {
    chatA2AAgent,
    isChattingA2AAgent,
  };
};

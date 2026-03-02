import { motion } from "framer-motion";
import { GuardrailCard } from "./guardrails-card";
import { useGuardrails } from "./guardrails-service";
import { Skeleton } from "@/components/ui/skeleton";
import { PageTitle } from "@/components/ui/page-title";
import { Separator } from "@/components/ui/separator";

export default function Guardrails() {
  const { guardrailProviders: providers = [], isFetchingProviders } =
    useGuardrails({
      providersEnabled: true,
    });

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="h-full w-full space-y-4 px-8 py-4"
    >
      <PageTitle
        title="Guardrail Providers"
        description="Configure guardrail providers for your agents. Enable content filtering, PII detection, and safety policies."
      />
      <Separator />
      <div className="h-[calc(100%-5rem)] overflow-y-scroll">
        <div className="grid grid-cols-4 gap-4 px-1 pt-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {isFetchingProviders ? (
            <>
              {[...Array(2)].map((_, index) => (
                <Skeleton
                  key={index}
                  className="col-span-1 h-52 w-full rounded-lg"
                />
              ))}
            </>
          ) : providers.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center py-16">
              <p className="text-muted-foreground">
                No guardrail providers available yet.
              </p>
            </div>
          ) : (
            providers.map((provider) => (
              <GuardrailCard key={provider.provider_id} provider={provider} />
            ))
          )}
        </div>
      </div>
    </motion.div>
  );
}

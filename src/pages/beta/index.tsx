import { useEffect } from "react";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageTitle } from "@/components/ui/page-title";
import BiasAnalysis from "./components/bias-analysis";
import ToxicityAnalysis from "./components/toxicity-analysis";
import PromptInjectionAnalysis from "./components/prompt-injection-analysis";

const BetaPage = () => {
  useEffect(() => {
    document.title = "Beta Features - Avanade";
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex h-full w-full flex-col space-y-8 p-8"
    >
      <PageTitle
        title="Responsible AI"
        description="Analyze and ensure the safety, fairness, and reliability of AI interactions"
        beta={true}
      />

      <Tabs defaultValue="bias" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="bias">Bias Analysis</TabsTrigger>
          <TabsTrigger value="toxicity">Toxicity Analysis</TabsTrigger>
          <TabsTrigger value="injection">Prompt Injection Analysis</TabsTrigger>
        </TabsList>
        <TabsContent value="bias">
          <BiasAnalysis />
        </TabsContent>
        <TabsContent value="toxicity">
          <ToxicityAnalysis />
        </TabsContent>
        <TabsContent value="injection">
          <PromptInjectionAnalysis />
        </TabsContent>
      </Tabs>
    </motion.div>
  );
};

export default BetaPage;

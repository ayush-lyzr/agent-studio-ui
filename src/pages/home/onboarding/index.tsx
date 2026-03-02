import { motion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { AxiosResponse } from "axios";
import { z, ZodSchema } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Button } from "@/components/custom/button";
import { BrandLogo } from "@/components/branding/BrandLogo";
import { MovingIndicatorNav } from "@/components/custom/moving-bar-navigation";
import { IOnboardingQuestion, Path } from "@/lib/types";
import axios from "@/lib/axios";
import { isMixpanelActive, PAGOS_URL } from "@/lib/constants";
import CardRadioButton from "./card-radio-button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { useOnboardingStore } from "./onboarding.store";
import { useOnboarding } from "./onboarding.service";
import { useManageAdminStore } from "@/pages/manage-admin/manage-admin.store";
import { useNavigate } from "react-router-dom";
import mixpanel from "mixpanel-browser";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useAuth } from "@/contexts/AuthContext";

export type Answer = {
  step1: "build" | "explore";
  step2: "personal" | "customer" | "sales";
  step3: "developer" | "business";
};

const Onboarding = () => {
  const { getToken , userId} = useAuth();
  const token = getToken();
  const navigate = useNavigate();
  const { currentUser } = useCurrentUser();

  const [step, setStep] = useState<number>(0);
  const [finish, setFinish] = useState<boolean>(false);
  const [formSchema, setFormSchema] = useState<ZodSchema>(z.object({}));

  const { onboarding, saveProgress, lastProgressedStep, saveLastProgressStep } =
    useOnboardingStore((state) => state);
  const org_data = useManageAdminStore((state) => state.org_data);
  const { saveOnboardingQuestionnaire } = useOnboarding();

  const { data: questionnaire, isLoading: isFetchingQuestionnaire } = useQuery({
    queryKey: ["getOnboardingQuestionnaire"],
    queryFn: (): Promise<AxiosResponse<IOnboardingQuestion[], any>> =>
      axios.get("/user/onboarding-questionnaire", {
        baseURL: PAGOS_URL,
        headers: { Authorization: `Bearer ${token}` },
      }),
    retry: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (questionnaire) {
      setFormSchema(
        z.object(
          Object.fromEntries(
            questionnaire.data?.map((item) => {
              const field = z.enum(item.options.map((opt) => opt.label) as any);
              return [
                item.question,
                item.multiple
                  ? item.required
                    ? z.array(field).min(1)
                    : z.array(field).optional()
                  : item.required
                    ? field
                    : field.optional(),
              ];
            }),
          ),
        ),
      );
    }

    if (org_data?.onboarded) {
      navigate(Path.HOME);
    }
  }, [questionnaire, org_data]);

  useEffect(() => {
    if (lastProgressedStep) {
      form.reset(onboarding);
      setStep(lastProgressedStep);
    }
  }, []);

  const form = useForm({
    resolver: zodResolver(formSchema),
  });

  const onNext = useCallback(() => {
    if (
      questionnaire?.data &&
      step >= 0 &&
      step < questionnaire?.data?.length
    ) {
      setStep((step) => step + 1);
      saveProgress(form.getValues());
      saveLastProgressStep(step + 1);
      if (mixpanel.hasOwnProperty("cookie") && isMixpanelActive) {
        mixpanel.people.set({
          $email: currentUser?.auth?.email ?? "global",
          // @ts-ignore
          $name:
            `${currentUser?.customFields?.["first-name"]} ${currentUser?.customFields?.["last-name"]}` ||
            "global",
          ...(form.watch() ?? {}),
          "Last Login": new Date(),
        });
        mixpanel.track("User Onboarding", {
          userId : userId ,
          onboarding: form.watch() ?? {},
        });
      }
    }
  }, [form.getValues()]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    await saveOnboardingQuestionnaire(values);
    if (mixpanel.hasOwnProperty("cookie") && isMixpanelActive) {
      mixpanel.people.set({
        $email: currentUser?.auth?.email ?? "global",
        // @ts-ignore
        $name:
          `${currentUser?.customFields?.["first-name"]} ${currentUser?.customFields?.["last-name"]}` ||
          "global",
        ...(form.watch() ?? {}),
        "Last Login": new Date(),
      });
      mixpanel.track("User Onboarding", {
        userId,
        onboarding: form.watch() ?? {},
      });
    }
    window.location.href = Path.HOME;
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 10 }}
      className="h-screen w-full bg-background p-4 transition-all ease-in-out"
    >
      <div className="mb-10 h-10 w-4/5">
        {step > 0 && (
          <Button
            variant="link"
            onClick={() => setStep((step) => (step > 0 ? step - 1 : step))}
          >
            <ChevronLeft className="size-4" />
            Back
          </Button>
        )}
      </div>
      <div className="flex h-3/4 w-full flex-col items-center">
        <div className="w-2/3">
          <span className="flex items-center justify-center">
            <BrandLogo className="h-12 w-auto max-w-[220px] object-contain" />
          </span>
          <span className="inline-flex gap-1 text-sm font-light">
            Personalizing your experience. Takes only 2 minutes!
          </span>
        </div>
        {isFetchingQuestionnaire ? (
          <div className="grid h-full place-items-center">
            <Loader2 className="size-10 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="h-full w-2/3"
            >
              {questionnaire?.data.map((currentStep, i) => {
                if (i === step) {
                  return (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      key={`onboarding-step-${i}`}
                      className="h-full w-full"
                    >
                      <FormField
                        name={currentStep.question}
                        control={form.control}
                        render={({ field }) => (
                          <FormItem>
                            <span className="mb-4 mt-6 inline-flex flex-wrap text-4xl font-semibold">
                              <p>{currentStep?.question}</p>

                              {currentStep?.multiple && (
                                <p className="text-sm font-normal italic text-muted-foreground">
                                  Select all that apply
                                </p>
                              )}
                            </span>
                            <p className="mb-4 mt-2 text-xl font-semibold">
                              {currentStep?.sub_question}
                            </p>
                            <FormControl>
                              <CardRadioButton
                                {...currentStep}
                                field={field}
                                finish={finish}
                                setFinish={setFinish}
                                isSaving={form.formState.isSubmitting}
                                onNext={onNext}
                                onSubmit={form.handleSubmit}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </motion.div>
                  );
                } else {
                  return null;
                }
              })}
              <div className="flex w-full flex-col items-center">
                <MovingIndicatorNav
                  count={questionnaire?.data?.length ?? 0}
                  activeIndex={step}
                />
              </div>
            </form>
          </Form>
        )}
      </div>
    </motion.div>
  );
};

export default Onboarding;

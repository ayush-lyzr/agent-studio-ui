import { Link, useSearchParams } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { useMemberstack } from "@memberstack/react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import mixpanel from "mixpanel-browser";
import { ReactNode, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { pricingTiers, topUpPlans } from "./data";
import { isMixpanelActive, PlanType } from "@/lib/constants";
import Subscribe from "./subscribe";
import { Path, UserRole } from "@/lib/types";
import { useManageAdminStore } from "../manage-admin/manage-admin.store";
import { buttonVariants } from "@/components/custom/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TopupCard } from "./topup-card";
import { PlanCard } from "./plan-card";
import { FaqCard } from "./faq-card";
import { PricingTable } from "./pricing-table";

interface FAQItem {
  question: string;
  answer: string | ReactNode;
}

if (mixpanel.hasOwnProperty("cookie") && isMixpanelActive)
  mixpanel.track("Upgrade plan page visited");
export default function UpgradePlan() {
  const topupRef = useRef<HTMLDivElement>(null);
  const [params, _] = useSearchParams();
  const sectionName = params.get("section");
  const { purchasePlansWithCheckout } = useMemberstack();
  const [subscribeInfoVisible, setSubscribeInfoVisible] =
    useState<boolean>(false);
  const [subscribeType, setSubscribeType] = useState<"team" | "org">("org");

  const [searchParams, setSearchParams] = useSearchParams();
  const planType =
    (searchParams.get("planType") as "monthly" | "yearly" | "default") ??
    "monthly";

  const faqs: FAQItem[] = [
    {
      question: "Is Agent Studio free to use?",
      answer:
        " Agent Studio offers a free account with 5 credits. Once you've used your credits, you'll need to upgrade to a paid plan. However, you will receive 5 free credits every month.",
    },
    {
      question: "Do I need technical skills to use Agent Studio?",
      answer:
        "No! Agent Studio is built for both technical and non-technical users. Business users can create agents with our intuitive interface and pre-built templates, no coding required while developers can use APIs and advanced customization",
    },
    {
      question: "Can I collaborate with my team on Agent Studio?",
      answer:
        "Yes! There are multiple plans that support team collaboration. The Teams plan includes 10 developer licenses, the Organization plan includes 25 developer licenses, and the Enterprise plan includes 50 developer licenses",
    },
    {
      question: "How does the subscription work? Can I cancel anytime?",
      answer:
        "Subscriptions are billed monthly starting from your first purchase. You can upgrade, downgrade, or cancel your plan at any time.",
    },
    {
      question: "What support is available if I face issues?",
      answer: (
        <span className="inline-block items-center">
          Our support team is always ready to help. Reach out to us at{" "}
          <Link to="mailto:support@lyzr.ai" className="link px-1">
            support@lyzr.ai
          </Link>
          or
          <Link to="mailto:help@lyzr.ai" className="link px-1">
            help@lyzr.ai
          </Link>
          for assistance.
        </span>
      ),
    },
    {
      question: "Can you build agents specialized for my requirements?",
      answer:
        "Absolutely! We build custom solutions tailored to your specific needs. Click here to book your demo call and discuss your requirements.",
    },
  ];

  const usage_data = useManageAdminStore((state) => state.usage_data);
  const current_organization = useManageAdminStore(
    (state) => state.current_organization,
  );

  const getButtonTitle = (name: string) => {
    switch (true) {
      case name === PlanType.Community && name !== usage_data?.plan_name:
        return "Not available";
      case usage_data?.plan_name?.includes(name) &&
        usage_data?.cycle_at === planType:
        return "Current plan";
      case ![PlanType.Community, PlanType.Starter, PlanType.Pro].includes(
        name as PlanType,
      ):
        return "Contact Us";
      default:
        return "Get started";
    }
  };

  const hasOrgPlan = (name: string) => name === PlanType.Organization;

  const hasTeamsPlan = (name: string) => name === PlanType.Teams;

  const handlePurchasePlan = (priceId: string, name: string) => async () => {
    try {
      if (name === PlanType.Community) {
        return;
      }

      if (!priceId) {
        window.open("https://www.avanade.com/en-gb/contact");
        return;
      }

      if (usage_data?.plan_name === name && usage_data?.cycle_at === planType) {
        toast.error("You're already on the same plan", {
          className: "bg-destructive text-secondary",
        });
        return;
      }

      if (
        priceId.includes("additional") &&
        ![UserRole.owner].includes(current_organization.role as UserRole)
      ) {
        toast.error("Please contact the owner of your organization to top up!");
        return;
      }

      if (hasOrgPlan(name)) {
        setSubscribeInfoVisible(true);
        setSubscribeType("org");
      } else if (hasTeamsPlan(name)) {
        setSubscribeInfoVisible(true);
        setSubscribeType("team");
      } else {
        toast.promise(
          purchasePlansWithCheckout({
            priceId,
            cancelUrl: window.location.origin + Path.UPGRADE_PLAN,
            successUrl: window.location.origin,
          }),
          {
            loading: "Redirecting you to stripe...",
            success: () => {
              if (mixpanel.hasOwnProperty("cookie") && isMixpanelActive)
                mixpanel.track(`Checked out to ${name} plan`);
              return `Redirecting to buy ${name} plan`;
            },
            error: (error) => error?.message,
            duration: 5 * 1000,
          },
        );
      }
    } catch (error: any) {
      console.log("Error purchasing plan => ", error);
      toast.error(error?.message);
    }
  };

  const plans = pricingTiers();

  useEffect(() => {
    if (sectionName === "topup") {
      topupRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [sectionName]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="grid h-full w-full place-items-center overflow-y-auto"
    >
      <div className="flex h-[96%] w-[99%] flex-col justify-between px-4">
        <div className="px-4">
          <Link
            to=".."
            className="mb-4 inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
          <h1 className="mb-4 text-3xl font-bold tracking-tight">
            Plans and Pricing
          </h1>
          <div className="flex items-start justify-between">
            <p className="text-lg text-muted-foreground">
              Whether you are an early-stage startup or a scaling enterprise,{" "}
              <br />
              Lyzr.ai is tailored to fuel your growth every step of the way.
            </p>
            <div className="flex items-center justify-end gap-4 px-4">
              <span className="text-bold inline-flex gap-1 text-sm">
                Pay yearly and get two months free!
              </span>
              <Tabs defaultValue={planType}>
                <TabsList>
                  <TabsTrigger
                    value="yearly"
                    className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                    onClick={() => setSearchParams({ planType: "yearly" })}
                  >
                    Yearly
                  </TabsTrigger>
                  <TabsTrigger
                    value="monthly"
                    className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                    onClick={() => setSearchParams({ planType: "monthly" })}
                  >
                    Monthly
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
        </div>

        <div className="flex justify-center gap-4 rounded-lg p-4 transition-all ease-in-out">
          {plans[planType]?.map((tier, idx) => (
            <PlanCard
              buttonTitle={getButtonTitle(tier.name)}
              delay={idx / 10}
              key={`${planType}-${tier.name}-${idx}`}
              onBuyNow={handlePurchasePlan(tier.priceId, tier.name)}
              planType={planType}
              tier={tier}
            />
          ))}
        </div>

        {false && (
          <div className="rounded-3xl bg-neutral-100">
            <div className="container mx-auto pb-0 pl-4 pr-0 pt-4">
              <div className="grid items-center gap-12 lg:grid-cols-2">
                {/* Content Section */}
                <div className="space-y-6">
                  <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
                    Enterprise/Organization
                  </h1>
                  <p className="max-w-xl text-lg leading-relaxed text-muted-foreground">
                    Lorem ipsum dolor sit amet consectetur. Neque tristique diam
                    volutpat viverra accumsan duis enim accumsan ac. Nec nulla
                    libero magna odio nisl aliquam pharetra. Duis vitae nunc
                    morbi id tellus. Posuere placerat nibh justo ultrices.
                  </p>
                  <div className="flex flex-wrap gap-4">
                    <Button size="lg" className="text-base">
                      Get started
                    </Button>
                    <Button variant="outline" size="lg" className="text-base">
                      Learn more
                    </Button>
                  </div>
                </div>

                {/* Image Section */}
                <div className="relative grid aspect-square w-full place-items-center place-self-end overflow-hidden rounded-br-3xl rounded-tl-3xl bg-neutral-200 lg:aspect-auto lg:h-[400px]">
                  <img
                    src="/lyzr-sign-in-logo.svg"
                    alt="Enterprise illustration"
                    className="object-cover"
                  />
                </div>
              </div>
              <br />
            </div>
          </div>
        )}

        <section className="w-full px-4 pb-4 pt-8" ref={topupRef}>
          <div className="container mx-auto max-w-7xl">
            <div className="mb-12 text-center">
              <h2 className="mb-4 text-2xl font-bold md:text-5xl">
                Need Extra Credits?
              </h2>
              <p className="text-md mx-auto max-w-3xl text-muted-foreground">
                Add credits to your existing plan instantly. Perfect for
                handling peak usage or special projects.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
              {topUpPlans.map((option, idx) => (
                <TopupCard
                  key={option.creditsString}
                  delay={idx / 10}
                  price={option.price.toString()}
                  credits={option.creditsString}
                  onBuyNow={handlePurchasePlan(
                    option.priceId,
                    `$${option.price}`,
                  )}
                />
              ))}
            </div>

            <div className="mt-8 text-center text-muted-foreground">
              <p>
                Credits are added instantly to your account • One-time payment •
                No subscription required
              </p>
            </div>
          </div>
        </section>

        <div className="px-4 py-12 md:py-10">
          {/* Header Section */}

          <PricingTable />
        </div>

        <div className="px-4 py-12 md:py-24">
          {/* Header Section */}
          <div className="mx-auto mb-16 max-w-3xl text-center">
            <h1 className="mb-4 text-4xl font-bold">FAQs</h1>
            <p className="text-lg text-muted-foreground">
              Can't find the answer you're looking for? Please chat with our
              team.
            </p>
          </div>

          {/* FAQ Grid */}
          <div className="mb-16 grid gap-x-6 gap-y-8 md:grid-cols-2 lg:grid-cols-3">
            {faqs.map((faq, index) => (
              <FaqCard faq={faq} delay={index / 10} />
            ))}
          </div>

          {/* Contact Section */}
          <div className="mx-auto max-w-3xl rounded-xl border bg-card p-8 shadow-md">
            <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
              <div className="text-center md:text-left">
                <h2 className="mb-2 text-2xl font-semibold text-primary">
                  Still have questions?
                </h2>
                <p className="text-muted-foreground">
                  Can't find the answer you're looking for? Please chat with our
                  team.
                </p>
              </div>
              <Link to="mailto:support@lyzr.ai" className={buttonVariants()}>
                Get in touch
              </Link>
            </div>
          </div>
        </div>
      </div>
      <Subscribe
        open={subscribeInfoVisible}
        onOpen={setSubscribeInfoVisible}
        type={subscribeType}
        planType={planType}
      />
    </motion.div>
  );
}

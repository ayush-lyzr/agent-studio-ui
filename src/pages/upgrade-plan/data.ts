import { PricingTier, PricingPlan } from "./types";

interface ITopUpPrice {
  price: number;
  priceId: string;
  credits: number;
  creditsString: string;
}

export const pricingTiers = () => {
  let plans: { [key: string]: PricingTier[] } = {
    default: [
      {
        name: "Community",
        type: "Individual",
        price: "$0",
        priceId: "",
        description: "Begin your Agent Studio journey at no cost.",
        headline: "Everything you'll love:",
        features: [
          "Unlimited Agents",
          "Unlimited end-users of Agents",
          "5 credits monthly",
          "1 Builder License",
          "Unlimited Users",
          { text: "100 MB Storage", tooltip: "Storage for your knowledgebase" },
          "Responsible AI",
          "Orchestration",
          "7 day logs (Traceability & Observaibility)",
        ],
        brandingImages: [],
      },
    ],
    monthly: [
      {
        name: "Community",
        type: "Individual",
        price: "$0",
        priceId: "",
        description: "Begin your Agent Studio journey at no cost.",
        headline: "",
        features: [
          "Build up to 10 Agents",
          "5 credits monthly",
          "1 Builder License",
          "Build upto 5 Knowledge bases",
          {
            text: "100 MB RAG Storage",
            tooltip: "Storage for your knowledgebase",
          },
          "Orchestration",
          "Limited Models",
          "Limited Blueprints",
          "7 day logs (Traceability & Observaibility)",
        ],
        brandingImages: [
          {
            name: "anuntatech com",
            logo: "/plans-brand-logos/anuntatech.webp",
            size: 60,
          },
          {
            name: "solaris hydrobotics",
            logo: "/plans-brand-logos/solaris-hydrobotics.webp",
            size: 60,
          },
        ],
      },
      {
        name: "Starter",
        type: "Individual",
        price: "$19",
        priceId: "prc_monthly-starter-w2q701kz",
        description: "A basic plan to get you started.",
        headline: "",
        features: [
          "Build up to 15 Agents",
          "Upgraded to 20 credits/month",
          "1 Builder License",
          "Build upto 10 Knowledge bases",
          {
            text: "100 MB RAG Storage",
            tooltip: "Storage for your knowledgebase",
          },
          "Orchestration",
          "Limited Models",
          "Limited Blueprints",
          "7 day logs (Traceability & Observaibility)",
        ],
        brandingImages: [
          {
            name: "Ciklum",
            logo: "/plans-brand-logos/ciklum.webp",
            size: 80,
          },
        ],
      },
      {
        name: "Pro",
        type: "Individual",
        price: "$99",
        priceId: "prc_pro-monthly-s3q801u1",
        description: "Upgrade to Pro for more features and benefits",
        headline: "",
        features: [
          "Build up to 25 Agents",
          "Upgraded to 100 credits/month",
          "1 Builder License",
          "Build upto 15 Knowledge bases",
          {
            text: "Upgraded to 1 GB RAG Storage",
            tooltip: "Storage for your knowledgebase",
          },
          "Orchestration",
          "Limited Models",
          "Limited Blueprints",
          "7 day logs (Traceability & Observaibility)",
          {
            text: "Supports few Super Agents",
            tooltip:
              "Plug & Play Agents - AI SDR, AI Phone Dialer, AI Marketer are available on plans Pro and above",
          },
        ],
        brandingImages: [
          {
            name: "emudhra",
            logo: "/plans-brand-logos/emudhra.webp",
            size: 70,
          },
          {
            name: "abi health",
            logo: "/plans-brand-logos/abi-health.webp",
            size: 60,
          },
        ],
      },
      // {
      //   name: "Teams",
      //   type: "Team",
      //   price: "$999",
      //   priceId: "prc_team-plan-monthly-401t0gve",
      //   description: "Plan offers advanced features for smaller teams",
      //   headline: "Everything in Pro plan plus:",
      //   features: [
      //     "Upgraded to 100K credits/month",
      //     {
      //       text: "Upgraded to 10 GB Storage",
      //       tooltip: "Storage for your knowledgebase",
      //     },
      //     "Upgraded to 10 Builder Licenses",
      //     "User access control",
      //     "Collaboration & Sharing",
      //     {
      //       text: "All super agents",
      //       tooltip:
      //         "Plug & Play Agents - AI SDR, AI Phone Dialer, AI Marketer are available on plans Pro and above",
      //     },
      //     "96 hour custom integration SLA",
      //   ],
      //   brandingImages: [
      //     {
      //       name: "air asia",
      //       logo: "/plans-brand-logos/air-asia.webp",
      //       size: 70,
      //     },
      //     {
      //       name: "hfs health",
      //       logo: "/plans-brand-logos/hfs.webp",
      //       size: 120,
      //     },
      //   ],
      // },
      {
        name: "Enterprise",
        type: "Team",
        price: "Custom",
        priceId: "",
        description: "Plan offers advanced features for large teams",
        headline: "Everything in Pro plan plus:",
        features: [
          {
            text: "Avanade agent build services",
            tooltip:
              "Avanade's internal services team will help you build / co-build agents and help you go live",
          },
          "Deploy on Lyzr Cloud or On-Prem",
          "Unlimited agents and Knowledge bases",
          // "Organizational General Intelligence (as per plan)",
          "Agent Entitlement Protocol",
          {
            text: "All models & Bring Your Own Model",
            tooltip:
              "Bring your own model or you can use all models providede by Lyzr",
          },
          "Team Collaboration",
          {
            text: "Credits & RAG storage as per plan",
            tooltip: "Credits as per plan. Storage for your knowledgebase",
          },
          "All Blueprints",
          "Responsible AI & Hallucination Manager",
          {
            text: "Agent Eval",
            tooltip: "Evaluates your agents against auto-generated test cases.",
          },
          "Logs (Traceability & Observability) as per plan",
          "48 hour custom integration SLA",
          "24/7 Technical Support",
        ],
        brandingImages: [
          {
            name: "accenture",
            logo: "/plans-brand-logos/accenture.webp",
            size: 70,
          },
          {
            name: "ntt data",
            logo: "/plans-brand-logos/ntt-data.webp",
            size: 150,
          },
        ],
        isPopular: false,
      },
      // {
      //   name: "Enterprise On-Prem",
      //   type: "Team",
      //   price: "Custom",
      //   priceId: "",
      //   description: "Plan tailored to your needs",
      //   headline: "Everything in Teams plan plus:",
      //   features: [
      //     "Runs on AWS, Azure, GCP...",
      //     {
      //       text: "Avanade agent build services",
      //       tooltip:
      //         "Avanade's internal services team will help you build / co-build agents and help you go live",
      //     },
      //     "Organizational General Intelligence",
      //     "Agent Entitlement Protocol",
      //     {
      //       text: "All models & BYOM",
      //       tooltip:
      //         "Bring your own model or you can use all models providede by Lyzr",
      //     },
      //     "Credits as per plan",
      //     {
      //       text: "Storage as per plan",
      //       tooltip: "Storage for your knowledgebase",
      //     },
      //     "Builder Licenses as per plan",
      //     "48 hour custom integration SLA",
      //     "24/7 Technical Support",
      //   ],
      // },
    ],
    yearly: [
      {
        name: "Community",
        type: "Individual",
        price: "$0",
        priceId: "",
        description: "Begin your Agent Studio journey at no cost.",
        headline: "",
        features: [
          "Build up to 10 Agents",
          "5 credits monthly",
          "1 Builder License",
          "Build upto 5 Knowledge bases",
          {
            text: "100 MB RAG Storage",
            tooltip: "Storage for your knowledgebase",
          },
          "Orchestration",
          "Limited Models",
          "Limited Blueprints",
          "7 day logs (Traceability & Observaibility)",
        ],
        brandingImages: [
          {
            name: "anuntatech com",
            logo: "/plans-brand-logos/anuntatech.webp",
            size: 60,
          },
          {
            name: "solaris hydrobotics",
            logo: "/plans-brand-logos/solaris-hydrobotics.webp",
            size: 60,
          },
        ],
      },
      {
        name: "Pro",
        type: "Individual",
        price: "$948",
        monthlyPrice: "99",
        yearlyPrice: "79",
        priceId: "prc_pro-plan-yearly-new-rx2xe0por",
        description: "Upgrade to Pro for more features and benefits",
        headline: "",
        features: [
          "Build up to 25 Agents",
          "Upgraded to 1200 credits/year",
          "1 Builder License",
          "Build upto 15 Knowledge bases",
          {
            text: "Upgraded to 1 GB RAG Storage",
            tooltip: "Storage for your knowledgebase",
          },
          "Orchestration",
          "Limited Models",
          "Limited Blueprints",
          "7 day logs (Traceability & Observaibility)",
          {
            text: "Supports few Super Agents",
            tooltip:
              "Plug & Play Agents - AI SDR, AI Phone Dialer, AI Marketer are available on plans Pro and above",
          },
        ],
        brandingImages: [
          {
            name: "emudhra",
            logo: "/plans-brand-logos/emudhra.webp",
            size: 70,
          },
          {
            name: "abi health",
            logo: "/plans-brand-logos/abi-health.webp",
            size: 60,
          },
        ],
      },
      // {
      //   name: "Teams",
      //   type: "Team",
      //   price: "$9948",
      //   monthlyPrice: "999",
      //   yearlyPrice: "829",
      //   priceId: "prc_teams-plan-yearly-7cgo0s0x",
      //   description: "Plan offers advanced features for smaller teams",
      //   headline: "Everything in Pro plan plus:",
      //   features: [
      //     "Upgraded to 1.2M credits/year",
      //     {
      //       text: "Upgraded to 10 GB Storage",
      //       tooltip: "Storage for your knowledgebase",
      //     },
      //     "Upgraded to 10 Builder Licenses",
      //     "User access control",
      //     "Collaboration & Sharing",
      //     {
      //       text: "All super agents",
      //       tooltip:
      //         "Avanade's internal services team will help you build / co-build agents and help you go live",
      //     },
      //     "96 hour custom integration SLA",
      //   ],
      //   brandingImages: [
      //     {
      //       name: "air asia",
      //       logo: "/plans-brand-logos/air-asia.webp",
      //       size: 70,
      //     },
      //     {
      //       name: "hfs health",
      //       logo: "/plans-brand-logos/hfs.webp",
      //       size: 120,
      //     },
      //   ],
      // },
      {
        name: "Enterprise",
        type: "Team",
        price: "Custom",
        priceId: "",
        description: "Plan offers advanced features for large teams",
        headline: "Everything in Pro plan plus:",
        features: [
          {
            text: "Avanade agent build services",
            tooltip:
              "Avanade's internal services team will help you build / co-build agents and help you go live",
          },
          "Deploy on Lyzr Cloud or On-Prem",
          // "Organizational General Intelligence (as per plan)",
          "Agent Entitlement Protocol",
          {
            text: "All models & Bring Your Own Model",
            tooltip:
              "Bring your own model or you can use all models providede by Lyzr",
          },
          "Team Collaboration",
          {
            text: "Credits & RAG storage as per plan",
            tooltip: "Credits as per plan. Storage for your knowledgebase",
          },
          "All Blueprints",
          "Responsible AI & Hallucination Manager",
          {
            text: "Agent Eval",
            tooltip: "Evaluates your agents against auto-generated test cases.",
          },
          "Logs (Traceability & Observability) as per plan",
          "48 hour custom integration SLA",
          "24/7 Technical Support",
        ],
        brandingImages: [
          {
            name: "accenture",
            logo: "/plans-brand-logos/accenture.webp",
            size: 70,
          },
          {
            name: "ntt data",
            logo: "/plans-brand-logos/ntt-data.webp",
            size: 150,
          },
        ],
        isPopular: false,
      },
      // {
      //   name: "Enterprise On-Prem",
      //   type: "Team",
      //   price: "Custom",
      //   priceId: "",
      //   description: "Plan for enterprises tailored to your needs",
      //   headline: "Everything in Teams plan plus:",
      //   features: [
      //     "Runs on AWS, Azure, GCP...",
      //     {
      //       text: "Avanade agent build services",
      //       tooltip:
      //         "Avanade's internal services team will help you build / co-build agents and help you go live",
      //     },
      //     "Organizational General Intelligence",
      //     "Agent Entitlement Protocol",
      //     {
      //       text: "All models & BYOM",
      //       tooltip:
      //         "Bring your own model or you can use all models providede by Lyzr",
      //     },
      //     "Credits as per plan",
      //     {
      //       text: "Storage as per plan",
      //       tooltip: "Storage for your knowledgebase",
      //     },
      //     "Builder Licenses as per plan",
      //     "48 hour custom integration SLA",
      //     "24/7 Technical Support",
      //   ],
      // },
    ],
  };

  // if (hasOrgPlan) {
  //   plans[planType].splice(1, 1);
  // }

  return plans;
};

export const topUpPlans: ITopUpPrice[] = [
  {
    price: 10,
    priceId: "prc_additional-credits-10-y29o03gf",
    credits: 10 * 100,
    creditsString: "10",
  },
  {
    price: 50,
    priceId: "prc_additional-one-time-0m6r01n3",
    credits: 50 * 100,
    creditsString: "50",
  },
  {
    price: 100,
    priceId: "prc_additional-credits-100-cv9w03mv",
    credits: 100 * 100,
    creditsString: "100",
  },
  {
    price: 1000,
    priceId: "prc_additional-credits-1000-k9aq003f",
    credits: 1000 * 100,
    creditsString: "1000",
  },
  {
    price: 5000,
    priceId: "prc_additional-credits-5000-y5a10310",
    credits: 5000 * 100,
    creditsString: "5000",
  },
];

export const brandingImages = [
  [
    {
      name: "anuntatech com",
      logo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRhhZbbtoKqRFwysToWzSU6aqmm23PaEK7zsw&s",
      size: 60,
    },
    {
      name: "solaris hydrobotics",
      logo: "https://static.wixstatic.com/media/7f1fbb_81200dd9cd7846908bbc9b7824c6c0d7~mv2.jpg",
      size: 60,
    },
  ],
  [
    {
      name: "Ciklum",
      logo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTMcusgfWFefeyWJnrpebZwZkb0_CX8E1vmmA&s",
      size: 80,
    },
    // {
    //   name: "thinkers 360",
    //   logo: "https://res.cloudinary.com/procurement-leaders/image/upload/v1649167883/marketplace/gjir5azoctwaf3k9gakl.jpg",
    //   size: 50,
    // },
  ],
  [
    {
      name: "emudhra",
      logo: "https://companieslogo.com/img/orig/EMUDHRA.NS_BIG-190af00e.png?t=1720244491",
      size: 70,
    },
    {
      name: "abi health",
      logo: "https://image4.owler.com/logo/abi-health_owler_20231218_125443_original.png",
      size: 60,
    },
  ],
  [
    {
      name: "air asia",
      logo: "https://images.seeklogo.com/logo-png/0/1/air-asia-logo-png_seeklogo-5027.png",
      size: 70,
    },
    {
      name: "hfs health",
      logo: "",
      size: 120,
    },
  ],
  [
    {
      name: "accenture",
      logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/Accenture.svg/1024px-Accenture.svg.png",
      size: 70,
    },
    {
      name: "ntt data",
      logo: "https://upload.wikimedia.org/wikipedia/commons/6/67/Logo_Global_NTT_DATA_Future_Blue_RGB.png",
      size: 150,
    },
  ],
];

export const pricingPlans: PricingPlan[] = [
  {
    id: "community",
    name: "Community",
    description: "Great for trying things out",
    price: {
      amount: 0,
      currency: "$",
      period: "month",
    },
    features: [
      // { name: "Monthly Subscription", value: "$0" },
      // { name: "Annual Subscription", value: "$0" },
      // { name: "Credits", value: "500/month" },
      { name: "# of Agents", value: 10 },
      { name: "# of Knowledge Bases", value: 5 },
      { name: "Knowledge Base Storage", value: "100 MB" },
      { name: "# of Tools", value: 5 },
      { name: "Collaboration & Team Members", value: false },
      { name: "Orchestration", value: true },
      { name: "Blueprints", value: "Few" },
      { name: "Pre-built Super Agents", value: false },
      { name: "Agent Entitlement", value: false },
      { name: "Agent Eval", value: false },
      { name: "Responsible AI", value: false },
      { name: "Hallucination Manager", value: false },
      { name: "Logs", value: "7 day Traces" },
      { name: "Custom Integration SLA", value: false },
      { name: "Support", value: "Email" },
    ],
    ctaText: "Get Started Free",
  },
  {
    id: "starter",
    name: "Starter",
    description: "Perfect for getting started",
    price: {
      amount: 29,
      currency: "$",
      period: "month",
    },
    features: [
      // { name: "Monthly Subscription", value: "$19" },
      // { name: "Annual Subscription", value: "Not available" },
      // { name: "Credits", value: "2000/month" },
      { name: "# of Agents", value: 15 },
      { name: "# of Knowledge Bases", value: 10 },
      { name: "Knowledge Base Storage", value: "100 MB" },
      { name: "# of Tools", value: 10 },
      { name: "Collaboration & Team Members", value: false },
      { name: "Orchestration", value: true },
      { name: "Blueprints", value: "Few" },
      { name: "Pre-built Super Agents", value: false },
      { name: "Agent Entitlement", value: false },
      { name: "Agent Eval", value: false },
      { name: "Responsible AI", value: false },
      { name: "Hallucination Manager", value: false },
      { name: "Logs", value: "7 day Traces" },
      { name: "Custom Integration SLA", value: false },
      { name: "Support", value: "Email" },
    ],
    ctaText: "Start Free Trial",
  },
  {
    id: "pro",
    name: "Pro",
    description: "For professionals who need scale",
    price: {
      amount: 99,
      currency: "$",
      period: "month",
    },
    features: [
      // { name: "Monthly Subscription", value: "$99" },
      // { name: "Annual Subscription", value: "$948" },
      // { name: "Credits", value: "10000/month" },
      { name: "# of Agents", value: 25 },
      { name: "# of Knowledge Bases", value: 15 },
      { name: "Knowledge Base Storage", value: "1 GB" },
      { name: "# of Tools", value: 25 },
      { name: "Collaboration & Team Members", value: false },
      { name: "Orchestration", value: true },
      { name: "Blueprints", value: "Few" },
      { name: "Pre-built Super Agents", value: true },
      { name: "Agent Entitlement", value: false },
      { name: "Agent Eval", value: false },
      { name: "Responsible AI", value: false },
      { name: "Hallucination Manager", value: false },
      { name: "Logs", value: "7 day Traces" },
      { name: "Custom Integration SLA", value: false },
      { name: "Support", value: "Email" },
    ],
    ctaText: "Upgrade Now",
  },
  {
    id: "custom",
    name: "Custom",
    description: "Tailored to your enterprise needs",
    price: "As per plan",
    features: [
      // { name: "Monthly Subscription", value: "Custom" },
      // { name: "Annual Subscription", value: "Custom" },
      // { name: "Credits", value: "As per plan" },
      { name: "# of Agents", value: "Unlimited" },
      { name: "# of Knowledge Bases", value: "Unlimited" },
      { name: "Knowledge Base Storage", value: "As per plan" },
      { name: "# of Tools", value: "Unlimited" },
      { name: "Collaboration & Team Members", value: true },
      { name: "Orchestration", value: true },
      { name: "Blueprints", value: "All" },
      { name: "Pre-built Super Agents", value: true },
      { name: "Agent Entitlement", value: true },
      { name: "Agent Eval", value: true },
      { name: "Responsible AI", value: true },
      { name: "Hallucination Manager", value: true },
      { name: "Logs", value: "As per plan" },
      { name: "Custom Integration SLA", value: "48 hour" },
      { name: "Support", value: "24x7 Support" },
    ],
    ctaText: "Contact Sales",
  },
];

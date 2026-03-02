export interface LyzrApp {
  id: string;
  name: string;
  description: string;
  categories?: string[];
  industry_tag?: string;
  function_tag?: string;
  category_tag: string;
  problems: string[];
  benefits: string[];
  videoUrl: string;
  launch_link: string;
  navigation_path: string;
  hub: string;
  demo?: boolean;
  forProAnAbove: boolean;
  new?: boolean;
  special?: ("Beta" | "Demo" | "Pro")[];
  coming_soon?: boolean;
}

export const lyzrApps: LyzrApp[] = [
  // Core Utility Hub Apps
  {
    id: "lyzr-gpt",
    name: "AvanadeGPT",
    description:
      "Your private, model-agnostic ChatGPT alternative for enterprises.",
    category_tag: "Core Utility",
    problems: [
      "Data Privacy Concerns: Enterprise data shared with public AI tools may be used for training or exposed to security risks.",
      "Vendor Lock-in: Dependence on a single AI provider limits flexibility and negotiating power.",
      "Compliance Issues: Public AI services may not meet industry-specific regulatory requirements.",
    ],
    benefits: [
      "Complete Data Privacy: Your conversations and data stay within your enterprise infrastructure.",
      "Model Flexibility: Switch between different AI models without changing your workflow.",
      "Enterprise-Grade Security: Built with compliance and security requirements in mind.",
    ],
    videoUrl: "",
    launch_link: "https://chat.lyzr.app",
    navigation_path: "/agent-marketplace/core-utility-hub/lyzr-gpt",
    hub: "core-utility",
    forProAnAbove: false,
    coming_soon: false,
  },
  {
    id: "open-source-perplexity",
    name: "Open Source Perplexity",
    description:
      "Self-hosted AI search engine powered by Lyzr agents. Get accurate, citation-backed answers from web searches with privacy-first architecture. Deploy your own intelligent search with pro-mode multi-step reasoning.",
    industry_tag: "Software & IT Services",
    function_tag: "Research & Knowledge Management",
    category_tag: "AI-Powered Search & Insights",
    problems: [
      "**Search engines lack context:** Traditional search returns links, not answers to your actual questions.",
      "**Privacy concerns with AI search:** Commercial AI search tools track your queries and collect data.",
      "**Complex research takes hours:** Multi-step research queries require manual work across multiple searches.",
    ],
    benefits: [
      "**Citation-backed answers instantly:** Get comprehensive responses with full source attribution, not just links.",
      "**Complete privacy control:** Self-hosted solution with no tracking or data collection on your searches.",
      "**Pro mode for deep research:** Automatically breaks complex queries into logical steps and synthesizes findings.",
    ],
    videoUrl: "https://www.youtube.com/embed/nuibctW1P3M",
    launch_link: "https://perplexity-oss.lyzr.app/",
    navigation_path:
      "/agent-marketplace/core-utility-hub/open-source-perplexity",
    hub: "core-utility",
    demo: true,
    forProAnAbove: false,
  },
  {
    id: "internal-knowledge-search",
    name: "Internal Knowledge Search",
    description:
      "The Enterprise AI knowledge search for enterprise's collective knowledge.",
    category_tag: "Core Utility",
    problems: [
      "Fragmented Knowledge: Critical information is scattered across Slack, emails, documents, wikis, and databases, making it nearly impossible to find what you need.",
      "Hours Lost to Search: Employees waste 2-5 hours per week manually searching for files, policies, or project updates across disconnected systems.",
      "Duplicate Work: Teams often recreate documents or solutions because they can't find existing resources, leading to inefficiency and wasted effort.",
    ],
    benefits: [
      "Unified Intelligence: Search across all enterprise systems—Slack, Google Drive, Confluence, SharePoint, and more—from a single interface.",
      "Instant Discovery: AI-powered semantic search delivers precise answers in seconds, not hours, by understanding intent rather than just keywords.",
      "Context-Aware Results: Automatically surfaces relevant documents, conversations, and insights based on your role, projects, and access permissions.",
    ],
    videoUrl: "",
    launch_link: "",
    navigation_path:
      "/agent-marketplace/core-utility-hub/internal-knowledge-search",
    hub: "core-utility",
    forProAnAbove: false,
    coming_soon: true,
  },
  {
    id: "daily-news-agent",
    name: "Daily News Agent",
    description:
      "Your customisable personalised news agent to keep you up to date on your favourite topics.",
    category_tag: "Core Utility",
    problems: [
      "Information Overload: Professionals are overwhelmed by hundreds of irrelevant news articles, social media updates, and industry reports every day.",
      "Critical Updates Get Missed: Without intelligent filtering, important industry developments, competitor moves, or regulatory changes slip through unnoticed.",
      "Productivity Drain: Manually scanning multiple news sources, newsletters, and feeds takes hours away from strategic work.",
    ],
    benefits: [
      "Personalized Intelligence: Receives only news that matters to your role, industry, and specific interests—delivered as concise summaries.",
      "Proactive Alerts: Automatically flags breaking news, competitor announcements, or market shifts relevant to your business.",
      "Time Savings: Transforms hours of manual news monitoring into a 5-minute daily briefing with actionable insights.",
    ],
    videoUrl: "",
    launch_link: "",
    navigation_path: "/agent-marketplace/core-utility-hub/daily-news-agent",
    hub: "core-utility",
    forProAnAbove: false,
    coming_soon: true,
  },
  {
    id: "agentic-copilot",
    name: "Agentic CoPilot",
    description:
      "Handles your emails & helps you manage your action items better.",
    category_tag: "Core Utility",
    problems: [
      "Inbox Chaos: Professionals receive 100+ emails daily, with critical action items buried beneath newsletters, FYIs, and spam.",
      "Missed Follow-Ups: Important tasks mentioned in email threads get forgotten, leading to dropped balls and damaged relationships.",
      "Context Switching Overhead: Constantly jumping between email, calendar, task lists, and Slack fragments focus and kills productivity.",
    ],
    benefits: [
      "Intelligent Email Management: Automatically categorizes, prioritizes, and drafts responses to routine emails, keeping your inbox under control.",
      "Zero Missed Actions: Extracts commitments, deadlines, and follow-ups from conversations and adds them to your task system with full context.",
      "Unified Workflow: Bridges email, calendar, and task management so you stay focused on execution rather than coordination.",
    ],
    videoUrl: "",
    launch_link: "",
    navigation_path: "/agent-marketplace/core-utility-hub/agentic-copilot",
    hub: "core-utility",
    forProAnAbove: false,
    coming_soon: true,
  },
  {
    id: "website-chat-agent",
    name: "Website Chat Agent",
    description:
      "Customisable ready to deploy chat agent for your website which you can build and deploy right away.",
    category_tag: "Core Utility",
    problems: [
      "Support Ticket Explosion: Every simple question generates a support ticket, overwhelming teams and slowing response times.",
      "24/7 Gaps: Customers outside business hours get no answers, leading to frustration and lost conversions.",
      "Inconsistent Responses: Different agents give different answers to the same questions, damaging trust and brand reputation.",
    ],
    benefits: [
      "Instant Deployment: Build, customize, and launch a branded chat agent in under 10 minutes—no coding required.",
      "Always-On Support: Handles common questions, troubleshooting, and product inquiries 24/7, reducing support load by 60-80%.",
      "Perfect Consistency: Delivers accurate, on-brand responses every time by drawing from your knowledge base and documentation.",
    ],
    videoUrl: "",
    launch_link: "",
    navigation_path: "/agent-marketplace/core-utility-hub/website-chat-agent",
    hub: "core-utility",
    forProAnAbove: false,
    coming_soon: true,
  },
  // Customer Service Hub Apps
  {
    id: "customer-experience-agent",
    name: "Customer Experience Agent",
    description:
      "Analyzes customer interaction data to improve personalized service and provides actionable feedback to help refine customer service.",
    category_tag: "Customer Service",
    function_tag: "Customer Service",
    problems: [
      "Invisible Customer Pain Points: Customer frustrations remain hidden in unstructured feedback, support tickets, and chat logs—never surfacing to decision-makers.",
      "Generic Service Experience: Without understanding individual customer history and preferences, teams deliver one-size-fits-all service that feels impersonal.",
      "Reactive Problem-Solving: Issues only get addressed after multiple complaints, damaging customer relationships and increasing churn.",
    ],
    benefits: [
      "Deep Customer Intelligence: Automatically analyzes every interaction—calls, chats, emails, surveys—to identify patterns, sentiment shifts, and emerging issues.",
      "Hyper-Personalized Service: Equips support teams with full customer context and preferences, enabling tailored responses that build loyalty.",
      "Proactive Improvement: Surfaces actionable insights and recommendations to fix systemic issues before they escalate into widespread problems.",
    ],
    videoUrl: "",
    launch_link: "",
    navigation_path:
      "/agent-marketplace/customer-service-hub/customer-experience-agent",
    hub: "customer-service",
    forProAnAbove: false,
    coming_soon: true,
  },
  {
    id: "customer-service-agent",
    name: "Customer Service Agent",
    description:
      "Manages a broad range of customer inquiries via email and chat, enhancing the responsiveness of customer service departments.",
    category_tag: "Customer Service",
    function_tag: "Customer Service",
    problems: [
      "Support Bottlenecks: Customer service teams are overwhelmed with routine inquiries about order status, account issues, and product questions—delaying responses to complex cases.",
      "Inconsistent Response Quality: Different agents handle similar queries differently, leading to varying customer experiences and confusion.",
      "High Operational Costs: Scaling customer support to meet demand requires hiring more agents, significantly increasing costs.",
    ],
    benefits: [
      "Handles Routine Inquiries Autonomously: Resolves 70-90% of common customer questions via email and chat instantly—freeing human agents for complex issues.",
      "Consistent, High-Quality Responses: Delivers accurate, on-brand answers every time by drawing from your knowledge base and business rules.",
      "Scales Without Hiring: Handles unlimited concurrent conversations during peak demand without adding headcount or infrastructure costs.",
    ],
    videoUrl: "",
    launch_link: "",
    navigation_path:
      "/agent-marketplace/customer-service-hub/customer-service-agent",
    hub: "customer-service",
    forProAnAbove: false,
    coming_soon: true,
  },
  {
    id: "email-triage-agent",
    name: "Email Triage Agent",
    description:
      "Automates the process of sorting incoming emails into categories and prioritizing them.",
    category_tag: "Customer Service",
    function_tag: "Customer Service",
    problems: [
      "Manual Email Sorting: Support teams waste hours daily categorizing and routing incoming customer emails to the right departments or agents.",
      "Delayed Response to Urgent Issues: Critical customer issues get buried in the inbox alongside low-priority inquiries, causing SLA breaches.",
      "Inefficient Workload Distribution: Without intelligent prioritization, agents either get overwhelmed or spend time on low-impact tasks.",
    ],
    benefits: [
      "Instant Categorization: Automatically sorts incoming emails by type, urgency, and required action—routing them to the right team or queue.",
      "Priority-Based Routing: Flags high-priority issues (angry customers, service outages, legal threats) for immediate human attention.",
      "Reduced Response Times: Eliminates manual triage delays, ensuring customers get routed to the right resource in seconds, not hours.",
    ],
    videoUrl: "",
    launch_link: "",
    navigation_path:
      "/agent-marketplace/customer-service-hub/email-triage-agent",
    hub: "customer-service",
    forProAnAbove: false,
    coming_soon: true,
  },
  // Banking & Insurance Hub Apps
  {
    id: "regulatory-monitoring-agent",
    name: "Regulatory Monitoring Agent",
    description:
      "Avanade's Regulatory Monitoring Agent transforms the way banks and financial institutions stay compliant. By combining real-time regulatory tracking with Generative AI capabilities, this agent ensures teams are always informed and prepared to act.",
    industry_tag: "Banking & Financial Services",
    category_tag: "Productivity & Cost Savings",
    problems: [
      "Manual Tracking Overload: Regulatory bodies frequently update guidelines and publish notices that banks must comply with. Traditional methods require manual monitoring, leading to delays or missed updates.",
      "Fragmented Information: Regulatory documents are often published across multiple formats and sections, making them hard to consolidate or search through. Without automated analytics, identifying fraudulent or high-risk claims becomes challenging, resulting in potential financial losses.",
      "Resource-Heavy Queries: Compliance teams often rely on legal or regulatory experts to interpret regulations, creating bottlenecks and increasing costs.",
    ],
    benefits: [
      "Faster Decision Making: Empowers teams to get answers on-demand, speeding up compliance workflows.",
      "Proactive Compliance: Enables teams to stay ahead of regulatory changes by automating discovery and interpretation.",
      "Reduced Legal Overhead: Minimizes reliance on manual review by legal experts, reducing compliance costs.",
    ],
    videoUrl: "https://www.youtube.com/embed/S_lMJJ5LSVI",
    launch_link: "https://regulatory-monitoring-agent.studio.lyzr.ai/",
    navigation_path:
      "/agent-marketplace/banking-insurance-hub/regulatory-monitoring-agent",
    hub: "banking-insurance",
    demo: true,
    forProAnAbove: false,
    special: ["Demo"],
  },
  {
    id: "banking-refund-management-agent",
    name: "Banking Refund Management Agent",
    description:
      "Avanade's Banking Refund Management Agent streamlines the entire refund process for credit card transactions. It handles everything from verifying refund requests and reviewing transaction history to deciding whether a refund is warranted—ultimately reducing operational overhead, minimizing fraud risk, and improving customer satisfaction.",
    industry_tag: "Banking & Financial Services",
    category_tag: "Customer Experience",
    problems: [
      "Complex, Manual Processes: Traditional refund workflows involve multiple teams and systems, leading to inconsistent decisions and long turnaround times.",
      "Customer Dissatisfaction: Delays in refund decisions and unclear communication can erode trust and lead to negative customer experiences.",
      "Fraud & Abuse Risks: Without robust analytics, banks struggle to distinguish legitimate refund requests from those initiated by bad actors, potentially resulting in unnecessary financial losses.",
    ],
    benefits: [
      "Faster Refund Processing: Automates the back-and-forth tasks of verifying and approving refunds, slashing response times and boosting customer satisfaction.",
      "Reduced Fraud & Chargebacks: Advanced analytics and user profiling identify high-risk requests early, significantly reducing losses due to fraudulent claims.",
      "Scalable & Adaptable: Easily integrate additional Lyzr Agents—like dispute resolution or compliance agents—without revamping existing systems or processes.",
    ],
    videoUrl: "https://www.youtube.com/embed/QtRkTldHhvk",
    launch_link: "https://refund-assistant.studio.lyzr.ai/",
    navigation_path:
      "/agent-marketplace/banking-insurance-hub/banking-refund-management-agent",
    hub: "banking-insurance",
    demo: true,
    forProAnAbove: false,
    special: ["Demo"],
  },
  {
    id: "teller-assistance",
    name: "Teller Assistance",
    description:
      "Avanade's Teller Assistance Agent enhances in-branch banking experiences by listening to live teller-customer conversations and proactively surfacing relevant knowledge base articles, policy documents, and product details. By providing real-time guidance, the agent empowers tellers to address customer queries accurately and efficiently, reducing wait times and improving overall customer satisfaction",
    category_tag: "Customer Experience",
    industry_tag: "Banking & Financial Services",
    problems: [
      "Delayed Responses: Tellers often need to manually search for policies, product details, or FAQs, leading to longer wait times",
      "Inconsistent Information: Human error and lack of quick reference materials can result in inconsistent answers across different branches",
      "Customer Frustration: Long processing times and incomplete responses reduce customer trust and satisfaction",
    ],
    benefits: [
      "Consistent & Fast Transactions: Instantly provides tellers with accurate, policy-aligned information, reducing compliance risks",
      "Enhanced Customer Experience: Customers receive quicker service and clear, consistent answers, boosting satisfaction and loyalty",
      "Reduced Training Overhead: New or rotating staff can quickly become productive, as the agent delivers real-time guidance on products and procedures",
    ],
    videoUrl: "https://www.youtube.com/embed/f7vkcZEaX1I",
    launch_link: "https://teller-assistance.studio.lyzr.ai/",
    navigation_path:
      "/agent-marketplace/banking-insurance-hub/teller-assistance",
    hub: "banking-insurance",
    demo: true,
    forProAnAbove: false,
    special: ["Demo"],
  },
  {
    id: "banking-customer-service",
    name: "Banking Customer Service",
    description:
      "Avanade's AI Customer Service Agent for banking is a highly modular, multi-agent system designed to automate customer support across chat, email, and voice. Powered by 20+ customizable agents in the background, it manages up to 90% of routine queries, freeing human teams to focus on high-impact issues",
    function_tag: "Customer Service",
    category_tag: "Customer Experience",
    problems: [
      "Underutilized Software: Many organizations pay full licensing fees for customer service platforms but utilize only around 10% of their capabilities",
      "Overloaded Support Teams: Traditional customer service channels are stretched thin by repetitive, low-value queries, leading to slower response times and high operational costs",
      "Complex Regulatory Landscape: Banking compliance demands adaptable systems that can quickly adjust to new guidelines",
    ],
    benefits: [
      "Reduced Costs: By automating up to 90% of inquiries, banks significantly cut down on operational expenses and license fees for underused software features",
      "Bolt-on Model: Adopt AI agents as bolt-on software onto your core systems, like core banking systems, ensuring minimal change management and maximum impact",
      "Improved Customer Satisfaction: Faster response times and consistent accuracy lead to higher customer loyalty and stronger brand reputation",
    ],
    videoUrl: "https://www.youtube.com/embed/e9VOcnKqdNQ",
    launch_link: "https://ai-customer-support.lyzr.app/",
    navigation_path:
      "/agent-marketplace/banking-insurance-hub/banking-customer-service",
    hub: "banking-insurance",
    demo: true,
    forProAnAbove: false,
    special: ["Demo"],
  },
  {
    id: "claims-processing-agent",
    name: "Claims Processing Agent",
    description:
      "Avanade's Claims Processing Agent automates the complex task of verifying and validating insurance claims. From document analysis to eligibility decisions, it seamlessly identifies compliant claims, flags inconsistencies, and accelerates approvals—significantly improving efficiency, reducing manual overhead, and enhancing customer satisfaction.",
    category_tag: "Productivity & Cost Savings",
    industry_tag: "Banking & Financial Services",
    problems: [
      "Manual, time-Intensive verification: Traditional claims processes rely on human verification, leading to slow, inconsistent, and error-prone decision-making.",
      "High fraud risk: Without automated analytics, identifying fraudulent or high-risk claims becomes challenging, resulting in potential financial losses.",
      "Customer frustration: Lengthy processing times and lack of transparency negatively impact policyholder trust and satisfaction",
    ],
    benefits: [
      "Improved Customer Experience: Enhances policyholder satisfaction through quicker, clearer communication and transparency.",
      "Highly scalable: Effortlessly handles increased claim volumes, easily adapting to evolving insurance standards and criteria.",
      "Operational efficiency: Eliminates repetitive, manual verification tasks, allowing insurance teams to focus on complex cases",
    ],
    videoUrl: "https://www.youtube.com/embed/02JvgoVyIHM",
    launch_link: "https://claims-processing-agent.studio.lyzr.ai/",
    navigation_path:
      "/agent-marketplace/banking-insurance-hub/claims-processing-agent",
    hub: "banking-insurance",
    demo: true,
    forProAnAbove: false,
    special: ["Demo"],
  },
  {
    id: "customer-onboarding-agent",
    name: "Customer Onboarding Agent for Banks",
    description:
      "Avanade's Customer Onboarding Agent for Banking is a powerful multi-agent system designed to automate and streamline the customer onboarding journey. From digitizing hand-signed applications to generating credit reports and account creation documents, it eliminates manual effort, improves compliance, and ensures a faster, more reliable onboarding experience.",
    category_tag: "Productivity & Cost Savings",
    industry_tag: "Banking & Financial Services",
    problems: [
      "Manual Data Entry & Delays: Handwritten customer applications require manual data entry, slowing down the onboarding process and increasing the risk of human error. Scaling becomes a lot difficult.",
      "Fragmented Processes: Credit checks, document generation, and approvals often span multiple systems and departments, leading to inefficiencies and inconsistent outcomes.",
      "Regulatory Compliance Challenges: Verifying sanctions, anti-money laundering (AML) status, and creditworthiness requires access to disparate databases and stringent compliance checks.",
    ],
    benefits: [
      "Cost-Efficient Scalability: Easily scale onboarding operations without increasing staff or infrastructure—ideal for peak load or expansion periods.",
      "Saves lot of time & effort: Batch processing support ensures onboarding through uploads of hundreds or thousands of customer profiles.",
      "Enhanced User Experience: Offers both agents and back-office teams a clear, structured view of the onboarding pipeline, improving operational transparency.",
    ],
    videoUrl: "https://www.youtube.com/embed/9f29UarWIp0",
    launch_link: "https://customer-onboarding.studio.lyzr.ai/",
    navigation_path:
      "/agent-marketplace/banking-insurance-hub/customer-onboarding-agent",
    hub: "banking-insurance",
    demo: false,
    forProAnAbove: false,
    special: ["Demo"],
  },
  {
    id: "litigation-analyzer-agent",
    name: "Litigation Analyzer Agent",
    description:
      "Litigation Analyzer Agent is a game-changing AI solution for legal professionals and business teams facing complex litigation documents. Whether it's understanding a lengthy legal submission, dissecting court verdicts, or preparing a strategic response, this agent simplifies the review process by extracting key entities, clauses, and issues.",
    category_tag: "Productivity & Cost Savings",
    industry_tag: "Banking & Financial Services",
    problems: [
      "Cumbersome Legal Documents: Legal submissions are often long, jargon-heavy, and difficult to navigate quickly—especially when time-sensitive decisions are needed.",
      "Manual Review Bottlenecks: Reviewing hundreds of pages manually to extract context, references, and relevance slows down legal workflows and increases risk.",
      "Lack of Strategic Context: Identifying actionable insights from litigation documents—such as the key issues, parties involved, legal citations, or verdicts—requires a seasoned eye and extensive effort.",
    ],
    benefits: [
      "Reduced Legal Risk: Ensure that no critical clause or reference is missed, reducing the likelihood of oversight in litigation response.",
      "Faster Case Understanding: Jump directly to the important parts of a legal document, without hours of manual review.",
      "Enhanced Legal Strategy: Gain clarity on underlying issues and verdict patterns to decide whether to pursue, settle, or escalate a case.",
    ],
    videoUrl: "https://www.youtube.com/embed/5syGsgp0_VA",
    launch_link: "https://litigation-analyzer.studio.lyzr.ai/",
    navigation_path:
      "/agent-marketplace/banking-insurance-hub/litigation-analyzer-agent",
    hub: "banking-insurance",
    demo: false,
    forProAnAbove: false,
    special: ["Beta"],
  },
  // Sales Hub Apps
  {
    id: "jazon",
    name: "Jazon AI SDR",
    description:
      "Jazon acts as your SDR, handling outreach campaigns autonomously. It tailors emails to prospects using their name and company details, schedules follow-ups, and manages multiple campaigns effortlessly. Focus on strategy while Jazon drives personalized, timely communication and consistent engagement.",
    function_tag: "Sales",
    category_tag: "Productivity & Cost Savings",
    problems: [
      "Manual Campaign Management: Running outreach campaigns 24/7 requires extensive manpower",
      "Missed Opportunities: Inconsistent follow-ups lead to lost prospects and reduced conversion rates",
      "Effort-Intensive Personalization: Crafting and tailoring emails for each contact takes significant time and effort",
    ],
    benefits: [
      "Time Savings: Automates the entire campaign workflow, from drafting to scheduling follow-ups",
      "Scalable Outreach: Easily manages multiple campaigns, reaching out to hundreds of prospects with tailored messaging",
      "Consistent Engagement: Maintains a steady cadence of communication with configured custom sequences",
    ],
    videoUrl: "",
    launch_link: "https://jazon.studio.lyzr.ai/",
    navigation_path: "/agent-marketplace/sales-hub/jazon",
    hub: "sales",
    forProAnAbove: true,
    special: ["Beta"],
  },
  {
    id: "jazon-lite",
    name: "Jazon AI SDR (Lite)",
    description:
      "Jazon Lite acts as your SDR, handling outreach campaigns autonomously. It tailors emails to prospects using their name and company details, schedules follow-ups, and manages multiple campaigns effortlessly. Focus on strategy while Jazon Lite drives personalized, timely communication and consistent engagement.",
    function_tag: "Sales",
    category_tag: "Productivity & Cost Savings",
    problems: [
      "Manual Campaign Management: Running outreach campaigns 24/7 requires extensive manpower",
      "Missed Opportunities: Inconsistent follow-ups lead to lost prospects and reduced conversion rates",
      "Effort-Intensive Personalization: Crafting and tailoring emails for each contact takes significant time and effort",
    ],
    benefits: [
      "Time Savings: Automates the entire campaign workflow, from drafting to scheduling follow-ups",
      "Scalable Outreach: Easily manages multiple campaigns, reaching out to hundreds of prospects with tailored messaging",
      "Consistent Engagement: Maintains a steady cadence of communication with personalized follow-ups, boosting the effectiveness of your outreach",
    ],
    videoUrl: "https://www.youtube.com/embed/cCxXE65Cnbw",
    launch_link: "https://jazon-lite.studio.lyzr.ai/",
    navigation_path: "/agent-marketplace/sales-hub/jazon-lite",
    hub: "sales",
    forProAnAbove: false,
    special: ["Beta"],
  },
  {
    id: "cold-email-generator",
    name: "Cold-Email Generator",
    description:
      "The Cold-Email Generator helps you craft personalized, professional emails to engage with prospects effectively. It gathers company and customer details, drafts tailored email content, and provides suggestions to refine and improve your message. Save time and enhance your outreach efforts with this AI-powered assistant.",
    function_tag: "Sales",
    category_tag: "Productivity & Cost Savings",
    problems: [
      "Personalization is time consuming: Individuals need to spend hours crafting personalized mails for each prospect",
      "Follow up challenges: Following up with prospects at regular intervals is a lot of effort, and one can miss out on sending such emails",
      "Low engagement rates: Lack of personalization leads to low engagement rates",
    ],
    benefits: [
      "Increased Productivity: Allows you to focus on strategic tasks while simplifying email creation",
      "Enhanced Engagement: Personalized emails help build better connections with prospects",
      "Improved Email Quality: Suggestions for edits ensure that your emails are professional and impactful",
    ],
    videoUrl: "https://www.youtube.com/embed/9oKqzmbQupM",
    launch_link: "https://cold-email-generator.studio.lyzr.ai/",
    navigation_path: "/agent-marketplace/sales-hub/cold-email-generator",
    hub: "sales",
    forProAnAbove: false,
    special: ["Beta"],
  },
  {
    id: "content-intelligence-delivery-agent",
    name: "Content Intelligence & Delivery Agent",
    description:
      "Automatically delivers the right sales content to prospects at the right time based on deal stage, buyer persona, and engagement signals. Ensures sales teams always have relevant case studies, one-pagers, and pitch decks on hand.",
    function_tag: "Sales",
    category_tag: "Sales Enablement",
    problems: [
      "Content Buried in Shared Drives: Sales reps waste hours searching for the right deck, case study, or one-pager—often using outdated versions.",
      "Generic Pitches: Without context-aware content delivery, reps send generic materials that don't resonate with buyer needs or deal stage.",
      "Missed Follow-Up Opportunities: Reps forget to send promised resources after calls, damaging credibility and slowing deal velocity.",
    ],
    benefits: [
      "Smart Content Recommendations: Automatically suggests the most relevant assets based on prospect industry, pain points, and deal stage.",
      "Always Up-to-Date: Ensures reps use the latest, approved versions of sales collateral—no more outdated decks.",
      "Automated Follow-Up: Sends promised materials immediately after calls with personalized messaging, keeping deals moving.",
    ],
    videoUrl: "",
    launch_link: "",
    navigation_path:
      "/agent-marketplace/sales-hub/content-intelligence-delivery-agent",
    hub: "sales",
    forProAnAbove: false,
    coming_soon: true,
  },
  {
    id: "deal-intelligence-call-prep-agent",
    name: "Deal Intelligence & Call Preparation Agent",
    description:
      "Synthesizes deal history, stakeholder profiles, competitive intel, and recent news to generate comprehensive call prep briefs. Ensures sales reps enter every meeting fully prepared and contextualized.",
    function_tag: "Sales",
    category_tag: "Sales Enablement",
    problems: [
      "Reps Enter Calls Unprepared: Without full context on prospect companies, stakeholders, and deal history, reps ask redundant questions and miss opportunities.",
      "Scattered Intelligence: Deal notes live in CRM, competitive intel in Slack, news in browsers—forcing reps to manually piece together context.",
      "Generic Discovery: Lack of pre-call research leads to surface-level conversations that fail to uncover deeper pain points or buying signals.",
    ],
    benefits: [
      "Comprehensive Call Briefs: Auto-generates pre-call summaries with company background, stakeholder profiles, deal status, and competitive positioning.",
      "Real-Time Market Intelligence: Surfaces recent news, funding rounds, leadership changes, and industry trends relevant to the prospect.",
      "Strategic Talking Points: Suggests high-impact questions and value propositions tailored to the prospect's current challenges and priorities.",
    ],
    videoUrl: "",
    launch_link: "",
    navigation_path:
      "/agent-marketplace/sales-hub/deal-intelligence-call-prep-agent",
    hub: "sales",
    forProAnAbove: false,
    coming_soon: true,
  },
  // Marketing Hub Apps
  {
    id: "pitch-deck-evaluator",
    name: "Pitch Deck Evaluator Agent",
    description:
      "The Pitch Deck Evaluator Agent analyzes pitch decks based on key investment criteria like storyline, market opportunity, traction, product-solution fit and GTM Strategy. It provides instant scores and actionable feedback, helping founders refine their pitch. By leveraging investor guidelines and industry insights, the agent streamlines the pitch improvement process.",
    category_tag: "Productivity & Cost Savings",
    industry_tag: "Other",
    problems: [
      "Lack of Actionable Feedback: Founders often struggle to receive structured, data-driven insights on their decks",
      "Limited Scalability for Investors: Venture capital firms need an efficient way to review multiple pitch decks at scale",
      "Time-consuming:  Founders find the process of getting their pitch reviewed slow, especially when they need iterative feedback",
    ],
    benefits: [
      "Objective and Consistent Evaluation: Ensures standardized scoring and insights based on investor-defined criteria",
      "Collaboration and Iterative Improvement: Enables teams to export and share feedback, helping refine pitch decks effectively",
      "Instant, Data-Driven Analysis: Provides immediate feedback, reducing the time needed for manual reviews",
    ],
    videoUrl: "https://www.youtube.com/embed/jW9_4oob9GQ",
    launch_link: "https://pitchdeck-analysis.lyzr.app/",
    navigation_path:
      "/agent-marketplace/research-analysis-hub/pitch-deck-evaluator",
    hub: "research-analysis",
    forProAnAbove: false,
    special: ["Beta"],
  },
  {
    id: "deep-competitive-research-agent",
    name: "Deep Competitive Research Agent",
    description:
      "Avanade's Deep Competitive Research Agent conducts in-depth competitive analysis, gathering insights on your company and competitors across various criteria.",
    category_tag: "Productivity & Cost Savings",
    function_tag: "Research",
    problems: [
      "**Time-consuming competitive research:** Conducting thorough market research takes significant time and resources.",
      "**Scattered data sources:** Valuable insights are fragmented across multiple platforms, making it hard to consolidate information.",
      "**Requires a lot of manual effort:** Analyzing competitors and compiling structured reports demands extensive manual work.",
    ],
    benefits: [
      "**Comprehensive insights:** Gain a detailed breakdown of your company's strengths and weaknesses relative to competitors.",
      "**Customizable & Modular:** Choose and expand research parameters based on business needs.",
      "**Saves time & effort:** Automates data collection and analysis, reducing manual workload.",
    ],
    videoUrl: "https://www.youtube.com/embed/x8MxhMTyXzw",
    launch_link: "https://competitor-research.studio.lyzr.ai/",
    navigation_path:
      "/agent-marketplace/research-analysis-hub/deep-competitive-research-agent",
    hub: "research-analysis",
    forProAnAbove: true,
    special: ["Beta"],
  },
  {
    id: "image-generator",
    name: "AI Image Generator",
    description:
      "Bring your creative visions to life effortlessly. The AI Art Generator transforms simple prompts—like art subject, background setting, color palette, and emotional tone—into beautiful, customized artwork within seconds.",
    function_tag: "Design & Creative",
    category_tag: "Productivity & Cost Savings",
    problems: [
      "Creating professional-quality art manually requires significant time, skill, and resources.",
      "Communicating creative ideas to designers can lead to misinterpretation and back-and-forth.",
      "Limited access to tools or expertise often hinders personal or business creative projects.",
    ],
    benefits: [
      "Generate high-quality artwork instantly, even without design skills.",
      "Customize every detail—from mood to color palette—for truly personalized creations.",
      "Accelerate creative workflows for marketing, content creation, personal projects, and more.",
    ],
    videoUrl: "",
    launch_link: "https://image-generator.studio.lyzr.ai/",
    navigation_path: "/agent-marketplace/banking-insurance-hub/image-generator",
    hub: "marketing",
    demo: true,
    forProAnAbove: false,
    special: ["Beta"],
  },
  {
    id: "blog-to-post-agent",
    name: "BlogToPost Agent",
    description:
      "BlogToPost helps you get more from your blogs by turning them into ready-to-publish posts for LinkedIn, YouTube, and Twitter — no manual rewriting, no extra effort. Just input your blog and choose your platform. The agent handles the rest.",
    category_tag: "Productivity & Cost Savings",
    industry_tag: "Marketing",
    problems: [
      "Repurposing blogs manually takes too much time",
      "Tone, format, and length vary across platforms",
      "Teams often don't have the bandwidth to adapt content for each channel",
    ],
    benefits: [
      "Saves hours of rewriting for every blog",
      "Keeps tone consistent across platforms",
      "Scales content marketing without extra hires",
    ],
    videoUrl: "https://www.youtube.com/embed/NYzFJRn3Bpw",
    launch_link: "https://blog-to-post.studio.lyzr.ai/",
    navigation_path: "/agent-marketplace/marketing-hub/blog-to-post-agent",
    hub: "marketing",
    demo: false,
    forProAnAbove: false,
    special: ["Beta"],
  },
  {
    id: "marketing-data-collection-agent",
    name: "Marketing Data Collection Agent",
    description:
      "Automatically gather insights from your team and transform them into ready-to-use content. The agent collects project updates, technical documentation, and thought leadership from across your organization, builds a centralized knowledge base, and generates marketing content instantly.",
    industry_tag: "Software & IT Services",
    function_tag: "Marketing & Communications",
    category_tag: "Productivity & Knowledge Management",
    problems: [
      "**Valuable insights stay siloed:** Project managers, developers, and experts hold information that never reaches marketing.",
      "**Content creation lacks depth:** Marketing teams don't have access to technical details and real project stories.",
      "**Manual information gathering is slow:** Chasing down teammates for updates and documentation wastes time.",
    ],
    benefits: [
      "**Automated knowledge capture:** Continuously collects insights, updates, and documentation from your entire team.",
      "**Centralized intelligence hub:** All organizational knowledge stored in one searchable, accessible knowledge base.",
      "**Instant content generation:** AI creates marketing content from real team insights, not generic messaging.",
    ],
    videoUrl: "https://www.youtube.com/embed/9tga9Veh07M",
    launch_link: "https://marketing-data-collection.lyzr.app/",
    navigation_path:
      "/agent-marketplace/marketing-hub/marketing-data-collection-agent",
    hub: "marketing",
    demo: true,
    forProAnAbove: false,
  },
  {
    id: "content-copywriting-agent",
    name: "Content & Copywriting Agent",
    description:
      "Generates high-quality marketing copy, blog posts, email campaigns, and ad scripts based on your brand voice and target audience. Eliminates writer's block and accelerates content production.",
    function_tag: "Marketing & Communications",
    category_tag: "Content Creation",
    problems: [
      "Content Creation Bottleneck: Marketing teams struggle to produce enough high-quality content to maintain consistent publishing schedules.",
      "Inconsistent Brand Voice: Different writers create content with varying tones and messaging, diluting brand identity.",
      "High Content Production Costs: Hiring freelancers or agencies for every blog post, email, and ad script becomes prohibitively expensive.",
    ],
    benefits: [
      "10x Content Output: Generate weeks worth of blog posts, social content, and email campaigns in hours, not days.",
      "Perfect Brand Consistency: All content adheres to your brand guidelines, tone of voice, and messaging framework automatically.",
      "Cost-Effective Scale: Reduce reliance on expensive content agencies while maintaining professional quality output.",
    ],
    videoUrl: "",
    launch_link: "",
    navigation_path:
      "/agent-marketplace/marketing-hub/content-copywriting-agent",
    hub: "marketing",
    forProAnAbove: false,
    coming_soon: true,
  },
  {
    id: "seo-web-agent",
    name: "SEO & Web Agent",
    description:
      "Optimizes website content for search engines by analyzing keywords, suggesting improvements, and tracking ranking performance. Automates technical SEO audits and content optimization recommendations.",
    function_tag: "Marketing & Communications",
    category_tag: "SEO & Digital Presence",
    problems: [
      "Invisible in Search Results: Potential customers can't find your business because competitors dominate search rankings.",
      "Manual SEO is Overwhelming: Keeping up with keyword research, technical audits, and content optimization requires specialized expertise.",
      "Slow Ranking Improvements: Traditional SEO takes months to show results with no clear visibility into what's working.",
    ],
    benefits: [
      "Automated Technical SEO: Continuously scans your site for issues, broken links, speed problems, and indexing errors—fixing them proactively.",
      "Smart Content Optimization: Analyzes top-ranking competitor content and provides specific recommendations to outrank them.",
      "Rank Tracking & Insights: Monitors keyword positions, traffic patterns, and SERP changes, alerting you to opportunities and threats.",
    ],
    videoUrl: "",
    launch_link: "",
    navigation_path: "/agent-marketplace/marketing-hub/seo-web-agent",
    hub: "marketing",
    forProAnAbove: false,
    coming_soon: true,
  },
  {
    id: "campaign-strategy-agent",
    name: "Campaign Strategy Agent",
    description:
      "Analyzes market trends, competitor positioning, and customer data to design targeted marketing campaigns. Provides strategic recommendations on channels, messaging, and budget allocation.",
    function_tag: "Marketing & Communications",
    category_tag: "Campaign Planning",
    problems: [
      "Campaigns Built on Guesswork: Without data-driven insights, marketing teams waste budget on ineffective channels and messaging.",
      "Competitor Blindness: Lack of real-time competitive intelligence means campaigns launch without understanding what competitors are doing.",
      "Generic Positioning: One-size-fits-all campaigns fail to resonate because they don't account for segment-specific customer needs.",
    ],
    benefits: [
      "Data-Driven Campaign Design: Analyzes customer segments, purchase behavior, and engagement patterns to build targeted strategies.",
      "Competitive Intelligence: Tracks competitor campaigns, messaging, and positioning to identify gaps and opportunities.",
      "Optimized Budget Allocation: Recommends how to distribute spend across channels for maximum ROI based on historical performance.",
    ],
    videoUrl: "",
    launch_link: "",
    navigation_path: "/agent-marketplace/marketing-hub/campaign-strategy-agent",
    hub: "marketing",
    forProAnAbove: false,
    coming_soon: true,
  },
  {
    id: "distribution-automation-agent",
    name: "Distribution & Automation Agent",
    description:
      "Schedules and publishes content across multiple channels (social media, email, blog) with optimal timing. Automates cross-posting, hashtag generation, and audience-specific customization.",
    function_tag: "Marketing & Communications",
    category_tag: "Distribution & Automation",
    problems: [
      "Manual Publishing is Time-Consuming: Posting the same content across LinkedIn, Twitter, Instagram, and newsletters takes hours daily.",
      "Inconsistent Posting Schedule: Irregular publishing reduces reach and engagement because audiences expect regular content.",
      "Platform-Specific Optimization Ignored: Content formatted for LinkedIn doesn't work on Twitter—but teams lack time to customize.",
    ],
    benefits: [
      "One-Click Multi-Channel Publishing: Create once, publish everywhere—automatically adapting format, length, and style per platform.",
      "Optimal Timing Automation: Analyzes audience engagement patterns to schedule posts when your followers are most active.",
      "Smart Hashtag & Caption Generation: Generates platform-specific hashtags, descriptions, and calls-to-action for maximum reach.",
    ],
    videoUrl: "",
    launch_link: "",
    navigation_path:
      "/agent-marketplace/marketing-hub/distribution-automation-agent",
    hub: "marketing",
    forProAnAbove: false,
    coming_soon: true,
  },
  {
    id: "analytics-insights-agent",
    name: "Analytics & Insights Agent",
    description:
      "Consolidates marketing performance data from all channels into actionable insights. Identifies trends, anomalies, and optimization opportunities with automated reporting and recommendations.",
    function_tag: "Marketing & Communications",
    category_tag: "Analytics & Performance",
    problems: [
      "Data Scattered Across Platforms: Marketing metrics live in Google Analytics, social platforms, email tools, and CRM—making holistic analysis impossible.",
      "No Actionable Insights: Teams see charts and numbers but struggle to understand what's working, what's broken, and what to change.",
      "Reporting Drains Resources: Analysts spend hours manually compiling reports instead of driving strategic improvements.",
    ],
    benefits: [
      "Unified Performance Dashboard: Aggregates data from all marketing channels into a single source of truth with real-time metrics.",
      "AI-Powered Recommendations: Automatically identifies underperforming campaigns, high-value audience segments, and optimization opportunities.",
      "Automated Reporting: Generates executive summaries, performance trends, and attribution analysis—saving hours of manual work weekly.",
    ],
    videoUrl: "",
    launch_link: "",
    navigation_path:
      "/agent-marketplace/marketing-hub/analytics-insights-agent",
    hub: "marketing",
    forProAnAbove: false,
    coming_soon: true,
  },
  // ITOps & SecOps Hub Apps
  {
    id: "it-support-helpdesk-ticket-triaging",
    name: "IT Support Helpdesk and Ticket Triaging",
    description:
      "An AI-powered IT Helpdesk Agent that delivers fast, accurate support for IT issues, access requests, troubleshooting, and device or application problems. It reduces manual workload for IT teams by automating triage, routing, and ticket creation while improving response times, SLA compliance, and end-user satisfaction. The agent integrates seamlessly with your existing IT systems to streamline access provisioning and incident workflows, providing reliable, self-service support with minimal setup and maximum operational impact.",
    industry_tag: "Information Technology",
    function_tag: "IT Support & Operations",
    category_tag: "Helpdesk Automation",
    problems: [
      "**High volume of repetitive requests:** (password resets, access provisioning, basic troubleshooting) overloads IT teams and slows service delivery.",
      "**Inconsistent responses and manual routing:** Lead to SLA breaches, operational errors, and frustrated employees.",
      "**Manual routing and approvals:** Mapping requests to teams and provisioning access is error-prone and slow.",
      "**Limited visibility into IT performance:** Makes it hard to forecast demand, identify recurring issues, and optimize staffing or processes.",
    ],
    benefits: [
      "**Faster time-to-first-response:** Auto-triage and agent-assist messages reduce initial wait times.",
      "**Lower operational load:** By automating triage, routing, and routine requests so IT teams focus on higher-value work.",
      "**Consistent, auditable answers:** Knowledge-backed responses reduce human error and compliance risk.",
      "**Seamless integrations:** Works with your existing systems like ServiceNow, Jira, Okta, Google Workspace, Slack, and more for end-to-end automation.",
      "**Actionable insights and reporting:** With MTTR, First Response, SLA compliance, and trend analysis for better planning and decision-making.",
    ],
    videoUrl: "https://www.youtube.com/embed/L-3tM9Q4DJI",
    launch_link: "https://it-helpdesk.lyzr.app/",
    navigation_path:
      "/agent-marketplace/itops-secops/it-support-helpdesk-ticket-triaging",
    hub: "itops-secops",
    forProAnAbove: false,
    coming_soon: false,
  },
  {
    id: "itops-aiops-alerts-incidents",
    name: "ITOps/AIOps - Alerts & Incidents",
    description:
      "Detects and correlates critical infrastructure alerts in real time, automatically escalating incidents to the right teams while running intelligent root-cause analysis using logs, metrics, and change data — enabling faster resolution and zero missed alerts.",
    function_tag: "IT Operations",
    category_tag: "AIOps & Incident Management",
    problems: [
      "Alert Fatigue: IT teams receive thousands of monitoring alerts daily, with 95%+ being false positives or low-priority noise.",
      "Slow Incident Detection: Critical outages get buried in alert floods, delaying detection and response by minutes or hours.",
      "Manual Root-Cause Analysis: Engineers waste hours correlating logs, metrics, and events across multiple systems to diagnose issues.",
    ],
    benefits: [
      "Intelligent Alert Correlation: Automatically groups related alerts into single incidents, reducing noise by 90% and surfacing real problems instantly.",
      "Automated Root-Cause Analysis: Analyzes logs, metrics, topology, and recent changes to identify likely causes before engineers even start investigating.",
      "Smart Escalation: Routes incidents to the right on-call team based on service ownership, severity, and historical resolution patterns.",
    ],
    videoUrl: "",
    launch_link: "",
    navigation_path:
      "/agent-marketplace/itops-secops-hub/itops-aiops-alerts-incidents",
    hub: "itops-secops",
    forProAnAbove: false,
    coming_soon: true,
  },
  {
    id: "infraops-employee-onboarding",
    name: "InfraOps & Employee Onboarding",
    description:
      "Automates infrastructure deployment and configuration during scheduled windows — enabling fast, error-free orchestration of servers, storage, and networks. Provisions employee devices, accounts, and access the moment HR adds a new hire.",
    function_tag: "IT Operations",
    category_tag: "Infrastructure & Onboarding Automation",
    problems: [
      "Manual Infrastructure Provisioning: Deploying new servers, storage, or network resources requires multiple teams, change approvals, and hours of manual configuration.",
      "Onboarding Delays: New employees wait days or weeks for laptops, accounts, email access, and application permissions—killing first-week productivity.",
      "Configuration Drift & Errors: Manual infrastructure changes lead to inconsistencies, security gaps, and compliance violations across environments.",
    ],
    benefits: [
      "Automated Infrastructure Orchestration: Provisions servers, storage, and network resources during maintenance windows with zero-touch automation.",
      "Day-One Employee Readiness: Automatically creates email, Slack, VPN, and application accounts the moment HR onboards a new hire—no manual IT intervention.",
      "Consistent, Compliant Configurations: Applies standardized infrastructure templates, ensuring security policies and compliance controls are always enforced.",
    ],
    videoUrl: "",
    launch_link: "",
    navigation_path:
      "/agent-marketplace/itops-secops-hub/infraops-employee-onboarding",
    hub: "itops-secops",
    forProAnAbove: false,
    coming_soon: true,
  },
  {
    id: "complianceops",
    name: "ComplianceOps",
    description:
      "A single, intelligent compliance engine that automates audits, enforces policies, and manages data lifecycle — ensuring continuous, effortless compliance across the organization.",
    function_tag: "Governance & Compliance",
    category_tag: "Compliance Automation",
    problems: [
      "Manual Compliance is Unsustainable: Organizations spend months preparing for audits, collecting evidence across systems, and responding to audit requests.",
      "Policy Enforcement Gaps: Security policies exist on paper, but actual enforcement is inconsistent—leading to violations and compliance failures.",
      "Reactive Data Governance: Without automated lifecycle management, sensitive data persists beyond retention policies, creating legal and regulatory risk.",
    ],
    benefits: [
      "Continuous Compliance Monitoring: Automatically scans systems for policy violations, configuration drift, and compliance gaps—alerting teams proactively.",
      "Audit-Ready Evidence Collection: Maintains a complete, tamper-proof audit trail with automated evidence gathering for SOC 2, ISO 27001, GDPR, and more.",
      "Automated Data Lifecycle Management: Enforces retention policies, archives aged data, and securely deletes information per regulatory requirements—without manual intervention.",
    ],
    videoUrl: "",
    launch_link: "",
    navigation_path: "/agent-marketplace/itops-secops-hub/complianceops",
    hub: "itops-secops",
    forProAnAbove: false,
    coming_soon: true,
  },
  {
    id: "securityops-soar-agent",
    name: "SecurityOps (SOAR) Agent",
    description:
      "Detects, investigates, and responds to security threats automatically — transforming alert chaos into a unified, low-code defense system that deploys in hours, not weeks.",
    function_tag: "Security Operations",
    category_tag: "SOAR & Threat Response",
    problems: [
      "Alert Overload: Security teams are drowning in thousands of alerts daily from firewalls, EDR, SIEM, and cloud security tools—with no way to prioritize real threats.",
      "Slow Incident Response: Manual investigation and remediation workflows take hours or days, allowing attackers to move laterally and cause damage.",
      "Complex SOAR Deployments: Traditional security orchestration platforms require months of custom development and integration work before providing value.",
    ],
    benefits: [
      "Automated Threat Detection & Response: Instantly triages security alerts, blocks malicious IPs, isolates compromised endpoints, and revokes suspicious access—without human intervention.",
      "Unified Investigation Workflows: Correlates data from EDR, SIEM, threat intel, and identity systems to build complete attack timelines in minutes.",
      "Deploy in Hours, Not Weeks: Pre-built playbooks and low-code automation enable security teams to operationalize SOAR capabilities immediately.",
    ],
    videoUrl: "",
    launch_link: "",
    navigation_path:
      "/agent-marketplace/itops-secops-hub/securityops-soar-agent",
    hub: "itops-secops",
    forProAnAbove: false,
    coming_soon: true,
  },
  // HR Hub Apps
  {
    id: "helpdesk-agent",
    name: "HR Helpdesk Agent",
    description:
      "An AI HR Helpdesk agent that provides employees instant, accurate answers on HR policies, payroll, and benefits.Reduces HR support workload while ensuring compliance with internal policies.Delivers fast, reliable self-service that improves employee experience and satisfaction.",
    industry_tag: "Software & IT Services",
    function_tag: "Human Resources (HR)",
    category_tag: "Productivity & Cost Savings",
    problems: [
      "Employees face delays and confusion in getting HR queries resolved.",
      "HR teams spend excessive time on repetitive, low-value support tasks.",
      "Resource-Heavy Queries: Compliance teams often rely on legal or regulatory experts to interpret regulations, creating bottlenecks and increasing costs.",
    ],
    benefits: [
      "Instant, accurate responses with responsible AI guardrails.",
      "Reduced HR workload and faster query resolution.",
      "Improved employee experience with seamless, compliant self-service.",
    ],
    videoUrl: "https://www.youtube.com/embed/jf_zXLOTnSE",
    launch_link: "https://hr-helpdesk.lyzr.app/",
    navigation_path: "/agent-marketplace/hr-hub/helpdesk-agent",
    hub: "hr",
    demo: true,
    forProAnAbove: false,
  },
  {
    id: "exit-interview-agent",
    name: "HR Exit Interview Agent",
    description:
      "Conducts unbiased exit interviews via voice, encouraging departing employees to share open, unfiltered feedback securely and anonymously with AI-powered analysis.",
    industry_tag: "Software & IT Services",
    function_tag: "Human Resources (HR)",
    category_tag: "Employee Experience & Retention",
    problems: [
      "**Rising Attrition Without Clear Solutions:** Companies experience high turnover but lack actionable insights on what specifically needs improvement to retain talent.",
      "**Inconsistent Interview Quality:** Human-led exit interviews vary widely in depth and focus, missing key data needed for meaningful organizational change.",
      "**Employees Don't Always Feel Comfortable Sharing Honest Feedback:** HR interviews make departing employees uncomfortable, leading to filtered responses that hide critical organizational issues.",
    ],
    benefits: [
      "Fully Automated Process: Eliminate manual interview scheduling, conducting, and processing - the AI handles everything from conversation to final report.",
      "Clear Reasons & Sentiment Analysis: Get detailed insights into why employees leave with AI-powered sentiment analysis revealing emotional drivers behind departures.",
      "Actionable Improvement Suggestions: Receive specific recommendations on what to fix based on exit interview patterns and feedback trends across your organization.",
    ],
    videoUrl: "https://www.youtube.com/embed/S31XbbCdlX8",
    launch_link: "https://exit-interview.lyzr.app/",
    navigation_path: "/agent-marketplace/hr-hub/exit-interview-agent",
    hub: "hr",
    demo: false,
    forProAnAbove: false,
  },
  {
    id: "performance-review-agent",
    name: "HR Performance Review Agent",
    description:
      "Automate your entire performance review cycle with intelligent multi-agent conversations that collect employee self-assessments and manager feedback simultaneously. Agent handles everything from cycle initiation to consolidated report generation, eliminating manual coordination and ensuring consistent, timely reviews.",
    industry_tag: "Software & IT Services",
    function_tag: "Human Resources (HR)",
    category_tag: "Productivity & Cost Savings",
    problems: [
      "**Manual Review Coordination Overhead:** HR teams spend countless hours manually coordinating performance review cycles, sending reminder emails, tracking completion status, and chasing down missing feedback from employees and managers.",
      "**Inconsistent and Delayed Feedback Collection:** Traditional review processes suffer from inconsistent timing, varying feedback quality, and delays as employees and managers struggle to align their schedules and complete reviews promptly.",
      "**Fragmented Feedback Consolidation:** Combining self-assessments with manager feedback into coherent, actionable performance reports requires significant manual effort and often results in incomplete or poorly structured evaluations.",
    ],
    benefits: [
      "**End-to-End Automation:** Complete automation from review cycle initiation to final report generation, with intelligent agents handling employee and manager conversations simultaneously, reducing HR workload by up to 80%.",
      "**Real-Time Progress Tracking:** Live dashboard visibility into review completion status across all employees and managers, with automated follow-ups and notifications ensuring no reviews fall through the cracks.",
      "**Intelligent Feedback Synthesis:** AI-powered consolidation of self-assessments and manager feedback into comprehensive, structured performance reports that provide actionable insights for employee development and organizational planning.",
    ],
    videoUrl: "https://www.youtube.com/embed/1ivLvgk2tBY",
    launch_link: "https://hr-performance-review.lyzr.app/",
    navigation_path: "/agent-marketplace/hr-hub/performance-review-agent",
    hub: "hr",
    demo: true,
    forProAnAbove: false,
  },
  {
    id: "candidate-sourcing-agent",
    name: "HR Candidate Sourcing Agent",
    description:
      "Find the right candidates instantly with natural language search. Simply describe your ideal hire or upload a job description, and get matched with the most relevant profiles. Save time on sourcing and focus on hiring the best talent.",
    industry_tag: "Software & IT Services",
    function_tag: "Human Resources (HR)",
    category_tag: "Talent Acquisition & Recruitment",
    problems: [
      "**Can't find the most suitable candidates:** Top talent gets buried in generic search results and irrelevant profiles.",
      "**LinkedIn search is complicated:** Boolean operators and filters make it hard to find exactly what you need.",
      "**Sourcing takes too long:** Hours spent manually searching and screening profiles for each role.",
    ],
    benefits: [
      "**Instant candidate discovery:** Get relevant profiles in seconds using simple conversational queries.",
      "**JD-to-candidate matching:** Upload any job description and automatically surface the best-fit candidates.",
      "**Ranked shortlists:** Candidates are intelligently scored and ranked, so you focus on top matches first.",
    ],
    videoUrl: "https://www.youtube.com/embed/YrDg0onjB7Y",
    launch_link: "https://hr-candidate-sourcing.lyzr.app/",
    navigation_path: "/agent-marketplace/hr-hub/candidate-sourcing-agent",
    hub: "hr",
    demo: true,
    forProAnAbove: false,
  },
  {
    id: "policy-compliance-manager",
    name: "HR Policy Compliance Manager",
    description:
      "Ensure 100% compliant HR policies aligned with the latest regulations. Create new policies, update existing ones, and get real-time compliance analysis. Eliminate contradictions, close gaps, and stay audit-ready at all times.",
    industry_tag: "Software & IT Services",
    function_tag: "Human Resources (HR)",
    category_tag: "Governance & Compliance",
    problems: [
      "**Non-compliant policies risk penalties:** 2 out of 3 organizations lack compliant policies and face regulatory fines.",
      "**Policies contradict each other:** Conflicting rules create confusion and legal exposure across your organization.",
      "**Manual creation, updation & compliance tracking is impossible:** Regulations change constantly and policies quickly become outdated.",
    ],
    benefits: [
      "**Always audit-ready:** All policies stay 100% compliant with latest regulatory standards automatically.",
      "**Real-time conflict detection:** Identifies and eliminates contradictions between policies instantly.",
      "**Create and update policies fast:** Generate missing policies or revise existing ones in minutes, not weeks.",
    ],
    videoUrl: "https://www.youtube.com/embed/u4OSgPlA8GU",
    launch_link: "https://policy-generation.lyzr.app/",
    navigation_path: "/agent-marketplace/hr-hub/policy-compliance-manager",
    hub: "hr",
    demo: true,
    forProAnAbove: false,
  },
  {
    id: "agentic-lms",
    name: "Agentic LMS - The L&D Agent",
    description:
      "The agentic learning and development platform that generates custom learning modules, assigns them to employees automatically, and provides an intelligent copilot for personalized learning and evaluation.",
    industry_tag: "Human Resources & Talent Development",
    function_tag: "Learning & Development",
    category_tag: "Training & Skill Development",
    problems: [
      "**Manual creation of learning content doesn't scale:** L&D teams spend excessive time designing modules for diverse employee needs.",
      "**Lack of personalized support:** Self-paced learners struggle without real-time guidance, resulting in low completion rates.",
      "**Ineffective assessments:** Traditional quizzes fail to measure real comprehension or practical application.",
    ],
    benefits: [
      "**Automated module creation & assignment:** Generates and manages learning tracks instantly, cutting L&D admin time drastically.",
      "**24/7 AI learning copilot:** Offers real-time explanations, examples, and clarifications during employee learning.",
      "**Objective skill evaluations:** Measures true understanding with intelligent, application-focused assessments.",
    ],
    videoUrl: "https://www.youtube.com/embed/Fx5v5nUYaTA",
    launch_link: "https://lms.lyzr.app/organizations",
    navigation_path: "/agent-marketplace/learning-hub/agentic-lms",
    hub: "hr",
    demo: true,
    forProAnAbove: false,
    new: true,
  },
  {
    id: "hr-candidate-screening-agent",
    name: "HR Candidate Screening Agent",
    description:
      "Automated resume screening system that generates role-specific evaluation rubrics and objectively assesses candidates against job requirements.",
    industry_tag: "Human Resources",
    function_tag: "Recruitment & Talent Acquisition",
    category_tag: "Hiring & Assessment",
    problems: [
      "**Manual resume screening is biased and slow:** Recruiters lose hours reviewing CVs with inconsistent judgment.",
      "**One-dimensional scoring misses strong candidates:** Traditional screening fails to uncover non-obvious strengths.",
      "**Lack of standardized rubrics:** Subjective evaluation leads to poor hiring decisions and inconsistency across teams.",
    ],
    benefits: [
      "**Bias-free multi-rubric evaluation:** Ensures fair, objective, multi-dimensional assessment for every applicant.",
      "**Screening time reduced from hours to minutes:** Automates candidate filtering while improving quality.",
      "**Consistent, defensible hiring criteria:** Applies standardized evaluation frameworks across roles and departments.",
    ],
    videoUrl: "",
    launch_link: "https://candidate-screening.lyzr.app/",
    navigation_path: "/agent-marketplace/hr-hub/hr-candidate-screening-agent",
    hub: "hr",
    demo: true,
    forProAnAbove: false,
    new: true,
  },
  {
    id: "technical-evaluation-agent",
    name: "Technical Evaluation Agent",
    description:
      "Automated code review system that evaluates coding assignments and GitHub submissions to measure skills, code quality, and engineering best practices.",
    industry_tag: "Software & IT Services",
    function_tag: "Technical Hiring & Engineering",
    category_tag: "Developer Assessment",
    problems: [
      "**Manual code reviews slow down hiring:** Reviewing assignments consumes engineering bandwidth and delays decisions.",
      "**Inconsistent reviewer standards:** Different reviewers judge code differently, leading to unfair or inaccurate results.",
      "**Shallow analysis due to limited time:** Teams often miss deeper architectural flaws or scalability issues.",
    ],
    benefits: [
      "**Standardized technical assessments:** Applies consistent scoring across all candidates with detailed quality metrics.",
      "**Cuts technical screening time by 80%:** Speeds up evaluation while improving depth and thoroughness.",
      "**Provides actionable engineering feedback:** Offers insights on architecture, maintainability, and best-practice adherence.",
    ],
    videoUrl: "",
    launch_link: "https://technical-screening.lyzr.app/",
    navigation_path:
      "/agent-marketplace/engineering-hub/technical-evaluation-agent",
    hub: "hr",
    demo: true,
    forProAnAbove: false,
    new: true,
  },
];

export const coreUtilityApps = lyzrApps
  .filter((app) => app.hub === "core-utility")
  .slice(0, 4);

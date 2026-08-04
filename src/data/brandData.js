export const BRAND_INFO = {
  name: "HeyIra.",
  tagline: "Conversations made human. AI that speaks naturally.",
  heroTitle: "The AI Employee That Answers. Sells. Books. Follows Up.",
  heroSubtitle: "Build human-like AI Voice Agents for Sales, Support, Booking, Collections and Follow-ups. No code. Go live in 5 minutes.",
  colors: {
    primary: "#7B5CFF",
    primaryHover: "#6946FF",
    secondary: "#A78BFA",
    darkBg: "#0D0D0F",
    surfaceCard: "#14131A",
    surfaceCardHover: "#1C1B24",
    border: "rgba(255, 255, 255, 0.08)",
    textMuted: "#A1A1AA",
    textLight: "#F5F5F7"
  }
};

export const TRUSTED_BRANDS = [
  { name: "zudio", label: "zudio" },
  { name: "OYO", label: "OYO" },
  { name: "BYJU'S", label: "BYJU'S" },
  { name: "safari", label: "safari" },
  { name: "Licious", label: "Licious" },
  { name: "mamaearth", label: "mamaearth" },
  { name: "boAt", label: "boAt" },
  { name: "Rapido", label: "Rapido" }
];

export const INDUSTRIES = [
  {
    id: "retail",
    label: "Retail",
    title: "Retail AI Voice Agent",
    description: "Handle customer inquiries, track orders, process returns and store locations.",
    bullets: ["Reduce support costs", "Increase customer satisfaction", "Increase repeat purchases"],
    flow: [
      { step: "1", title: "Incoming Call", subtitle: "Where is my order?", icon: "PhoneIncoming" },
      { step: "2", title: "HeyIra checks", subtitle: "Shopify / ERP", icon: "ShoppingBag" },
      { step: "3", title: "Answers", subtitle: "Instantly in voice", icon: "Volume2" },
      { step: "4", title: "Creates", subtitle: "Ticket / Log", icon: "Ticket" },
      { step: "5", title: "Sends", subtitle: "WhatsApp confirmation", icon: "MessageSquare" }
    ]
  },
  {
    id: "healthcare",
    label: "Healthcare",
    title: "Healthcare Assistant",
    description: "Schedule doctor appointments, answer patient FAQs, and send prescription reminders.",
    bullets: ["24/7 patient booking", "HIPAA compliant routing", "Zero hold time"],
    flow: [
      { step: "1", title: "Patient Call", subtitle: "Book Dr. Sharma", icon: "PhoneIncoming" },
      { step: "2", title: "HeyIra checks", subtitle: "Hospital EMR", icon: "Calendar" },
      { step: "3", title: "Confirms Slot", subtitle: "Instant verbal reply", icon: "CheckCircle2" },
      { step: "4", title: "Sends SMS", subtitle: "Google Maps link", icon: "Send" }
    ]
  },
  {
    id: "education",
    label: "Education",
    title: "Admissions Counselor",
    description: "Qualify student leads, schedule campus visits, and answer fee structure questions.",
    bullets: ["10x faster lead response", "Automated course guidance", "Higher enrollment conversion"],
    flow: [
      { step: "1", title: "Student Inquiry", subtitle: "B.Tech Admissions?", icon: "GraduationCap" },
      { step: "2", title: "HeyIra checks", subtitle: "Course Database", icon: "Database" },
      { step: "3", title: "Explains Fees", subtitle: "Clear verbal answers", icon: "Mic" },
      { step: "4", title: "Schedules Visit", subtitle: "Calendar Booking", icon: "CalendarCheck" }
    ]
  },
  {
    id: "realestate",
    label: "Real Estate",
    title: "Real Estate Lead Agent",
    description: "Pre-qualify buyers, answer property specs, and schedule site visits automatically.",
    bullets: ["Instant lead response", "Smart buyer qualification", "Automated CRM syncing"],
    flow: [
      { step: "1", title: "Buyer Call", subtitle: "3BHK Price in Bandra?", icon: "Home" },
      { step: "2", title: "HeyIra checks", subtitle: "Property Catalog", icon: "Search" },
      { step: "3", title: "Provides Details", subtitle: "Sq.ft & Price quote", icon: "DollarSign" },
      { step: "4", title: "Books Site Visit", subtitle: "Sales rep calendar", icon: "UserCheck" }
    ]
  },
  {
    id: "automobile",
    label: "Automobile",
    title: "Service & Test-Drive Agent",
    description: "Book car service appointments, schedule test drives, and handle insurance renewals.",
    bullets: ["Zero missed service calls", "Automated service reminders", "Instant dealer sync"],
    flow: [
      { step: "1", title: "Customer Call", subtitle: "Book EV Test Drive", icon: "Car" },
      { step: "2", title: "HeyIra checks", subtitle: "Dealer Inventory", icon: "Layers" },
      { step: "3", title: "Reserves Slot", subtitle: "Instant audio confirmation", icon: "ShieldCheck" },
      { step: "4", title: "Notifies Dealer", subtitle: "CRM alert created", icon: "Bell" }
    ]
  },
  {
    id: "hospitality",
    label: "Hospitality",
    title: "Hotel Concierge Agent",
    description: "Handle room reservations, table bookings, room service requests and FAQs.",
    bullets: ["Multilingual guest support", "Instant booking confirm", "Reduced front-desk load"],
    flow: [
      { step: "1", title: "Guest Inquiry", subtitle: "Reserve Suite for 2 nights", icon: "Bed" },
      { step: "2", title: "HeyIra checks", subtitle: "PMS System", icon: "Grid" },
      { step: "3", title: "Locks Room", subtitle: "Voice booking confirmation", icon: "Key" },
      { step: "4", title: "Sends Voucher", subtitle: "Email & WhatsApp", icon: "Mail" }
    ]
  },
  {
    id: "finance",
    label: "Finance",
    title: "Banking & Credit Agent",
    description: "Assist with loan eligibility, credit card sales, billing queries and payment reminders.",
    bullets: ["Strict regulatory compliance", "Secure verification", "High conversion rates"],
    flow: [
      { step: "1", title: "Customer Call", subtitle: "Apply for Lifetime Free Card", icon: "CreditCard" },
      { step: "2", title: "HeyIra checks", subtitle: "Eligibility Matrix", icon: "Cpu" },
      { step: "3", title: "Validates Info", subtitle: "Spoken verification", icon: "UserCheck" },
      { step: "4", title: "Generates Application", subtitle: "Direct push to bank API", icon: "Zap" }
    ]
  },
  {
    id: "insurance",
    label: "Insurance",
    title: "Insurance Renewal Agent",
    description: "Automate policy renewals, claim status updates, and premium quotes.",
    bullets: ["Automated outbound renewals", "Instant claim status", "Reduced lapse rate"],
    flow: [
      { step: "1", title: "Policy Holder", subtitle: "Check Claim Status", icon: "Shield" },
      { step: "2", title: "HeyIra checks", subtitle: "Claims Engine", icon: "Database" },
      { step: "3", title: "Provides Status", subtitle: "Clear speech summary", icon: "Activity" },
      { step: "4", title: "Sends Link", subtitle: "Document upload SMS", icon: "Send" }
    ]
  }
];

export const BUILD_STEPS = [
  { step: "1", title: "Knowledge", desc: "Connect your documents, APIs, & CRM data", icon: "Database" },
  { step: "2", title: "Brain", desc: "AI understands intent, context, & memory", icon: "Cpu" },
  { step: "3", title: "Voice", desc: "Choose ultra-natural human voices & accents", icon: "Volume2" },
  { step: "4", title: "Actions", desc: "Set what tools & API calls it can make", icon: "Zap" },
  { step: "5", title: "Deploy", desc: "Assign phone number or embed widget in 1 click", icon: "Rocket" }
];

export const CONVERSATION_FLOW = [
  { title: "Human Speaks", desc: "Natural voice input in any dialect or language", icon: "User" },
  { title: "AI Thinks", desc: "Real-time semantic analysis & reasoning", icon: "Brain" },
  { title: "Checks Your Data", desc: "Queries your CRM, database, or API live", icon: "Database" },
  { title: "Replies Naturally", desc: "Ultra-low latency spoken response", icon: "Sparkles" },
  { title: "Books / Follows Up", desc: "Triggers WhatsApp, SMS, calendar, or tickets", icon: "CheckCircle" }
];

export const BRAIN_CAPABILITIES = [
  {
    id: "memory",
    title: "Memory",
    desc: "Remembers every conversation, customer preference, and previous context across calls.",
    icon: "Brain"
  },
  {
    id: "reasoning",
    title: "Reasoning",
    desc: "Understands subtle nuances, intent, complex business logic, and objections effortlessly.",
    icon: "Zap"
  },
  {
    id: "tool-calling",
    title: "Tool Calling",
    desc: "Takes direct action in your external apps & systems (Stripe, Shopify, HubSpot, Google Calendar).",
    icon: "Wrench"
  },
  {
    id: "multilingual",
    title: "Multi-language",
    desc: "Speaks 50+ global languages & Indian regional dialects (Hinglish, Hindi, Tamil, Telugu, etc.).",
    icon: "Globe"
  },
  {
    id: "emotion",
    title: "Emotion Detection",
    desc: "Understands tone, urgency, and sentiment to adapt its empathy and speaking rhythm.",
    icon: "Heart"
  }
];

export const INTEGRATIONS = [
  { name: "HubSpot", category: "CRM", color: "#FF7A59" },
  { name: "Salesforce", category: "CRM", color: "#00A1E0" },
  { name: "Zoho", category: "CRM", color: "#C0272D" },
  { name: "Shopify", category: "E-commerce", color: "#96BF48" },
  { name: "Google Calendar", category: "Booking", color: "#4285F4" },
  { name: "WhatsApp", category: "Messaging", color: "#25D366" },
  { name: "Slack", category: "Messaging", color: "#4A154B" },
  { name: "Twilio", category: "Telephony", color: "#F22F46" },
  { name: "Stripe", category: "Payments", color: "#635BFF" },
  { name: "Razorpay", category: "Payments", color: "#0C2340" }
];

export const AGENT_TEMPLATES = [
  {
    id: "restaurant",
    name: "Restaurant Booking Agent",
    role: "A warm host who takes reservations, answers menu questions, and checks table availability.",
    image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=500&auto=format&fit=crop&q=60"
  },
  {
    id: "realestate",
    name: "Real Estate Lead Agent",
    role: "A professional property consultant who qualifies home buyers and books site visits.",
    image: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=500&auto=format&fit=crop&q=60"
  },
  {
    id: "admission",
    name: "Admission Counselor",
    role: "An empathetic counselor guiding prospective students through course details and deadlines.",
    image: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=500&auto=format&fit=crop&q=60"
  },
  {
    id: "insurance",
    name: "Insurance Sales Agent",
    role: "A articulate advisor helping customers select policies and understand coverage options.",
    image: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=500&auto=format&fit=crop&q=60"
  }
];

export const TESTIMONIALS = [
  {
    quote: "HeyIra feels like a real part of our team. It handles 70% of our calls without any human intervention.",
    author: "Komal Bahl",
    role: "CEO, Snapdeal partner",
    company: "Snapdeal"
  },
  {
    quote: "We've reduced our support cost by 60% and response time from 28 mins to under 2 minutes with HeyIra.",
    author: "Harsh Kale",
    role: "MD, Kube Capital",
    company: "Kube Capital"
  },
  {
    quote: "Our students love the instant answers and reminders. It's like having a 24/7 admission counselor.",
    author: "Sharda Torshkia",
    role: "CEO, DirectEd",
    company: "DirectEd"
  },
  {
    quote: "HeyIra helped us convert more leads and book more site visits. Absolute game-changer!",
    author: "Sambit Gaurav",
    role: "Founder, Housewise",
    company: "Housewise"
  }
];

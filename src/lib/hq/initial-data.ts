export type CompanyHealth = "protected" | "transition" | "investment" | "watch";

export type CompanySummary = {
  name: string;
  category: string;
  operator: string;
  cashRole: "Cash engine" | "Investment" | "Asset";
  health: CompanyHealth;
  priority: string;
};

export type TransitionStep = {
  title: string;
  description: string;
  status: "now" | "next" | "later";
};

export const companies: CompanySummary[] = [
  {
    name: "AutoRx Center",
    category: "Automotive service",
    operator: "Osman — GM transition",
    cashRole: "Cash engine",
    health: "transition",
    priority: "Install a capable general manager without weakening cash flow.",
  },
  {
    name: "RunTech",
    category: "Vertical SaaS",
    operator: "Osman — founder",
    cashRole: "Investment",
    health: "investment",
    priority: "Prove the product inside AutoRx before scaling externally.",
  },
  {
    name: "AR-C Homes",
    category: "Real estate development",
    operator: "Operator to formalize",
    cashRole: "Asset",
    health: "watch",
    priority: "Control capital deployment, milestones, and project accountability.",
  },
  {
    name: "Ulua Loans",
    category: "Financial software",
    operator: "Not assigned",
    cashRole: "Investment",
    health: "investment",
    priority: "Keep in validation until legal and operating assumptions are proven.",
  },
];

export const transitionSteps: TransitionStep[] = [
  {
    title: "Define the AutoRx GM seat",
    description: "Write the scorecard, authority limits, compensation, and non-negotiable controls.",
    status: "now",
  },
  {
    title: "Map Osman dependencies",
    description: "Identify every decision, approval, relationship, and process that still stops without Osman.",
    status: "now",
  },
  {
    title: "Build department ownership",
    description: "Install clear ownership for service, production, administration, finance, and people.",
    status: "next",
  },
  {
    title: "Recruit and test the operator",
    description: "Use financial, operational, leadership, and integrity tests before transferring authority.",
    status: "next",
  },
  {
    title: "Run absence tests",
    description: "Progress from one day to thirty days while measuring deterioration and hidden dependencies.",
    status: "later",
  },
];

export const ownerControls = [
  "Bank balances and transaction alerts",
  "Payroll changes and labor-cost trend",
  "Weekly scorecard and corrective actions",
  "Capital transferred to other companies",
  "Warranty, refund, and comeback exposure",
  "Critical legal, people, and reputation risks",
];

export const firstMetrics = [
  "Sales",
  "Gross profit dollars",
  "Gross margin",
  "Operating cash flow",
  "Payroll as a percentage of sales",
  "Sold hours",
  "Estimate conversion",
  "Average repair order",
  "Comebacks and warranty cost",
  "Vehicles stopped beyond promise date",
];

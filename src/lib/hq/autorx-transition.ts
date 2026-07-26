export type ReadinessStatus = "not_started" | "mapping" | "documented" | "delegated" | "tested";

export type DepartmentSeat = {
  name: string;
  primaryResult: string;
  currentOwner: string;
  targetLeader: string;
  status: ReadinessStatus;
};

export type OwnerDependency = {
  category: "Decision" | "Approval" | "Relationship" | "Knowledge" | "Access" | "Execution";
  title: string;
  risk: "Critical" | "High" | "Medium";
  targetSeat: string;
  status: ReadinessStatus;
};

export const gmSeat = {
  title: "General Manager — AutoRx Center",
  primaryResult:
    "Produce predictable operating cash flow while protecting margin, quality, people, customer trust, and compliance without daily intervention from Osman.",
  accountableFor: [
    "Sales, gross profit, and operating cash flow",
    "Service-advisor conversion and customer communication",
    "Technician production, quality, and on-time completion",
    "Payroll discipline, staffing, and employee accountability",
    "Warranty, comeback, refund, and reputation exposure",
    "Execution of the approved operating plan and budget",
  ],
  ownerRetains: [
    "Debt, bank accounts, ownership, and capital transfers",
    "Major contracts, lawsuits, settlements, and legal exposure",
    "Executive compensation and leadership hiring or termination",
    "Material pricing changes and capital expenditures",
    "Extraordinary refunds or commitments outside written policy",
  ],
};

export const departmentSeats: DepartmentSeat[] = [
  {
    name: "General management",
    primaryResult: "The whole company meets its financial and operating commitments.",
    currentOwner: "Osman",
    targetLeader: "AutoRx General Manager",
    status: "mapping",
  },
  {
    name: "Service and customer operations",
    primaryResult: "Demand becomes profitable authorized work with clear communication.",
    currentOwner: "Shared / Osman escalation",
    targetLeader: "Service Manager",
    status: "not_started",
  },
  {
    name: "Shop production",
    primaryResult: "Correct work is completed on time with controlled quality and productivity.",
    currentOwner: "Shared operational leadership",
    targetLeader: "Shop Foreman / Production Manager",
    status: "not_started",
  },
  {
    name: "Administration and finance controls",
    primaryResult: "Money, payroll, vendor credits, records, and obligations remain accurate and controlled.",
    currentOwner: "Osman / administrative team",
    targetLeader: "Administrative and Finance Coordinator",
    status: "not_started",
  },
  {
    name: "People and training",
    primaryResult: "Every required seat has a capable person who meets standards and develops.",
    currentOwner: "Osman",
    targetLeader: "GM with shared HR support",
    status: "not_started",
  },
];

export const ownerDependencies: OwnerDependency[] = [
  {
    category: "Approval",
    title: "Final payroll review and release",
    risk: "Critical",
    targetSeat: "GM + finance control",
    status: "not_started",
  },
  {
    category: "Decision",
    title: "Warranty, refund, and goodwill exceptions",
    risk: "High",
    targetSeat: "GM within written limits",
    status: "mapping",
  },
  {
    category: "Access",
    title: "Banking, payment, and owner-level system access",
    risk: "Critical",
    targetSeat: "Owner retained; controlled operational access",
    status: "not_started",
  },
  {
    category: "Relationship",
    title: "Critical vendor and warranty-company escalations",
    risk: "High",
    targetSeat: "GM",
    status: "not_started",
  },
  {
    category: "Knowledge",
    title: "Weekly financial diagnosis and cash-protection decisions",
    risk: "Critical",
    targetSeat: "GM + owner review",
    status: "mapping",
  },
  {
    category: "Execution",
    title: "Employee discipline, hiring, and termination process",
    risk: "High",
    targetSeat: "GM within policy",
    status: "not_started",
  },
  {
    category: "Decision",
    title: "Daily prioritization when production, parts, and promises conflict",
    risk: "High",
    targetSeat: "GM + production leader",
    status: "not_started",
  },
  {
    category: "Approval",
    title: "Transfers from AutoRx into other ventures",
    risk: "Critical",
    targetSeat: "Owner retained",
    status: "documented",
  },
];

export const transitionGates = [
  {
    gate: "1. Define",
    outcome: "The GM seat, scorecard, authority, and compensation are approved.",
    status: "In progress",
  },
  {
    gate: "2. Document",
    outcome: "Critical owner-dependent processes have verified instructions and controls.",
    status: "Not started",
  },
  {
    gate: "3. Install",
    outcome: "A selected operator controls the daily rhythm and department leaders.",
    status: "Not started",
  },
  {
    gate: "4. Transfer",
    outcome: "Osman stops normal operating decisions and reviews results weekly.",
    status: "Not started",
  },
  {
    gate: "5. Test",
    outcome: "AutoRx completes a 30-day absence test without material deterioration.",
    status: "Not started",
  },
];

export const statusLabels: Record<ReadinessStatus, string> = {
  not_started: "Not started",
  mapping: "Mapping",
  documented: "Documented",
  delegated: "Delegated",
  tested: "Tested",
};

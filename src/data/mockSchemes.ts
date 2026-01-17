export interface Scheme {
  id: string;
  name: string;
  shortDescription: string;
  fullDescription: string;
  ministry: string;
  level: 'Central' | 'State';
  state?: string;
  category: string;
  benefitType: 'Grant' | 'Subsidy' | 'Training' | 'Loan' | 'Insurance';
  benefitAmount?: string;
  eligibility: {
    status: 'eligible' | 'possibly-eligible' | 'not-eligible' | 'unknown';
    criteria: string[];
    reasons?: string[];
  };
  documentsRequired: string[];
  applicationSteps: {
    step: number;
    title: string;
    description: string;
    mode: 'Online' | 'Offline' | 'Both';
  }[];
  deadline?: string;
  applicationUrl?: string;
  tags: string[];
}

export const mockSchemes: Scheme[] = [
  {
    id: "pm-kisan",
    name: "PM-KISAN Samman Nidhi",
    shortDescription: "₹6,000 annual income support for small and marginal farmers",
    fullDescription: "Pradhan Mantri Kisan Samman Nidhi is a Central Sector scheme with 100% funding from Government of India. Under this scheme, income support of ₹6,000 per year is provided to all farmer families across the country in three equal installments of ₹2,000 each every four months.",
    ministry: "Ministry of Agriculture & Farmers Welfare",
    level: "Central",
    category: "Agriculture",
    benefitType: "Grant",
    benefitAmount: "₹6,000 per year",
    eligibility: {
      status: "eligible",
      criteria: [
        "Small and marginal farmers",
        "Cultivable land holding up to 2 hectares",
        "Family income criteria applicable"
      ],
      reasons: ["Your profile indicates you are a farmer with less than 2 hectares of land"]
    },
    documentsRequired: [
      "Aadhaar Card",
      "Land ownership documents",
      "Bank account details",
      "State domicile certificate"
    ],
    applicationSteps: [
      { step: 1, title: "Visit PM-KISAN Portal", description: "Go to pmkisan.gov.in and click on 'New Farmer Registration'", mode: "Online" },
      { step: 2, title: "Enter Aadhaar Details", description: "Provide your Aadhaar number for verification", mode: "Online" },
      { step: 3, title: "Fill Application Form", description: "Complete the form with land and bank details", mode: "Online" },
      { step: 4, title: "Verification", description: "Local patwari will verify your land records", mode: "Offline" }
    ],
    applicationUrl: "https://pmkisan.gov.in",
    tags: ["farmers", "income support", "direct benefit"]
  },
  {
    id: "pmay-urban",
    name: "Pradhan Mantri Awas Yojana (Urban)",
    shortDescription: "Affordable housing with interest subsidy for urban poor",
    fullDescription: "PMAY-U aims to provide housing for all in urban areas by 2024. The mission provides central assistance to implementing agencies through States/UTs for construction of houses for eligible families/beneficiaries.",
    ministry: "Ministry of Housing and Urban Affairs",
    level: "Central",
    category: "Housing",
    benefitType: "Subsidy",
    benefitAmount: "Up to ₹2.67 lakh interest subsidy",
    eligibility: {
      status: "possibly-eligible",
      criteria: [
        "Economically Weaker Section (EWS) - Income up to ₹3 lakh",
        "Low Income Group (LIG) - Income ₹3-6 lakh",
        "Should not own a pucca house anywhere in India"
      ],
      reasons: ["Need to verify income details for final eligibility"]
    },
    documentsRequired: [
      "Aadhaar Card",
      "Income certificate",
      "No property certificate",
      "Bank statements",
      "Caste certificate (if applicable)"
    ],
    applicationSteps: [
      { step: 1, title: "Check Eligibility", description: "Use the online eligibility calculator", mode: "Online" },
      { step: 2, title: "Apply Online", description: "Visit pmaymis.gov.in and create an account", mode: "Online" },
      { step: 3, title: "Submit Documents", description: "Upload required documents online", mode: "Online" },
      { step: 4, title: "Field Verification", description: "Officials will verify your current residence", mode: "Offline" }
    ],
    applicationUrl: "https://pmaymis.gov.in",
    tags: ["housing", "urban poor", "subsidy"]
  },
  {
    id: "mudra-loan",
    name: "Pradhan Mantri MUDRA Yojana",
    shortDescription: "Collateral-free loans up to ₹10 lakh for micro enterprises",
    fullDescription: "PMMY provides loans up to ₹10 lakh to non-corporate, non-farm small/micro enterprises. The scheme has three products: Shishu (up to ₹50,000), Kishore (₹50,000 to ₹5 lakh), and Tarun (₹5 lakh to ₹10 lakh).",
    ministry: "Ministry of Finance",
    level: "Central",
    category: "Business & MSME",
    benefitType: "Loan",
    benefitAmount: "Up to ₹10 lakh",
    eligibility: {
      status: "eligible",
      criteria: [
        "Non-farm income generating activity",
        "Micro/small enterprise category",
        "Business plan required for Kishore and Tarun"
      ]
    },
    documentsRequired: [
      "Aadhaar Card",
      "PAN Card",
      "Business plan",
      "Proof of business existence",
      "Bank statements (6 months)"
    ],
    applicationSteps: [
      { step: 1, title: "Choose Loan Category", description: "Select Shishu, Kishore, or Tarun based on requirement", mode: "Both" },
      { step: 2, title: "Visit Bank Branch", description: "Go to any scheduled commercial bank, RRB, or MFI", mode: "Offline" },
      { step: 3, title: "Submit Application", description: "Fill the MUDRA loan application form", mode: "Both" },
      { step: 4, title: "Loan Sanction", description: "Bank will process and sanction the loan", mode: "Offline" }
    ],
    applicationUrl: "https://www.mudra.org.in",
    tags: ["business", "loans", "MSME", "entrepreneurs"]
  },
  {
    id: "nsap-widow",
    name: "Indira Gandhi National Widow Pension",
    shortDescription: "Monthly pension of ₹300 for widows in BPL families",
    fullDescription: "Under the National Social Assistance Programme, widows aged 40-79 years belonging to BPL households are entitled to a monthly pension. State governments may provide additional amounts.",
    ministry: "Ministry of Rural Development",
    level: "Central",
    category: "Social Security",
    benefitType: "Grant",
    benefitAmount: "₹300 per month (Central) + State contribution",
    eligibility: {
      status: "not-eligible",
      criteria: [
        "Widow aged 40-79 years",
        "Belonging to Below Poverty Line (BPL) household",
        "Not receiving pension from any other source"
      ],
      reasons: ["This scheme is specifically for widows. You may check other social security schemes."]
    },
    documentsRequired: [
      "Aadhaar Card",
      "Death certificate of husband",
      "BPL card",
      "Age proof",
      "Bank account details"
    ],
    applicationSteps: [
      { step: 1, title: "Get BPL Certificate", description: "Obtain BPL certificate from local authority", mode: "Offline" },
      { step: 2, title: "Apply at Block Office", description: "Submit application at Block Development Office", mode: "Offline" },
      { step: 3, title: "Verification", description: "Social welfare officer will verify documents", mode: "Offline" },
      { step: 4, title: "Pension Disbursement", description: "Pension credited directly to bank account", mode: "Online" }
    ],
    tags: ["widow", "pension", "social security", "BPL"]
  },
  {
    id: "pm-scholarship",
    name: "Prime Minister's Scholarship Scheme",
    shortDescription: "Scholarships for children of ex-servicemen and defence personnel",
    fullDescription: "The scheme provides financial assistance to wards of ex-servicemen, ex-coast guard personnel and their widows for pursuing professional degree courses.",
    ministry: "Ministry of Defence",
    level: "Central",
    category: "Education",
    benefitType: "Grant",
    benefitAmount: "₹2,500-3,000 per month",
    eligibility: {
      status: "unknown",
      criteria: [
        "Ward/widow of ex-servicemen or coast guard",
        "Pursuing first professional degree course",
        "Minimum 60% marks in qualifying exam"
      ]
    },
    documentsRequired: [
      "Aadhaar Card",
      "Discharge certificate of parent",
      "Marksheets",
      "Admission letter",
      "Bank account details"
    ],
    applicationSteps: [
      { step: 1, title: "Register on KSB Portal", description: "Create account on Kendriya Sainik Board website", mode: "Online" },
      { step: 2, title: "Fill Application", description: "Complete scholarship application form", mode: "Online" },
      { step: 3, title: "Upload Documents", description: "Submit all required documents online", mode: "Online" },
      { step: 4, title: "Track Status", description: "Monitor application status on portal", mode: "Online" }
    ],
    applicationUrl: "https://ksb.gov.in",
    tags: ["scholarship", "education", "defence", "ex-servicemen"]
  },
  {
    id: "ayushman-bharat",
    name: "Ayushman Bharat - PM-JAY",
    shortDescription: "Free health coverage up to ₹5 lakh per family per year",
    fullDescription: "Ayushman Bharat Pradhan Mantri Jan Arogya Yojana provides health coverage of ₹5 lakh per family per year for secondary and tertiary hospitalization. It covers over 10 crore poor and vulnerable families.",
    ministry: "Ministry of Health & Family Welfare",
    level: "Central",
    category: "Healthcare",
    benefitType: "Insurance",
    benefitAmount: "Up to ₹5 lakh per family per year",
    eligibility: {
      status: "possibly-eligible",
      criteria: [
        "Identified through SECC 2011 data",
        "Below Poverty Line families",
        "No formal sector employment"
      ],
      reasons: ["Check your eligibility using your Aadhaar or ration card number"]
    },
    documentsRequired: [
      "Aadhaar Card",
      "Ration card",
      "Any government ID"
    ],
    applicationSteps: [
      { step: 1, title: "Check Eligibility", description: "Visit mera.pmjay.gov.in or call 14555", mode: "Both" },
      { step: 2, title: "Get e-Card", description: "Visit nearest Ayushman Mitra at empanelled hospital", mode: "Offline" },
      { step: 3, title: "Verify Identity", description: "Complete Aadhaar-based verification", mode: "Offline" },
      { step: 4, title: "Receive Card", description: "Get Ayushman Card for cashless treatment", mode: "Offline" }
    ],
    applicationUrl: "https://pmjay.gov.in",
    tags: ["health", "insurance", "hospital", "free treatment"]
  }
];

export const categories = [
  "All Categories",
  "Agriculture",
  "Housing",
  "Education",
  "Healthcare",
  "Business & MSME",
  "Social Security",
  "Women & Child",
  "SC/ST Welfare",
  "Skill Development"
];

export const states = [
  "All India",
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Delhi",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal"
];

export const benefitTypes = [
  "All Types",
  "Grant",
  "Subsidy",
  "Training",
  "Loan",
  "Insurance"
];

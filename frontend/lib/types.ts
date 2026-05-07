/**
 * TypeScript interfaces for the Explainable AI Loan Approval System
 */

// Form input interface matching backend LoanApplicationRequest
export interface LoanApplication {
  Age: number;
  Sex: string;
  Job: number;
  Housing: string;
  Saving_accounts: string | null;
  Checking_account: string | null;
  Credit_amount: number;
  Duration: number;
  Purpose: string;
}

// Feature impact from SHAP explanations
export interface FeatureImpact {
  feature: string;
  impact: number;
  direction: "positive" | "negative";
}

// Prediction response from /predict endpoint
export interface PredictionResponse {
  prediction: "Approved" | "Rejected";
  approval_probability: number;
  top_positive_factors: FeatureImpact[];
  top_negative_factors: FeatureImpact[];
  all_feature_impacts: FeatureImpact[];
}

// Counterfactual recommendation
export interface CounterfactualRecommendation {
  Credit_amount: number | null;
  Duration: number | null;
  Saving_accounts: string | null;
  Checking_account: string | null;
  prediction: "Approved" | "Rejected";
}

// Counterfactual response from /counterfactuals endpoint
export interface CounterfactualResponse {
  original_prediction: "Approved" | "Rejected";
  original_probability: number;
  counterfactual_recommendations: CounterfactualRecommendation[];
  message: string | null;
}

// Application state
export interface AppState {
  isLoading: boolean;
  prediction: PredictionResponse | null;
  counterfactuals: CounterfactualResponse | null;
  error: string | null;
}

// Form field configuration
export interface FormField {
  name: keyof LoanApplication;
  label: string;
  type: "number" | "select";
  options?: { value: string; label: string }[];
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
}

// Dropdown options
export const SEX_OPTIONS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
];

export const JOB_OPTIONS = [
  { value: "0", label: "Unskilled (Non-Resident)" },
  { value: "1", label: "Unskilled (Resident)" },
  { value: "2", label: "Skilled" },
  { value: "3", label: "Highly Skilled" },
];

export const HOUSING_OPTIONS = [
  { value: "own", label: "Own" },
  { value: "rent", label: "Rent" },
  { value: "free", label: "Free" },
];

export const SAVING_ACCOUNTS_OPTIONS = [
  { value: "NA", label: "Not Available" },
  { value: "little", label: "Little" },
  { value: "moderate", label: "Moderate" },
  { value: "quite rich", label: "Quite Rich" },
  { value: "rich", label: "Rich" },
];

export const CHECKING_ACCOUNT_OPTIONS = [
  { value: "NA", label: "Not Available" },
  { value: "little", label: "Little" },
  { value: "moderate", label: "Moderate" },
  { value: "rich", label: "Rich" },
];

export const PURPOSE_OPTIONS = [
  { value: "car", label: "Car" },
  { value: "furniture/equipment", label: "Furniture/Equipment" },
  { value: "radio/TV", label: "Radio/TV" },
  { value: "domestic appliances", label: "Domestic Appliances" },
  { value: "repairs", label: "Repairs" },
  { value: "education", label: "Education" },
  { value: "business", label: "Business" },
  { value: "vacation/others", label: "Vacation/Others" },
];

// Default form values
export const DEFAULT_FORM_VALUES: LoanApplication = {
  Age: 35,
  Sex: "male",
  Job: 2,
  Housing: "own",
  Saving_accounts: "moderate",
  Checking_account: "little",
  Credit_amount: 5000,
  Duration: 24,
  Purpose: "car",
};

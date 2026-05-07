/**
 * API client for the Explainable AI Loan Approval backend
 */

import axios, { AxiosError } from "axios";
import type {
  LoanApplication,
  PredictionResponse,
  CounterfactualResponse,
} from "./types";

// Backend API base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000,
});

/**
 * Transform form data to match backend expected format
 */
function transformFormData(data: LoanApplication): LoanApplication {
  return {
    ...data,
    Saving_accounts: data.Saving_accounts === "NA" ? null : data.Saving_accounts,
    Checking_account: data.Checking_account === "NA" ? null : data.Checking_account,
  };
}

/**
 * Handle API errors and return user-friendly messages
 */
function handleApiError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{ detail?: string }>;
    
    if (axiosError.response) {
      const status = axiosError.response.status;
      const detail = axiosError.response.data?.detail;
      
      if (status === 400) {
        return detail || "Invalid input data. Please check your form entries.";
      }
      if (status === 503) {
        return "Model service is currently unavailable. Please try again later.";
      }
      if (status === 500) {
        return detail || "Server error occurred. Please try again.";
      }
      return detail || `Request failed with status ${status}`;
    }
    
    if (axiosError.code === "ECONNABORTED") {
      return "Request timed out. Please try again.";
    }
    
    if (axiosError.code === "ERR_NETWORK") {
      return "Cannot connect to the server. Please ensure the backend is running.";
    }
  }
  
  return "An unexpected error occurred. Please try again.";
}

/**
 * Get loan approval prediction with SHAP explanations
 */
export async function predictLoanApproval(
  application: LoanApplication
): Promise<{ data?: PredictionResponse; error?: string }> {
  try {
    const transformedData = transformFormData(application);
    const response = await apiClient.post<PredictionResponse>(
      "/predict",
      transformedData
    );
    return { data: response.data };
  } catch (error) {
    return { error: handleApiError(error) };
  }
}

/**
 * Get counterfactual recommendations for rejected applications
 */
export async function getCounterfactuals(
  application: LoanApplication
): Promise<{ data?: CounterfactualResponse; error?: string }> {
  try {
    const transformedData = transformFormData(application);
    const response = await apiClient.post<CounterfactualResponse>(
      "/counterfactuals",
      transformedData
    );
    return { data: response.data };
  } catch (error) {
    return { error: handleApiError(error) };
  }
}

/**
 * Check backend health status
 */
export async function checkHealth(): Promise<boolean> {
  try {
    const response = await apiClient.get("/health");
    return response.data?.status === "healthy";
  } catch {
    return false;
  }
}

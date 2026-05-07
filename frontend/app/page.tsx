"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Cell,
  Tooltip,
  ReferenceLine,
} from "recharts";
import {
  FileText,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  XCircle,
  Loader2,
  ArrowRight,
  Info,
  Lightbulb,
  BookOpen,
  FlaskConical,
  ChevronDown,
  AlertTriangle,
  ExternalLink,
  Minus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  type LoanApplication,
  type PredictionResponse,
  type CounterfactualResponse,
  SEX_OPTIONS,
  JOB_OPTIONS,
  HOUSING_OPTIONS,
  SAVING_ACCOUNTS_OPTIONS,
  CHECKING_ACCOUNT_OPTIONS,
  PURPOSE_OPTIONS,
  DEFAULT_FORM_VALUES,
} from "@/lib/types";
import { predictLoanApproval, getCounterfactuals } from "@/lib/api";

// Simple fade animation
const fadeIn = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0 },
};

// Select Component
function Select({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "w-full appearance-none rounded-md border border-border bg-input px-3 py-2.5",
          "text-foreground text-sm",
          "focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-primary",
          "transition-colors duration-150"
        )}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
    </div>
  );
}

// Input Component
function Input({
  type = "text",
  value,
  onChange,
  placeholder,
  min,
  max,
  step,
}: {
  type?: string;
  value: string | number;
  onChange: (value: string) => void;
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      min={min}
      max={max}
      step={step}
      className={cn(
        "w-full rounded-md border border-border bg-input px-3 py-2.5",
        "text-foreground text-sm placeholder:text-muted-foreground",
        "focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-primary",
        "transition-colors duration-150"
      )}
    />
  );
}

// Form Field Wrapper
function FormField({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-foreground">
        {label}
      </label>
      {children}
      {hint && (
        <p className="text-xs text-muted-foreground">{hint}</p>
      )}
    </div>
  );
}

// Section Header Component
function SectionHeader({
  number,
  title,
  subtitle,
}: {
  number: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-8">
      <div className="flex items-baseline gap-3 mb-2">
        <span className="text-sm font-mono text-primary font-medium">
          {number}
        </span>
        <h2 className="text-2xl font-serif font-semibold text-foreground">
          {title}
        </h2>
      </div>
      {subtitle && (
        <p className="text-muted-foreground ml-8">{subtitle}</p>
      )}
    </div>
  );
}

// Header Section
function Header() {
  return (
    <header className="border-b border-border bg-white">
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
              <FlaskConical className="h-4 w-4" />
              <span>Research Demonstration</span>
            </div>
            <h1 className="text-3xl font-serif font-semibold text-foreground mb-2">
              Explainable AI for Credit Risk Assessment
            </h1>
            <p className="text-muted-foreground max-w-2xl">
              An interactive demonstration of interpretable machine learning techniques
              for loan approval decisions, featuring SHAP-based explanations and
              counterfactual recommendations.
            </p>
          </div>
          <div className="hidden md:block text-right text-sm text-muted-foreground">
            <p className="font-medium text-foreground">XGBoost + SHAP + DiCE</p>
            <p>German Credit Dataset</p>
          </div>
        </div>

        {/* Methodology badges */}
        <div className="flex flex-wrap gap-2 mt-6">
          {[
            "XGBoost Classifier",
            "SHAP TreeExplainer",
            "DiCE Counterfactuals",
            "Optuna HPO",
          ].map((tech) => (
            <span
              key={tech}
              className="badge badge-primary"
            >
              {tech}
            </span>
          ))}
        </div>
      </div>
    </header>
  );
}

// Application Form Section
function ApplicationForm({
  formData,
  setFormData,
  onSubmit,
  isLoading,
}: {
  formData: LoanApplication;
  setFormData: React.Dispatch<React.SetStateAction<LoanApplication>>;
  onSubmit: () => void;
  isLoading: boolean;
}) {
  const updateField = useCallback(
    <K extends keyof LoanApplication>(field: K, value: LoanApplication[K]) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
    },
    [setFormData]
  );

  return (
    <section className="py-12 px-6">
      <div className="max-w-5xl mx-auto">
        <SectionHeader
          number="1"
          title="Input Features"
          subtitle="Enter the loan applicant's information for risk assessment"
        />

        <div className="card p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Demographic Features */}
            <div className="lg:col-span-3">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
                Applicant Demographics
              </h3>
            </div>

            <FormField label="Age" hint="Applicant age in years (18-120)">
              <Input
                type="number"
                value={formData.Age}
                onChange={(v) => updateField("Age", parseInt(v) || 0)}
                min={18}
                max={120}
              />
            </FormField>

            <FormField label="Sex">
              <Select
                value={formData.Sex}
                onChange={(v) => updateField("Sex", v)}
                options={SEX_OPTIONS}
              />
            </FormField>

            <FormField label="Employment Category" hint="0: Unskilled non-resident, 3: Highly skilled">
              <Select
                value={String(formData.Job)}
                onChange={(v) => updateField("Job", parseInt(v))}
                options={JOB_OPTIONS}
              />
            </FormField>

            <FormField label="Housing Status">
              <Select
                value={formData.Housing}
                onChange={(v) => updateField("Housing", v)}
                options={HOUSING_OPTIONS}
              />
            </FormField>

            {/* Financial Features */}
            <div className="lg:col-span-3 mt-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
                Financial Information
              </h3>
            </div>

            <FormField label="Savings Account Status">
              <Select
                value={formData.Saving_accounts || "NA"}
                onChange={(v) => updateField("Saving_accounts", v)}
                options={SAVING_ACCOUNTS_OPTIONS}
              />
            </FormField>

            <FormField label="Checking Account Status">
              <Select
                value={formData.Checking_account || "NA"}
                onChange={(v) => updateField("Checking_account", v)}
                options={CHECKING_ACCOUNT_OPTIONS}
              />
            </FormField>

            <FormField label="Credit Amount" hint="Requested loan amount in DM">
              <Input
                type="number"
                value={formData.Credit_amount}
                onChange={(v) => updateField("Credit_amount", parseFloat(v) || 0)}
                min={1}
                step={100}
              />
            </FormField>

            <FormField label="Duration" hint="Loan term in months (1-72)">
              <Input
                type="number"
                value={formData.Duration}
                onChange={(v) => updateField("Duration", parseInt(v) || 0)}
                min={1}
                max={72}
              />
            </FormField>

            <FormField label="Loan Purpose">
              <Select
                value={formData.Purpose}
                onChange={(v) => updateField("Purpose", v)}
                options={PURPOSE_OPTIONS}
              />
            </FormField>
          </div>

          {/* Submit Button */}
          <div className="mt-8 pt-6 border-t border-border flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              <Info className="h-4 w-4 inline mr-1" />
              All features are used in the XGBoost model for prediction
            </p>
            <button
              onClick={onSubmit}
              disabled={isLoading}
              className={cn(
                "inline-flex items-center gap-2 px-6 py-2.5 rounded-md",
                "bg-primary text-primary-foreground font-medium text-sm",
                "hover:bg-primary/90 transition-colors",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Running Inference...
                </>
              ) : (
                <>
                  <FlaskConical className="h-4 w-4" />
                  Run Prediction
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

// Prediction Result Section
function PredictionResult({
  prediction,
}: {
  prediction: PredictionResponse;
}) {
  const isApproved = prediction.prediction === "Approved";
  const probability = prediction.approval_probability;
  const percentProb = probability * 100;

  return (
    <motion.section
      {...fadeIn}
      className="py-12 px-6 bg-muted/30"
    >
      <div className="max-w-5xl mx-auto">
        <SectionHeader
          number="2"
          title="Model Prediction"
          subtitle="Classification result from the XGBoost model with probability score"
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main Result Card */}
          <div className={cn(
            "card p-6 md:col-span-2",
            isApproved ? "border-l-4 border-l-success" : "border-l-4 border-l-danger"
          )}>
            <div className="flex items-start justify-between mb-6">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Classification Result</p>
                <div className="flex items-center gap-3">
                  {isApproved ? (
                    <CheckCircle2 className="h-8 w-8 text-success" />
                  ) : (
                    <XCircle className="h-8 w-8 text-danger" />
                  )}
                  <span className={cn(
                    "text-3xl font-serif font-semibold",
                    isApproved ? "text-success" : "text-danger"
                  )}>
                    {prediction.prediction}
                  </span>
                </div>
              </div>
              <span className={cn(
                "badge",
                isApproved ? "badge-success" : "badge-danger"
              )}>
                {isApproved ? "Low Risk" : "High Risk"}
              </span>
            </div>

            {/* Probability Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Approval Probability</span>
                <span className="font-mono font-medium">{percentProb.toFixed(2)}%</span>
              </div>
              <div className="relative h-3 bg-muted rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${percentProb}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className={cn(
                    "absolute inset-y-0 left-0 rounded-full",
                    isApproved ? "bg-success" : "bg-danger"
                  )}
                />
                {/* Decision threshold marker */}
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-foreground/50"
                  style={{ left: "50%" }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0% (Reject)</span>
                <span className="font-medium">50% threshold</span>
                <span>100% (Approve)</span>
              </div>
            </div>
          </div>

          {/* Stats Card */}
          <div className="card p-6">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
              Model Output
            </h4>
            <div className="space-y-4">
              <div className="data-row">
                <span className="text-sm text-muted-foreground">P(Approved)</span>
                <span className="font-mono text-sm">{probability.toFixed(4)}</span>
              </div>
              <div className="data-row">
                <span className="text-sm text-muted-foreground">P(Rejected)</span>
                <span className="font-mono text-sm">{(1 - probability).toFixed(4)}</span>
              </div>
              <div className="data-row">
                <span className="text-sm text-muted-foreground">Log-odds</span>
                <span className="font-mono text-sm">
                  {probability > 0 && probability < 1
                    ? Math.log(probability / (1 - probability)).toFixed(4)
                    : "N/A"}
                </span>
              </div>
              <div className="data-row">
                <span className="text-sm text-muted-foreground">Decision</span>
                <span className="font-mono text-sm">
                  P &gt; 0.5 → {isApproved ? "Accept" : "Reject"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  );
}

// SHAP Explanation Section
function ShapExplanation({
  prediction,
}: {
  prediction: PredictionResponse;
}) {
  const allFactors = prediction.all_feature_impacts.map((f) => ({
    feature: f.feature.replace(/_/g, " "),
    impact: f.impact,
    absImpact: Math.abs(f.impact),
    direction: f.direction,
  })).sort((a, b) => b.absImpact - a.absImpact);

  const maxAbsImpact = Math.max(...allFactors.map(f => f.absImpact), 0.01);

  return (
    <motion.section
      {...fadeIn}
      className="py-12 px-6"
    >
      <div className="max-w-5xl mx-auto">
        <SectionHeader
          number="3"
          title="SHAP Feature Attribution"
          subtitle="Local explanations showing each feature's contribution to the prediction"
        />

        <div className="methodology-note mb-8">
          <strong>Methodology:</strong> SHAP (SHapley Additive exPlanations) values are computed
          using TreeExplainer, which provides exact Shapley values for tree-based models.
          Positive values push toward approval; negative values push toward rejection.
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Positive Factors */}
          <div className="card p-6">
            <div className="flex items-center gap-2 mb-6">
              <TrendingUp className="h-5 w-5 text-success" />
              <h3 className="font-semibold">Positive Contributors</h3>
              <span className="text-sm text-muted-foreground ml-auto">
                Toward Approval
              </span>
            </div>

            <div className="space-y-4">
              {prediction.top_positive_factors.length > 0 ? (
                prediction.top_positive_factors.map((factor, i) => (
                  <motion.div
                    key={factor.feature}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium">{factor.feature.replace(/_/g, " ")}</span>
                      <span className="font-mono text-success">
                        +{factor.impact.toFixed(4)}
                      </span>
                    </div>
                    <div className="impact-bar">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(Math.abs(factor.impact) / maxAbsImpact) * 100}%` }}
                        transition={{ duration: 0.6, delay: i * 0.05 }}
                        className="impact-bar-fill bg-success"
                      />
                    </div>
                  </motion.div>
                ))
              ) : (
                <p className="text-muted-foreground text-sm text-center py-4">
                  No positive factors identified
                </p>
              )}
            </div>
          </div>

          {/* Negative Factors */}
          <div className="card p-6">
            <div className="flex items-center gap-2 mb-6">
              <TrendingDown className="h-5 w-5 text-danger" />
              <h3 className="font-semibold">Negative Contributors</h3>
              <span className="text-sm text-muted-foreground ml-auto">
                Toward Rejection
              </span>
            </div>

            <div className="space-y-4">
              {prediction.top_negative_factors.length > 0 ? (
                prediction.top_negative_factors.map((factor, i) => (
                  <motion.div
                    key={factor.feature}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium">{factor.feature.replace(/_/g, " ")}</span>
                      <span className="font-mono text-danger">
                        {factor.impact.toFixed(4)}
                      </span>
                    </div>
                    <div className="impact-bar">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(Math.abs(factor.impact) / maxAbsImpact) * 100}%` }}
                        transition={{ duration: 0.6, delay: i * 0.05 }}
                        className="impact-bar-fill bg-danger"
                      />
                    </div>
                  </motion.div>
                ))
              ) : (
                <p className="text-muted-foreground text-sm text-center py-4">
                  No negative factors identified
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Full Feature Impact Chart */}
        {allFactors.length > 0 && (
          <div className="card p-6 mt-6">
            <h3 className="font-semibold mb-2">Complete Feature Impact Summary</h3>
            <p className="text-sm text-muted-foreground mb-6">
              All SHAP values sorted by absolute magnitude
            </p>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={allFactors}
                  layout="vertical"
                  margin={{ top: 10, right: 40, left: 120, bottom: 10 }}
                >
                  <XAxis
                    type="number"
                    stroke="#9ca3af"
                    fontSize={11}
                    tickFormatter={(v) => v.toFixed(2)}
                  />
                  <YAxis
                    type="category"
                    dataKey="feature"
                    stroke="#9ca3af"
                    fontSize={11}
                    width={110}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#fff",
                      border: "1px solid #e5e7eb",
                      borderRadius: "6px",
                      fontSize: "12px",
                    }}
                    formatter={(value: number) => [value.toFixed(4), "SHAP Value"]}
                  />
                  <ReferenceLine x={0} stroke="#9ca3af" strokeDasharray="3 3" />
                  <Bar dataKey="impact" radius={[0, 4, 4, 0]}>
                    {allFactors.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.direction === "positive" ? "#22c55e" : "#ef4444"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </motion.section>
  );
}

// Counterfactual Recommendations Section
function CounterfactualRecommendations({
  counterfactuals,
  originalData,
}: {
  counterfactuals: CounterfactualResponse;
  originalData: LoanApplication;
}) {
  if (counterfactuals.counterfactual_recommendations.length === 0) {
    return (
      <motion.section {...fadeIn} className="py-12 px-6 bg-muted/30">
        <div className="max-w-5xl mx-auto">
          <SectionHeader
            number="4"
            title="Counterfactual Explanations"
            subtitle="Actionable recommendations to achieve approval"
          />
          <div className="card p-8 text-center">
            <AlertTriangle className="h-12 w-12 text-warning mx-auto mb-4" />
            <h3 className="font-semibold mb-2">No Counterfactuals Generated</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              The DiCE algorithm could not find valid counterfactual examples
              within the specified constraints. This may indicate that significant
              changes would be needed across multiple features.
            </p>
          </div>
        </div>
      </motion.section>
    );
  }

  return (
    <motion.section {...fadeIn} className="py-12 px-6 bg-muted/30">
      <div className="max-w-5xl mx-auto">
        <SectionHeader
          number="4"
          title="Counterfactual Explanations"
          subtitle="Minimal feature changes that would result in loan approval"
        />

        <div className="methodology-note mb-8">
          <strong>Methodology:</strong> Counterfactual explanations are generated using DiCE
          (Diverse Counterfactual Explanations). Only actionable features are modified:
          Credit Amount, Duration, Savings Account, and Checking Account. Immutable features
          (Age, Sex) remain unchanged.
        </div>

        {/* Comparison Table */}
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left p-4 font-semibold">Feature</th>
                  <th className="text-center p-4 font-semibold">Original Value</th>
                  {counterfactuals.counterfactual_recommendations.map((_, i) => (
                    <th key={i} className="text-center p-4 font-semibold">
                      <span className="inline-flex items-center gap-1">
                        CF {i + 1}
                        <CheckCircle2 className="h-4 w-4 text-success" />
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Credit Amount Row */}
                <tr className="border-b border-border">
                  <td className="p-4 font-medium">Credit Amount</td>
                  <td className="p-4 text-center font-mono">
                    {originalData.Credit_amount.toLocaleString()}
                  </td>
                  {counterfactuals.counterfactual_recommendations.map((rec, i) => (
                    <td key={i} className="p-4 text-center">
                      {rec.Credit_amount !== null ? (
                        <span className={cn(
                          "font-mono",
                          rec.Credit_amount !== originalData.Credit_amount && "text-primary font-semibold"
                        )}>
                          {rec.Credit_amount.toLocaleString()}
                          {rec.Credit_amount !== originalData.Credit_amount && (
                            <span className="block text-xs text-muted-foreground">
                              {rec.Credit_amount < originalData.Credit_amount
                                ? `↓ ${(originalData.Credit_amount - rec.Credit_amount).toLocaleString()}`
                                : `↑ ${(rec.Credit_amount - originalData.Credit_amount).toLocaleString()}`}
                            </span>
                          )}
                        </span>
                      ) : (
                        <Minus className="h-4 w-4 mx-auto text-muted-foreground" />
                      )}
                    </td>
                  ))}
                </tr>

                {/* Duration Row */}
                <tr className="border-b border-border">
                  <td className="p-4 font-medium">Duration (months)</td>
                  <td className="p-4 text-center font-mono">{originalData.Duration}</td>
                  {counterfactuals.counterfactual_recommendations.map((rec, i) => (
                    <td key={i} className="p-4 text-center">
                      {rec.Duration !== null ? (
                        <span className={cn(
                          "font-mono",
                          rec.Duration !== originalData.Duration && "text-primary font-semibold"
                        )}>
                          {rec.Duration}
                          {rec.Duration !== originalData.Duration && (
                            <span className="block text-xs text-muted-foreground">
                              {rec.Duration < originalData.Duration
                                ? `↓ ${originalData.Duration - rec.Duration}`
                                : `↑ ${rec.Duration - originalData.Duration}`}
                            </span>
                          )}
                        </span>
                      ) : (
                        <Minus className="h-4 w-4 mx-auto text-muted-foreground" />
                      )}
                    </td>
                  ))}
                </tr>

                {/* Savings Account Row */}
                <tr className="border-b border-border">
                  <td className="p-4 font-medium">Savings Account</td>
                  <td className="p-4 text-center capitalize">
                    {originalData.Saving_accounts || "N/A"}
                  </td>
                  {counterfactuals.counterfactual_recommendations.map((rec, i) => (
                    <td key={i} className="p-4 text-center">
                      {rec.Saving_accounts ? (
                        <span className={cn(
                          "capitalize",
                          rec.Saving_accounts !== originalData.Saving_accounts && "text-primary font-semibold"
                        )}>
                          {rec.Saving_accounts}
                        </span>
                      ) : (
                        <Minus className="h-4 w-4 mx-auto text-muted-foreground" />
                      )}
                    </td>
                  ))}
                </tr>

                {/* Checking Account Row */}
                <tr className="border-b border-border">
                  <td className="p-4 font-medium">Checking Account</td>
                  <td className="p-4 text-center capitalize">
                    {originalData.Checking_account || "N/A"}
                  </td>
                  {counterfactuals.counterfactual_recommendations.map((rec, i) => (
                    <td key={i} className="p-4 text-center">
                      {rec.Checking_account ? (
                        <span className={cn(
                          "capitalize",
                          rec.Checking_account !== originalData.Checking_account && "text-primary font-semibold"
                        )}>
                          {rec.Checking_account}
                        </span>
                      ) : (
                        <Minus className="h-4 w-4 mx-auto text-muted-foreground" />
                      )}
                    </td>
                  ))}
                </tr>

                {/* Predicted Outcome Row */}
                <tr className="bg-success-light/50">
                  <td className="p-4 font-semibold">Predicted Outcome</td>
                  <td className="p-4 text-center">
                    <span className="badge badge-danger">Rejected</span>
                  </td>
                  {counterfactuals.counterfactual_recommendations.map((rec, i) => (
                    <td key={i} className="p-4 text-center">
                      <span className="badge badge-success">{rec.prediction}</span>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Interpretation Note */}
        <div className="mt-6 p-4 bg-warning-light/50 rounded-lg border border-warning/20">
          <div className="flex gap-3">
            <Lightbulb className="h-5 w-5 text-warning shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-foreground mb-1">Interpretation Guide</p>
              <p className="text-muted-foreground">
                Each counterfactual (CF) represents a minimal set of changes to the original
                application that would flip the decision from &quot;Rejected&quot; to &quot;Approved&quot;.
                Values in <span className="text-primary font-semibold">blue</span> indicate
                changes from the original. These are not guarantees but model-based suggestions.
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  );
}

// Error Alert Component
function ErrorAlert({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="fixed top-4 left-1/2 -translate-x-1/2 z-50 max-w-lg"
    >
      <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-danger-light border border-danger/20 shadow-lg">
        <AlertTriangle className="h-5 w-5 text-danger shrink-0" />
        <p className="text-sm text-foreground">{message}</p>
        <button
          onClick={onDismiss}
          className="ml-2 text-muted-foreground hover:text-foreground"
        >
          ×
        </button>
      </div>
    </motion.div>
  );
}

// References Section
function References() {
  return (
    <section className="py-12 px-6 border-t border-border">
      <div className="max-w-5xl mx-auto">
        <h3 className="text-lg font-serif font-semibold mb-6">References & Methodology</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
          <div>
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              SHAP Explanations
            </h4>
            <p className="text-muted-foreground mb-2">
              Lundberg, S. M., & Lee, S. I. (2017). A unified approach to interpreting
              model predictions. <em>NeurIPS</em>.
            </p>
            <a
              href="https://github.com/slundberg/shap"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline inline-flex items-center gap-1"
            >
              github.com/slundberg/shap
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
          <div>
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              DiCE Counterfactuals
            </h4>
            <p className="text-muted-foreground mb-2">
              Mothilal, R. K., et al. (2020). Explaining machine learning classifiers
              through diverse counterfactual explanations. <em>FAT*</em>.
            </p>
            <a
              href="https://github.com/interpretml/DiCE"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline inline-flex items-center gap-1"
            >
              github.com/interpretml/DiCE
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

// Footer
function Footer() {
  return (
    <footer className="py-8 px-6 bg-muted/50 border-t border-border">
      <div className="max-w-5xl mx-auto text-center text-sm text-muted-foreground">
        <p className="mb-2">
          <strong>Explainable AI Credit Risk Assessment</strong> — Research Demonstration
        </p>
        <p>
          Built with XGBoost, SHAP TreeExplainer, and DiCE Counterfactual Explanations
        </p>
        <p className="mt-2 text-xs">
          Dataset: German Credit Data (UCI ML Repository) | Model: XGBoost with Optuna HPO
        </p>
      </div>
    </footer>
  );
}

// Main Page Component
export default function Home() {
  const [formData, setFormData] = useState<LoanApplication>(DEFAULT_FORM_VALUES);
  const [isLoading, setIsLoading] = useState(false);
  const [prediction, setPrediction] = useState<PredictionResponse | null>(null);
  const [counterfactuals, setCounterfactuals] = useState<CounterfactualResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setPrediction(null);
    setCounterfactuals(null);

    const predictionResult = await predictLoanApproval(formData);

    if (predictionResult.error) {
      setError(predictionResult.error);
      setIsLoading(false);
      return;
    }

    if (predictionResult.data) {
      setPrediction(predictionResult.data);

      if (predictionResult.data.prediction === "Rejected") {
        const cfResult = await getCounterfactuals(formData);
        if (cfResult.data) {
          setCounterfactuals(cfResult.data);
        }
      }
    }

    setIsLoading(false);
  }, [formData]);

  return (
    <main className="min-h-screen bg-background">
      {/* Error Toast */}
      <AnimatePresence>
        {error && (
          <ErrorAlert message={error} onDismiss={() => setError(null)} />
        )}
      </AnimatePresence>

      {/* Header */}
      <Header />

      {/* Application Form */}
      <ApplicationForm
        formData={formData}
        setFormData={setFormData}
        onSubmit={handleSubmit}
        isLoading={isLoading}
      />

      {/* Results */}
      <AnimatePresence mode="wait">
        {prediction && (
          <motion.div
            key="results"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <PredictionResult prediction={prediction} />
            <ShapExplanation prediction={prediction} />
            {counterfactuals && (
              <CounterfactualRecommendations
                counterfactuals={counterfactuals}
                originalData={formData}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>

     

      {/* Footer */}
      <Footer />
    </main>
  );
}

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Explainable AI Credit Risk Assessment | XAI Research Demo",
  description:
    "A research demonstration of explainable machine learning for credit risk assessment using SHAP values and counterfactual explanations.",
  keywords: [
    "explainable AI",
    "XAI",
    "SHAP",
    "credit risk",
    "machine learning",
    "counterfactual explanations",
    "DiCE",
    "interpretable ML",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} antialiased`}>{children}</body>
    </html>
  );
}

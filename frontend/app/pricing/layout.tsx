import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing — Free, Pro & Agency Plans",
  description: "Start free, upgrade when you need more. VisibilityRadar Pro gives you 10 analyses/month across all 6 AI models. Launch pricing — limited time only.",
  alternates: { canonical: "/pricing" },
  openGraph: {
    title: "VisibilityRadar Pricing — Free AI Brand Visibility Scoring",
    description: "Free plan available. Pro at $49/mo (launch price). Agency at $599/mo with API access.",
    url: "https://visibilityradar.ai/pricing",
  },
};

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return children;
}

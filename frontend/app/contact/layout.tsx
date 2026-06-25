import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Get in touch with the VisibilityRadar team. Questions about AI brand visibility, GEO optimization, or your account.",
  alternates: { canonical: "/contact" },
  openGraph: { title: "Contact VisibilityRadar", description: "Get in touch with the VisibilityRadar team.", url: "https://visibilityradar.ai/contact", type: "website" },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}

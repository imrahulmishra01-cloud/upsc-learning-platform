import { Metadata } from "next";

export const metadata: Metadata = {
  title: "PYQ Practice | UPSC App",
  description: "Previous Year Questions practice and analysis for UPSC preparation",
};

export default function PYQLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

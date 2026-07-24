import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Material Vault | UPSC App",
};

export default function MaterialsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

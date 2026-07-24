import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Upload Material | UPSC App",
};

export default function UploadLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

import type { Metadata } from "next";
import "../src/index.css";
import "../src/views/LandingPage.css";
import "../src/views/Auth.css";
import "../src/components/AppSidebar.css";
import "../src/views/Dashboard.css";
import "../src/views/WorkspacePages.css";

export const metadata: Metadata = {
  title: "Trustix | Digital Inheritance",
  description: "Secure digital inheritance and asset protection.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

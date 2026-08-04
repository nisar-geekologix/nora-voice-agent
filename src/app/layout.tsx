import "../index.css";
import { type ReactNode } from "react";

export const metadata = {
  title: "Nora AI Voice Platform",
  description: "Enterprise Voice Agents and Automation Gateway",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}

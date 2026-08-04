import "./globals.css";

export const metadata = {
  title: "HeyIra. - Conversations made human. AI that speaks naturally.",
  description:
    "The AI Employee That Answers. Sells. Books. Follows Up. Build human-like AI Voice Agents for Sales, Support, Booking, Collections and Follow-ups.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark scroll-smooth" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-[#0D0D0F] text-[#F5F5F7] antialiased selection:bg-[#7B5CFF]/30 selection:text-white min-h-screen" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}

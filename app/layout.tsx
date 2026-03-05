import "./globals.css";
import React from "react";

export const metadata = {
  title: "Wix AI Minimal Chatbot",
  description: "Minimal chatbot for embedding into Wix."
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  );
}

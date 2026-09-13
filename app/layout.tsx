import "./globals.css";
import React from "react";

export const metadata = {
  title: "Nurse Erica • Aesthetic Assistant",
  description:
    "Ask about Botox, Dysport, Xeomin, dermal fillers, and facial balancing. Serving Philadelphia, PA and Chester County, PA."
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

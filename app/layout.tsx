import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "4iGadgets",
  description:
    "Bangladesh's friendly everything store. Genuine products, honest prices, delivery across the country.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      {/* Body background + base font match the exported 4iGadgets design exactly. */}
      <body style={{ backgroundColor: "rgb(217, 212, 202)", fontFamily: "Helvetica" }}>
        {children}
      </body>
    </html>
  );
}

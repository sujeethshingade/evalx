import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "EvalX",
  description: "Extract marks from student PDFs and create consolidated Excel sheets dynamically.",
  authors: [{ name: "Sujeeth Shingade" }, {url: "https://github.com/sujeethshingade"}]
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} min-h-screen text-slate-100 antialiased`}>
        {children}
      </body>
    </html>
  );
}

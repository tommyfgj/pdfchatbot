import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PDF Chatbot - AI-Powered PDF Reader",
  description: "Read PDFs and chat with AI about selected text",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}

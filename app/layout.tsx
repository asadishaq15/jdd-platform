import type { Metadata } from "next";
import "./globals.css";
import "../components/parity/legacy-motion.css";

export const metadata: Metadata = {
  title: "Jardin du Desert - Space",
  description: "Private hospitality Space for Jardin du Desert.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/assets/favicon.png" type="image/png" />
        <meta name="theme-color" content="#F4F4F2" />
      </head>
      <body suppressHydrationWarning>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{if(localStorage.getItem("jdd-theme")==="dark"){document.body.classList.add("night");document.querySelector('meta[name="theme-color"]').setAttribute("content","#111110")}}catch(e){}`,
          }}
        />
        {children}
      </body>
    </html>
  );
}

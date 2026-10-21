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
        <meta name="theme-color" content="#111110" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=Inter:wght@300;400;500&display=swap" rel="stylesheet" />
      </head>
      <body className="night" suppressHydrationWarning>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{if(localStorage.getItem("jdd-theme")==="light"){document.body.classList.remove("night");document.querySelector('meta[name="theme-color"]').setAttribute("content","#F4F4F2")}}catch(e){}`,
          }}
        />
        {children}
      </body>
    </html>
  );
}

import { Inter } from "next/font/google";
import "./globals.css";
import ThemeProvider from "@/components/ThemeProvider";
import { AuthProvider } from "@/context/AuthContext";

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata = {
  title: "AuraLab – AI-Powered Learning Assistant",
  description: "A modern, focus-oriented learning management system powered by AI.",
  icons: {
    icon: "/logo.png",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} antialiased`} style={{ background: 'transparent' }}>
        <div style={{ position: 'fixed', inset: 0, width: '100vw', height: '100vh', pointerEvents: 'none', overflow: 'hidden', zIndex: -1 }}>
          {/* Background Video */}
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: -1,
            background: '#0a0e1a',
          }}>
            <video
              autoPlay
              loop
              muted
              playsInline
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                opacity: 0.8,
              }}
            >
              <source src="/bg-video.mp4" type="video/mp4" />
            </video>
          </div>
        </div>
        <AuthProvider>
          <ThemeProvider>
            {children}
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

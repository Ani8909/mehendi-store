import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { Playfair_Display, Poppins } from "next/font/google";
import Layout from "@/components/Layout";
import { AuthProvider } from "@/lib/authContext";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
});

const poppins = Poppins({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-poppins",
});

export default function App({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider>
      <main className={`${playfair.variable} ${poppins.variable} font-sans`}>
        <Layout>
          <Component {...pageProps} />
        </Layout>
      </main>
    </AuthProvider>
  );
}

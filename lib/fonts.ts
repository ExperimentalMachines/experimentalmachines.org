import { Inter, Inter_Tight } from "next/font/google";

// The organisation's typefaces, defined once for every page that uses them: the
// homepage and the pages under /openweights. Their variables go on a .home
// wrapper (globals.css); the older pages keep Archivo from the root layout.
export const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
export const interTight = Inter_Tight({ subsets: ["latin"], variable: "--font-inter-tight", display: "swap" });

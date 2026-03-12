import { Roboto, Raleway, Nunito_Sans, Geist, Geist_Mono } from "next/font/google";

// Roboto - used by landing page hero/header
export const roboto = Roboto({
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
  variable: "--font-roboto",
  display: "swap",
});

// Active pairing: Raleway + Nunito Sans
export const raleway = Raleway({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-raleway",
  display: "swap",
});

export const nunitoSans = Nunito_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-nunito-sans",
  display: "swap",
});

// Default fonts (Geist)
export const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// ============================================
// CUSTOM FONTS (loaded via @font-face in globals.css)
// ============================================
// These fonts are defined in globals.css and can be used via CSS variables:
// --font-urw-din: "urw-din", sans-serif;
// --font-euclid: "euclidCircularALightWebS", "euclidCircularALightWebS Fallback", sans-serif;

// CSS variable names for custom fonts
export const customFonts = {
  urwDin: "--font-urw-din",
  euclid: "--font-euclid",
} as const;

// ============================================
// FONT CONFIGURATION
// ============================================
export const ACTIVE_FONT_PAIRING = 6 as const;

// Active font pairing: Raleway (heading) + Nunito Sans (body)
export const activeFontPairing = {
  name: "Raleway + Nunito Sans",
  heading: raleway,
  body: nunitoSans,
  headingVar: "--font-raleway",
  bodyVar: "--font-nunito-sans",
} as const;

// Get only the active font variables (heading + body + mono)
export const getActiveFontVariables = () => {
  return `${roboto.variable} ${raleway.variable} ${nunitoSans.variable} ${geistSans.variable} ${geistMono.variable}`;
};

// Alias used by admin pages — returns the same active font variables
export const getAllFontVariables = getActiveFontVariables;

// Helper to get CSS variable values for the active font pairing
export const getActiveFontCSSVariables = () => {
  return {
    primary: `var(${activeFontPairing.headingVar})`,
    heading: `var(${activeFontPairing.headingVar})`,
  };
};

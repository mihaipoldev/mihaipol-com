import {
  Roboto,
  Open_Sans,
  Montserrat,
  DM_Sans,
  Source_Code_Pro,
  Space_Grotesk,
  Josefin_Sans,
  Rubik,
  Geist,
  Geist_Mono,
  Inter,
  Poppins,
  Nunito_Sans,
  Raleway,
} from "next/font/google";

// Font Pairing 1: Roboto + Open Sans
export const roboto = Roboto({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-roboto",
  display: "swap",
});

export const openSans = Open_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-open-sans",
  display: "swap",
});

// Font Pairing 2: Montserrat + DM Sans (Gotham alternative)
export const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-montserrat",
  display: "swap",
});

export const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-dm-sans",
  display: "swap",
});

// Font Pairing 3: Source Code Pro + Space Grotesk
export const sourceCodePro = Source_Code_Pro({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-source-code-pro",
  display: "swap",
});

export const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-space-grotesk",
  display: "swap",
});

// Font Pairing 4: Josefin Sans + Rubik (Fortuna alternative)
export const josefinSans = Josefin_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-josefin-sans",
  display: "swap",
});

export const rubik = Rubik({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-rubik",
  display: "swap",
});

// Font Pairing 5: Inter + Poppins
export const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

export const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
});

// Font Pairing 6: Raleway + Nunito Sans
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
// FONT CONFIGURATION - CHANGE HERE TO SWITCH FONTS
// ============================================
export type FontPairing = 1 | 2 | 3 | 4 | 5 | 6;

// Change this value to switch between font pairings
export const ACTIVE_FONT_PAIRING: FontPairing = 6;

// Font pairing configurations
export const fontPairings = {
  1: {
    name: "Roboto + Open Sans",
    heading: roboto,
    body: openSans,
    headingVar: "--font-roboto", //good
    bodyVar: "--font-open-sans",
  },
  2: {
    name: "Montserrat + DM Sans (Gotham)",
    heading: montserrat,
    body: dmSans,
    headingVar: "--font-montserrat", // good
    bodyVar: "--font-dm-sans", // good
  },
  3: {
    name: "Source Code Pro + Space Grotesk",
    heading: sourceCodePro,
    body: spaceGrotesk,
    headingVar: "--font-source-code-pro", // mono
    bodyVar: "--font-space-grotesk", // no
  },
  4: {
    name: "Josefin Sans + Rubik (Fortuna)",
    heading: josefinSans,
    body: rubik,
    headingVar: "--font-josefin-sans", //good
    bodyVar: "--font-rubik", //no
  },
  5: {
    name: "Inter + Poppins",
    heading: inter,
    body: poppins,
    headingVar: "--font-inter", //no
    bodyVar: "--font-poppins", //good
  },
  6: {
    name: "Raleway + Nunito Sans",
    heading: raleway,
    body: nunitoSans,
    headingVar: "--font-raleway", // not really
    bodyVar: "--font-nunito-sans", //good
  },
} as const;

// Get the active font pairing
export const activeFontPairing = fontPairings[ACTIVE_FONT_PAIRING];

// Get all font variables for className (includes all fonts for CSS variable availability)
export const getAllFontVariables = () => {
  return [
    roboto.variable,
    openSans.variable,
    montserrat.variable,
    dmSans.variable,
    sourceCodePro.variable,
    spaceGrotesk.variable,
    josefinSans.variable,
    rubik.variable,
    inter.variable,
    poppins.variable,
    raleway.variable,
    nunitoSans.variable,
    geistSans.variable,
    geistMono.variable,
  ].join(" ");
};

// Get only the active font variables
export const getActiveFontVariables = () => {
  return `${activeFontPairing.heading.variable} ${activeFontPairing.body.variable} ${geistMono.variable}`;
};

// Helper to get CSS variable values for the active font pairing
// Use this to update CSS variables in globals.css when switching fonts
export const getActiveFontCSSVariables = () => {
  return {
    primary: `var(${activeFontPairing.headingVar})`,
    heading: `var(${activeFontPairing.headingVar})`,
  };
};

// ============================================
// HOW TO SWITCH FONTS:
// ============================================
// 1. Change ACTIVE_FONT_PAIRING above (line ~125) to 1, 2, 3, 4, 5, or 6
// 2. Update globals.css:
//    - In :root (around line 20): Update --font-family-primary and --font-family-heading
//    - In .preset-balanced (around line 280): Update --font-family-primary and --font-family-heading
//    - Use the values from getActiveFontCSSVariables() or the pairing variables:
//      Pairing 1: --font-roboto (heading), --font-open-sans (body)
//      Pairing 2: --font-montserrat (heading), --font-dm-sans (body) - DM Sans is Gotham alternative
//      Pairing 3: --font-source-code-pro (heading), --font-space-grotesk (body)
//      Pairing 4: --font-josefin-sans (heading), --font-rubik (body) - Rubik is Fortuna alternative
//      Pairing 5: --font-inter (heading), --font-poppins (body)
//      Pairing 6: --font-raleway (heading), --font-nunito-sans (body)
// 3. Restart your dev server


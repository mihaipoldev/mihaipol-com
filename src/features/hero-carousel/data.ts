import fs from "fs";
import path from "path";

export function getHeroCarouselImages(): string[] {
  const dir = path.join(process.cwd(), "public", "hero images");
  const files = fs.readdirSync(dir);
  return files
    .filter((f) => /\.(jpg|jpeg|png|webp)$/i.test(f))
    .sort()
    .map((f) => `/hero images/${f}`);
}

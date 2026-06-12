/**
 * Post-build script: generates static HTML pages for each professional
 * with Open Graph meta tags pre-baked so WhatsApp / social bots
 * can generate link previews without executing JavaScript.
 *
 * Run after `vite build`. Creates:
 *   dist/{slug}/index.html  ← has OG tags + loads the React SPA normally
 */

import fs from "node:fs";
import path from "node:path";

const SITE_URL = "https://probo.pro";
const SITE_NAME = "Probo.pro";

const PROFESSIONALS = {
  doctor_melgar: {
    name: "Dr. Francisco Melgar",
    title: "Médico Estético",
    specialty: "Especialista en Medicina Estética y Tricología",
    city: "Cochabamba",
    heroPhoto: "/doctor_melgar/photos/drmelgar.jpeg",
    services: ["Toxina Botulínica", "Ácido Hialurónico", "Diseño de Labios"],
  },
  barber_vip: {
    name: "Barber VIP",
    title: "Barbería de Lujo",
    specialty: "Corte, barba y grooming de primera clase",
    city: "Cochabamba",
    heroPhoto: "/barber_vip/photos/barberia.webp",
    services: ["Corte Clásico", "Fade & Degradado", "Tinte & Color"],
  },
  dr_seifert: {
    name: "Dr. Ivan Seifert",
    title: "Especialista en Endodoncia",
    specialty: "Especialista en endodoncia y tratamiento de conductos",
    city: "Cochabamba",
    heroPhoto: "/dr_seifert/photos/dr_seifert_2.jpeg",
    services: [
      "Limpieza & Profilaxis",
      "Blanqueamiento Dental",
      "Carillas de Porcelana",
    ],
  },
  jhoel_cuts: {
    name: "Jhoel Cuts",
    title: "Barbero & Estilista",
    specialty: "Cortes de autor, fade artístico y estilismo personalizado",
    city: "Cochabamba",
    heroPhoto: "/jhoel_cuts/photos/jhoel.jpeg",
    services: ["Corte Clásico", "Fade & Degradado", "Tinte & Color"],
  },
};

const distDir = path.resolve("dist");
const baseHtml = fs.readFileSync(path.join(distDir, "index.html"), "utf8");

for (const [slug, pro] of Object.entries(PROFESSIONALS)) {
  const pageUrl = `${SITE_URL}/${slug}`;
  const imageUrl = `${SITE_URL}${pro.heroPhoto}`;
  const title = `${pro.name} — ${pro.title} en ${pro.city} | ${SITE_NAME}`;

  const ogTags = `
    <meta property="og:type"        content="website" />
    <meta property="og:url"         content="${pageUrl}" />
    <meta property="og:title"       content="${title}" />
    <meta property="og:image"       content="${imageUrl}" />
    <meta property="og:image:width"  content="300" />
    <meta property="og:image:height" content="300" />
    <meta property="og:site_name"   content="${SITE_NAME}" />
    <meta name="twitter:card"       content="summary" />
    <meta name="twitter:title"      content="${title}" />
    <meta name="twitter:image"      content="${imageUrl}" />
    <title>${title}</title>
    <link rel="manifest" href="/${slug}/manifest.json" />
    <meta name="apple-mobile-web-app-title" content="${pro.name.split(" ").slice(0, 2).join(" ")}" />`;

  // Inject OG tags right after <head> and replace the default <title>
  const html = baseHtml
    .replace(/<title>[^<]*<\/title>/, "") // remove default title
    .replace("<head>", `<head>${ogTags}`);

  const outDir = path.join(distDir, slug);
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, "index.html"), html);

  // Per-professional manifest for Android home screen name
  const manifest = {
    name: pro.name,
    short_name: pro.name.split(" ").slice(0, 2).join(" "),
    description: `${pro.specialty} en ${pro.city}`,
    start_url: `/${slug}`,
    display: "standalone",
    background_color: "#111111",
    theme_color: "#111111",
    icons: [
      { src: pro.heroPhoto, sizes: "192x192", type: "image/jpeg" },
      { src: pro.heroPhoto, sizes: "512x512", type: "image/jpeg" },
    ],
  };
  fs.writeFileSync(
    path.join(outDir, "manifest.json"),
    JSON.stringify(manifest, null, 2),
  );

  console.log(`✓ Generated dist/${slug}/index.html + manifest.json`);
}

console.log("\n✅ OG HTML pages generated successfully");

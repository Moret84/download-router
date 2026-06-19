import type { Rule } from "./types";

export function createDefaultRules(): Rule[] {
  return [
    {
      id: crypto.randomUUID(),
      name: "GitHub Releases",
      enabled: true,
      priority: 10,
      domain: "github.com",
      urlRegex: "/releases/",
      destination: "~/Downloads/GitHub/Releases",
    },
    {
      id: crypto.randomUUID(),
      name: "PDF",
      enabled: true,
      priority: 20,
      extension: "pdf",
      destination: "~/Downloads/PDF",
    },
    {
      id: crypto.randomUUID(),
      name: "Images",
      enabled: true,
      priority: 30,
      extension: "jpg|jpeg|png|webp",
      destination: "~/Downloads/Images",
    },
    {
      id: crypto.randomUUID(),
      name: "Archives",
      enabled: true,
      priority: 40,
      extension: "zip|tar.gz|7z",
      destination: "~/Downloads/Archives",
    },
    {
      id: crypto.randomUUID(),
      name: "Installers",
      enabled: true,
      priority: 50,
      extension: "dmg|exe|msi|apk",
      destination: "~/Downloads/Installers",
    },
  ];
}

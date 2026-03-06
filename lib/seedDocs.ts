import type { SourceType } from "@/lib/types";

export interface SeedDoc {
  fileName: string;
  publicPath: string;
  sourceType: SourceType;
  label: string;
}

export const seedDocs: SeedDoc[] = [
  {
    fileName: "2015-US-Army-Corps-Shoring-Operation-Guide-SOG.pdf",
    publicPath: "/seed_docs/2015-US-Army-Corps-Shoring-Operation-Guide-SOG.pdf",
    sourceType: "SOG",
    label: "USACE Shoring Operations Guide (2015)",
  },
  {
    fileName: "CMC-Rope-Rescue-Field-Guide-4th-Edition.pdf",
    publicPath: "/seed_docs/CMC-Rope-Rescue-Field-Guide-4th-Edition.pdf",
    sourceType: "OTHER",
    label: "CMC Rope Rescue Field Guide (4th)",
  },
  {
    fileName: "MUSAR-SOG-2020.pdf",
    publicPath: "/seed_docs/MUSAR-SOG-2020.pdf",
    sourceType: "SOG",
    label: "MUSAR SOG (2020)",
  },
  {
    fileName: "st-120108-final-shoring-guidebook.pdf",
    publicPath: "/seed_docs/st-120108-final-shoring-guidebook.pdf",
    sourceType: "OTHER",
    label: "Shoring Guidebook (st-120108)",
  },
];

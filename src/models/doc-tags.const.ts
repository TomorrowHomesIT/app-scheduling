export const DOC_TAGS = ["ENG", "LPD", "PIC", "SOL", "EXT", "INT", "SUB", "STD", "NRG"] as const;

export type TDocTag = (typeof DOC_TAGS)[number];

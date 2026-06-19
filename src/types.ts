export interface Rule {
  id: string;
  name: string;
  enabled: boolean;
  priority: number;

  domain?: string;
  urlRegex?: string;
  filenameRegex?: string;
  extension?: string;
  mimeType?: string;

  destination: string;
}

export interface DownloadLog {
  timestamp: number;
  filename: string;
  sourceUrl: string;
  matchedRule?: string;
  destination: string;
}

export interface MatchInput {
  url: string;
  filename: string;
  mimeType?: string;
}

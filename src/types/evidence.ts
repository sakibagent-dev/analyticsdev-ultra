import { Evidence, EvidenceType } from "./detection";

export interface EvidenceBuilderOptions {
  idPrefix?: string;
  type: EvidenceType;
  description: string;
  source?: string;
  value?: string;
  confidence?: number;
}

export function createEvidence(options: EvidenceBuilderOptions): Evidence {
  const prefix = options.idPrefix || options.type;
  const rand = Math.random().toString(36).substring(2, 8);
  return {
    id: `${prefix}_${Date.now()}_${rand}`,
    type: options.type,
    description: options.description,
    source: options.source,
    value: options.value,
    confidence: options.confidence ?? 1.0,
    timestamp: Date.now(),
  };
}

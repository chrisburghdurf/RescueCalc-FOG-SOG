export type RuleFieldType = "number" | "select";

export interface RuleField {
  id: string;
  label: string;
  type: RuleFieldType;
  required: boolean;
  min?: number;
  max?: number;
  step?: number;
  options?: Array<{ value: string; label: string }>;
  defaultValue?: number | string;
}

export interface RuleCitationQuery {
  query: string;
  preferredSource?: "FOG" | "SOG" | "OTHER";
}

export interface RuleDefinition {
  id: string;
  toolName: string;
  description: string;
  placeholder: boolean;
  placeholderLabel?: string;
  calculator:
    | "airbagLift"
    | "cribbingHeight"
    | "vehicleStabilization"
    | "strutAngleLoad"
    | "shoringSelector"
    | "ropeRescueMA"
    | "collapseWeight";
  inputs: RuleField[];
  assumptions: string[];
  warnings: string[];
  stepTemplates: string[];
  citationQueries: RuleCitationQuery[];
}

export interface RuleRunResult {
  recommendedSteps: string[];
  assumptions: string[];
  warnings: string[];
  computed: Record<string, number | string>;
}

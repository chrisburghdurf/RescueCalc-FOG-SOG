import { z } from "zod";
import type { RuleDefinition } from "@/lib/rules/types";

export function buildInputSchema(rule: RuleDefinition) {
  const shape: Record<string, z.ZodType> = {};

  for (const field of rule.inputs) {
    if (field.type === "number") {
      let numericField = z.coerce.number({
        error: `${field.label} must be a number.`,
      });

      if (field.min !== undefined) {
        numericField = numericField.min(field.min, `${field.label} must be at least ${field.min}.`);
      }

      if (field.max !== undefined) {
        numericField = numericField.max(field.max, `${field.label} must be ${field.max} or less.`);
      }

      shape[field.id] = field.required ? numericField : numericField.optional();
      continue;
    }

    if (field.type === "select") {
      const values = field.options?.map((option) => option.value) ?? [];
      const selectSchema = z.string().refine((value) => values.includes(value), {
        message: `${field.label} must be one of: ${values.join(", ")}`,
      });

      shape[field.id] = field.required ? selectSchema : selectSchema.optional();
    }
  }

  return z.object(shape);
}

import airbagLiftPlanner from "@/data/rules/airbag-lift-planner.json";
import cribbingHeightPlanner from "@/data/rules/cribbing-height-planner.json";
import vehicleStabilizationSelector from "@/data/rules/vehicle-stabilization-selector.json";
import strutAngleLoadHelper from "@/data/rules/strut-angle-load-helper.json";
import shoringSelectorWizard from "@/data/rules/shoring-selector-wizard.json";
import ropeRescueMaCalculator from "@/data/rules/rope-rescue-ma-calculator.json";
import collapseWeightCalculator from "@/data/rules/collapse-weight-calculator.json";
import type { RuleDefinition } from "@/lib/rules/types";

export const rulesRegistry: RuleDefinition[] = [
  airbagLiftPlanner as RuleDefinition,
  cribbingHeightPlanner as RuleDefinition,
  vehicleStabilizationSelector as RuleDefinition,
  strutAngleLoadHelper as RuleDefinition,
  shoringSelectorWizard as RuleDefinition,
  ropeRescueMaCalculator as RuleDefinition,
  collapseWeightCalculator as RuleDefinition,
];

export function getRuleById(ruleId: string) {
  return rulesRegistry.find((rule) => rule.id === ruleId);
}

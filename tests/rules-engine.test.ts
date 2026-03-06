import { describe, expect, it } from "vitest";
import airbagLiftPlanner from "@/data/rules/airbag-lift-planner.json";
import collapseWeightCalculator from "@/data/rules/collapse-weight-calculator.json";
import ropeRescueCalculator from "@/data/rules/rope-rescue-ma-calculator.json";
import { buildInputSchema } from "@/lib/rules/schema";
import { runRuleCalculation } from "@/lib/rules/operations";
import type { RuleDefinition } from "@/lib/rules/types";

describe("rules engine", () => {
  it("runs airbag planner and computes stages", () => {
    const rule = airbagLiftPlanner as RuleDefinition;
    const schema = buildInputSchema(rule);

    const input = schema.parse({
      targetLiftHeightIn: 8,
      liftPoints: 2,
      captureIntervalIn: 1,
      cribbingMaterialSizeIn: 4,
      startingClearanceIn: 2,
    });

    const result = runRuleCalculation(rule, input as Record<string, string | number>);

    expect(result.computed.stageCount).toBe(8);
    expect(result.computed.layersNeeded).toBe(2);
  });

  it("runs rope rescue MA calculator", () => {
    const rule = ropeRescueCalculator as RuleDefinition;
    const schema = buildInputSchema(rule);

    const input = schema.parse({
      systemType: "5",
      pulleyCount: 3,
      efficiencyPerPulley: 0.9,
      directionChanges: 1,
      loadLbf: 2500,
    });

    const result = runRuleCalculation(rule, input as Record<string, string | number>);

    expect(result.computed.theoreticalMA).toBe(5);
    expect(Number(result.computed.actualMA)).toBeGreaterThan(0);
    expect(Number(result.computed.requiredHaulLbf)).toBeGreaterThan(0);
  });

  it("runs collapse weight calculator", () => {
    const rule = collapseWeightCalculator as RuleDefinition;
    const schema = buildInputSchema(rule);

    const input = schema.parse({
      materialType: "reinforced-concrete",
      shape: "slab",
      lengthFt: 10,
      widthFt: 8,
      heightFt: 0.5,
    });

    const result = runRuleCalculation(rule, input as Record<string, string | number>);

    expect(result.computed.volumeFt3).toBe(40);
    expect(result.computed.unitWeightPcf).toBe(150);
    expect(result.computed.estimatedWeightLb).toBe(6000);
  });
});

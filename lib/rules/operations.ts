import {
  actual_MA,
  cribbing_height,
  haul_force,
  psf_from_pcf_thickness,
  raker_base_offset_from_height,
  raker_length_from_height,
  stages_for_capture,
  theoretical_MA,
  volume_rect_prism,
  weight_from_volume,
} from "@/lib/fieldmath";
import type { RuleDefinition, RuleRunResult } from "@/lib/rules/types";

function round(value: number) {
  return Number(value.toFixed(2));
}

function fillTemplate(template: string, computed: Record<string, number | string>) {
  return template.replace(/\{([^}]+)\}/g, (_, key: string) => {
    const value = computed[key];
    return value === undefined ? "N/A" : String(value);
  });
}

function finalize(rule: RuleDefinition, computed: Record<string, number | string>): RuleRunResult {
  return {
    recommendedSteps: rule.stepTemplates.map((template) => fillTemplate(template, computed)),
    assumptions: rule.assumptions,
    warnings: rule.warnings,
    computed,
  };
}

const UNIT_WEIGHT_PCF: Record<string, number> = {
  "reinforced-concrete": 150,
  masonry: 125,
  wood: 35,
  steel: 490,
};

export function runRuleCalculation(rule: RuleDefinition, input: Record<string, string | number>): RuleRunResult {
  if (rule.calculator === "airbagLift") {
    const targetLiftHeightIn = Number(input.targetLiftHeightIn);
    const liftPoints = Number(input.liftPoints);
    const captureIntervalIn = Number(input.captureIntervalIn);
    const cribbingMaterialSizeIn = Number(input.cribbingMaterialSizeIn);
    const startingClearanceIn = Number(input.startingClearanceIn);

    const stages = stages_for_capture(targetLiftHeightIn, captureIntervalIn);
    const layersNeeded = Math.ceil(targetLiftHeightIn / Math.max(cribbingMaterialSizeIn, 0.5));

    return finalize(rule, {
      targetLiftHeightIn,
      liftPoints,
      captureIntervalIn,
      cribbingMaterialSizeIn,
      startingClearanceIn,
      stageCount: stages.count,
      layersNeeded,
    });
  }

  if (rule.calculator === "cribbingHeight") {
    const cribbingThicknessIn = Number(input.cribbingThicknessIn);
    const desiredHeightIn = Number(input.desiredHeightIn);
    const baseFootprintFt = Number(input.baseFootprintFt);
    const stackCount = Number(input.stackCount);

    const layersRequired = Math.max(1, Math.ceil(desiredHeightIn / Math.max(cribbingThicknessIn, 0.25)));
    const estimatedHeightIn = round(cribbing_height(layersRequired, cribbingThicknessIn));

    return finalize(rule, {
      cribbingThicknessIn,
      desiredHeightIn,
      baseFootprintFt,
      stackCount,
      layersRequired,
      estimatedHeightIn,
    });
  }

  if (rule.calculator === "vehicleStabilization") {
    const vehiclePosition = String(input.vehiclePosition);
    const hazards = String(input.hazards);
    const availableTools = String(input.availableTools);

    const stabilizationPlan =
      vehiclePosition === "roof"
        ? "Four-point stabilization with progressive crib capture"
        : vehiclePosition === "side"
          ? "Upper-lower strut set with wedge capture"
          : "Wheel chock + diagonal stabilization";

    const capturePoints =
      availableTools === "struts-only"
        ? "At least 2 strut anchor points + wheel restraint"
        : "Four corners plus hazard-side redundancy";

    return finalize(rule, {
      vehiclePosition,
      hazards,
      availableTools,
      stabilizationPlan,
      capturePoints,
    });
  }

  if (rule.calculator === "strutAngleLoad") {
    const insertionHeightFt = Number(input.insertionHeightFt);
    const intendedAngleDeg = Number(input.intendedAngleDeg);
    const strutLengthOptionsFt = Number(input.strutLengthOptionsFt);
    const configuration = String(input.configuration);

    const neededLengthFt = round(raker_length_from_height(insertionHeightFt, intendedAngleDeg));
    const baseOffsetFt = round(raker_base_offset_from_height(insertionHeightFt, intendedAngleDeg));
    const fitStatus = strutLengthOptionsFt >= neededLengthFt ? "Fits available length" : "Insufficient length";

    return finalize(rule, {
      insertionHeightFt,
      intendedAngleDeg,
      strutLengthOptionsFt,
      configuration,
      neededLengthFt,
      baseOffsetFt,
      fitStatus,
    });
  }

  if (rule.calculator === "shoringSelector") {
    const mission = String(input.mission);
    const openingSizeFt = Number(input.openingSizeFt);
    const damageIndicators = String(input.damageIndicators);
    const accessConstraints = String(input.accessConstraints);

    let shoreCategory = mission === "vertical" ? "T-shore" : "Raker shore";
    if (openingSizeFt > 8 && mission === "vertical") {
      shoreCategory = "Double-T shore";
    }
    if (damageIndicators === "severe") {
      shoreCategory = mission === "vertical" ? "Laced post shore" : "Heavy raker shore";
    }

    const inspectionTempo = damageIndicators === "severe" ? "continuous" : "interval-based";

    return finalize(rule, {
      mission,
      openingSizeFt,
      damageIndicators,
      accessConstraints,
      shoreCategory,
      inspectionTempo,
    });
  }

  if (rule.calculator === "ropeRescueMA") {
    const systemType = Number(input.systemType);
    const pulleyCount = Number(input.pulleyCount);
    const efficiencyPerPulley = Number(input.efficiencyPerPulley);
    const directionChanges = Number(input.directionChanges);
    const loadLbf = Number(input.loadLbf);

    const theoreticalMA = theoretical_MA(systemType);
    const actualMA = round(actual_MA(theoreticalMA, efficiencyPerPulley, pulleyCount + directionChanges));
    const requiredHaulLbf = round(haul_force(loadLbf, actualMA));

    return finalize(rule, {
      systemType,
      pulleyCount,
      efficiencyPerPulley,
      directionChanges,
      loadLbf,
      theoreticalMA,
      actualMA,
      requiredHaulLbf,
    });
  }

  const materialType = String(input.materialType);
  const shape = String(input.shape);
  const lengthFt = Number(input.lengthFt);
  const widthFt = Number(input.widthFt);
  const heightFt = Number(input.heightFt);

  const unitWeightPcf = UNIT_WEIGHT_PCF[materialType] ?? 150;
  const volumeFt3 = round(volume_rect_prism(lengthFt, widthFt, heightFt));
  const estimatedWeightLb = round(weight_from_volume(volumeFt3, unitWeightPcf));
  const estimatedPsf = round(psf_from_pcf_thickness(unitWeightPcf, heightFt));

  return finalize(rule, {
    materialType,
    shape,
    lengthFt,
    widthFt,
    heightFt,
    unitWeightPcf,
    volumeFt3,
    estimatedWeightLb,
    estimatedPsf,
  });
}

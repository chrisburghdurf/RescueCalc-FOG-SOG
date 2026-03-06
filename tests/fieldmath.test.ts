import { describe, expect, it } from "vitest";
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

describe("fieldmath", () => {
  it("computes geometry and weights", () => {
    expect(volume_rect_prism(10, 2, 0.5)).toBe(10);
    expect(weight_from_volume(10, 150)).toBe(1500);
    expect(psf_from_pcf_thickness(150, 0.5)).toBe(75);
  });

  it("computes raker geometry", () => {
    expect(raker_length_from_height(12, 60)).toBeCloseTo(13.86, 2);
    expect(raker_base_offset_from_height(12, 60)).toBeCloseTo(6.93, 2);
  });

  it("computes cribbing and stages", () => {
    expect(cribbing_height(5, 4)).toBe(20);
    const stages = stages_for_capture(10, 2);
    expect(stages.count).toBe(5);
    expect(stages.steps[0]?.endLiftIn).toBe(2);
    expect(stages.steps[4]?.endLiftIn).toBe(10);
  });

  it("computes MA and haul force", () => {
    expect(theoretical_MA(5)).toBe(5);
    const actual = actual_MA(5, 0.9, 4);
    expect(actual).toBeCloseTo(3.2805, 4);
    expect(haul_force(3000, actual)).toBeCloseTo(914.49, 2);
  });
});

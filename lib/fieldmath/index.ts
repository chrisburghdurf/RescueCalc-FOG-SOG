export function volume_rect_prism(length_ft: number, width_ft: number, height_ft: number) {
  return length_ft * width_ft * height_ft;
}

export function weight_from_volume(volume_ft3: number, unit_weight_pcf: number) {
  return volume_ft3 * unit_weight_pcf;
}

export function psf_from_pcf_thickness(pcf: number, thickness_ft: number) {
  return pcf * thickness_ft;
}

export function raker_length_from_height(height_ft: number, angle_deg: number) {
  const radians = (angle_deg * Math.PI) / 180;
  return height_ft / Math.sin(radians);
}

export function raker_base_offset_from_height(height_ft: number, angle_deg: number) {
  const radians = (angle_deg * Math.PI) / 180;
  return height_ft / Math.tan(radians);
}

export function cribbing_height(layers: number, crib_thickness_in: number) {
  return layers * crib_thickness_in;
}

export function stages_for_capture(total_lift_in: number, capture_interval_in: number) {
  const stageCount = Math.max(1, Math.ceil(total_lift_in / Math.max(capture_interval_in, 0.1)));
  const steps = Array.from({ length: stageCount }, (_, index) => {
    const end = Math.min(total_lift_in, (index + 1) * capture_interval_in);
    return {
      stage: index + 1,
      endLiftIn: Number(end.toFixed(2)),
    };
  });

  return {
    count: stageCount,
    steps,
  };
}

export function theoretical_MA(strands_at_load: number) {
  return strands_at_load;
}

export function actual_MA(theoretical_ma: number, pulley_efficiency: number, pulley_count: number) {
  return theoretical_ma * pulley_efficiency ** pulley_count;
}

export function haul_force(load_lbf: number, actual_ma: number) {
  return load_lbf / Math.max(actual_ma, 0.001);
}

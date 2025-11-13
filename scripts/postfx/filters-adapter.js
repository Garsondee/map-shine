// Adapter module to expose post-processing filters via ES exports
// without changing runtime behavior. We read from multiple sources:
// - globalThis.* (direct globals)
// - globalThis.__filters?.* (bundled namespace)
// - PIXI.filters?.* (standard PIXI namespace)

export const ColorCorrectionFilter =
  globalThis.ColorCorrectionFilter ||
  globalThis.__filters?.ColorCorrectionFilter ||
  (globalThis.PIXI?.filters && globalThis.PIXI.filters.ColorCorrectionFilter) ||
  null;

export const ChromaticAberrationFilter =
  globalThis.ChromaticAberrationFilter ||
  globalThis.__filters?.ChromaticAberrationFilter ||
  (globalThis.PIXI?.filters && globalThis.PIXI.filters.ChromaticAberrationFilter) ||
  null;

export const LensDistortionFilter =
  globalThis.LensDistortionFilter ||
  globalThis.__filters?.LensDistortionFilter ||
  (globalThis.PIXI?.filters && globalThis.PIXI.filters.LensDistortionFilter) ||
  null;

export const VignetteFilter =
  globalThis.VignetteFilter ||
  globalThis.__filters?.VignetteFilter ||
  (globalThis.PIXI?.filters && globalThis.PIXI.filters.VignetteFilter) ||
  null;

export const FilmGrainFilter =
  globalThis.FilmGrainFilter ||
  globalThis.__filters?.FilmGrainFilter ||
  (globalThis.PIXI?.filters && globalThis.PIXI.filters.FilmGrainFilter) ||
  null;

export const PrismFilter =
  globalThis.PrismFilter ||
  globalThis.__filters?.PrismFilter ||
  (globalThis.PIXI?.filters && globalThis.PIXI.filters.PrismFilter) ||
  null;

// Metallic shine effects
export const MetallicShineFilter =
  globalThis.MetallicShineFilter ||
  globalThis.__filters?.MetallicShineFilter ||
  (globalThis.PIXI?.filters && globalThis.PIXI.filters.MetallicShineFilter) ||
  null;

export const MetallicStripePatternFilter =
  globalThis.MetallicStripePatternFilter ||
  globalThis.__filters?.MetallicStripePatternFilter ||
  (globalThis.PIXI?.filters && globalThis.PIXI.filters.MetallicStripePatternFilter) ||
  null;

export const TiltShiftFilterConstructor =
  globalThis.TiltShiftFilterConstructor ||
  globalThis.__filters?.TiltShiftFilterConstructor ||
  (globalThis.PIXI?.filters && globalThis.PIXI.filters.TiltShiftFilter) ||
  null;

export const ParticleRgbSplitFilter =
  globalThis.ParticleRgbSplitFilter ||
  globalThis.__filters?.ParticleRgbSplitFilter ||
  null;

export const CloudSuppressorFilter =
  globalThis.CloudSuppressorFilter ||
  null;

export const BiofilmMaskFilter =
  globalThis.BiofilmMaskFilter ||
  globalThis.__filters?.BiofilmMaskFilter ||
  null;

export const NoisePatternFilter =
  globalThis.NoisePatternFilter ||
  globalThis.__filters?.NoisePatternFilter ||
  null;

export const AmbientColorFilter =
  globalThis.AmbientColorFilter ||
  null;

export const TimeOfDayColorFilter =
  globalThis.TimeOfDayColorFilter ||
  globalThis.__filters?.TimeOfDayColorFilter ||
  (globalThis.PIXI?.filters && globalThis.PIXI.filters.TimeOfDayColorFilter) ||
  null;

// Optional custom filter used in heat distortion step (if available)
export const HeatDistortionFilter =
  globalThis.HeatDistortionFilter ||
  globalThis.__filters?.HeatDistortionFilter ||
  (globalThis.PIXI?.filters && globalThis.PIXI.filters.HeatDistortionFilter) ||
  null;

// Project-specific filters exposed via globals in module.js
export const BuildingShadowsFilter =
  globalThis.BuildingShadowsFilter || null;

export const WaterEffectsFilter =
  globalThis.WaterEffectsFilter || null;

export const FoamFilter =
  globalThis.FoamFilter || null;

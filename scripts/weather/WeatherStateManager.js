/**
 * Weather State Manager - Centralized Weather Configuration System
 * 
 * Serves as the single source of truth for all weather state configurations
 * and provides unified transition management across all weather systems.
 * 
 * @module WeatherStateManager
 */

/**
 * Complete weather state definitions covering all systems
 * Each state contains every parameter needed for atmospheric, visual,
 * environmental, and audio effects
 */
export const WEATHER_STATE_DEFINITIONS = {
  clear: {
    name: "Clear",
    description: "Sunny day with minimal cloud coverage",
    
    // Atmospheric Parameters (for WeatherOrchestrator)
    atmospheric: {
      temperature: { min: 15, max: 25, ideal: 20 },
      humidity: { min: 20, max: 50, ideal: 30 },
      pressure: { min: 1010, max: 1025, ideal: 1018 },
      windStrength: { min: 0.1, max: 0.4, ideal: 0.2 }
    },
    
    // Visual Parameters
    visual: {
      skyTint: { r: 0.95, g: 0.98, b: 1.0 },
      ambientLight: { r: 1.0, g: 0.95, b: 0.9 },
      colorCorrection: { 
        saturation: 1.05, 
        contrast: 1.02, 
        brightness: 1.03 
      },
      atmosphericTint: { r: 1.0, g: 1.0, b: 1.0 }
    },
    
    // Cloud System
    clouds: {
      density: 0.2,
      threshold: 0.7,
      softness: 0.3,
      coverage: 0.15,
      windSpeed: 3,
      windForce: 0.4,
      windDrag: 0.85,
      lightingContribution: 0.1
    },
    
    // Precipitation (Particle/Shader System)
    precipitation: {
      type: "none",
      intensity: 0,
      particleCount: 0,
      shader: {
        enabled: false,
        opacity: 0,
        intensity: 0,
        rainDensity: 0,
        gridSize: 150,
        streakLength: 80,
        splashIntensity: 0,
        waveMaskIntensity: 0,
        curtainIntensity: 0,
        worleySpeed: 1.0
      },
      particles: {
        enabled: false,
        spawnRate: 0,
        edgeDroplets: { enabled: false, rate: 0 }
      }
    },
    
    // Environmental Effects
    environment: {
      windMultipliers: {
        baseSpeed: 0.6,
        gustSpeed: 0.7,
        gustFrequency: 1.2,
        gustDuration: 1.0,
        angleChangeFrequency: 1.2,
        angleChangeRange: 0.8
      },
      foliageMultipliers: {
        rustleSpeed: 0.7,
        swaySpeed: 0.6
      },
      lightingMultipliers: {
        ambientStrength: 1.0,
        sunStrength: 1.0,
        shadowStrength: 0.8
      }
    },
    
    // Audio Parameters
    audio: {
      windSound: { enabled: true, volume: 0.3, pitch: 1.0, type: "gentle" },
      weatherSound: { enabled: false, type: "none", volume: 0.0 },
      musicModulation: { mood: "peaceful", intensity: 0.2 }
    },
    
    // Special Effects
    effects: {
      lightning: { enabled: false, frequency: 0, intensity: 0 },
      groundEffects: { 
        enabled: false, 
        type: "none",
        accumulation: { rate: 0, maxDepth: 0 }
      },
      particles: { enabled: false, types: [] }
    },
    
    // Transition Configuration
    transitions: {
      fadeIn: { duration: 2000, easing: "easeInOut" },
      fadeOut: { duration: 2000, easing: "easeInOut" },
      priority: 1,
      allowFrom: ["any"],
      allowTo: ["any"]
    }
  },
  
  // New state between clear and drizzle
  'partly-cloudy': {
    name: "Partly Cloudy",
    description: "Bright skies with scattered white clouds, no precipitation",
    
    atmospheric: {
      temperature: { min: 14, max: 24, ideal: 19 },
      humidity: { min: 30, max: 55, ideal: 40 },
      pressure: { min: 1008, max: 1022, ideal: 1016 },
      windStrength: { min: 0.2, max: 0.5, ideal: 0.3 }
    },
    
    visual: {
      skyTint: { r: 0.92, g: 0.96, b: 1.0 },
      ambientLight: { r: 0.98, g: 0.95, b: 0.92 },
      colorCorrection: { 
        saturation: 1.02, 
        contrast: 1.01, 
        brightness: 1.02 
      },
      atmosphericTint: { r: 0.98, g: 0.98, b: 1.0 }
    },
    
    clouds: {
      density: 0.4,
      threshold: 0.6,
      softness: 0.4,
      coverage: 0.35,
      windSpeed: 4,
      windForce: 0.5,
      windDrag: 0.85,
      lightingContribution: 0.25
    },
    
    precipitation: {
      type: "none",
      intensity: 0,
      particleCount: 0,
      shader: {
        enabled: false,
        opacity: 0,
        intensity: 0,
        rainDensity: 0,
        gridSize: 150,
        streakLength: 80,
        splashIntensity: 0,
        waveMaskIntensity: 0,
        curtainIntensity: 0,
        worleySpeed: 1.0
      },
      particles: {
        enabled: false,
        spawnRate: 0,
        edgeDroplets: { enabled: false, rate: 0 }
      }
    },
    
    environment: {
      windMultipliers: {
        baseSpeed: 0.8,
        gustSpeed: 0.85,
        gustFrequency: 1.1,
        gustDuration: 1.0,
        angleChangeFrequency: 1.0,
        angleChangeRange: 1.0
      },
      foliageMultipliers: {
        rustleSpeed: 0.9,
        swaySpeed: 0.8
      },
      lightingMultipliers: {
        ambientStrength: 0.95,
        sunStrength: 0.9,
        shadowStrength: 0.9
      }
    },
    
    audio: {
      windSound: { enabled: true, volume: 0.35, pitch: 0.98, type: "gentle" },
      weatherSound: { enabled: false, type: "none", volume: 0.0 },
      musicModulation: { mood: "positive", intensity: 0.25 }
    },
    
    effects: {
      lightning: { enabled: false, frequency: 0, intensity: 0 },
      groundEffects: { 
        enabled: false, 
        type: "none",
        accumulation: { rate: 0, maxDepth: 0 }
      },
      particles: { enabled: false, types: [] }
    },
    
    transitions: {
      fadeIn: { duration: 2200, easing: "easeInOut" },
      fadeOut: { duration: 2200, easing: "easeInOut" },
      priority: 1,
      allowFrom: ["any"],
      allowTo: ["any"]
    }
  },
  
  drizzle: {
    name: "Drizzle",
    description: "Light rain with moderate cloud coverage",
    
    atmospheric: {
      temperature: { min: 12, max: 20, ideal: 18 },
      humidity: { min: 50, max: 70, ideal: 60 },
      pressure: { min: 1005, max: 1015, ideal: 1010 },
      windStrength: { min: 0.3, max: 0.6, ideal: 0.4 }
    },
    
    visual: {
      skyTint: { r: 0.85, g: 0.88, b: 0.92 },
      ambientLight: { r: 0.85, g: 0.85, b: 0.9 },
      colorCorrection: { 
        saturation: 0.95, 
        contrast: 0.98, 
        brightness: 1.0 
      },
      atmosphericTint: { r: 0.95, g: 0.95, b: 1.0 }
    },
    
    clouds: {
      density: 0.4,
      threshold: 0.5,
      softness: 0.4,
      coverage: 0.6,
      windSpeed: 5,
      windForce: 0.6,
      windDrag: 0.8,
      lightingContribution: 0.4
    },
    
    precipitation: {
      type: "rain",
      intensity: 0.3,
      particleCount: 200,
      shader: {
        enabled: true,
        opacity: 0.15,
        intensity: 0.6,
        rainDensity: 0.6,
        gridSize: 180,
        streakLength: 60,
        splashIntensity: 0.3,
        waveMaskIntensity: 0.5,
        curtainIntensity: 0.2,
        worleySpeed: 0.8
      },
      particles: {
        enabled: true,
        spawnRate: 30,
        edgeDroplets: { enabled: true, rate: 15 }
      }
    },
    
    environment: {
      windMultipliers: {
        baseSpeed: 0.8,
        gustSpeed: 0.85,
        gustFrequency: 1.1,
        gustDuration: 1.0,
        angleChangeFrequency: 1.0,
        angleChangeRange: 1.0
      },
      foliageMultipliers: {
        rustleSpeed: 1.2,
        swaySpeed: 1.0
      },
      lightingMultipliers: {
        ambientStrength: 0.7,
        sunStrength: 0.5,
        shadowStrength: 1.0
      }
    },
    
    audio: {
      windSound: { enabled: true, volume: 0.5, pitch: 0.9, type: "light" },
      weatherSound: { enabled: true, type: "drizzle", volume: 0.4 },
      musicModulation: { mood: "calm", intensity: 0.4 }
    },
    
    effects: {
      lightning: { enabled: false, frequency: 0, intensity: 0 },
      groundEffects: { 
        enabled: true, 
        type: "light_puddles",
        accumulation: { rate: 0.2, maxDepth: 3 }
      },
      particles: { enabled: true, types: ["rain", "mist"] }
    },
    
    transitions: {
      fadeIn: { duration: 2500, easing: "easeInOut" },
      fadeOut: { duration: 2500, easing: "easeInOut" },
      priority: 2,
      allowFrom: ["any"],
      allowTo: ["any"]
    }
  },
  
  rain: {
    name: "Rain",
    description: "Steady rainfall with heavy cloud coverage",
    
    atmospheric: {
      temperature: { min: 10, max: 25, ideal: 18 },
      humidity: { min: 60, max: 85, ideal: 75 },
      pressure: { min: 995, max: 1010, ideal: 1000 },
      windStrength: { min: 0.5, max: 0.8, ideal: 0.6 }
    },
    
    visual: {
      skyTint: { r: 0.75, g: 0.78, b: 0.85 },
      ambientLight: { r: 0.7, g: 0.7, b: 0.8 },
      colorCorrection: { 
        saturation: 0.85, 
        contrast: 0.95, 
        brightness: 0.98 
      },
      atmosphericTint: { r: 0.92, g: 0.92, b: 0.98 }
    },
    
    clouds: {
      density: 0.8,
      threshold: 0.3,
      softness: 0.6,
      coverage: 0.85,
      windSpeed: 8,
      windForce: 0.8,
      windDrag: 0.75,
      lightingContribution: 0.7
    },
    
    precipitation: {
      type: "rain",
      intensity: 0.6,
      particleCount: 500,
      shader: {
        enabled: true,
        opacity: 0.25,
        intensity: 1.0,
        rainDensity: 1.0,
        gridSize: 150,
        streakLength: 80,
        splashIntensity: 0.5,
        waveMaskIntensity: 0.7,
        curtainIntensity: 0.5,
        worleySpeed: 1.0
      },
      particles: {
        enabled: true,
        spawnRate: 80,
        edgeDroplets: { enabled: true, rate: 40 }
      }
    },
    
    environment: {
      windMultipliers: {
        baseSpeed: 1.0,
        gustSpeed: 1.2,
        gustFrequency: 1.0,
        gustDuration: 1.1,
        angleChangeFrequency: 1.0,
        angleChangeRange: 1.2
      },
      foliageMultipliers: {
        rustleSpeed: 1.8,
        swaySpeed: 1.5
      },
      lightingMultipliers: {
        ambientStrength: 0.5,
        sunStrength: 0.3,
        shadowStrength: 1.3
      }
    },
    
    audio: {
      windSound: { enabled: true, volume: 0.7, pitch: 0.8, type: "moderate" },
      weatherSound: { enabled: true, type: "rain", volume: 0.6 },
      musicModulation: { mood: "melancholic", intensity: 0.6 }
    },
    
    effects: {
      lightning: { enabled: false, frequency: 0, intensity: 0 },
      groundEffects: { 
        enabled: true, 
        type: "puddles",
        accumulation: { rate: 0.8, maxDepth: 8 }
      },
      particles: { enabled: true, types: ["rain", "mist", "ripples"] }
    },
    
    transitions: {
      fadeIn: { duration: 3000, easing: "easeIn" },
      fadeOut: { duration: 3000, easing: "easeOut" },
      priority: 3,
      allowFrom: ["any"],
      allowTo: ["any"]
    }
  },
  
  storm: {
    name: "Storm",
    description: "Heavy rain with strong winds and lightning",
    
    atmospheric: {
      temperature: { min: 15, max: 30, ideal: 28 },
      humidity: { min: 70, max: 95, ideal: 85 },
      pressure: { min: 985, max: 1005, ideal: 990 },
      windStrength: { min: 0.7, max: 1.0, ideal: 0.9 }
    },
    
    visual: {
      skyTint: { r: 0.3, g: 0.35, b: 0.45 },
      ambientLight: { r: 0.4, g: 0.4, b: 0.5 },
      colorCorrection: { 
        saturation: 0.6, 
        contrast: 0.85, 
        brightness: 0.92 
      },
      atmosphericTint: { r: 0.9, g: 0.9, b: 1.0 }
    },
    
    clouds: {
      density: 0.95,
      threshold: 0.1,
      softness: 0.8,
      coverage: 0.95,
      windSpeed: 15,
      windForce: 1.2,
      windDrag: 0.65,
      lightingContribution: 0.95
    },
    
    precipitation: {
      type: "rain",
      intensity: 1.0,
      particleCount: 800,
      shader: {
        enabled: true,
        opacity: 0.45,
        intensity: 1.5,
        rainDensity: 1.8,
        gridSize: 120,
        streakLength: 120,
        splashIntensity: 1.2,
        waveMaskIntensity: 0.9,
        curtainIntensity: 1.0,
        worleySpeed: 1.5
      },
      particles: {
        enabled: true,
        spawnRate: 150,
        edgeDroplets: { enabled: true, rate: 80 }
      }
    },
    
    environment: {
      windMultipliers: {
        baseSpeed: 1.5,
        gustSpeed: 1.8,
        gustFrequency: 1.5,
        gustDuration: 1.3,
        angleChangeFrequency: 1.8,
        angleChangeRange: 1.5
      },
      foliageMultipliers: {
        rustleSpeed: 2.5,
        swaySpeed: 2.2
      },
      lightingMultipliers: {
        ambientStrength: 0.3,
        sunStrength: 0.1,
        shadowStrength: 1.8
      }
    },
    
    audio: {
      windSound: { enabled: true, volume: 0.9, pitch: 0.7, type: "strong" },
      weatherSound: { enabled: true, type: "storm", volume: 0.8 },
      musicModulation: { mood: "tense", intensity: 0.9 }
    },
    
    effects: {
      lightning: { 
        enabled: true, 
        frequency: 8, 
        intensity: 0.9,
        flashDuration: 150,
        thunderDelay: { min: 0.5, max: 3.0 }
      },
      groundEffects: { 
        enabled: true, 
        type: "puddles",
        accumulation: { rate: 1.5, maxDepth: 15 }
      },
      particles: { enabled: true, types: ["rain", "debris", "ripples", "spray"] }
    },
    
    transitions: {
      fadeIn: { duration: 4000, easing: "easeIn" },
      fadeOut: { duration: 4000, easing: "easeOut" },
      priority: 5,
      allowFrom: ["any"],
      allowTo: ["any"]
    }
  },
  
  snow: {
    name: "Snow",
    description: "Gentle snowfall with dense cloud coverage",
    
    atmospheric: {
      temperature: { min: -10, max: 5, ideal: 0 },
      humidity: { min: 50, max: 80, ideal: 60 },
      pressure: { min: 1000, max: 1020, ideal: 1010 },
      windStrength: { min: 0.2, max: 0.5, ideal: 0.3 }
    },
    
    visual: {
      skyTint: { r: 0.85, g: 0.88, b: 0.95 },
      ambientLight: { r: 0.9, g: 0.9, b: 1.0 },
      colorCorrection: { 
        saturation: 0.8, 
        contrast: 0.95, 
        brightness: 1.02 
      },
      atmosphericTint: { r: 0.98, g: 0.98, b: 1.0 }
    },
    
    clouds: {
      density: 0.8,
      threshold: 0.2,
      softness: 0.7,
      coverage: 0.9,
      windSpeed: 6,
      windForce: 0.5,
      windDrag: 0.8,
      lightingContribution: 0.8
    },
    
    precipitation: {
      type: "snow",
      intensity: 0.5,
      particleCount: 400,
      shader: {
        enabled: true,
        opacity: 0.3,
        intensity: 1.0,
        snowDensity: 1.0,
        snowScale: 1.5,
        driftAmount: 1.0,
        speed: 2.0,
        rotation: 1.0
      },
      particles: {
        enabled: true,
        spawnRate: 60,
        edgeDroplets: { enabled: false, rate: 0 }
      }
    },
    
    environment: {
      windMultipliers: {
        baseSpeed: 0.8,
        gustSpeed: 0.9,
        gustFrequency: 0.8,
        gustDuration: 1.0,
        angleChangeFrequency: 0.8,
        angleChangeRange: 0.6
      },
      foliageMultipliers: {
        rustleSpeed: 0.6,
        swaySpeed: 0.5
      },
      lightingMultipliers: {
        ambientStrength: 0.8,
        sunStrength: 0.7,
        shadowStrength: 0.9
      }
    },
    
    audio: {
      windSound: { enabled: true, volume: 0.4, pitch: 1.0, type: "soft" },
      weatherSound: { enabled: true, type: "snow", volume: 0.3 },
      musicModulation: { mood: "peaceful", intensity: 0.3 }
    },
    
    effects: {
      lightning: { enabled: false, frequency: 0, intensity: 0 },
      groundEffects: { 
        enabled: true, 
        type: "snow_accumulation",
        accumulation: { rate: 0.5, maxDepth: 10 }
      },
      particles: { enabled: true, types: ["snow", "mist"] }
    },
    
    transitions: {
      fadeIn: { duration: 3000, easing: "easeInOut" },
      fadeOut: { duration: 3000, easing: "easeInOut" },
      priority: 3,
      allowFrom: ["any"],
      allowTo: ["any"]
    }
  },
  
  blizzard: {
    name: "Blizzard",
    description: "Heavy snow with strong winds and poor visibility",
    
    atmospheric: {
      temperature: { min: -15, max: 0, ideal: -5 },
      humidity: { min: 60, max: 90, ideal: 75 },
      pressure: { min: 985, max: 1005, ideal: 990 },
      windStrength: { min: 0.8, max: 1.0, ideal: 0.95 }
    },
    
    visual: {
      skyTint: { r: 0.7, g: 0.75, b: 0.85 },
      ambientLight: { r: 0.6, g: 0.6, b: 0.7 },
      colorCorrection: { 
        saturation: 0.65, 
        contrast: 0.88, 
        brightness: 0.95 
      },
      atmosphericTint: { r: 0.95, g: 0.95, b: 1.0 }
    },
    
    clouds: {
      density: 0.98,
      threshold: 0.05,
      softness: 0.9,
      coverage: 0.98,
      windSpeed: 20,
      windForce: 1.5,
      windDrag: 0.6,
      lightingContribution: 1.0
    },
    
    precipitation: {
      type: "snow",
      intensity: 1.0,
      particleCount: 1000,
      shader: {
        enabled: true,
        opacity: 0.5,
        intensity: 1.8,
        snowDensity: 2.0,
        snowScale: 2.5,
        driftAmount: 2.5,
        speed: 8.0,
        rotation: 2.0
      },
      particles: {
        enabled: true,
        spawnRate: 120,
        edgeDroplets: { enabled: false, rate: 0 }
      }
    },
    
    environment: {
      windMultipliers: {
        baseSpeed: 2.0,
        gustSpeed: 2.8,
        gustFrequency: 2.0,
        gustDuration: 1.5,
        angleChangeFrequency: 2.0,
        angleChangeRange: 1.8
      },
      foliageMultipliers: {
        rustleSpeed: 3.0,
        swaySpeed: 2.8
      },
      lightingMultipliers: {
        ambientStrength: 0.4,
        sunStrength: 0.2,
        shadowStrength: 1.5
      }
    },
    
    audio: {
      windSound: { enabled: true, volume: 1.0, pitch: 0.6, type: "howling" },
      weatherSound: { enabled: true, type: "blizzard", volume: 0.9 },
      musicModulation: { mood: "dangerous", intensity: 1.0 }
    },
    
    effects: {
      lightning: { enabled: false, frequency: 0, intensity: 0 },
      groundEffects: { 
        enabled: true, 
        type: "heavy_snow",
        accumulation: { rate: 1.8, maxDepth: 25 }
      },
      particles: { enabled: true, types: ["snow", "ice", "wind"] }
    },
    
    transitions: {
      fadeIn: { duration: 5000, easing: "easeIn" },
      fadeOut: { duration: 5000, easing: "easeOut" },
      priority: 6,
      allowFrom: ["any"],
      allowTo: ["any"]
    }
  },
  
  sleet: {
    name: "Sleet",
    description: "Mixed rain and snow with moderate winds",
    
    atmospheric: {
      temperature: { min: 2, max: 8, ideal: 5 },
      humidity: { min: 60, max: 85, ideal: 70 },
      pressure: { min: 995, max: 1010, ideal: 1000 },
      windStrength: { min: 0.4, max: 0.7, ideal: 0.55 }
    },
    
    visual: {
      skyTint: { r: 0.75, g: 0.78, b: 0.82 },
      ambientLight: { r: 0.7, g: 0.7, b: 0.75 },
      colorCorrection: { 
        saturation: 0.75, 
        contrast: 0.92, 
        brightness: 0.96 
      },
      atmosphericTint: { r: 0.94, g: 0.94, b: 0.98 }
    },
    
    clouds: {
      density: 0.7,
      threshold: 0.25,
      softness: 0.6,
      coverage: 0.8,
      windSpeed: 10,
      windForce: 0.9,
      windDrag: 0.7,
      lightingContribution: 0.75
    },
    
    precipitation: {
      type: "sleet",
      intensity: 0.7,
      particleCount: 600,
      shader: {
        enabled: true,
        opacity: 0.35,
        intensity: 1.2,
        rainDensity: 1.5,
        snowDensity: 1.5,
        gridSize: 135,
        streakLength: 70,
        snowScale: 1.2,
        driftAmount: 1.8,
        speed: 4.0,
        mixRatio: 0.6 // 60% rain, 40% snow
      },
      particles: {
        enabled: true,
        spawnRate: 100,
        edgeDroplets: { enabled: true, rate: 50 }
      }
    },
    
    environment: {
      windMultipliers: {
        baseSpeed: 1.2,
        gustSpeed: 1.5,
        gustFrequency: 1.3,
        gustDuration: 1.2,
        angleChangeFrequency: 1.3,
        angleChangeRange: 1.4
      },
      foliageMultipliers: {
        rustleSpeed: 1.5,
        swaySpeed: 1.3
      },
      lightingMultipliers: {
        ambientStrength: 0.6,
        sunStrength: 0.4,
        shadowStrength: 1.4
      }
    },
    
    audio: {
      windSound: { enabled: true, volume: 0.6, pitch: 0.85, type: "mixed" },
      weatherSound: { enabled: true, type: "sleet", volume: 0.5 },
      musicModulation: { mood: "uneasy", intensity: 0.5 }
    },
    
    effects: {
      lightning: { enabled: false, frequency: 0, intensity: 0 },
      groundEffects: { 
        enabled: true, 
        type: "slush",
        accumulation: { rate: 0.6, maxDepth: 6 }
      },
      particles: { enabled: true, types: ["rain", "snow", "sleet"] }
    },
    
    transitions: {
      fadeIn: { duration: 3500, easing: "easeInOut" },
      fadeOut: { duration: 3500, easing: "easeInOut" },
      priority: 4,
      allowFrom: ["any"],
      allowTo: ["any"]
    }
  }
};

/**
 * Weather State Manager - Main Controller Class
 * 
 * Provides centralized weather state management and unified transitions
 */
export class WeatherStateManager {
  constructor(initialStateDefinitions = null) {
    // Core state management
    this.stateDefinitions = initialStateDefinitions || WEATHER_STATE_DEFINITIONS;
    this.customStates = new Map(); // User-defined states
    this.currentState = 'clear';
    this.targetState = null;
    this.isTransitioning = false;
    this.transitionProgress = 0;
    this.transitionStartTime = 0;
    this.transitionDuration = 0;
    this.transitionEasing = 'easeInOut';
    
    // System registration
    this.registeredSystems = new Map();
    this.systemUpdateQueue = [];
    
    // Transition registry
    this.transitionRules = new Map();
    this.activeTransitions = new Map();
    
    // Event system
    this.eventListeners = new Map();
    
    // History and diagnostics
    this.stateHistory = [];
    this.lastTransitionTime = 0;
    this.maxHistoryLength = 50;
    
    console.log('MapShine | WeatherStateManager initialized');
  }
  
  /**
   * Initialize the manager
   * @returns {Promise<void>}
   */
  async initialize() {
    // Initialize transition rules
    this._initializeTransitionRules();
    
    // Load any custom states from settings
    await this._loadCustomStates();
    
    // Set initial state
    const initialState = this._getInitialState();
    if (initialState && this.stateDefinitions[initialState]) {
      this._setCurrentState(initialState, true);
    }
    
    console.log('MapShine | WeatherStateManager initialized with state:', this.currentState);
  }
  
  /**
   * Register a weather system for state updates
   * @param {string} systemName - Name of the system
   * @param {Object} systemConfig - System configuration
   * @param {Function} systemConfig.updateFunction - Function to update system with state
   * @param {Function} systemConfig.transitionFunction - Function to handle transitions
   * @param {number} systemConfig.priority - Update priority (lower = earlier)
   * @param {boolean} systemConfig.enabled - Whether system is active
   */
  registerSystem(systemName, systemConfig) {
    if (!systemConfig.updateFunction || typeof systemConfig.updateFunction !== 'function') {
      console.warn(`WeatherStateManager | System ${systemName} must provide updateFunction`);
      return false;
    }
    
    this.registeredSystems.set(systemName, {
      updateFunction: systemConfig.updateFunction,
      transitionFunction: systemConfig.transitionFunction || ((from, to, progress) => {
        systemConfig.updateFunction(this.getInterpolatedState(from, to, progress));
      }),
      priority: systemConfig.priority || 100,
      enabled: systemConfig.enabled !== false,
      lastUpdate: 0
    });
    
    // Sort systems by priority
    this._sortSystemsByPriority();
    
    console.log(`WeatherStateManager | Registered system: ${systemName} (priority: ${systemConfig.priority})`);
    return true;
  }
  
  /**
   * Unregister a weather system
   * @param {string} systemName - Name of the system
   */
  unregisterSystem(systemName) {
    const removed = this.registeredSystems.delete(systemName);
    if (removed) {
      console.log(`WeatherStateManager | Unregistered system: ${systemName}`);
    }
    return removed;
  }
  
  /**
   * Get the complete state definition for a weather state
   * @param {string} stateName - Name of the weather state
   * @returns {Object|null} Complete state definition
   */
  getStateDefinition(stateName) {
    // Check custom states first
    if (this.customStates.has(stateName)) {
      return this.customStates.get(stateName);
    }
    
    // Check built-in states
    if (this.stateDefinitions[stateName]) {
      return this.stateDefinitions[stateName];
    }
    
    return null;
  }
  
  /**
   * Get the current active state definition (interpolated during transitions)
   * @returns {Object} Current state definition
   */
  getActiveStateDefinition() {
    if (!this.isTransitioning) {
      return this.getStateDefinition(this.currentState);
    }
    
    // Return interpolated state during transition
    const currentDef = this.getStateDefinition(this.currentState);
    const targetDef = this.getStateDefinition(this.targetState);
    
    return this.getInterpolatedState(this.currentState, this.targetState, this.transitionProgress);
  }
  
  /**
   * Get interpolated state between two weather states
   * @param {string} fromState - Source state name
   * @param {string} toState - Target state name
   * @param {number} progress - Progress (0-1)
   * @returns {Object} Interpolated state definition
   */
  getInterpolatedState(fromState, toState, progress) {
    const from = this.getStateDefinition(fromState);
    const to = this.getStateDefinition(toState);
    
    if (!from || !to) {
      console.warn(`WeatherStateManager | Cannot interpolate: invalid states ${fromState} -> ${toState}`);
      return from || to || this.getStateDefinition('clear');
    }
    
    const t = this._applyEasing(progress);
    const interpolated = {
      name: `${from.name} → ${to.name}`,
      description: `Transitioning from ${from.name} to ${to.name}`,
      isTransitioning: true,
      transitionProgress: progress,
      
      // Interpolate all nested properties
      atmospheric: this._interpolateObject(from.atmospheric, to.atmospheric, t, this._interpolateAtmospheric),
      visual: this._interpolateObject(from.visual, to.visual, t, this._interpolateVisual),
      clouds: this._interpolateObject(from.clouds, to.clouds, t, this._interpolateNumeric),
      precipitation: this._interpolateObject(from.precipitation, to.precipitation, t, this._interpolatePrecipitation),
      environment: this._interpolateObject(from.environment, to.environment, t, this._interpolateEnvironment),
      audio: this._interpolateObject(from.audio, to.audio, t, this._interpolateAudio),
      effects: this._interpolateObject(from.effects, to.effects, t, this._interpolateEffects),
      transitions: from.transitions // Use from state transitions
    };
    
    return interpolated;
  }
  
  /**
   * Transition to a new weather state
   * @param {string} newState - Target weather state
   * @param {Object} options - Transition options
   * @param {number} options.duration - Transition duration in ms
   * @param {string} options.easing - Easing function name
   * @param {boolean} options.force - Force transition even if same state
   * @returns {boolean} Success status
   */
  transitionTo(newState, options = {}) {
    // Validate target state
    if (!this.getStateDefinition(newState)) {
      console.error(`WeatherStateManager | Invalid weather state: ${newState}`);
      return false;
    }
    
    // Check if transition is needed
    if (newState === this.currentState && !this.isTransitioning && !options.force) {
      console.log(`WeatherStateManager | Already in ${newState} state`);
      return true;
    }
    
    // Check transition rules
    if (!this._canTransition(this.currentState, newState)) {
      console.warn(`WeatherStateManager | Transition not allowed: ${this.currentState} -> ${newState}`);
      return false;
    }
    
    // Get transition configuration
    const transitionConfig = this._getTransitionConfig(this.currentState, newState);
    const duration = options.duration || transitionConfig.duration;
    const easing = options.easing || transitionConfig.easing;
    
    // Start transition
    this._startTransition(newState, duration, easing);
    
    console.log(`WeatherStateManager | Starting transition: ${this.currentState} -> ${newState} (${duration}ms)`);
    return true;
  }
  
  /**
   * Update transition progress (called each frame)
   * @param {number} deltaTime - Time since last frame in ms
   */
  updateTransition(deltaTime) {
    if (!this.isTransitioning) {
      return;
    }
    
    const elapsed = Date.now() - this.transitionStartTime;
    this.transitionProgress = Math.min(elapsed / this.transitionDuration, 1.0);
    
    console.log('WeatherStateManager | Transition progress updated:', this.transitionProgress, 'elapsed:', elapsed, 'duration:', this.transitionDuration);
    
    // Update all registered systems
    this._updateAllSystems();
    
    // Check if transition is complete
    if (this.transitionProgress >= 1.0) {
      console.log('WeatherStateManager | Transition complete, calling _completeTransition');
      this._completeTransition();
    }
  }
  
  /**
   * Force immediate state change (no transition)
   * @param {string} newState - Target weather state
   */
  setState(newState) {
    if (!this.getStateDefinition(newState)) {
      console.error(`WeatherStateManager | Invalid weather state: ${newState}`);
      return;
    }
    
    // Cancel any ongoing transition
    if (this.isTransitioning) {
      this._cancelTransition();
    }
    
    this._setCurrentState(newState, true);
    this._updateAllSystems();
    
    console.log(`WeatherStateManager | Force set state to: ${newState}`);
  }
  
  /**
   * Set a custom weather state definition
   * @param {string} stateName - Name of the custom state
   * @param {Object} stateDefinition - Complete state definition
   * @param {boolean} save - Whether to save to settings
   */
  setCustomState(stateName, stateDefinition, save = true) {
    // Validate state definition
    if (!this._validateStateDefinition(stateDefinition)) {
      console.error(`WeatherStateManager | Invalid state definition for ${stateName}`);
      return false;
    }
    
    this.customStates.set(stateName, stateDefinition);
    
    if (save) {
      this._saveCustomStates();
    }
    
    console.log(`WeatherStateManager | Set custom state: ${stateName}`);
    return true;
  }
  
  /**
   * Remove a custom weather state
   * @param {string} stateName - Name of the custom state
   */
  removeCustomState(stateName) {
    const removed = this.customStates.delete(stateName);
    if (removed) {
      this._saveCustomStates();
      console.log(`WeatherStateManager | Removed custom state: ${stateName}`);
    }
    return removed;
  }
  
  /**
   * Get all available weather states (built-in + custom)
   * @returns {Array} Array of state information
   */
  getAllStates() {
    const states = [];
    
    // Built-in states
    for (const [key, def] of Object.entries(this.stateDefinitions)) {
      states.push({
        key,
        name: def.name,
        description: def.description,
        type: 'builtin'
      });
    }
    
    // Custom states
    for (const [key, def] of this.customStates.entries()) {
      states.push({
        key,
        name: def.name,
        description: def.description,
        type: 'custom'
      });
    }
    
    return states.sort((a, b) => a.name.localeCompare(b.name));
  }
  
  /**
   * Get diagnostics for UI display
   * @returns {Object} Diagnostic information
   */
  getDiagnostics() {
    const timeSinceTransition = Date.now() - this.lastTransitionTime;
    
    return {
      currentState: this.currentState,
      targetState: this.targetState,
      isTransitioning: this.isTransitioning,
      transitionProgress: Math.round(this.transitionProgress * 100),
      transitionDuration: this.transitionDuration,
      timeSinceTransition: `${Math.round(timeSinceTransition / 1000)}s ago`,
      registeredSystems: Array.from(this.registeredSystems.keys()),
      customStatesCount: this.customStates.size,
      totalStatesCount: Object.keys(this.stateDefinitions).length + this.customStates.size,
      stateHistoryLength: this.stateHistory.length,
      activeTransition: this.isTransitioning ? {
        from: this.currentState,
        to: this.targetState,
        progress: Math.round(this.transitionProgress * 100),
        remaining: Math.max(0, this.transitionDuration - (Date.now() - this.transitionStartTime))
      } : null
    };
  }
  
  /**
   * Add event listener
   * @param {string} event - Event name ('stateChange', 'transitionStart', 'transitionComplete')
   * @param {Function} callback - Event callback
   */
  addEventListener(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event).push(callback);
  }
  
  /**
   * Remove event listener
   * @param {string} event - Event name
   * @param {Function} callback - Event callback to remove
   */
  removeEventListener(event, callback) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }
  
  /**
   * Destroy the manager
   */
  destroy() {
    this.cancelTransition();
    this.registeredSystems.clear();
    this.customStates.clear();
    this.eventListeners.clear();
    this.stateHistory.length = 0;
    
    console.log('WeatherStateManager destroyed');
  }
  
  // === Private Methods ===
  
  /**
   * Initialize transition rules between states
   * @private
   */
  _initializeTransitionRules() {
    // Natural progression rules (shorter transitions)
    const naturalProgressions = [
      ['clear', 'partly-cloudy'], ['partly-cloudy', 'drizzle'],
      ['drizzle', 'rain'], ['rain', 'storm'],
      ['clear', 'snow'], ['snow', 'blizzard'],
      ['rain', 'sleet'], ['sleet', 'snow'],
      ['sleet', 'rain'], ['blizzard', 'snow']
    ];
    
    // Register natural progressions with short durations
    for (const [from, to] of naturalProgressions) {
      this.transitionRules.set(`${from}->${to}`, {
        duration: 8000,
        easing: 'easeInOut',
        type: 'natural'
      });
    }
    
    // All other transitions get default durations
    const allStates = Object.keys(this.stateDefinitions);
    for (const from of allStates) {
      for (const to of allStates) {
        if (from !== to && !this.transitionRules.has(`${from}->${to}`)) {
          // Determine transition type and duration
          const bothPrecip = ['rain', 'storm', 'drizzle'].includes(from) && 
                            ['rain', 'storm', 'drizzle'].includes(to);
          const bothSnow = ['snow', 'blizzard'].includes(from) && 
                          ['snow', 'blizzard'].includes(to);
          
          let duration, type;
          if (bothPrecip || bothSnow) {
            duration = 10000;
            type = 'similar';
          } else {
            duration = 15000;
            type = 'major';
          }
          
          this.transitionRules.set(`${from}->${to}`, {
            duration,
            easing: 'easeInOut',
            type
          });
        }
      }
    }
  }
  
  /**
   * Start transition to new state
   * @param {string} newState - Target state
   * @param {number} duration - Transition duration
   * @param {string} easing - Easing function
   * @private
   */
  _startTransition(newState, duration, easing) {
    this.targetState = newState;
    this.isTransitioning = true;
    this.transitionProgress = 0;
    this.transitionStartTime = Date.now();
    this.transitionDuration = duration;
    this.transitionEasing = easing;
    
    // Emit transition start event
    this._emitEvent('transitionStart', {
      from: this.currentState,
      to: newState,
      duration,
      easing
    });
  }
  
  /**
   * Complete current transition
   * @private
   */
  _completeTransition() {
    const fromState = this.currentState;
    const toState = this.targetState;
    
    this._setCurrentState(toState, true);
    this.isTransitioning = false;
    this.targetState = null;
    this.transitionProgress = 0;
    this.lastTransitionTime = Date.now();
    
    // Update all systems with final state
    this._updateAllSystems();
    
    // Emit transition complete event
    this._emitEvent('transitionComplete', {
      from: fromState,
      to: toState,
      duration: this.transitionDuration
    });
  }
  
  /**
   * Cancel current transition
   * @private
   */
  _cancelTransition() {
    if (!this.isTransitioning) return;
    
    this.isTransitioning = false;
    this.targetState = null;
    this.transitionProgress = 0;
    
    this._emitEvent('transitionCancelled', {
      from: this.currentState,
      to: this.targetState
    });
  }
  
  /**
   * Set current state and update history
   * @param {string} newState - New state name
   * @param {boolean} updateHistory - Whether to update history
   * @private
   */
  _setCurrentState(newState, updateHistory = false) {
    const oldState = this.currentState;
    this.currentState = newState;
    
    if (updateHistory && oldState !== newState) {
      this.stateHistory.push({
        from: oldState,
        to: newState,
        timestamp: Date.now()
      });
      
      // Trim history if needed
      if (this.stateHistory.length > this.maxHistoryLength) {
        this.stateHistory.shift();
      }
      
      // Emit state change event
      this._emitEvent('stateChange', {
        from: oldState,
        to: newState
      });
    }
  }
  
  /**
   * Update all registered systems
   * @private
   */
  _updateAllSystems() {
    const activeState = this.getActiveStateDefinition();
    console.log('WeatherStateManager | _updateAllSystems called, registered systems count:', this.registeredSystems.size);
    
    for (const [systemName, system] of this.registeredSystems.entries()) {
      console.log(`WeatherStateManager | Updating system: ${systemName}, enabled: ${system.enabled}`);
      if (!system.enabled) continue;
      
      try {
        if (this.isTransitioning && system.transitionFunction) {
          console.log(`WeatherStateManager | Calling transition function for ${systemName}`);
          system.transitionFunction(this.currentState, this.targetState, this.transitionProgress);
        } else {
          console.log(`WeatherStateManager | Calling update function for ${systemName}`);
          system.updateFunction(activeState);
        }
        system.lastUpdate = Date.now();
      } catch (error) {
        console.error(`WeatherStateManager | Failed to update system ${systemName}:`, error);
      }
    }
  }
  
  /**
   * Sort registered systems by priority
   * @private
   */
  _sortSystemsByPriority() {
    this.registeredSystems = new Map(
      Array.from(this.registeredSystems.entries())
        .sort((a, b) => a[1].priority - b[1].priority)
    );
  }
  
  /**
   * Check if transition is allowed
   * @param {string} from - Source state
   * @param {string} to - Target state
   * @returns {boolean} Whether transition is allowed
   * @private
   */
  _canTransition(from, to) {
    // For now, allow all transitions
    // This could be extended with custom rules
    return true;
  }
  
  /**
   * Get transition configuration
   * @param {string} from - Source state
   * @param {string} to - Target state
   * @returns {Object} Transition configuration
   * @private
   */
  _getTransitionConfig(from, to) {
    return this.transitionRules.get(`${from}->${to}`) || {
      duration: 10000,
      easing: 'easeInOut',
      type: 'default'
    };
  }
  
  /**
   * Apply easing function to progress value
   * @param {number} t - Progress value (0-1)
   * @returns {number} Eased progress
   * @private
   */
  _applyEasing(t) {
    switch (this.transitionEasing) {
      case 'easeIn':
        return t * t;
      case 'easeOut':
        return t * (2 - t);
      case 'easeInOut':
        return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
      default:
        return t;
    }
  }
  
  /**
   * Interpolate object properties
   * @param {Object} from - Source object
   * @param {Object} to - Target object
   * @param {number} t - Progress (0-1)
   * @param {Function} interpolator - Property-specific interpolator
   * @returns {Object} Interpolated object
   * @private
   */
  _interpolateObject(from, to, t, interpolator) {
    if (!from || !to) return from || to;
    
    const result = {};
    for (const key of Object.keys(to)) {
      if (from[key] !== undefined && to[key] !== undefined) {
        // Ensure the interpolator runs with the correct `this` context
        result[key] = interpolator.call(this, from[key], to[key], t, key);
      } else if (to[key] !== undefined) {
        result[key] = to[key];
      } else {
        result[key] = from[key];
      }
    }
    return result;
  }
  
  // Property-specific interpolators
  _interpolateAtmospheric(from, to, t, key) {
    if (typeof from === 'object' && typeof to === 'object') {
      return {
        min: this._lerp(from.min, to.min, t),
        max: this._lerp(from.max, to.max, t),
        ideal: this._lerp(from.ideal, to.ideal, t)
      };
    }
    return this._lerp(from, to, t);
  }
  
  _interpolateVisual(from, to, t, key) {
    if (typeof from === 'object' && typeof to === 'object') {
      if (from.r !== undefined && to.r !== undefined) {
        // Color object
        return {
          r: this._lerp(from.r, to.r, t),
          g: this._lerp(from.g, to.g, t),
          b: this._lerp(from.b, to.b, t)
        };
      } else {
        // Other visual properties
        return this._interpolateObject(from, to, t, this._lerp);
      }
    }
    return this._lerp(from, to, t);
  }
  
  _interpolateNumeric(from, to, t, key) {
    return this._lerp(from, to, t);
  }
  
  _interpolatePrecipitation(from, to, t, key) {
    if (key === 'type') {
      return t < 0.5 ? from : to;
    }
    if (typeof from === 'object' && typeof to === 'object') {
      return this._interpolateObject(from, to, t, this._lerp);
    }
    return this._lerp(from, to, t);
  }
  
  _interpolateEnvironment(from, to, t, key) {
    if (typeof from === 'object' && typeof to === 'object') {
      return this._interpolateObject(from, to, t, this._lerp);
    }
    return this._lerp(from, to, t);
  }
  
  _interpolateAudio(from, to, t, key) {
    if (typeof from === 'object' && typeof to === 'object') {
      return this._interpolateObject(from, to, t, this._lerp);
    }
    return this._lerp(from, to, t);
  }
  
  _interpolateEffects(from, to, t, key) {
    if (typeof from === 'object' && typeof to === 'object') {
      return this._interpolateObject(from, to, t, this._lerp);
    }
    return this._lerp(from, to, t);
  }
  
  /**
   * Linear interpolation helper
   * @param {number} from - Start value
   * @param {number} to - End value
   * @param {number} t - Progress (0-1)
   * @returns {number} Interpolated value
   * @private
   */
  _lerp(from, to, t) {
    return from + (to - from) * t;
  }
  
  /**
   * Get initial state from settings or default
   * @returns {string} Initial state name
   * @private
   */
  _getInitialState() {
    // Try to get from active config, fall back to 'clear'
    return game.mapShine?.profileManager?.activeConfig?.weather?.currentState || 'clear';
  }
  
  /**
   * Load custom states from settings
   * @private
   */
  async _loadCustomStates() {
    try {
      const customStatesData = game.settings.get('map-shine', 'customWeatherStates') || {};
      for (const [name, definition] of Object.entries(customStatesData)) {
        if (this._validateStateDefinition(definition)) {
          this.customStates.set(name, definition);
        }
      }
      console.log(`WeatherStateManager | Loaded ${this.customStates.size} custom states`);
    } catch (error) {
      console.warn('WeatherStateManager | Failed to load custom states:', error);
    }
  }
  
  /**
   * Save custom states to settings
   * @private
   */
  _saveCustomStates() {
    try {
      const customStatesData = {};
      for (const [name, definition] of this.customStates.entries()) {
        customStatesData[name] = definition;
      }
      game.settings.set('map-shine', 'customWeatherStates', customStatesData);
    } catch (error) {
      console.warn('WeatherStateManager | Failed to save custom states:', error);
    }
  }
  
  /**
   * Validate state definition structure
   * @param {Object} definition - State definition to validate
   * @returns {boolean} Whether definition is valid
   * @private
   */
  _validateStateDefinition(definition) {
    // Basic validation - check required top-level properties
    const required = ['name', 'description'];
    for (const prop of required) {
      if (!definition[prop]) {
        console.warn(`WeatherStateManager | Invalid state definition: missing ${prop}`);
        return false;
      }
    }
    return true;
  }
  
  /**
   * Emit event to listeners
   * @param {string} event - Event name
   * @param {Object} data - Event data
   * @private
   */
  _emitEvent(event, data) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      for (const callback of listeners) {
        try {
          callback(data);
        } catch (error) {
          console.error(`WeatherStateManager | Event listener error for ${event}:`, error);
        }
      }
    }
  }
}

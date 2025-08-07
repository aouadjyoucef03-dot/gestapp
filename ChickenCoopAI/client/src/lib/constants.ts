// Age-based target parameters for chicks
export const AGE_TARGETS = {
  0: { tempMin: 32, tempMax: 35, humidity: 60, ventilation: 20 }, // Day 0-7
  7: { tempMin: 29, tempMax: 32, humidity: 60, ventilation: 25 },
  14: { tempMin: 27, tempMax: 30, humidity: 65, ventilation: 30 },
  21: { tempMin: 24, tempMax: 27, humidity: 65, ventilation: 35 },
  28: { tempMin: 21, tempMax: 24, humidity: 70, ventilation: 40 },
  35: { tempMin: 18, tempMax: 21, humidity: 70, ventilation: 45 },
};

// Growth stages
export const GROWTH_STAGES = {
  0: 'Brooding',
  14: 'Starter',
  28: 'Grower',
  42: 'Finisher',
};

// Daily checklist tasks
export const DEFAULT_CHECKLIST_TASKS = [
  { id: '1', task: 'Check water system pressure', completed: false },
  { id: '2', task: 'Inspect feed levels in all bins', completed: false },
  { id: '3', task: 'Check ventilation equipment function', completed: false },
  { id: '4', task: 'Record temperature readings (morning)', completed: false },
  { id: '5', task: 'Observe chick behavior patterns', completed: false },
  { id: '6', task: 'Clean water dispensers', completed: false },
];

// Equipment specifications for calculations
export const EQUIPMENT_SPECS = {
  fan: {
    airflowFactor: 0.85, // m³/min per cm diameter per % speed
    powerFactor: 0.02, // kW per cm diameter per % speed
  },
  heater: {
    efficiencyFactor: 0.8, // heating efficiency
    temperatureRise: 0.5, // °C per kW per 100m³
  },
  inlet: {
    velocityFactor: 2.5, // m/s per % opening
    coolingFactor: 0.1, // °C reduction per m/s velocity
  },
};

// Feed and water consumption targets (per 1000 birds)
export const CONSUMPTION_TARGETS = {
  feed: {
    0: 20, // kg/day for age 0-7 days
    7: 35,
    14: 55,
    21: 80,
    28: 110,
    35: 150,
  },
  water: {
    0: 50, // L/day for age 0-7 days
    7: 85,
    14: 140,
    21: 200,
    28: 280,
    35: 380,
  },
};

// Standard FCR (Feed Conversion Ratio) targets
export const FCR_TARGETS = {
  14: 1.2,
  21: 1.35,
  28: 1.5,
  35: 1.65,
  42: 1.8,
};

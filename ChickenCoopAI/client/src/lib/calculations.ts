import { EQUIPMENT_SPECS, AGE_TARGETS } from './constants';
import type { Farm, Equipment, Flock } from '@shared/schema';

export interface EnvironmentalCalculation {
  insideTemp: number;
  insideHumidity: number;
  totalHeating: number;
  totalCooling: number;
  ventilationEffect: number;
  recommendations: Array<{
    type: 'warning' | 'info' | 'success';
    title: string;
    message: string;
    action: string;
  }>;
  volume: number;
  surfaceArea: number;
}

export function calculateInsideTemperature(
  farm: Farm,
  equipment: Equipment[],
  outsideTemp: number,
  outsideHumidity: number,
  windSpeed: number,
  flockAge?: number
): EnvironmentalCalculation {
  const volume = farm.length * farm.width * farm.height;
  const surfaceArea = 2 * (farm.length * farm.width + farm.length * farm.height + farm.width * farm.height);
  
  let insideTemp = outsideTemp;
  
  // Calculate heating effect
  const activeHeaters = equipment.filter(eq => eq.type === 'heater' && eq.isActive);
  const totalHeating = activeHeaters.reduce((sum, heater) => {
    const power = heater.specification?.power || 0;
    const setting = heater.currentSetting || 0;
    return sum + (power * setting / 100);
  }, 0);
  
  // Apply heating (more sophisticated model)
  const heatingEffect = totalHeating * EQUIPMENT_SPECS.heater.efficiencyFactor * 
    EQUIPMENT_SPECS.heater.temperatureRise / (volume / 100);
  insideTemp += heatingEffect;
  
  // Calculate cooling effect from fans
  const activeFans = equipment.filter(eq => eq.type === 'fan' && eq.isActive);
  const totalCooling = activeFans.reduce((sum, fan) => {
    const diameter = fan.specification?.diameter || 0;
    const setting = fan.currentSetting || 0;
    const airflow = diameter * EQUIPMENT_SPECS.fan.airflowFactor * setting / 100;
    return sum + airflow;
  }, 0);
  
  // Apply fan cooling effect
  const coolingEffect = Math.min(
    totalCooling * 0.001 * Math.max(insideTemp - outsideTemp, 0) / volume,
    insideTemp - outsideTemp
  );
  insideTemp -= coolingEffect;
  
  // Calculate ventilation effect from inlets
  const inlets = equipment.filter(eq => eq.type === 'inlet');
  const ventilationEffect = inlets.reduce((sum, inlet) => {
    const surface = inlet.specification?.surface || 0;
    const opening = inlet.currentSetting || 0;
    const velocity = opening * EQUIPMENT_SPECS.inlet.velocityFactor / 100;
    const coolingFromVentilation = velocity * EQUIPMENT_SPECS.inlet.coolingFactor * windSpeed * 0.1;
    return sum + coolingFromVentilation;
  }, 0);
  
  insideTemp -= ventilationEffect;
  
  // Calculate humidity (simplified psychrometric calculation)
  let insideHumidity = outsideHumidity;
  if (insideTemp > outsideTemp) {
    // Relative humidity decreases as temperature increases
    insideHumidity *= (outsideTemp + 273.15) / (insideTemp + 273.15);
    insideHumidity = Math.min(100, Math.max(30, insideHumidity));
  }
  
  // Generate age-appropriate recommendations
  const recommendations = generateRecommendations(
    insideTemp,
    insideHumidity,
    flockAge || 18,
    totalHeating,
    totalCooling,
    equipment
  );
  
  return {
    insideTemp: Math.round(insideTemp * 10) / 10,
    insideHumidity: Math.round(insideHumidity * 10) / 10,
    totalHeating,
    totalCooling,
    ventilationEffect: Math.round(ventilationEffect * 10) / 10,
    recommendations,
    volume,
    surfaceArea: Math.round(surfaceArea * 10) / 10,
  };
}

function generateRecommendations(
  insideTemp: number,
  insideHumidity: number,
  age: number,
  totalHeating: number,
  totalCooling: number,
  equipment: Equipment[]
): Array<{
  type: 'warning' | 'info' | 'success';
  title: string;
  message: string;
  action: string;
}> {
  const recommendations = [];
  
  // Get age-appropriate targets
  const ageKey = Math.floor(age / 7) * 7;
  const targets = AGE_TARGETS[ageKey as keyof typeof AGE_TARGETS] || AGE_TARGETS[35];
  
  // Temperature recommendations
  if (insideTemp < targets.tempMin) {
    const diff = targets.tempMin - insideTemp;
    recommendations.push({
      type: 'warning',
      title: 'Temperature Below Target',
      message: `Inside temperature ${insideTemp.toFixed(1)}°C is ${diff.toFixed(1)}°C below target range (${targets.tempMin}-${targets.tempMax}°C). Consider increasing heater output or reducing ventilation.`,
      action: 'temperature_low'
    });
  } else if (insideTemp > targets.tempMax) {
    const diff = insideTemp - targets.tempMax;
    recommendations.push({
      type: 'warning', 
      title: 'Temperature Above Target',
      message: `Inside temperature ${insideTemp.toFixed(1)}°C is ${diff.toFixed(1)}°C above target range (${targets.tempMin}-${targets.tempMax}°C). Consider increasing fan speed or opening inlets.`,
      action: 'temperature_high'
    });
  } else {
    recommendations.push({
      type: 'success',
      title: 'Temperature Optimal',
      message: `Inside temperature ${insideTemp.toFixed(1)}°C is within the optimal range for ${age}-day-old chicks.`,
      action: 'temperature_good'
    });
  }
  
  // Humidity recommendations
  if (insideHumidity < targets.humidity - 10) {
    recommendations.push({
      type: 'info',
      title: 'Humidity Low',
      message: `Humidity ${insideHumidity.toFixed(1)}% is below optimal range. Consider adding water sources or reducing ventilation.`,
      action: 'humidity_low'
    });
  } else if (insideHumidity > targets.humidity + 15) {
    recommendations.push({
      type: 'info',
      title: 'Humidity High',
      message: `Humidity ${insideHumidity.toFixed(1)}% is above optimal range. Increase ventilation to reduce moisture.`,
      action: 'humidity_high'
    });
  }
  
  // Energy optimization recommendations
  if (totalHeating > 10 && insideTemp > targets.tempMax) {
    recommendations.push({
      type: 'info',
      title: 'Energy Optimization',
      message: `Reduce heater output by 15-20% to save energy while maintaining optimal temperature.`,
      action: 'optimize_energy'
    });
  }
  
  // Equipment optimization
  const activeFans = equipment.filter(eq => eq.type === 'fan' && eq.isActive);
  const activeHeaters = equipment.filter(eq => eq.type === 'heater' && eq.isActive);
  
  if (activeFans.length > 1 && insideTemp >= targets.tempMin && insideTemp <= targets.tempMax) {
    recommendations.push({
      type: 'info',
      title: 'Equipment Optimization',
      message: 'Consider running fewer fans at higher speed for better energy efficiency.',
      action: 'optimize_fans'
    });
  }
  
  if (activeHeaters.length === 0 && insideTemp < targets.tempMin - 2) {
    recommendations.push({
      type: 'warning',
      title: 'Heating Required',
      message: 'Temperature is critically low. Activate heaters immediately.',
      action: 'activate_heating'
    });
  }
  
  return recommendations;
}

export function calculateGrowthProjections(flock: Flock, currentEnvironment: EnvironmentalCalculation) {
  const { currentAge, averageWeight, chickCount } = flock;
  
  // Standard growth rate (grams per day) based on age
  const baseGrowthRate = Math.max(10, 50 - currentAge * 0.8);
  
  // Environmental factor affecting growth
  let environmentalFactor = 1.0;
  
  // Temperature stress affects growth
  const hasGoodTemp = currentEnvironment.recommendations.some(r => r.action === 'temperature_good');
  if (!hasGoodTemp) {
    environmentalFactor *= 0.85; // 15% reduction for poor temperature
  }
  
  // Calculate projected weights
  const projectedWeight7d = averageWeight + (baseGrowthRate * environmentalFactor * 7);
  const projectedWeight14d = averageWeight + (baseGrowthRate * environmentalFactor * 14);
  
  // Calculate growth rate vs standard
  const standardWeight = getStandardWeight(currentAge);
  const growthRateVsStandard = ((averageWeight / standardWeight) - 1) * 100;
  
  // Calculate FCR (simplified)
  const fcr = 1.2 + (currentAge * 0.01) + (hasGoodTemp ? 0 : 0.2);
  
  return {
    projectedWeight7d: Math.round(projectedWeight7d),
    projectedWeight14d: Math.round(projectedWeight14d),
    growthRateVsStandard: Math.round(growthRateVsStandard * 10) / 10,
    fcr: Math.round(fcr * 100) / 100,
    environmentalFactor: Math.round(environmentalFactor * 100) / 100,
  };
}

function getStandardWeight(age: number): number {
  // Standard weight curve for broiler chicks (grams)
  return 40 + (age * 20) + Math.pow(age, 1.5) * 2;
}

export function calculateDensity(chickCount: number, length: number, width: number): number {
  const floorArea = length * width;
  return Math.round((chickCount / floorArea) * 100) / 100;
}

export function calculateConsumptionTargets(chickCount: number, age: number) {
  const ageKey = Math.floor(age / 7) * 7;
  const baseTargets = {
    feed: [20, 35, 55, 80, 110, 150][Math.floor(ageKey / 7)] || 150,
    water: [50, 85, 140, 200, 280, 380][Math.floor(ageKey / 7)] || 380,
  };
  
  return {
    feed: Math.round((baseTargets.feed * chickCount / 1000) * 100) / 100,
    water: Math.round((baseTargets.water * chickCount / 1000) * 100) / 100,
  };
}

import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertFarmSchema, 
  insertFlockSchema, 
  insertEquipmentSchema,
  insertFeedWaterSchema,
  insertEnvironmentalReadingSchema,
  insertMortalitySchema,
  updateEquipmentSchema 
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Farm routes
  app.get("/api/farms", async (req, res) => {
    try {
      const farms = await storage.getFarms();
      res.json(farms);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch farms" });
    }
  });

  app.get("/api/farms/:id", async (req, res) => {
    try {
      const farm = await storage.getFarm(req.params.id);
      if (!farm) {
        return res.status(404).json({ message: "Farm not found" });
      }
      res.json(farm);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch farm" });
    }
  });

  app.post("/api/farms", async (req, res) => {
    try {
      const farmData = insertFarmSchema.parse(req.body);
      const farm = await storage.createFarm(farmData);
      res.status(201).json(farm);
    } catch (error) {
      res.status(400).json({ message: "Invalid farm data" });
    }
  });

  app.patch("/api/farms/:id", async (req, res) => {
    try {
      const updateData = insertFarmSchema.parse(req.body);
      const farm = await storage.updateFarm(req.params.id, updateData);
      if (!farm) {
        return res.status(404).json({ message: "Farm not found" });
      }
      res.json(farm);
    } catch (error) {
      res.status(400).json({ message: "Invalid farm data" });
    }
  });

  // Flock routes
  app.get("/api/farms/:farmId/flocks", async (req, res) => {
    try {
      const flocks = await storage.getFlocksByFarm(req.params.farmId);
      res.json(flocks);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch flocks" });
    }
  });

  app.post("/api/flocks", async (req, res) => {
    try {
      const flockData = insertFlockSchema.parse(req.body);
      const flock = await storage.createFlock(flockData);
      res.status(201).json(flock);
    } catch (error) {
      res.status(400).json({ message: "Invalid flock data" });
    }
  });

  // Equipment routes
  app.get("/api/farms/:farmId/equipment", async (req, res) => {
    try {
      const equipment = await storage.getEquipmentByFarm(req.params.farmId);
      res.json(equipment);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch equipment" });
    }
  });

  app.post("/api/equipment", async (req, res) => {
    try {
      const equipmentData = insertEquipmentSchema.parse(req.body);
      const equipment = await storage.createEquipment(equipmentData);
      res.status(201).json(equipment);
    } catch (error) {
      res.status(400).json({ message: "Invalid equipment data" });
    }
  });

  app.patch("/api/equipment/:id", async (req, res) => {
    try {
      const updateData = updateEquipmentSchema.parse(req.body);
      const equipment = await storage.updateEquipment(req.params.id, updateData);
      if (!equipment) {
        return res.status(404).json({ message: "Equipment not found" });
      }
      res.json(equipment);
    } catch (error) {
      res.status(400).json({ message: "Invalid equipment data" });
    }
  });

  app.delete("/api/equipment/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteEquipment(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Equipment not found" });
      }
      res.json({ message: "Equipment deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete equipment" });
    }
  });

  // Weather API route
  app.get("/api/weather/:lat/:lon", async (req, res) => {
    try {
      const { lat, lon } = req.params;
      const apiKey = process.env.WEATHER_API_KEY || process.env.OPENWEATHER_API_KEY || "demo_key";
      
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`
      );
      
      if (!response.ok) {
        throw new Error("Weather API request failed");
      }
      
      const data = await response.json();
      
      const weatherData = {
        temperature: data.main.temp,
        humidity: data.main.humidity,
        pressure: data.main.pressure,
        windSpeed: data.wind.speed * 3.6, // Convert m/s to km/h
        description: data.weather[0].description,
        icon: data.weather[0].icon,
      };
      
      res.json(weatherData);
    } catch (error) {
      res.status(500).json({ 
        message: "Failed to fetch weather data",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Environmental readings
  app.get("/api/farms/:farmId/readings/latest", async (req, res) => {
    try {
      const reading = await storage.getLatestReading(req.params.farmId);
      res.json(reading);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch latest reading" });
    }
  });

  app.post("/api/environmental-readings", async (req, res) => {
    try {
      const readingData = insertEnvironmentalReadingSchema.parse(req.body);
      const reading = await storage.createEnvironmentalReading(readingData);
      res.status(201).json(reading);
    } catch (error) {
      res.status(400).json({ message: "Invalid reading data" });
    }
  });

  // Feed and water routes
  app.get("/api/flocks/:flockId/consumption/today", async (req, res) => {
    try {
      const consumption = await storage.getTodaysConsumption(req.params.flockId);
      res.json(consumption);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch consumption data" });
    }
  });

  app.post("/api/feed-water-records", async (req, res) => {
    try {
      console.log('Received feed/water record data:', req.body);
      
      // Parse and validate the data
      const recordData = insertFeedWaterSchema.parse({
        flockId: req.body.flockId,
        type: req.body.type,
        amount: parseFloat(req.body.amount),
        date: req.body.date || new Date().toISOString(),
      });
      
      console.log('Parsed record data:', recordData);
      
      const record = await storage.createFeedWaterRecord(recordData);
      res.status(201).json(record);
    } catch (error) {
      console.error('Failed to create feed/water record:', error);
      res.status(400).json({ 
        message: "Invalid feed/water record data",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Mortality routes
  app.get("/api/flocks/:flockId/mortality/today", async (req, res) => {
    try {
      const mortality = await storage.getTodaysMortality(req.params.flockId);
      res.json({ mortality });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch mortality data" });
    }
  });

  app.post("/api/mortality-records", async (req, res) => {
    try {
      const recordData = insertMortalitySchema.parse(req.body);
      const record = await storage.createMortalityRecord(recordData);
      res.status(201).json(record);
    } catch (error) {
      res.status(400).json({ message: "Invalid mortality record data" });
    }
  });

  // AI Calculations endpoint
  app.post("/api/calculate-environment", async (req, res) => {
    try {
      const { farmId, outsideTemp, outsideHumidity, windSpeed } = req.body;
      
      const farm = await storage.getFarm(farmId);
      const equipment = await storage.getEquipmentByFarm(farmId);
      
      if (!farm) {
        return res.status(404).json({ message: "Farm not found" });
      }
      
      // Calculate inside temperature based on equipment and outside conditions
      const volume = farm.length * farm.width * farm.height;
      const surfaceArea = 2 * (farm.length * farm.width + farm.length * farm.height + farm.width * farm.height);
      
      // Base temperature calculation
      let insideTemp = outsideTemp;
      
      // Add heating effect
      const activeHeaters = equipment.filter(eq => eq.type === 'heater' && eq.isActive);
      const totalHeating = activeHeaters.reduce((sum, heater) => {
        const power = heater.specification?.power || 0;
        const setting = heater.currentSetting || 0;
        return sum + (power * setting / 100);
      }, 0);
      
      // Heating contribution (simplified model)
      insideTemp += (totalHeating * 0.8) / (volume * 0.001); // Rough calculation
      
      // Subtract cooling effect from fans
      const activeFans = equipment.filter(eq => eq.type === 'fan' && eq.isActive);
      const totalCooling = activeFans.reduce((sum, fan) => {
        const diameter = fan.specification?.diameter || 0;
        const setting = fan.currentSetting || 0;
        const airflow = Math.PI * Math.pow(diameter / 200, 2) * setting * 50; // Simplified airflow calc
        return sum + airflow;
      }, 0);
      
      // Cooling contribution
      const coolingEffect = (totalCooling * 0.001 * Math.max(insideTemp - outsideTemp, 0)) / volume;
      insideTemp -= coolingEffect;
      
      // Ventilation effect from inlets
      const inlets = equipment.filter(eq => eq.type === 'inlet');
      const ventilationEffect = inlets.reduce((sum, inlet) => {
        const surface = inlet.specification?.surface || 0;
        const opening = inlet.currentSetting || 0;
        return sum + (surface * opening / 100 * windSpeed * 0.1);
      }, 0);
      
      insideTemp -= ventilationEffect;
      
      // Calculate humidity (simplified)
      let insideHumidity = outsideHumidity;
      if (insideTemp > outsideTemp) {
        insideHumidity *= (outsideTemp + 273.15) / (insideTemp + 273.15); // Relative humidity adjustment
      }
      
      // Generate recommendations
      const recommendations = [];
      const targetTempMin = 30;
      const targetTempMax = 32;
      
      if (insideTemp < targetTempMin) {
        recommendations.push({
          type: 'warning',
          title: 'Temperature Below Target',
          message: `Inside temperature ${insideTemp.toFixed(1)}°C is below target range. Consider increasing heater output or reducing ventilation.`,
          action: 'temperature_low'
        });
      } else if (insideTemp > targetTempMax) {
        recommendations.push({
          type: 'warning', 
          title: 'Temperature Above Target',
          message: `Inside temperature ${insideTemp.toFixed(1)}°C is above target range. Consider increasing fan speed or opening inlets.`,
          action: 'temperature_high'
        });
      } else {
        recommendations.push({
          type: 'success',
          title: 'Temperature Optimal',
          message: 'Inside temperature is within the optimal range for current age.',
          action: 'temperature_good'
        });
      }
      
      // Energy optimization recommendations
      if (totalHeating > 10 && insideTemp > targetTempMax) {
        recommendations.push({
          type: 'info',
          title: 'Energy Optimization',
          message: 'Consider reducing heater output to save energy while maintaining comfort zone.',
          action: 'optimize_energy'
        });
      }
      
      const calculations = {
        insideTemp: Math.round(insideTemp * 10) / 10,
        insideHumidity: Math.round(insideHumidity * 10) / 10,
        totalHeating,
        totalCooling,
        ventilationEffect: Math.round(ventilationEffect * 10) / 10,
        recommendations,
        volume,
        surfaceArea: Math.round(surfaceArea * 10) / 10,
      };
      
      res.json(calculations);
    } catch (error) {
      res.status(500).json({ 
        message: "Failed to calculate environmental conditions",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Checklist routes
  app.get("/api/farms/:farmId/checklist/today", async (req, res) => {
    try {
      const checklist = await storage.getTodaysChecklist(req.params.farmId);
      res.json(checklist);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch checklist" });
    }
  });

  app.post("/api/farms/:farmId/checklist", async (req, res) => {
    try {
      const { tasks } = req.body;
      const checklist = await storage.updateChecklist(req.params.farmId, tasks);
      res.json(checklist);
    } catch (error) {
      res.status(500).json({ message: "Failed to update checklist" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

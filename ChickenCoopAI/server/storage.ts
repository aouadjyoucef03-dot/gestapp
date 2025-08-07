import { 
  type Farm, type InsertFarm,
  type Flock, type InsertFlock,
  type Equipment, type InsertEquipment, type UpdateEquipment,
  type EnvironmentalReading, type InsertEnvironmentalReading,
  type FeedWaterRecord, type InsertFeedWater,
  type MortalityRecord, type InsertMortality,
  type DailyChecklist
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Farm operations
  getFarms(): Promise<Farm[]>;
  getFarm(id: string): Promise<Farm | undefined>;
  createFarm(farm: InsertFarm): Promise<Farm>;
  updateFarm(id: string, data: Partial<Farm>): Promise<Farm | undefined>;

  // Flock operations
  getFlock(id: string): Promise<Flock | undefined>;
  getFlocksByFarm(farmId: string): Promise<Flock[]>;
  createFlock(flock: InsertFlock): Promise<Flock>;
  updateFlock(id: string, data: Partial<Flock>): Promise<Flock | undefined>;

  // Equipment operations
  getEquipment(id: string): Promise<Equipment | undefined>;
  getEquipmentByFarm(farmId: string): Promise<Equipment[]>;
  createEquipment(equipment: InsertEquipment): Promise<Equipment>;
  updateEquipment(id: string, data: UpdateEquipment): Promise<Equipment | undefined>;
  deleteEquipment(id: string): Promise<boolean>;

  // Environmental readings
  getLatestReading(farmId: string): Promise<EnvironmentalReading | undefined>;
  createEnvironmentalReading(reading: InsertEnvironmentalReading): Promise<EnvironmentalReading>;
  getReadings(farmId: string, limit?: number): Promise<EnvironmentalReading[]>;

  // Feed and water records
  getFeedWaterRecords(flockId: string, type?: 'feed' | 'water'): Promise<FeedWaterRecord[]>;
  createFeedWaterRecord(record: InsertFeedWater): Promise<FeedWaterRecord>;
  getTodaysConsumption(flockId: string): Promise<{ feed: number; water: number }>;

  // Mortality records
  getMortalityRecords(flockId: string): Promise<MortalityRecord[]>;
  createMortalityRecord(record: InsertMortality): Promise<MortalityRecord>;
  getTodaysMortality(flockId: string): Promise<number>;

  // Daily checklist
  getTodaysChecklist(farmId: string): Promise<DailyChecklist | undefined>;
  updateChecklist(farmId: string, tasks: { id: string; task: string; completed: boolean }[]): Promise<DailyChecklist>;
}

export class MemStorage implements IStorage {
  private farms: Map<string, Farm> = new Map();
  private flocks: Map<string, Flock> = new Map();
  private equipment: Map<string, Equipment> = new Map();
  private environmentalReadings: Map<string, EnvironmentalReading> = new Map();
  private feedWaterRecords: Map<string, FeedWaterRecord> = new Map();
  private mortalityRecords: Map<string, MortalityRecord> = new Map();
  private dailyChecklists: Map<string, DailyChecklist> = new Map();

  constructor() {
    // Initialize with sample data
    this.initializeData();
  }

  private initializeData() {
    // Create a default farm
    const farmId = randomUUID();
    const farm: Farm = {
      id: farmId,
      name: "Main Farm",
      length: 24,
      width: 12,
      height: 3.5,
      createdAt: new Date(),
    };
    this.farms.set(farmId, farm);

    // Create a default flock
    const flockId = randomUUID();
    const flock: Flock = {
      id: flockId,
      farmId,
      name: "Batch A",
      chickCount: 1250,
      initialChickCount: 1300,
      currentAge: 18,
      averageWeight: 485,
      batchDate: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000),
      createdAt: new Date(),
    };
    this.flocks.set(flockId, flock);

    // Create default equipment
    const equipmentData = [
      { type: 'fan', name: 'Fan 1', specification: { diameter: 120, power: 2.8 } },
      { type: 'fan', name: 'Fan 2', specification: { diameter: 100, power: 2.1 } },
      { type: 'heater', name: 'Heater 1', specification: { power: 15 } },
      { type: 'heater', name: 'Heater 2', specification: { power: 12 } },
      { type: 'inlet', name: 'Air Inlet System', specification: { surface: 2.4 } },
    ];

    equipmentData.forEach(eq => {
      const id = randomUUID();
      const equipment: Equipment = {
        id,
        farmId,
        type: eq.type,
        name: eq.name,
        specification: eq.specification,
        isActive: eq.type === 'fan' ? true : eq.type === 'heater' ? true : false,
        currentSetting: eq.type === 'fan' ? 75 : eq.type === 'heater' ? 45 : 30,
        createdAt: new Date(),
      };
      this.equipment.set(id, equipment);
    });

    // Create initial environmental reading
    const readingId = randomUUID();
    const reading: EnvironmentalReading = {
      id: readingId,
      farmId,
      insideTemp: 28,
      insideHumidity: 65,
      outsideTemp: 22,
      outsideHumidity: 45,
      windSpeed: 12,
      pressure: 1013,
      timestamp: new Date(),
    };
    this.environmentalReadings.set(readingId, reading);
  }

  async getFarm(id: string): Promise<Farm | undefined> {
    return this.farms.get(id);
  }

  async createFarm(insertFarm: InsertFarm): Promise<Farm> {
    const id = randomUUID();
    const farm: Farm = {
      ...insertFarm,
      id,
      createdAt: new Date(),
    };
    this.farms.set(id, farm);
    return farm;
  }

  async getFarms(): Promise<Farm[]> {
    return Array.from(this.farms.values());
  }

  async updateFarm(id: string, data: Partial<Farm>): Promise<Farm | undefined> {
    const farm = this.farms.get(id);
    if (!farm) return undefined;
    
    const updated = { ...farm, ...data };
    this.farms.set(id, updated);
    return updated;
  }

  async getFlock(id: string): Promise<Flock | undefined> {
    return this.flocks.get(id);
  }

  async getFlocksByFarm(farmId: string): Promise<Flock[]> {
    return Array.from(this.flocks.values()).filter(f => f.farmId === farmId);
  }

  async createFlock(insertFlock: InsertFlock): Promise<Flock> {
    const id = randomUUID();
    const flock: Flock = {
      ...insertFlock,
      id,
      createdAt: new Date(),
    };
    this.flocks.set(id, flock);
    return flock;
  }

  async updateFlock(id: string, data: Partial<Flock>): Promise<Flock | undefined> {
    const flock = this.flocks.get(id);
    if (!flock) return undefined;
    
    const updated = { ...flock, ...data };
    this.flocks.set(id, updated);
    return updated;
  }

  async getEquipment(id: string): Promise<Equipment | undefined> {
    return this.equipment.get(id);
  }

  async getEquipmentByFarm(farmId: string): Promise<Equipment[]> {
    return Array.from(this.equipment.values()).filter(e => e.farmId === farmId);
  }

  async createEquipment(insertEquipment: InsertEquipment): Promise<Equipment> {
    const id = randomUUID();
    const equipment: Equipment = {
      ...insertEquipment,
      id,
      createdAt: new Date(),
    };
    this.equipment.set(id, equipment);
    return equipment;
  }

  async updateEquipment(id: string, data: UpdateEquipment): Promise<Equipment | undefined> {
    const equipment = this.equipment.get(id);
    if (!equipment) return undefined;
    
    const updated = { ...equipment, ...data };
    this.equipment.set(id, updated);
    return updated;
  }

  async deleteEquipment(id: string): Promise<boolean> {
    return this.equipment.delete(id);
  }

  async getLatestReading(farmId: string): Promise<EnvironmentalReading | undefined> {
    const readings = Array.from(this.environmentalReadings.values())
      .filter(r => r.farmId === farmId)
      .sort((a, b) => new Date(b.timestamp!).getTime() - new Date(a.timestamp!).getTime());
    
    return readings[0];
  }

  async createEnvironmentalReading(insertReading: InsertEnvironmentalReading): Promise<EnvironmentalReading> {
    const id = randomUUID();
    const reading: EnvironmentalReading = {
      ...insertReading,
      id,
      timestamp: new Date(),
    };
    this.environmentalReadings.set(id, reading);
    return reading;
  }

  async getReadings(farmId: string, limit = 100): Promise<EnvironmentalReading[]> {
    return Array.from(this.environmentalReadings.values())
      .filter(r => r.farmId === farmId)
      .sort((a, b) => new Date(b.timestamp!).getTime() - new Date(a.timestamp!).getTime())
      .slice(0, limit);
  }

  async getFeedWaterRecords(flockId: string, type?: 'feed' | 'water'): Promise<FeedWaterRecord[]> {
    let records = Array.from(this.feedWaterRecords.values()).filter(r => r.flockId === flockId);
    
    if (type) {
      records = records.filter(r => r.type === type);
    }
    
    return records.sort((a, b) => new Date(b.date!).getTime() - new Date(a.date!).getTime());
  }

  async createFeedWaterRecord(insertRecord: InsertFeedWater): Promise<FeedWaterRecord> {
    const id = randomUUID();
    const record: FeedWaterRecord = {
      ...insertRecord,
      id,
      createdAt: new Date(),
    };
    this.feedWaterRecords.set(id, record);
    return record;
  }

  async getTodaysConsumption(flockId: string): Promise<{ feed: number; water: number }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayRecords = Array.from(this.feedWaterRecords.values())
      .filter(r => r.flockId === flockId && new Date(r.date!).toDateString() === today.toDateString());
    
    const feed = todayRecords.filter(r => r.type === 'feed').reduce((sum, r) => sum + r.amount, 0);
    const water = todayRecords.filter(r => r.type === 'water').reduce((sum, r) => sum + r.amount, 0);
    
    return { feed, water };
  }

  async getMortalityRecords(flockId: string): Promise<MortalityRecord[]> {
    return Array.from(this.mortalityRecords.values())
      .filter(r => r.flockId === flockId)
      .sort((a, b) => new Date(b.date!).getTime() - new Date(a.date!).getTime());
  }

  async createMortalityRecord(insertRecord: InsertMortality): Promise<MortalityRecord> {
    const id = randomUUID();
    const record: MortalityRecord = {
      ...insertRecord,
      id,
      createdAt: new Date(),
    };
    this.mortalityRecords.set(id, record);
    
    // Update flock count
    const flock = Array.from(this.flocks.values()).find(f => f.id === insertRecord.flockId);
    if (flock) {
      flock.chickCount = Math.max(0, flock.chickCount - insertRecord.deathCount);
      this.flocks.set(flock.id, flock);
    }
    
    return record;
  }

  async getTodaysMortality(flockId: string): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayRecords = Array.from(this.mortalityRecords.values())
      .filter(r => r.flockId === flockId && new Date(r.date!).toDateString() === today.toDateString());
    
    return todayRecords.reduce((sum, r) => sum + r.deathCount, 0);
  }

  async getTodaysChecklist(farmId: string): Promise<DailyChecklist | undefined> {
    const today = new Date().toDateString();
    return Array.from(this.dailyChecklists.values())
      .find(c => c.farmId === farmId && new Date(c.date!).toDateString() === today);
  }

  async updateChecklist(farmId: string, tasks: { id: string; task: string; completed: boolean }[]): Promise<DailyChecklist> {
    const existing = await this.getTodaysChecklist(farmId);
    
    if (existing) {
      existing.tasks = tasks;
      this.dailyChecklists.set(existing.id, existing);
      return existing;
    }
    
    const id = randomUUID();
    const checklist: DailyChecklist = {
      id,
      farmId,
      date: new Date(),
      tasks,
      createdAt: new Date(),
    };
    this.dailyChecklists.set(id, checklist);
    return checklist;
  }
}

export const storage = new MemStorage();

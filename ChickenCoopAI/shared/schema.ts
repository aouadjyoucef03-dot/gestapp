import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, real, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const farms = pgTable("farms", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  length: real("length").notNull(), // meters
  width: real("width").notNull(), // meters
  height: real("height").notNull(), // meters
  createdAt: timestamp("created_at").defaultNow(),
});

export const flocks = pgTable("flocks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  farmId: varchar("farm_id").references(() => farms.id),
  name: text("name").notNull(),
  chickCount: integer("chick_count").notNull(),
  initialChickCount: integer("initial_chick_count").notNull(),
  currentAge: integer("current_age").notNull(), // days
  averageWeight: real("average_weight").notNull(), // grams
  batchDate: timestamp("batch_date").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const equipment = pgTable("equipment", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  farmId: varchar("farm_id").references(() => farms.id),
  type: text("type").notNull(), // 'fan' | 'heater' | 'inlet'
  name: text("name").notNull(),
  specification: json("specification").$type<{
    diameter?: number; // cm for fans
    power?: number; // kW for heaters
    surface?: number; // m² for inlets
  }>(),
  isActive: boolean("is_active").default(false),
  currentSetting: real("current_setting").default(0), // percentage
  createdAt: timestamp("created_at").defaultNow(),
});

export const environmentalReadings = pgTable("environmental_readings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  farmId: varchar("farm_id").references(() => farms.id),
  insideTemp: real("inside_temp"),
  insideHumidity: real("inside_humidity"),
  outsideTemp: real("outside_temp"),
  outsideHumidity: real("outside_humidity"),
  windSpeed: real("wind_speed"),
  pressure: real("pressure"),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const feedWaterRecords = pgTable("feed_water_records", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  flockId: varchar("flock_id").references(() => flocks.id),
  type: text("type").notNull(), // 'feed' | 'water'
  amount: real("amount").notNull(), // kg for feed, L for water
  date: timestamp("date").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const mortalityRecords = pgTable("mortality_records", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  flockId: varchar("flock_id").references(() => flocks.id),
  deathCount: integer("death_count").notNull(),
  cause: text("cause"), // optional cause of death
  date: timestamp("date").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const dailyChecklists = pgTable("daily_checklists", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  farmId: varchar("farm_id").references(() => farms.id),
  date: timestamp("date").defaultNow(),
  tasks: json("tasks").$type<{
    id: string;
    task: string;
    completed: boolean;
  }[]>(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas
export const insertFarmSchema = createInsertSchema(farms).pick({
  name: true,
  length: true,
  width: true,
  height: true,
});

export const insertFlockSchema = createInsertSchema(flocks).pick({
  farmId: true,
  name: true,
  chickCount: true,
  initialChickCount: true,
  currentAge: true,
  averageWeight: true,
  batchDate: true,
});

export const insertMortalitySchema = createInsertSchema(mortalityRecords).pick({
  flockId: true,
  deathCount: true,
  cause: true,
}).extend({
  date: z.string().optional(),
});

export const insertEquipmentSchema = createInsertSchema(equipment).pick({
  farmId: true,
  type: true,
  name: true,
  specification: true,
  isActive: true,
  currentSetting: true,
});

export const insertFeedWaterSchema = createInsertSchema(feedWaterRecords).pick({
  flockId: true,
  type: true,
  amount: true,
}).extend({
  date: z.string().optional(),
});

export const insertEnvironmentalReadingSchema = createInsertSchema(environmentalReadings).pick({
  farmId: true,
  insideTemp: true,
  insideHumidity: true,
  outsideTemp: true,
  outsideHumidity: true,
  windSpeed: true,
  pressure: true,
});

export const updateEquipmentSchema = z.object({
  isActive: z.boolean().optional(),
  currentSetting: z.number().min(0).max(100).optional(),
});

// Types
export type InsertFarm = z.infer<typeof insertFarmSchema>;
export type InsertFlock = z.infer<typeof insertFlockSchema>;
export type InsertEquipment = z.infer<typeof insertEquipmentSchema>;
export type InsertFeedWater = z.infer<typeof insertFeedWaterSchema>;
export type InsertEnvironmentalReading = z.infer<typeof insertEnvironmentalReadingSchema>;
export type InsertMortality = z.infer<typeof insertMortalitySchema>;
export type UpdateEquipment = z.infer<typeof updateEquipmentSchema>;

export type Farm = typeof farms.$inferSelect;
export type Flock = typeof flocks.$inferSelect;
export type Equipment = typeof equipment.$inferSelect;
export type EnvironmentalReading = typeof environmentalReadings.$inferSelect;
export type FeedWaterRecord = typeof feedWaterRecords.$inferSelect;
export type MortalityRecord = typeof mortalityRecords.$inferSelect;
export type DailyChecklist = typeof dailyChecklists.$inferSelect;

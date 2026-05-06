import { pgTable, serial, text, integer, real, timestamp, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const profilesTable = pgTable("profiles", {
  id: serial("id").primaryKey(),
  clerkUserId: text("clerk_user_id").notNull().unique(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  age: integer("age").notNull(),
  weightKg: real("weight_kg").notNull(),
  heightCm: real("height_cm").notNull(),
  fitnessGoal: text("fitness_goal").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertProfileSchema = createInsertSchema(profilesTable).omit({ id: true, createdAt: true });
export type InsertProfile = z.infer<typeof insertProfileSchema>;
export type Profile = typeof profilesTable.$inferSelect;

export const workoutsTable = pgTable("workouts", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  type: text("type").notNull(),
  durationMinutes: integer("duration_minutes").notNull(),
  caloriesBurned: integer("calories_burned").notNull(),
  notes: text("notes"),
  date: date("date").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertWorkoutSchema = createInsertSchema(workoutsTable).omit({ id: true, createdAt: true });
export type InsertWorkout = z.infer<typeof insertWorkoutSchema>;
export type Workout = typeof workoutsTable.$inferSelect;

export const nutritionTable = pgTable("nutrition_entries", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  foodName: text("food_name").notNull(),
  calories: integer("calories").notNull(),
  protein: real("protein"),
  carbs: real("carbs"),
  fat: real("fat"),
  date: date("date").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertNutritionSchema = createInsertSchema(nutritionTable).omit({ id: true, createdAt: true });
export type InsertNutrition = z.infer<typeof insertNutritionSchema>;
export type NutritionEntry = typeof nutritionTable.$inferSelect;

export const weightEntriesTable = pgTable("weight_entries", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  weightKg: real("weight_kg").notNull(),
  date: date("date").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertWeightSchema = createInsertSchema(weightEntriesTable).omit({ id: true, createdAt: true });
export type InsertWeight = z.infer<typeof insertWeightSchema>;
export type WeightEntry = typeof weightEntriesTable.$inferSelect;

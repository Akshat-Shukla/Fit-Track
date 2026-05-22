import { useState } from "react";
import { useListNutrition, useLogNutrition, useDeleteNutrition, getListNutritionQueryKey, getGetDashboardStatsQueryKey, useGetWeeklyStats } from "@fitness/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Utensils, Plus, Trash2, ChevronLeft, ChevronRight as ChevronRightIcon } from "lucide-react";
import { format, addDays, subDays, isToday, parseISO } from "date-fns";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { AppLayout } from "@/components/layout";
import { PageTransition, StaggerList, StaggerItem } from "@/components/page-transition";

const nutritionSchema = z.object({
  foodName: z.string().min(1, "Name required").max(100),
  calories: z.coerce.number().min(0).max(5000),
  protein: z.coerce.number().min(0).max(500).optional(),
  carbs: z.coerce.number().min(0).max(500).optional(),
  fat: z.coerce.number().min(0).max(500).optional(),
  date: z.string(),
});

type NutritionValues = z.infer<typeof nutritionSchema>;

const CALORIE_TARGET = 2000;
const PROTEIN_TARGET = 150;
const CARBS_TARGET = 250;
const FAT_TARGET = 65;

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border/50 px-4 py-3 rounded-xl shadow-2xl">
      <p className="text-xs font-semibold text-muted-foreground mb-2">
        {(() => { try { return format(parseISO(label), "MMM d"); } catch { return label; } })()}
      </p>
      {payload.map((entry: any, i: number) => (
        <div key={i} className="flex items-center justify-between gap-4 text-sm mb-1 last:mb-0">
          <div className="flex items-center gap-2.5">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-muted-foreground text-xs">{entry.name}:</span>
          </div>
          <span className="font-bold text-xs">{entry.value}g</span>
        </div>
      ))}
    </div>
  );
};

const formatDate = (d: string) => { try { return format(parseISO(d), "MMM d"); } catch { return d; } };

function MacroChip({ label, value, target, textColor, bgColor }: { label: string; value: number; target: number; textColor: string; bgColor: string }) {
  const pct = Math.min(100, (value / target) * 100);
  return (
    <div className="flex-1 bg-card/30 border border-border/30 rounded-xl p-3">
      <div className="flex justify-between items-baseline mb-2">
        <span className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">{label}</span>
        <span className={`text-xs font-bold ${textColor}`}>{Math.round(value)}g</span>
      </div>
      <div className="h-1.5 rounded-full bg-muted/30 overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ease-out ${bgColor}`} style={{ width: `${pct}%` }} />
      </div>
      <div className="text-[10px] text-muted-foreground mt-1.5">{target}g target</div>
    </div>
  );
}

export function NutritionPage() {
  const today = format(new Date(), "yyyy-MM-dd");
  const [selectedDate, setSelectedDate] = useState(today);

  const { data: entries, isLoading } = useListNutrition({ date: selectedDate });
  const { data: weeklyStats, isLoading: weeklyLoading } = useGetWeeklyStats();
  const logNutrition = useLogNutrition();
  const deleteNutrition = useDeleteNutrition();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const form = useForm<NutritionValues>({
    resolver: zodResolver(nutritionSchema),
    defaultValues: { foodName: "", calories: 0, protein: 0, carbs: 0, fat: 0, date: today },
  });

  const onSubmit = (data: NutritionValues) => {
    logNutrition.mutate(
      { data: { ...data, date: selectedDate } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListNutritionQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetDashboardStatsQueryKey() });
          toast({ title: "Meal logged!" });
          setIsDialogOpen(false);
          form.reset({ foodName: "", calories: 0, protein: 0, carbs: 0, fat: 0, date: today });
        },
        onError: () => {
          toast({ variant: "destructive", title: "Failed to log meal" });
        },
      }
    );
  };

  const handleDelete = (id: number) => {
    if (confirm("Delete this entry?")) {
      deleteNutrition.mutate(
        { id },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getListNutritionQueryKey() });
            queryClient.invalidateQueries({ queryKey: getGetDashboardStatsQueryKey() });
            toast({ title: "Entry deleted" });
          },
        }
      );
    }
  };

  const totals = entries?.reduce(
    (acc, e) => ({ calories: acc.calories + e.calories, protein: acc.protein + (e.protein ?? 0), carbs: acc.carbs + (e.carbs ?? 0), fat: acc.fat + (e.fat ?? 0) }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  ) ?? { calories: 0, protein: 0, carbs: 0, fat: 0 };

  const caloriePct = Math.min(100, (totals.calories / CALORIE_TARGET) * 100);
  const parsedDate = new Date(selectedDate + "T12:00:00");

  return (
    <AppLayout>
      <PageTransition>
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Nutrition</h1>
              <p className="text-sm text-muted-foreground mt-0.5">Track your fuel and macros.</p>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90 shrink-0">
                  <Plus className="mr-2 h-4 w-4" /> Add Food
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[420px] bg-card border-border/40">
                <DialogHeader>
                  <DialogTitle className="text-lg font-bold">Log Food</DialogTitle>
                  <DialogDescription className="text-sm text-muted-foreground">Add a new entry to your nutrition log.</DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">
                    <FormField control={form.control} name="foodName" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Food Name</FormLabel>
                        <FormControl><Input placeholder="e.g. Chicken breast, rice" className="bg-background/60 border-border/40" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="calories" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Calories (kcal)</FormLabel>
                        <FormControl><Input type="number" className="bg-background/60 border-border/40" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <div className="grid grid-cols-3 gap-3">
                      {(["protein", "carbs", "fat"] as const).map(macro => (
                        <FormField key={macro} control={form.control} name={macro} render={({ field }) => (
                          <FormItem>
                            <FormLabel className="capitalize text-xs">{macro} (g)</FormLabel>
                            <FormControl><Input type="number" className="bg-background/60 border-border/40" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                      ))}
                    </div>
                    <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90" disabled={logNutrition.isPending}>
                      {logNutrition.isPending ? "Saving..." : "Save Entry"}
                    </Button>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="flex items-center gap-2 bg-card/20 border border-border/30 rounded-xl px-4 py-2.5 w-fit">
            <button
              className="h-7 w-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
              onClick={() => setSelectedDate(format(subDays(parsedDate, 1), "yyyy-MM-dd"))}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm font-medium px-1 min-w-[140px] text-center">
              {isToday(parsedDate) ? "Today" : format(parsedDate, "EEEE, MMM d")}
            </span>
            <button
              className="h-7 w-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors disabled:opacity-30"
              onClick={() => setSelectedDate(format(addDays(parsedDate, 1), "yyyy-MM-dd"))}
              disabled={isToday(parsedDate)}
            >
              <ChevronRightIcon className="h-4 w-4" />
            </button>
          </div>

          <div className="bg-card/20 border border-border/30 rounded-2xl p-5">
            <div className="flex items-center gap-6 mb-5">
              <div className="relative w-24 h-24 shrink-0">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="40" fill="transparent" stroke="currentColor" strokeWidth="8" className="text-muted/20" />
                  <motion.circle
                    key={totals.calories}
                    cx="50" cy="50" r="40"
                    fill="transparent"
                    stroke="currentColor"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray="251.2"
                    initial={{ strokeDashoffset: 251.2 }}
                    animate={{ strokeDashoffset: 251.2 - (caloriePct / 100) * 251.2 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="text-primary"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xl font-bold leading-none">{totals.calories}</span>
                  <span className="text-[9px] text-muted-foreground uppercase tracking-wider">kcal</span>
                </div>
              </div>
              <div className="flex-1 space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Daily Target</span>
                  <span className="font-semibold">{CALORIE_TARGET} kcal</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Consumed</span>
                  <span className="font-semibold text-primary">{totals.calories} kcal</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Remaining</span>
                  <span className={`font-semibold ${totals.calories > CALORIE_TARGET ? "text-rose-400" : "text-muted-foreground"}`}>
                    {Math.max(0, CALORIE_TARGET - totals.calories)} kcal
                  </span>
                </div>
              </div>
            </div>
            <div className="flex gap-2.5">
              <MacroChip label="Protein" value={totals.protein} target={PROTEIN_TARGET} textColor="text-blue-400" bgColor="bg-blue-400" />
              <MacroChip label="Carbs" value={totals.carbs} target={CARBS_TARGET} textColor="text-amber-400" bgColor="bg-amber-400" />
              <MacroChip label="Fat" value={totals.fat} target={FAT_TARGET} textColor="text-rose-400" bgColor="bg-rose-400" />
            </div>
          </div>

          <Card className="bg-card/20 border-border/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-bold">Macro Trends</CardTitle>
              <CardDescription className="text-xs">Protein, carbs, and fat over the last 7 days</CardDescription>
            </CardHeader>
            <CardContent className="h-64 pt-2">
              {weeklyLoading ? (
                <Skeleton className="w-full h-full rounded-xl" />
              ) : !weeklyStats || weeklyStats.length === 0 ? (
                <div className="h-full flex items-center justify-center text-sm text-muted-foreground">No data yet</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyStats} margin={{ top: 4, right: 4, left: -24, bottom: 0 }} barGap={2}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} opacity={0.5} />
                    <XAxis dataKey="date" tickFormatter={formatDate} stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} dy={8} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: "hsl(var(--muted)/0.08)" }} />
                    <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: "11px", paddingTop: 8 }} />
                    <Bar dataKey="protein" name="Protein" fill="#60a5fa" radius={[3, 3, 0, 0]} maxBarSize={20} />
                    <Bar dataKey="carbs" name="Carbs" fill="#fbbf24" radius={[3, 3, 0, 0]} maxBarSize={20} />
                    <Bar dataKey="fat" name="Fat" fill="#fb7185" radius={[3, 3, 0, 0]} maxBarSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <div>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Food Log</h2>
            {isLoading ? (
              <div className="space-y-2.5">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
              </div>
            ) : !entries || entries.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground border border-dashed border-border/30 rounded-2xl">
                <Utensils className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No food logged {isToday(parsedDate) ? "today" : "for this day"}.</p>
              </div>
            ) : (
              <StaggerList className="space-y-2">
                {entries.map(entry => (
                  <StaggerItem key={entry.id}>
                    <div className="group flex items-center gap-4 px-4 py-3.5 rounded-xl bg-card/30 border border-border/25 hover:border-primary/20 hover:bg-card/50 transition-colors">
                      <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                        <Utensils className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm truncate">{entry.foodName}</h4>
                        <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-0.5">
                          {entry.protein != null && <span><span className="text-blue-400 font-semibold">{entry.protein}g</span> protein</span>}
                          {entry.carbs != null && <span><span className="text-amber-400 font-semibold">{entry.carbs}g</span> carbs</span>}
                          {entry.fat != null && <span><span className="text-rose-400 font-semibold">{entry.fat}g</span> fat</span>}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-bold text-sm">{entry.calories}</div>
                        <div className="text-[10px] text-muted-foreground uppercase tracking-wider">kcal</div>
                      </div>
                      <button
                        className="h-7 w-7 flex items-center justify-center rounded-lg text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-all"
                        onClick={() => handleDelete(entry.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </StaggerItem>
                ))}
              </StaggerList>
            )}
          </div>
        </div>
      </PageTransition>
    </AppLayout>
  );
}

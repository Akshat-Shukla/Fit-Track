import { useState } from "react";
import { useGetWeeklyStats, useGetWeightHistory, useLogWeight, getGetWeightHistoryQueryKey, getGetDashboardStatsQueryKey } from "@fitness/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { format, parseISO } from "date-fns";
import { Scale, Plus, TrendingDown, TrendingUp, Minus, Activity, Flame } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { AppLayout } from "@/components/layout";
import { PageTransition, StaggerList, StaggerItem } from "@/components/page-transition";

const weightSchema = z.object({
  weightKg: z.coerce.number().min(30, "Too low").max(300, "Too high"),
  date: z.string(),
});

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border/50 px-4 py-3 rounded-xl shadow-2xl">
        <p className="text-xs font-semibold text-muted-foreground mb-2">
          {(() => { try { return format(parseISO(label), "MMM d"); } catch { return label; } })()}
        </p>
        {payload.map((entry: any, i: number) => (
          <div key={i} className="flex items-center gap-2.5 text-sm">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-muted-foreground text-xs">{entry.name}:</span>
            <span className="font-bold text-xs">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const formatDate = (d: string) => { try { return format(parseISO(d), "MMM d"); } catch { return d; } };

export function ProgressPage() {
  const { data: weeklyStats, isLoading: weeklyLoading } = useGetWeeklyStats();
  const { data: weightHistory, isLoading: weightLoading } = useGetWeightHistory();
  const logWeight = useLogWeight();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const form = useForm<z.infer<typeof weightSchema>>({
    resolver: zodResolver(weightSchema),
    defaultValues: { weightKg: 75, date: format(new Date(), "yyyy-MM-dd") },
  });

  const onSubmit = (data: z.infer<typeof weightSchema>) => {
    logWeight.mutate(
      { data },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetWeightHistoryQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetDashboardStatsQueryKey() });
          toast({ title: "Weight logged!" });
          setIsDialogOpen(false);
          form.reset({ weightKg: 75, date: format(new Date(), "yyyy-MM-dd") });
        },
        onError: () => {
          toast({ variant: "destructive", title: "Failed to log weight" });
        },
      }
    );
  };

  // Weight trend stats
  const weightChange = weightHistory && weightHistory.length >= 2
    ? +(weightHistory[weightHistory.length - 1].weightKg - weightHistory[0].weightKg).toFixed(1)
    : null;

  const totalWorkoutsWeek = weeklyStats?.reduce((s, d) => s + (d.workoutCount ?? 0), 0) ?? 0;
  const totalCaloriesWeek = weeklyStats?.reduce((s, d) => s + (d.caloriesBurned ?? 0), 0) ?? 0;

  return (
    <AppLayout>
      <PageTransition>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Progress</h1>
              <p className="text-sm text-muted-foreground mt-0.5">Visualize your journey and performance trends.</p>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="border-border/40 bg-card/30 hover:bg-card/60 shrink-0">
                  <Scale className="mr-2 h-4 w-4 text-primary" /> Log Weight
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[380px] bg-card border-border/40">
                <DialogHeader>
                  <DialogTitle className="text-lg font-bold">Log Weight</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">
                    <FormField control={form.control} name="weightKg" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Weight (kg)</FormLabel>
                        <FormControl><Input type="number" step="0.1" className="bg-background/60 border-border/40" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="date" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date</FormLabel>
                        <FormControl><Input type="date" className="bg-background/60 border-border/40" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90" disabled={logWeight.isPending}>
                      {logWeight.isPending ? "Saving..." : "Save"}
                    </Button>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Weekly summary chips */}
          <StaggerList className="grid grid-cols-3 gap-3">
            {[
              { label: "Workouts This Week", value: totalWorkoutsWeek, icon: Activity, color: "text-primary" },
              { label: "Calories Burned", value: `${totalCaloriesWeek.toLocaleString()} kcal`, icon: Flame, color: "text-rose-400" },
              {
                label: "Weight Trend",
                value: weightChange == null ? "—" : `${weightChange > 0 ? "+" : ""}${weightChange} kg`,
                icon: weightChange == null ? Minus : weightChange < 0 ? TrendingDown : TrendingUp,
                color: weightChange == null ? "text-muted-foreground" : weightChange < 0 ? "text-primary" : "text-rose-400"
              },
            ].map((s) => (
              <StaggerItem key={s.label}>
                <div className="bg-card/30 border border-border/30 rounded-xl px-4 py-3 flex items-center gap-3">
                  <s.icon className={`h-5 w-5 ${s.color} shrink-0`} />
                  <div>
                    <div className={`font-bold text-lg leading-none ${s.color}`}>{s.value}</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">{s.label}</div>
                  </div>
                </div>
              </StaggerItem>
            ))}
          </StaggerList>

          {/* Charts */}
          <div className="space-y-5">
            {/* Weight Trend */}
            <Card className="bg-card/20 border-border/30">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-bold">Body Weight</CardTitle>
                    <CardDescription className="text-xs">Weight history over time</CardDescription>
                  </div>
                  {weightChange !== null && (
                    <div className={`flex items-center gap-1 text-sm font-semibold ${weightChange < 0 ? "text-primary" : "text-rose-400"}`}>
                      {weightChange < 0 ? <TrendingDown className="h-4 w-4" /> : <TrendingUp className="h-4 w-4" />}
                      {weightChange > 0 ? "+" : ""}{weightChange} kg
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="h-56 pt-2">
                {weightLoading ? (
                  <Skeleton className="w-full h-full rounded-xl" />
                ) : !weightHistory || weightHistory.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-2">
                    <Scale className="h-8 w-8 opacity-20" />
                    <p className="text-sm">No weight data yet — log your first entry.</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={weightHistory} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                      <defs>
                        <linearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} opacity={0.5} />
                      <XAxis dataKey="date" tickFormatter={formatDate} stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} dy={8} />
                      <YAxis domain={["auto", "auto"]} stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area type="monotone" dataKey="weightKg" name="Weight (kg)" stroke="hsl(var(--primary))" strokeWidth={2.5} fill="url(#weightGrad)" dot={{ r: 3.5, fill: "hsl(var(--primary))", strokeWidth: 0 }} activeDot={{ r: 5, fill: "hsl(var(--background))", stroke: "hsl(var(--primary))", strokeWidth: 2 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Caloric Balance */}
              <Card className="bg-card/20 border-border/30">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-bold">Caloric Balance</CardTitle>
                  <CardDescription className="text-xs">Consumed vs burned (7 days)</CardDescription>
                </CardHeader>
                <CardContent className="h-52 pt-2">
                  {weeklyLoading ? (
                    <Skeleton className="w-full h-full rounded-xl" />
                  ) : !weeklyStats || weeklyStats.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-sm text-muted-foreground">No data yet</div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={weeklyStats} margin={{ top: 4, right: 4, left: -24, bottom: 0 }} barGap={3}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} opacity={0.5} />
                        <XAxis dataKey="date" tickFormatter={formatDate} stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} dy={8} />
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: "hsl(var(--muted)/0.08)" }} />
                        <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: "11px", paddingTop: 8 }} />
                        <Bar dataKey="caloriesConsumed" name="Consumed" fill="hsl(var(--chart-2))" radius={[3, 3, 0, 0]} maxBarSize={28} />
                        <Bar dataKey="caloriesBurned" name="Burned" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} maxBarSize={28} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              {/* Active Minutes */}
              <Card className="bg-card/20 border-border/30">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-bold">Active Minutes</CardTitle>
                  <CardDescription className="text-xs">Workout duration per day</CardDescription>
                </CardHeader>
                <CardContent className="h-52 pt-2">
                  {weeklyLoading ? (
                    <Skeleton className="w-full h-full rounded-xl" />
                  ) : !weeklyStats || weeklyStats.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-sm text-muted-foreground">No data yet</div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={weeklyStats} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} opacity={0.5} />
                        <XAxis dataKey="date" tickFormatter={formatDate} stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} dy={8} />
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: "hsl(var(--muted)/0.08)" }} />
                        <Bar dataKey="workoutMinutes" name="Minutes" fill="hsl(217 91% 60%)" radius={[3, 3, 0, 0]} maxBarSize={36} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </PageTransition>
    </AppLayout>
  );
}

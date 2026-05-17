import { useState } from "react";
import { useListWorkouts, useLogWorkout, useDeleteWorkout, getListWorkoutsQueryKey, getGetDashboardStatsQueryKey } from "@fitness/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Activity, Calendar, Clock, Plus, Trash2, Flame, Droplet, Dumbbell, Zap, Timer, TrendingUp } from "lucide-react";
import { format, parseISO } from "date-fns";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { AppLayout } from "@/components/layout";
import { PageTransition, StaggerList, StaggerItem } from "@/components/page-transition";

const workoutSchema = z.object({
  type: z.enum(["running", "cycling", "swimming", "weightlifting", "yoga", "hiit", "walking", "other"]),
  durationMinutes: z.coerce.number().min(1).max(1440),
  caloriesBurned: z.coerce.number().min(0).max(10000),
  date: z.string(),
  notes: z.string().optional(),
});

type WorkoutValues = z.infer<typeof workoutSchema>;

const WORKOUT_TYPES = [
  { value: "running", label: "Running", icon: Flame, color: "text-rose-400", bg: "bg-rose-500/10" },
  { value: "cycling", label: "Cycling", icon: Zap, color: "text-amber-400", bg: "bg-amber-500/10" },
  { value: "swimming", label: "Swimming", icon: Droplet, color: "text-blue-400", bg: "bg-blue-500/10" },
  { value: "weightlifting", label: "Weightlifting", icon: Dumbbell, color: "text-primary", bg: "bg-primary/10" },
  { value: "yoga", label: "Yoga", icon: Activity, color: "text-purple-400", bg: "bg-purple-500/10" },
  { value: "hiit", label: "HIIT", icon: Flame, color: "text-orange-400", bg: "bg-orange-500/10" },
  { value: "walking", label: "Walking", icon: Activity, color: "text-teal-400", bg: "bg-teal-500/10" },
  { value: "other", label: "Other", icon: TrendingUp, color: "text-muted-foreground", bg: "bg-muted/20" },
];

function getWorkoutMeta(type: string) {
  return WORKOUT_TYPES.find(w => w.value === type) ?? WORKOUT_TYPES[7];
}

const CaloriesTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border/50 px-4 py-3 rounded-xl shadow-2xl">
      <p className="text-xs font-semibold text-muted-foreground mb-1.5">
        {(() => { try { return format(parseISO(label), "MMM d"); } catch { return label; } })()}
      </p>
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-primary" />
        <span className="text-xs text-muted-foreground">Calories:</span>
        <span className="text-xs font-bold">{payload[0].value} kcal</span>
      </div>
    </div>
  );
};

export function WorkoutsPage() {
  const { data: workouts, isLoading } = useListWorkouts({ limit: 50 });
  const logWorkout = useLogWorkout();
  const deleteWorkout = useDeleteWorkout();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const form = useForm<WorkoutValues>({
    resolver: zodResolver(workoutSchema),
    defaultValues: {
      type: "running",
      durationMinutes: 30,
      caloriesBurned: 300,
      date: format(new Date(), "yyyy-MM-dd"),
      notes: "",
    },
  });

  const onSubmit = (data: WorkoutValues) => {
    logWorkout.mutate(
      { data: { ...data, type: data.type as any } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListWorkoutsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetDashboardStatsQueryKey() });
          toast({ title: "Workout logged!" });
          setIsDialogOpen(false);
          form.reset({ type: "running", durationMinutes: 30, caloriesBurned: 300, date: format(new Date(), "yyyy-MM-dd"), notes: "" });
        },
        onError: () => {
          toast({ variant: "destructive", title: "Failed to log workout" });
        },
      }
    );
  };

  const handleDelete = (id: number) => {
    if (confirm("Delete this workout?")) {
      deleteWorkout.mutate(
        { id },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getListWorkoutsQueryKey() });
            queryClient.invalidateQueries({ queryKey: getGetDashboardStatsQueryKey() });
            toast({ title: "Workout deleted" });
          },
        }
      );
    }
  };

  const totalCalories = workouts?.reduce((s, w) => s + w.caloriesBurned, 0) ?? 0;
  const totalMinutes = workouts?.reduce((s, w) => s + w.durationMinutes, 0) ?? 0;

  const caloriesChartData = workouts
    ? Object.entries(
        workouts.reduce<Record<string, number>>((acc, w) => {
          acc[w.date] = (acc[w.date] ?? 0) + w.caloriesBurned;
          return acc;
        }, {})
      )
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, calories]) => ({ date, calories }))
    : [];

  return (
    <AppLayout>
      <PageTransition>
        <div className="space-y-7">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Workouts</h1>
              <p className="text-sm text-muted-foreground mt-0.5">Track and manage your training sessions.</p>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90 shrink-0">
                  <Plus className="mr-2 h-4 w-4" /> Log Session
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[420px] bg-card border-border/40">
                <DialogHeader>
                  <DialogTitle className="text-lg font-bold">Log a Workout</DialogTitle>
                  <DialogDescription className="text-sm text-muted-foreground">Add a new session to your training history.</DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">
                    <FormField control={form.control} name="type" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Activity Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-background/60 border-border/40">
                              <SelectValue placeholder="Select activity" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-card border-border/40">
                            {WORKOUT_TYPES.map(wt => (
                              <SelectItem key={wt.value} value={wt.value}>
                                <div className="flex items-center gap-2">
                                  <wt.icon className={`h-4 w-4 ${wt.color}`} />
                                  {wt.label}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <div className="grid grid-cols-2 gap-3">
                      <FormField control={form.control} name="durationMinutes" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Duration (min)</FormLabel>
                          <FormControl><Input type="number" className="bg-background/60 border-border/40" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="caloriesBurned" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Calories</FormLabel>
                          <FormControl><Input type="number" className="bg-background/60 border-border/40" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>
                    <FormField control={form.control} name="date" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date</FormLabel>
                        <FormControl><Input type="date" className="bg-background/60 border-border/40" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="notes" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes <span className="text-muted-foreground">(optional)</span></FormLabel>
                        <FormControl><Textarea className="bg-background/60 border-border/40 resize-none h-20" placeholder="How did it feel?" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90" disabled={logWorkout.isPending}>
                      {logWorkout.isPending ? "Saving..." : "Save Workout"}
                    </Button>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          {!isLoading && workouts && workouts.length > 0 && (
            <>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Total Sessions", value: workouts.length, icon: Activity, color: "text-primary" },
                  { label: "Total Minutes", value: totalMinutes, icon: Timer, color: "text-blue-400" },
                  { label: "Calories Burned", value: totalCalories.toLocaleString(), icon: Flame, color: "text-rose-400" },
                ].map(stat => (
                  <div key={stat.label} className="bg-card/30 border border-border/30 rounded-xl px-4 py-3 flex items-center gap-3">
                    <stat.icon className={`h-5 w-5 ${stat.color} shrink-0`} />
                    <div>
                      <div className="font-bold text-lg leading-none">{stat.value}</div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">{stat.label}</div>
                    </div>
                  </div>
                ))}
              </div>

              <Card className="bg-card/20 border-border/30">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-bold">Calories Burned Over Time</CardTitle>
                  <CardDescription className="text-xs">Total calories burned per training day</CardDescription>
                </CardHeader>
                <CardContent className="h-56 pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={caloriesChartData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                      <defs>
                        <linearGradient id="caloriesGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} opacity={0.5} />
                      <XAxis
                        dataKey="date"
                        tickFormatter={d => { try { return format(parseISO(d), "MMM d"); } catch { return d; } }}
                        stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} dy={8}
                      />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                      <Tooltip content={<CaloriesTooltip />} />
                      <Area
                        type="monotone" dataKey="calories" name="Calories"
                        stroke="hsl(var(--primary))" strokeWidth={2.5}
                        fill="url(#caloriesGrad)"
                        dot={{ r: 3.5, fill: "hsl(var(--primary))", strokeWidth: 0 }}
                        activeDot={{ r: 5, fill: "hsl(var(--background))", stroke: "hsl(var(--primary))", strokeWidth: 2 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </>
          )}

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-[88px] w-full rounded-xl" />)}
            </div>
          ) : !workouts || workouts.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground border border-dashed border-border/30 rounded-2xl bg-card/10">
              <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Dumbbell className="h-7 w-7 text-primary" />
              </div>
              <h3 className="text-base font-semibold text-foreground mb-1">No workouts yet</h3>
              <p className="text-sm max-w-xs mx-auto">Log your first session to start tracking progress.</p>
            </div>
          ) : (
            <StaggerList className="space-y-2.5">
              {workouts.map(workout => {
                const meta = getWorkoutMeta(workout.type);
                return (
                  <StaggerItem key={workout.id}>
                    <div className="group relative flex items-center gap-4 px-5 py-4 rounded-xl bg-card/30 border border-border/30 hover:border-primary/20 hover:bg-card/50 transition-colors cursor-default">
                      <div className={`h-11 w-11 rounded-xl ${meta.bg} flex items-center justify-center shrink-0`}>
                        <meta.icon className={`h-5 w-5 ${meta.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold capitalize text-sm">{workout.type.replace("_", " ")}</h3>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                          <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{format(new Date(workout.date), "MMM d, yyyy")}</span>
                          <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{workout.durationMinutes} min</span>
                        </div>
                        {workout.notes && (
                          <p className="text-xs text-muted-foreground/70 italic mt-1 truncate">"{workout.notes}"</p>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <div className={`font-bold text-base ${meta.color}`}>{workout.caloriesBurned}</div>
                        <div className="text-[10px] text-muted-foreground uppercase tracking-wider">kcal</div>
                      </div>
                      <button
                        className="absolute right-3 top-3 h-7 w-7 flex items-center justify-center rounded-lg text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-all"
                        onClick={() => handleDelete(workout.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </StaggerItem>
                );
              })}
            </StaggerList>
          )}
        </div>
      </PageTransition>
    </AppLayout>
  );
}

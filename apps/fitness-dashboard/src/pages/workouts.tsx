import { useState } from "react";
import { useListWorkouts, useLogWorkout, useDeleteWorkout, getListWorkoutsQueryKey, getGetDashboardStatsQueryKey } from "@fitness/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Activity, Calendar, Clock, Plus, Trash2, Flame, Droplet, Dumbbell, Zap } from "lucide-react";
import { format } from "date-fns";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

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

const workoutSchema = z.object({
  type: z.enum(["running", "cycling", "swimming", "weightlifting", "yoga", "hiit", "walking", "other"]),
  durationMinutes: z.coerce.number().min(1).max(1440),
  caloriesBurned: z.coerce.number().min(0).max(10000),
  date: z.string(),
  notes: z.string().optional(),
});

type WorkoutValues = z.infer<typeof workoutSchema>;

const WORKOUT_TYPES = [
  { value: "running", label: "Running", icon: Flame },
  { value: "cycling", label: "Cycling", icon: Zap },
  { value: "swimming", label: "Swimming", icon: Droplet },
  { value: "weightlifting", label: "Weightlifting", icon: Dumbbell },
  { value: "yoga", label: "Yoga", icon: Activity },
  { value: "hiit", label: "HIIT", icon: Flame },
  { value: "walking", label: "Walking", icon: Activity },
  { value: "other", label: "Other", icon: Activity },
];

export function WorkoutsPage() {
  const { data: workouts, isLoading } = useListWorkouts();
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
          toast({ title: "Workout logged successfully" });
          setIsDialogOpen(false);
          form.reset({
            type: "running",
            durationMinutes: 30,
            caloriesBurned: 300,
            date: format(new Date(), "yyyy-MM-dd"),
            notes: "",
          });
        },
        onError: () => {
          toast({ variant: "destructive", title: "Failed to log workout" });
        },
      }
    );
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this workout?")) {
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

  const getIconForType = (type: string) => {
    const wt = WORKOUT_TYPES.find(w => w.value === type);
    const Icon = wt?.icon || Activity;
    return <Icon className="h-5 w-5" />;
  };

  return (
    <AppLayout>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Workouts</h1>
            <p className="text-muted-foreground mt-1">Track and manage your training sessions.</p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90 w-full sm:w-auto">
                <Plus className="mr-2 h-4 w-4" /> Log Session
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-card border-border/40">
              <DialogHeader>
                <DialogTitle>Log a Workout</DialogTitle>
                <DialogDescription>Add a new session to your training history.</DialogDescription>
              </DialogHeader>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Activity Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-background/50 border-border/40">
                              <SelectValue placeholder="Select activity" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {WORKOUT_TYPES.map(wt => (
                              <SelectItem key={wt.value} value={wt.value}>
                                <div className="flex items-center gap-2">
                                  <wt.icon className="h-4 w-4 text-muted-foreground" />
                                  {wt.label}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="durationMinutes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Duration (min)</FormLabel>
                          <FormControl>
                            <Input type="number" className="bg-background/50 border-border/40" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="caloriesBurned"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Calories (kcal)</FormLabel>
                          <FormControl>
                            <Input type="number" className="bg-background/50 border-border/40" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date</FormLabel>
                        <FormControl>
                          <Input type="date" className="bg-background/50 border-border/40" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes (Optional)</FormLabel>
                        <FormControl>
                          <Textarea className="bg-background/50 border-border/40 resize-none" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90 mt-4" disabled={logWorkout.isPending}>
                    {logWorkout.isPending ? "Saving..." : "Save Workout"}
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
          </div>
        ) : !workouts || workouts.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground border border-dashed border-border/40 rounded-xl bg-card/20">
            <Activity className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <h3 className="text-lg font-medium mb-1 text-foreground">No workouts logged yet</h3>
            <p className="max-w-md mx-auto">Your training history will appear here once you start logging your sessions.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {workouts.map(workout => (
              <Card key={workout.id} className="bg-card/30 border-border/40 backdrop-blur-sm group overflow-hidden relative hover:border-primary/30 transition-colors">
                <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
                <CardContent className="p-5">
                  <div className="flex justify-between items-start">
                    <div className="flex items-start gap-4">
                      <div className="h-12 w-12 rounded-xl bg-background border border-border/50 flex items-center justify-center text-primary shadow-inner">
                        {getIconForType(workout.type)}
                      </div>
                      <div>
                        <h3 className="font-bold text-lg capitalize">{workout.type}</h3>
                        <div className="flex items-center text-sm text-muted-foreground gap-4 mt-1">
                          <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> {format(new Date(workout.date), "MMM d, yyyy")}</span>
                          <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> {workout.durationMinutes} min</span>
                        </div>
                        {workout.notes && (
                          <p className="text-sm mt-3 text-muted-foreground/80 italic">"{workout.notes}"</p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end justify-between h-full">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 -mt-2 -mr-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleDelete(workout.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <div className="text-right mt-2">
                        <div className="font-bold text-xl text-green-500">{workout.caloriesBurned}</div>
                        <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">kcal</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}

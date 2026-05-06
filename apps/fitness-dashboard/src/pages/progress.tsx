import { useState } from "react";
import { useGetWeeklyStats, useGetWeightHistory, useLogWeight, getGetWeightHistoryQueryKey } from "@fitness/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { format, parseISO } from "date-fns";
import { Scale, Plus, Target, TrendingDown } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { AppLayout } from "@/components/layout";

const weightSchema = z.object({
  weightKg: z.coerce.number().min(30).max(300),
  date: z.string(),
});

export function ProgressPage() {
  const { data: weeklyStats, isLoading: weeklyLoading } = useGetWeeklyStats();
  const { data: weightHistory, isLoading: weightLoading } = useGetWeightHistory();
  const logWeight = useLogWeight();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const form = useForm<z.infer<typeof weightSchema>>({
    resolver: zodResolver(weightSchema),
    defaultValues: {
      weightKg: 75,
      date: format(new Date(), "yyyy-MM-dd"),
    },
  });

  const onSubmit = (data: z.infer<typeof weightSchema>) => {
    logWeight.mutate(
      { data },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetWeightHistoryQueryKey() });
          toast({ title: "Weight logged successfully" });
          setIsDialogOpen(false);
        },
        onError: () => {
          toast({ variant: "destructive", title: "Failed to log weight" });
        },
      }
    );
  };

  // Format data for charts
  const formatXAxisDate = (dateStr: string) => {
    try {
      return format(parseISO(dateStr), "MMM d");
    } catch (e) {
      return dateStr;
    }
  };

  // Custom tooltips
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border/50 p-3 rounded-lg shadow-xl">
          <p className="text-sm font-medium mb-2">{formatXAxisDate(label)}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="text-muted-foreground">{entry.name}:</span>
              <span className="font-bold">{entry.value}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <AppLayout>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Analytics & Progress</h1>
            <p className="text-muted-foreground mt-1">Visualize your journey and performance metrics.</p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-card hover:bg-card/80 text-foreground border border-border/40">
                <Scale className="mr-2 h-4 w-4 text-primary" /> Log Weight
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-card border-border/40">
              <DialogHeader>
                <DialogTitle>Log Weight</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                  <FormField
                    control={form.control}
                    name="weightKg"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Weight (kg)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.1" className="bg-background/50 border-border/40" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
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
                  <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90 mt-4" disabled={logWeight.isPending}>
                    {logWeight.isPending ? "Saving..." : "Save"}
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Weight Trend */}
          <Card className="bg-card/30 border-border/40 backdrop-blur-sm lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle>Body Weight Trend</CardTitle>
                <CardDescription>Your weight history over time</CardDescription>
              </div>
              <TrendingDown className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent className="h-[300px] mt-4">
              {weightLoading ? (
                <Skeleton className="w-full h-full" />
              ) : !weightHistory || weightHistory.length === 0 ? (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  No weight data available.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={weightHistory} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={formatXAxisDate} 
                      stroke="hsl(var(--muted-foreground))" 
                      fontSize={12} 
                      tickLine={false} 
                      axisLine={false}
                      dy={10}
                    />
                    <YAxis 
                      domain={['auto', 'auto']} 
                      stroke="hsl(var(--muted-foreground))" 
                      fontSize={12} 
                      tickLine={false} 
                      axisLine={false}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Line 
                      type="monotone" 
                      dataKey="weightKg" 
                      name="Weight (kg)"
                      stroke="hsl(var(--primary))" 
                      strokeWidth={3}
                      dot={{ r: 4, fill: "hsl(var(--primary))", strokeWidth: 0 }}
                      activeDot={{ r: 6, fill: "hsl(var(--background))", stroke: "hsl(var(--primary))", strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Calories In vs Out */}
          <Card className="bg-card/30 border-border/40 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Caloric Balance</CardTitle>
              <CardDescription>Consumed vs Burned (7 days)</CardDescription>
            </CardHeader>
            <CardContent className="h-[250px] mt-2">
              {weeklyLoading ? (
                <Skeleton className="w-full h-full" />
              ) : !weeklyStats || weeklyStats.length === 0 ? (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  No data available.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyStats} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={formatXAxisDate} 
                      stroke="hsl(var(--muted-foreground))" 
                      fontSize={12} 
                      tickLine={false} 
                      axisLine={false}
                      dy={10}
                    />
                    <YAxis 
                      stroke="hsl(var(--muted-foreground))" 
                      fontSize={12} 
                      tickLine={false} 
                      axisLine={false}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted)/0.1)' }} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                    <Bar dataKey="caloriesConsumed" name="Consumed" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} maxBarSize={40} />
                    <Bar dataKey="caloriesBurned" name="Burned" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Workout Minutes */}
          <Card className="bg-card/30 border-border/40 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Active Minutes</CardTitle>
              <CardDescription>Duration of workouts (7 days)</CardDescription>
            </CardHeader>
            <CardContent className="h-[250px] mt-2">
              {weeklyLoading ? (
                <Skeleton className="w-full h-full" />
              ) : !weeklyStats || weeklyStats.length === 0 ? (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  No data available.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyStats} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={formatXAxisDate} 
                      stroke="hsl(var(--muted-foreground))" 
                      fontSize={12} 
                      tickLine={false} 
                      axisLine={false}
                      dy={10}
                    />
                    <YAxis 
                      stroke="hsl(var(--muted-foreground))" 
                      fontSize={12} 
                      tickLine={false} 
                      axisLine={false}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted)/0.1)' }} />
                    <Bar dataKey="workoutMinutes" name="Minutes" fill="hsl(var(--chart-4))" radius={[4, 4, 0, 0]} maxBarSize={50} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

        </div>
      </div>
    </AppLayout>
  );
}

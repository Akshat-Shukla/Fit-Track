import { useState } from "react";
import { useListNutrition, useLogNutrition, useDeleteNutrition, getListNutritionQueryKey, getGetDashboardStatsQueryKey } from "@fitness/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Coffee, Plus, Trash2, Calendar, Utensils } from "lucide-react";
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
import { useToast } from "@/hooks/use-toast";
import { AppLayout } from "@/components/layout";

const nutritionSchema = z.object({
  foodName: z.string().min(2, "Name too short").max(100),
  calories: z.coerce.number().min(0).max(5000),
  protein: z.coerce.number().min(0).max(500).optional(),
  carbs: z.coerce.number().min(0).max(500).optional(),
  fat: z.coerce.number().min(0).max(500).optional(),
  date: z.string(),
});

type NutritionValues = z.infer<typeof nutritionSchema>;

export function NutritionPage() {
  // Use today's date for filtering list by default
  const today = format(new Date(), "yyyy-MM-dd");
  const [selectedDate, setSelectedDate] = useState(today);
  
  const { data: entries, isLoading } = useListNutrition({ date: selectedDate });
  const logNutrition = useLogNutrition();
  const deleteNutrition = useDeleteNutrition();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const form = useForm<NutritionValues>({
    resolver: zodResolver(nutritionSchema),
    defaultValues: {
      foodName: "",
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      date: today,
    },
  });

  const onSubmit = (data: NutritionValues) => {
    logNutrition.mutate(
      { data },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListNutritionQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetDashboardStatsQueryKey() });
          toast({ title: "Meal logged successfully" });
          setIsDialogOpen(false);
          form.reset({
            foodName: "",
            calories: 0,
            protein: 0,
            carbs: 0,
            fat: 0,
            date: today,
          });
        },
        onError: () => {
          toast({ variant: "destructive", title: "Failed to log meal" });
        },
      }
    );
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this entry?")) {
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

  const totals = entries?.reduce((acc, entry) => ({
    calories: acc.calories + entry.calories,
    protein: acc.protein + (entry.protein || 0),
    carbs: acc.carbs + (entry.carbs || 0),
    fat: acc.fat + (entry.fat || 0),
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 }) || { calories: 0, protein: 0, carbs: 0, fat: 0 };

  return (
    <AppLayout>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Nutrition</h1>
            <p className="text-muted-foreground mt-1">Track your fuel and macros.</p>
          </div>
          
          <div className="flex items-center gap-3">
            <Input 
              type="date" 
              value={selectedDate} 
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-card/50 border-border/40 w-auto"
            />
            
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                  <Plus className="mr-2 h-4 w-4" /> Add Food
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px] bg-card border-border/40">
                <DialogHeader>
                  <DialogTitle>Log Food</DialogTitle>
                  <DialogDescription>Add a new entry to your nutrition log.</DialogDescription>
                </DialogHeader>
                
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                    <FormField
                      control={form.control}
                      name="foodName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Food Name</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. Oatmeal with berries" className="bg-background/50 border-border/40" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="calories"
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

                    <div className="grid grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="protein"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">Protein (g)</FormLabel>
                            <FormControl>
                              <Input type="number" className="bg-background/50 border-border/40" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="carbs"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">Carbs (g)</FormLabel>
                            <FormControl>
                              <Input type="number" className="bg-background/50 border-border/40" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="fat"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">Fat (g)</FormLabel>
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
                    
                    <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90 mt-4" disabled={logNutrition.isPending}>
                      {logNutrition.isPending ? "Saving..." : "Save Entry"}
                    </Button>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Macro Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-card/30 border-border/40 backdrop-blur-sm text-center py-4">
            <div className="text-3xl font-bold">{totals.calories}</div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Calories</p>
          </Card>
          <Card className="bg-card/30 border-border/40 backdrop-blur-sm text-center py-4">
            <div className="text-3xl font-bold text-blue-400">{totals.protein}g</div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Protein</p>
          </Card>
          <Card className="bg-card/30 border-border/40 backdrop-blur-sm text-center py-4">
            <div className="text-3xl font-bold text-green-400">{totals.carbs}g</div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Carbs</p>
          </Card>
          <Card className="bg-card/30 border-border/40 backdrop-blur-sm text-center py-4">
            <div className="text-3xl font-bold text-yellow-400">{totals.fat}g</div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Fat</p>
          </Card>
        </div>

        {/* Entries List */}
        <Card className="bg-card/30 border-border/40 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Daily Log</CardTitle>
            <CardDescription>{format(new Date(selectedDate), "EEEE, MMMM d, yyyy")}</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
              </div>
            ) : !entries || entries.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground border border-dashed border-border/40 rounded-lg">
                <Utensils className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No food logged for this day.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {entries.map(entry => (
                  <div key={entry.id} className="flex items-center justify-between p-4 rounded-xl bg-background/50 border border-border/30 hover:bg-white/5 transition-colors group">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-500">
                        <Coffee className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-base">{entry.foodName}</h4>
                        <div className="flex items-center text-xs text-muted-foreground gap-3 mt-1">
                          {entry.protein !== null && <span><span className="text-blue-400 font-medium">{entry.protein}g</span> P</span>}
                          {entry.carbs !== null && <span><span className="text-green-400 font-medium">{entry.carbs}g</span> C</span>}
                          {entry.fat !== null && <span><span className="text-yellow-400 font-medium">{entry.fat}g</span> F</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="font-bold text-lg">{entry.calories}</div>
                        <div className="text-[10px] text-muted-foreground uppercase tracking-widest">kcal</div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleDelete(entry.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}

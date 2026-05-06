import { useEffect } from "react";
import { useLocation } from "wouter";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useCreateProfile, getGetProfileQueryKey } from "@fitness/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useUser } from "@clerk/react";

import { Activity, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";

const onboardingSchema = z.object({
  age: z.coerce.number().min(10, "Must be at least 10").max(120, "Invalid age"),
  weightKg: z.coerce.number().min(30, "Must be at least 30kg").max(300, "Invalid weight"),
  heightCm: z.coerce.number().min(100, "Must be at least 100cm").max(250, "Invalid height"),
  fitnessGoal: z.enum(["lose_weight", "build_muscle", "improve_endurance", "stay_active"]),
});

type OnboardingValues = z.infer<typeof onboardingSchema>;

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

export function OnboardingPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useUser();
  
  const createProfile = useCreateProfile();

  const form = useForm<OnboardingValues>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      age: 30,
      weightKg: 75,
      heightCm: 175,
      fitnessGoal: "build_muscle",
    },
  });

  const onSubmit = (data: OnboardingValues) => {
    createProfile.mutate(
      {
        data: {
          ...data,
          name: user?.firstName || "Athlete",
          email: user?.emailAddresses[0]?.emailAddress || "athlete@example.com",
        },
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetProfileQueryKey() });
          toast({
            title: "Profile setup complete",
            description: "Welcome to FitTrack. Let's get to work.",
          });
          setLocation("/dashboard");
        },
        onError: (err) => {
          toast({
            variant: "destructive",
            title: "Error setting up profile",
            description: "Please try again later.",
          });
          console.error(err);
        },
      }
    );
  };

  return (
    <div className="min-h-[100dvh] bg-background text-foreground flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
      
      <Card className="w-full max-w-xl bg-card/50 backdrop-blur-xl border-border/40 shadow-2xl relative z-10">
        <CardHeader className="text-center space-y-4 pb-8">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
            <Activity className="h-7 w-7" />
          </div>
          <div>
            <CardTitle className="text-3xl font-bold tracking-tight">Configure Your Cockpit</CardTitle>
            <CardDescription className="text-base mt-2">
              We need a few details to calibrate your dashboard and metrics.
            </CardDescription>
          </div>
        </CardHeader>
        
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField
                  control={form.control}
                  name="age"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-muted-foreground font-medium uppercase tracking-wider text-xs">Age</FormLabel>
                      <FormControl>
                        <Input type="number" className="h-12 bg-background/50 border-border/40 text-lg" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="weightKg"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-muted-foreground font-medium uppercase tracking-wider text-xs">Weight (kg)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.1" className="h-12 bg-background/50 border-border/40 text-lg" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="heightCm"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-muted-foreground font-medium uppercase tracking-wider text-xs">Height (cm)</FormLabel>
                      <FormControl>
                        <Input type="number" className="h-12 bg-background/50 border-border/40 text-lg" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="fitnessGoal"
                render={({ field }) => (
                  <FormItem className="space-y-4 pt-4 border-t border-border/40">
                    <FormLabel className="text-muted-foreground font-medium uppercase tracking-wider text-xs">Primary Mission</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                      >
                        {[
                          { value: "lose_weight", label: "Lose Weight", desc: "Caloric deficit focus" },
                          { value: "build_muscle", label: "Build Muscle", desc: "Strength & hypertrophy" },
                          { value: "improve_endurance", label: "Endurance", desc: "Stamina & cardio" },
                          { value: "stay_active", label: "Stay Active", desc: "General health" },
                        ].map((goal) => (
                          <FormItem key={goal.value}>
                            <FormControl>
                              <RadioGroupItem value={goal.value} className="peer sr-only" />
                            </FormControl>
                            <FormLabel className="flex flex-col items-center justify-between rounded-xl border border-border/40 bg-background/30 p-4 hover:bg-white/5 hover:text-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10 peer-data-[state=checked]:text-primary cursor-pointer transition-all">
                              <span className="font-bold mb-1">{goal.label}</span>
                              <span className="text-xs opacity-70">{goal.desc}</span>
                            </FormLabel>
                          </FormItem>
                        ))}
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button 
                type="submit" 
                className="w-full h-14 mt-8 text-lg font-bold bg-primary hover:bg-primary/90 text-primary-foreground group"
                disabled={createProfile.isPending}
              >
                {createProfile.isPending ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <>
                    Initialize Dashboard
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

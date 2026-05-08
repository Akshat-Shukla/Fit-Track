import { useEffect } from "react";
import { useUser } from "@clerk/react";
import { useGetProfile, useUpdateProfile, getGetProfileQueryKey } from "@fitness/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { User, Save, Scale, Ruler, Calendar, Target, BadgeCheck } from "lucide-react";

import { AppLayout } from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { PageTransition } from "@/components/page-transition";

const settingsSchema = z.object({
  name: z.string().min(2, "At least 2 characters").max(80),
  age: z.coerce.number().min(10).max(120),
  weightKg: z.coerce.number().min(20).max(400),
  heightCm: z.coerce.number().min(50).max(280),
  fitnessGoal: z.enum(["lose_weight", "build_muscle", "improve_endurance", "stay_active"]),
});

type SettingsValues = z.infer<typeof settingsSchema>;

const goalOptions = [
  { value: "lose_weight", label: "Lose Weight" },
  { value: "build_muscle", label: "Build Muscle" },
  { value: "improve_endurance", label: "Improve Endurance" },
  { value: "stay_active", label: "Stay Active" },
];

function getBmiInfo(bmi: number) {
  if (bmi < 18.5) return { label: "Underweight", color: "text-blue-400", bg: "bg-blue-400/10" };
  if (bmi < 25) return { label: "Healthy", color: "text-primary", bg: "bg-primary/10" };
  if (bmi < 30) return { label: "Overweight", color: "text-amber-400", bg: "bg-amber-400/10" };
  return { label: "Obese", color: "text-rose-400", bg: "bg-rose-400/10" };
}

export function SettingsPage() {
  const { user } = useUser();
  const { data: profile, isLoading } = useGetProfile();
  const updateProfile = useUpdateProfile();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const form = useForm<SettingsValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: { name: "", age: 25, weightKg: 70, heightCm: 170, fitnessGoal: "stay_active" },
  });

  useEffect(() => {
    if (profile) {
      form.reset({
        name: profile.name,
        age: profile.age,
        weightKg: profile.weightKg,
        heightCm: profile.heightCm,
        fitnessGoal: profile.fitnessGoal as SettingsValues["fitnessGoal"],
      });
    }
  }, [profile, form]);

  const onSubmit = (data: SettingsValues) => {
    updateProfile.mutate(
      { data },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetProfileQueryKey() });
          toast({ title: "Profile updated!" });
        },
        onError: () => {
          toast({ variant: "destructive", title: "Failed to update profile" });
        },
      }
    );
  };

  const bmi = profile ? +(profile.weightKg / Math.pow(profile.heightCm / 100, 2)).toFixed(1) : null;
  const bmiInfo = bmi ? getBmiInfo(bmi) : null;

  return (
    <AppLayout>
      <PageTransition>
        <div className="space-y-6 max-w-xl">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Manage your profile and fitness details.</p>
          </div>

          {/* Account card */}
          <Card className="bg-card/20 border-border/30">
            <CardHeader className="pb-4">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <User className="h-4 w-4 text-primary" /> Account
              </CardTitle>
              <CardDescription className="text-xs">Your Clerk account details</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16 border-2 border-border/40">
                  <AvatarImage src={user?.imageUrl} />
                  <AvatarFallback className="bg-primary/15 text-primary text-xl font-bold">
                    {user?.firstName?.charAt(0) ?? user?.emailAddresses[0]?.emailAddress?.charAt(0) ?? "U"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="font-semibold">{user?.fullName || user?.firstName || "—"}</p>
                    {user?.emailAddresses[0]?.verification?.status === "verified" && (
                      <BadgeCheck className="h-4 w-4 text-primary" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{user?.emailAddresses[0]?.emailAddress}</p>
                  <p className="text-[11px] text-muted-foreground/60 mt-1.5">Avatar managed via your Clerk account</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* BMI card */}
          {bmi && bmiInfo && (
            <div className="bg-card/20 border border-border/30 rounded-xl px-5 py-4 flex items-center justify-between">
              <div>
                <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">Body Mass Index</p>
                <p className="text-3xl font-bold mt-0.5">{bmi}</p>
              </div>
              <div className="text-right">
                <span className={`inline-block px-3 py-1 rounded-lg text-xs font-bold ${bmiInfo.bg} ${bmiInfo.color}`}>
                  {bmiInfo.label}
                </span>
                <div className="text-xs text-muted-foreground mt-2 space-y-0.5">
                  <div>{profile?.heightCm} cm</div>
                  <div>{profile?.weightKg} kg</div>
                </div>
              </div>
            </div>
          )}

          {/* Fitness profile */}
          <Card className="bg-card/20 border-border/30">
            <CardHeader className="pb-4">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" /> Fitness Profile
              </CardTitle>
              <CardDescription className="text-xs">Update your physical stats and goal</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-10 w-full" />)}
                </div>
              ) : (
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                    <FormField control={form.control} name="name" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1.5 text-xs text-muted-foreground uppercase tracking-wider">
                          <User className="h-3 w-3" /> Display Name
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="Your name" className="bg-background/50 border-border/40" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <div className="grid grid-cols-3 gap-3">
                      <FormField control={form.control} name="age" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-1 text-xs text-muted-foreground uppercase tracking-wider">
                            <Calendar className="h-3 w-3" /> Age
                          </FormLabel>
                          <FormControl><Input type="number" className="bg-background/50 border-border/40" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="weightKg" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-1 text-xs text-muted-foreground uppercase tracking-wider">
                            <Scale className="h-3 w-3" /> Weight
                          </FormLabel>
                          <FormControl><Input type="number" step="0.1" className="bg-background/50 border-border/40" {...field} /></FormControl>
                          <FormDescription className="text-[10px]">kg</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="heightCm" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-1 text-xs text-muted-foreground uppercase tracking-wider">
                            <Ruler className="h-3 w-3" /> Height
                          </FormLabel>
                          <FormControl><Input type="number" step="0.5" className="bg-background/50 border-border/40" {...field} /></FormControl>
                          <FormDescription className="text-[10px]">cm</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>

                    <FormField control={form.control} name="fitnessGoal" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1.5 text-xs text-muted-foreground uppercase tracking-wider">
                          <Target className="h-3 w-3" /> Primary Goal
                        </FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-background/50 border-border/40">
                              <SelectValue placeholder="Select your goal" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-card border-border/40">
                            {goalOptions.map(o => (
                              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <Button
                      type="submit"
                      className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                      disabled={updateProfile.isPending}
                    >
                      <Save className="mr-2 h-4 w-4" />
                      {updateProfile.isPending ? "Saving..." : "Save Changes"}
                    </Button>
                  </form>
                </Form>
              )}
            </CardContent>
          </Card>
        </div>
      </PageTransition>
    </AppLayout>
  );
}

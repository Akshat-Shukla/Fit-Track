import { useEffect } from "react";
import { useUser } from "@clerk/react";
import { useGetProfile, useUpdateProfile, getGetProfileQueryKey } from "@fitness/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { User, Save, Scale, Ruler, Calendar, Target } from "lucide-react";

import { AppLayout } from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

const settingsSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(80),
  age: z.coerce.number().min(10, "Must be at least 10").max(120, "Must be at most 120"),
  weightKg: z.coerce.number().min(20, "Must be at least 20 kg").max(400, "Must be at most 400 kg"),
  heightCm: z.coerce.number().min(50, "Must be at least 50 cm").max(280, "Must be at most 280 cm"),
  fitnessGoal: z.enum(["lose_weight", "build_muscle", "improve_endurance", "stay_active"]),
});

type SettingsValues = z.infer<typeof settingsSchema>;

const goalLabels: Record<string, string> = {
  lose_weight: "Lose Weight",
  build_muscle: "Build Muscle",
  improve_endurance: "Improve Endurance",
  stay_active: "Stay Active",
};

export function SettingsPage() {
  const { user } = useUser();
  const { data: profile, isLoading } = useGetProfile();
  const updateProfile = useUpdateProfile();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const form = useForm<SettingsValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      name: "",
      age: 25,
      weightKg: 70,
      heightCm: 170,
      fitnessGoal: "stay_active",
    },
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
          toast({ title: "Profile updated successfully" });
        },
        onError: () => {
          toast({ variant: "destructive", title: "Failed to update profile" });
        },
      }
    );
  };

  const bmi = profile
    ? (profile.weightKg / Math.pow(profile.heightCm / 100, 2)).toFixed(1)
    : null;

  const getBmiLabel = (bmi: number) => {
    if (bmi < 18.5) return { label: "Underweight", color: "text-blue-400" };
    if (bmi < 25) return { label: "Healthy", color: "text-primary" };
    if (bmi < 30) return { label: "Overweight", color: "text-amber-400" };
    return { label: "Obese", color: "text-rose-400" };
  };

  const bmiInfo = bmi ? getBmiLabel(parseFloat(bmi)) : null;

  return (
    <AppLayout>
      <div className="space-y-6 max-w-2xl">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground mt-1">Manage your profile and fitness details.</p>
        </div>

        {/* Profile picture card */}
        <Card className="bg-card/30 border-border/40 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-base flex items-center gap-2">
              <User className="h-4 w-4 text-primary" />
              Account
            </CardTitle>
            <CardDescription>Your Clerk account details</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-5">
              <Avatar className="h-20 w-20 border-2 border-border/50">
                <AvatarImage src={user?.imageUrl} />
                <AvatarFallback className="bg-primary/20 text-primary text-2xl font-bold">
                  {user?.firstName?.charAt(0) ?? user?.emailAddresses[0]?.emailAddress?.charAt(0) ?? "U"}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold text-base">{user?.fullName || user?.firstName || "—"}</p>
                <p className="text-sm text-muted-foreground">{user?.emailAddresses[0]?.emailAddress}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  Profile picture and email are managed through your Clerk account.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* BMI snapshot */}
        {profile && bmi && bmiInfo && (
          <Card className="bg-card/30 border-border/40 backdrop-blur-sm">
            <CardContent className="py-4 px-5">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Your BMI</p>
                  <p className="text-2xl font-bold">{bmi}</p>
                </div>
                <Badge variant="outline" className={`${bmiInfo.color} border-current/30`}>
                  {bmiInfo.label}
                </Badge>
                <div className="text-right text-xs text-muted-foreground space-y-0.5">
                  <p>{profile.heightCm} cm</p>
                  <p>{profile.weightKg} kg</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Fitness profile form */}
        <Card className="bg-card/30 border-border/40 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              Fitness Profile
            </CardTitle>
            <CardDescription>Update your physical stats and goal</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-10 w-full" />)}
              </div>
            ) : (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <User className="h-3.5 w-3.5 text-muted-foreground" /> Display Name
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="Your name" className="bg-background/50 border-border/40" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="age"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5 text-muted-foreground" /> Age
                          </FormLabel>
                          <FormControl>
                            <Input type="number" className="bg-background/50 border-border/40" {...field} />
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
                          <FormLabel className="flex items-center gap-1.5">
                            <Scale className="h-3.5 w-3.5 text-muted-foreground" /> Weight
                          </FormLabel>
                          <FormControl>
                            <Input type="number" step="0.1" className="bg-background/50 border-border/40" {...field} />
                          </FormControl>
                          <FormDescription className="text-[11px]">kg</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="heightCm"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-1.5">
                            <Ruler className="h-3.5 w-3.5 text-muted-foreground" /> Height
                          </FormLabel>
                          <FormControl>
                            <Input type="number" step="0.5" className="bg-background/50 border-border/40" {...field} />
                          </FormControl>
                          <FormDescription className="text-[11px]">cm</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="fitnessGoal"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Target className="h-3.5 w-3.5 text-muted-foreground" /> Primary Goal
                        </FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-background/50 border-border/40">
                              <SelectValue placeholder="Select your goal" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-card border-border/40">
                            {Object.entries(goalLabels).map(([value, label]) => (
                              <SelectItem key={value} value={value}>{label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

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
    </AppLayout>
  );
}

import { useGetDashboardStats, useGetProfile, useListWorkouts, getGetDashboardStatsQueryKey } from "@fitness/api-client-react";
import { Activity, Flame, Target, TrendingUp, Plus, Calendar, Clock, Dumbbell, Utensils } from "lucide-react";
import { Link, useLocation } from "wouter";
import { format } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { AppLayout } from "@/components/layout";

const DAILY_CALORIE_TARGET = 2000;
const DAILY_PROTEIN_TARGET = 150;
const DAILY_CARBS_TARGET = 250;
const DAILY_FAT_TARGET = 65;

function MacroBar({ label, value, target, color }: { label: string; value: number; target: number; color: string }) {
  const pct = Math.min(100, Math.round((value / target) * 100));
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium tabular-nums">
          <span className={color}>{Math.round(value)}g</span>
          <span className="text-muted-foreground"> / {target}g</span>
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-muted/40 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${color.replace("text-", "bg-")}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function DashboardPage() {
  const [, setLocation] = useLocation();
  const { data: profile, isLoading: profileLoading, isError: profileError } = useGetProfile();
  const { data: stats, isLoading: statsLoading } = useGetDashboardStats();
  const { data: workouts, isLoading: workoutsLoading } = useListWorkouts({ limit: 4 });

  if (profileError) {
    setLocation("/onboarding");
    return null;
  }

  const today = format(new Date(), "EEEE, MMMM d");

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground font-medium uppercase tracking-widest">{today}</p>
            <h1 className="text-3xl font-bold tracking-tight mt-0.5">
              {profileLoading ? <Skeleton className="h-9 w-48" /> : `Welcome back, ${profile?.name?.split(" ")[0]}`}
            </h1>
          </div>
          <Link href="/workouts">
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90 shrink-0">
              <Plus className="mr-2 h-4 w-4" /> Log Workout
            </Button>
          </Link>
        </div>

        {/* Daily Stat Cards */}
        {statsLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="bg-card/30 border-border/40">
                <CardContent className="pt-6">
                  <Skeleton className="h-8 w-16 mb-2" />
                  <Skeleton className="h-3 w-24" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-card/30 border-border/40 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4">
                <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Streak</CardTitle>
                <Flame className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="text-3xl font-bold">{stats?.workoutStreak ?? 0}</div>
                <p className="text-xs text-muted-foreground mt-0.5">days in a row</p>
              </CardContent>
            </Card>

            <Card className="bg-card/30 border-border/40 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4">
                <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Today's Workouts</CardTitle>
                <Dumbbell className="h-4 w-4 text-blue-400" />
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="text-3xl font-bold">{stats?.totalWorkoutsToday ?? 0}</div>
                <p className="text-xs text-muted-foreground mt-0.5">{stats?.totalWorkoutsThisWeek ?? 0} this week</p>
              </CardContent>
            </Card>

            <Card className="bg-card/30 border-border/40 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4">
                <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Burned Today</CardTitle>
                <TrendingUp className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="text-3xl font-bold">{stats?.totalCaloriesBurnedToday ?? 0}</div>
                <p className="text-xs text-muted-foreground mt-0.5">kcal active</p>
              </CardContent>
            </Card>

            <Card className="bg-card/30 border-border/40 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4">
                <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Current Weight</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="text-3xl font-bold">
                  {stats?.currentWeightKg ?? profile?.weightKg ?? 0}
                  <span className="text-lg font-normal text-muted-foreground ml-1">kg</span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">latest log</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Activity */}
          <Card className="lg:col-span-2 bg-card/30 border-border/40 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base">Recent Activity</CardTitle>
                <CardDescription>Your latest sessions</CardDescription>
              </div>
              <Link href="/workouts">
                <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80 text-xs">
                  View All
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {workoutsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-14 w-full" />)}
                </div>
              ) : !workouts || workouts.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground border border-dashed border-border/40 rounded-xl">
                  <Activity className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">No workouts yet</p>
                  <Button variant="link" className="text-primary text-sm mt-1 h-auto p-0" onClick={() => setLocation("/workouts")}>
                    Log your first session
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {workouts.map(workout => (
                    <div key={workout.id} className="flex items-center justify-between px-4 py-3 rounded-xl bg-background/40 border border-border/20 hover:bg-white/5 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                          <Activity className="h-4 w-4" />
                        </div>
                        <div>
                          <h4 className="font-medium capitalize text-sm">{workout.type.replace("_", " ")}</h4>
                          <div className="flex items-center text-xs text-muted-foreground gap-2 mt-0.5">
                            <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {format(new Date(workout.date), "MMM d")}</span>
                            <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {workout.durationMinutes}m</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-primary text-sm">{workout.caloriesBurned}</div>
                        <div className="text-[10px] text-muted-foreground uppercase tracking-wider">kcal</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Daily Nutrition & Goal */}
          <div className="space-y-4">
            {/* Calorie Ring */}
            <Card className="bg-card/30 border-border/40 backdrop-blur-sm">
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-base flex items-center gap-2">
                  <Utensils className="h-4 w-4 text-primary" />
                  Daily Nutrition
                </CardTitle>
                <CardDescription className="capitalize text-xs">
                  {profile?.fitnessGoal?.replace(/_/g, " ") ?? "Goal"}
                </CardDescription>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                {statsLoading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-24 w-24 rounded-full mx-auto" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-full" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Calorie ring */}
                    <div className="flex items-center gap-4">
                      <div className="relative w-20 h-20 shrink-0">
                        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                          <circle cx="50" cy="50" r="38" fill="transparent" stroke="currentColor" strokeWidth="10" className="text-muted/20" />
                          <circle
                            cx="50" cy="50" r="38"
                            fill="transparent"
                            stroke="currentColor"
                            strokeWidth="10"
                            strokeLinecap="round"
                            strokeDasharray={`${Math.min(100, ((stats?.totalCaloriesConsumedToday ?? 0) / DAILY_CALORIE_TARGET) * 100) * 2.39} 239`}
                            className="text-primary transition-all duration-700"
                          />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-lg font-bold leading-none">{stats?.totalCaloriesConsumedToday ?? 0}</span>
                          <span className="text-[9px] text-muted-foreground uppercase tracking-wider">kcal</span>
                        </div>
                      </div>
                      <div className="flex-1 space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Target</span>
                          <span className="font-medium">{DAILY_CALORIE_TARGET} kcal</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Remaining</span>
                          <span className="font-medium text-primary">
                            {Math.max(0, DAILY_CALORIE_TARGET - (stats?.totalCaloriesConsumedToday ?? 0))} kcal
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Burned</span>
                          <span className="font-medium">+{stats?.totalCaloriesBurnedToday ?? 0} kcal</span>
                        </div>
                      </div>
                    </div>

                    {/* Macro bars */}
                    <div className="space-y-3 pt-1 border-t border-border/30">
                      <MacroBar label="Protein" value={stats?.totalProteinToday ?? 0} target={DAILY_PROTEIN_TARGET} color="text-blue-400" />
                      <MacroBar label="Carbs" value={stats?.totalCarbsToday ?? 0} target={DAILY_CARBS_TARGET} color="text-amber-400" />
                      <MacroBar label="Fat" value={stats?.totalFatToday ?? 0} target={DAILY_FAT_TARGET} color="text-rose-400" />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Weekly goal chip */}
            <Card className="bg-card/30 border-border/40 backdrop-blur-sm">
              <CardContent className="px-4 py-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground uppercase tracking-wider">Weekly Goal</span>
                  <span className="text-xs font-bold text-primary">{stats?.goalProgress ?? 0}%</span>
                </div>
                <Progress value={stats?.goalProgress ?? 0} className="h-2 bg-muted/30" />
                <p className="text-[11px] text-muted-foreground mt-2">
                  {stats?.totalWorkoutsThisWeek ?? 0} / 5 workouts this week
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

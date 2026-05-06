import { useState } from "react";
import { useGetDashboardStats, useGetProfile, useListWorkouts } from "@fitness/api-client-react";
import { Activity, Flame, Trophy, Target, TrendingUp, Plus, Calendar, Clock } from "lucide-react";
import { Link, useLocation } from "wouter";
import { format } from "date-fns";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { AppLayout } from "@/components/layout";

export function DashboardPage() {
  const [, setLocation] = useLocation();
  const { data: profile, isLoading: profileLoading, isError: profileError } = useGetProfile();
  const { data: stats, isLoading: statsLoading } = useGetDashboardStats();
  const { data: workouts, isLoading: workoutsLoading } = useListWorkouts({ limit: 3 });

  if (profileError) {
    // If the profile returns 404, we redirect to onboarding
    // This could also be handled at a higher level, but we do it here for simplicity
    setLocation("/onboarding");
    return null;
  }

  const isLoading = profileLoading || statsLoading || workoutsLoading;

  return (
    <AppLayout>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {profileLoading ? <Skeleton className="h-9 w-48" /> : `Welcome back, ${profile?.name}`}
            </h1>
            <p className="text-muted-foreground mt-1">
              Here is your performance summary for today.
            </p>
          </div>
          
          <div className="flex gap-2">
            <Link href="/workouts">
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                <Plus className="mr-2 h-4 w-4" /> Log Workout
              </Button>
            </Link>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="bg-card/30 border-border/40">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-4 rounded-full" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16 mb-1" />
                  <Skeleton className="h-3 w-32" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-card/30 border-border/40 backdrop-blur-sm shadow-lg shadow-black/20">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Active Streak</CardTitle>
                <Flame className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats?.workoutStreak || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">days in a row</p>
              </CardContent>
            </Card>

            <Card className="bg-card/30 border-border/40 backdrop-blur-sm shadow-lg shadow-black/20">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Workouts This Week</CardTitle>
                <Activity className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats?.totalWorkoutsThisWeek || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">sessions completed</p>
              </CardContent>
            </Card>

            <Card className="bg-card/30 border-border/40 backdrop-blur-sm shadow-lg shadow-black/20">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Calories Burned</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats?.totalCaloriesBurnedThisWeek || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">kcal this week</p>
              </CardContent>
            </Card>

            <Card className="bg-card/30 border-border/40 backdrop-blur-sm shadow-lg shadow-black/20">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Current Weight</CardTitle>
                <Target className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats?.currentWeightKg || profile?.weightKg || 0} <span className="text-lg font-normal text-muted-foreground">kg</span></div>
                <p className="text-xs text-muted-foreground mt-1">latest log</p>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card className="lg:col-span-2 bg-card/30 border-border/40 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Your latest workout sessions</CardDescription>
              </div>
              <Link href="/workouts">
                <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
                  View All
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {workoutsLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : !workouts || workouts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground border border-dashed border-border/40 rounded-lg">
                  <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No recent workouts found.</p>
                  <Button variant="link" className="text-primary mt-2" onClick={() => setLocation("/workouts")}>
                    Log your first session
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {workouts.map(workout => (
                    <div key={workout.id} className="flex items-center justify-between p-4 rounded-xl bg-background/50 border border-border/30 hover:bg-white/5 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                          <Activity className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="font-semibold capitalize">{workout.type}</h4>
                          <div className="flex items-center text-xs text-muted-foreground gap-3 mt-1">
                            <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {format(new Date(workout.date), "MMM d")}</span>
                            <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {workout.durationMinutes} min</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-green-500">{workout.caloriesBurned}</div>
                        <div className="text-xs text-muted-foreground">kcal</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-card/30 border-border/40 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Goal Progress</CardTitle>
              <CardDescription className="capitalize">{profile?.fitnessGoal?.replace('_', ' ') || 'Goal'}</CardDescription>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-32 w-32 rounded-full mx-auto" />
                  <Skeleton className="h-4 w-full" />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-4">
                  <div className="relative w-40 h-40 flex items-center justify-center mb-6">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                      <circle 
                        cx="50" cy="50" r="40" 
                        fill="transparent" 
                        stroke="currentColor" 
                        strokeWidth="8" 
                        className="text-muted/20" 
                      />
                      <circle 
                        cx="50" cy="50" r="40" 
                        fill="transparent" 
                        stroke="currentColor" 
                        strokeWidth="8" 
                        strokeDasharray={`${(stats?.goalProgress || 0) * 2.51} 251`}
                        className="text-primary transition-all duration-1000 ease-out" 
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <Trophy className="h-6 w-6 text-primary mb-1" />
                      <span className="text-2xl font-bold">{stats?.goalProgress || 0}%</span>
                    </div>
                  </div>
                  
                  <div className="w-full space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Daily Calorie Intake</span>
                      <span className="font-medium">{stats?.totalCaloriesConsumedToday || 0} kcal</span>
                    </div>
                    <Progress value={(stats?.totalCaloriesConsumedToday || 0) / 2000 * 100} className="h-2 bg-muted/30" />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}

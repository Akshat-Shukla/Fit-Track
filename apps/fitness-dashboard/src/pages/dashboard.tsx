import { useGetDashboardStats, useGetProfile, useListWorkouts } from "@fitness/api-client-react";
import { Activity, Flame, Target, TrendingUp, Plus, Calendar, Clock, Utensils, Zap, Scale } from "lucide-react";
import { Link, useLocation } from "wouter";
import { format } from "date-fns";
import { motion } from "framer-motion";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AppLayout } from "@/components/layout";
import { PageTransition, StaggerList, StaggerItem } from "@/components/page-transition";

const CALORIE_TARGET = 2000;
const PROTEIN_TARGET = 150;
const CARBS_TARGET = 250;
const FAT_TARGET = 65;

function StatCard({ label, value, sub, icon: Icon, color, loading }: {
  label: string; value: string | number; sub?: string;
  icon: React.ElementType; color: string; loading?: boolean;
}) {
  return (
    <div className="bg-card/25 border border-border/30 rounded-xl p-4 flex items-start gap-3">
      <div className={`h-9 w-9 rounded-lg ${color.replace("text-", "bg-")}/10 flex items-center justify-center shrink-0 mt-0.5`}>
        <Icon className={`h-4.5 w-4.5 ${color}`} style={{ height: 18, width: 18 }} />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider truncate">{label}</p>
        {loading ? (
          <Skeleton className="h-7 w-16 mt-1" />
        ) : (
          <p className="text-2xl font-bold leading-tight mt-0.5">{value}</p>
        )}
        {sub && !loading && <p className="text-[11px] text-muted-foreground mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function MacroBar({ label, value, target, color }: { label: string; value: number; target: number; color: string }) {
  const pct = Math.min(100, Math.round((value / target) * 100));
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-semibold"><span className={color}>{Math.round(value)}g</span><span className="text-muted-foreground">/{target}g</span></span>
      </div>
      <div className="h-1.5 rounded-full bg-muted/20 overflow-hidden">
        <motion.div
          key={pct}
          className={`h-full rounded-full ${color.replace("text-", "bg-")}`}
          initial={{ width: "0%" }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.7, ease: "easeOut", delay: 0.1 }}
        />
      </div>
    </div>
  );
}

export function DashboardPage() {
  const [, setLocation] = useLocation();
  const { data: profile, isLoading: profileLoading, isError: profileError } = useGetProfile();
  const { data: stats, isLoading: statsLoading } = useGetDashboardStats();
  const { data: workouts, isLoading: workoutsLoading } = useListWorkouts({ limit: 5 });

  if (profileError) {
    setLocation("/onboarding");
    return null;
  }

  const today = format(new Date(), "EEEE, MMMM d");
  const caloriePct = Math.min(100, ((stats?.totalCaloriesConsumedToday ?? 0) / CALORIE_TARGET) * 100);

  return (
    <AppLayout>
      <PageTransition>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <p className="text-xs text-muted-foreground font-semibold uppercase tracking-widest">{today}</p>
              {profileLoading ? (
                <Skeleton className="h-8 w-52 mt-1" />
              ) : (
                <h1 className="text-2xl font-bold tracking-tight mt-0.5">
                  Hey, {profile?.name?.split(" ")[0]} 👋
                </h1>
              )}
            </div>
            <Link href="/workouts">
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90 shrink-0">
                <Plus className="mr-2 h-4 w-4" /> Log Workout
              </Button>
            </Link>
          </div>

          {/* Stat Cards */}
          <StaggerList className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StaggerItem>
              <StatCard label="Streak" value={`${stats?.workoutStreak ?? 0}d`} sub="days in a row" icon={Flame} color="text-primary" loading={statsLoading} />
            </StaggerItem>
            <StaggerItem>
              <StatCard label="Sessions Today" value={stats?.totalWorkoutsToday ?? 0} sub={`${stats?.totalWorkoutsThisWeek ?? 0} this week`} icon={Zap} color="text-blue-400" loading={statsLoading} />
            </StaggerItem>
            <StaggerItem>
              <StatCard label="Burned Today" value={`${stats?.totalCaloriesBurnedToday ?? 0}`} sub="kcal active" icon={TrendingUp} color="text-rose-400" loading={statsLoading} />
            </StaggerItem>
            <StaggerItem>
              <StatCard
                label="Weight"
                value={`${stats?.currentWeightKg ?? profile?.weightKg ?? "—"} kg`}
                sub="latest log"
                icon={Scale}
                color="text-muted-foreground"
                loading={statsLoading || profileLoading}
              />
            </StaggerItem>
          </StaggerList>

          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
            {/* Recent Workouts - 3 cols */}
            <Card className="lg:col-span-3 bg-card/20 border-border/30">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-bold">Recent Sessions</CardTitle>
                  <CardDescription className="text-xs">Your latest training</CardDescription>
                </div>
                <Link href="/workouts">
                  <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80 text-xs h-7 px-2">View all</Button>
                </Link>
              </CardHeader>
              <CardContent>
                {workoutsLoading ? (
                  <div className="space-y-2.5">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-14 rounded-xl" />)}
                  </div>
                ) : !workouts || workouts.length === 0 ? (
                  <div className="text-center py-10 text-muted-foreground border border-dashed border-border/30 rounded-xl">
                    <Activity className="h-7 w-7 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No sessions yet</p>
                    <Button variant="link" className="text-primary text-xs mt-1 h-auto p-0" onClick={() => setLocation("/workouts")}>
                      Log your first workout
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {workouts.map(w => (
                      <div key={w.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-background/30 hover:bg-white/4 transition-colors">
                        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                          <Activity className="h-3.5 w-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold capitalize">{w.type.replace("_", " ")}</p>
                          <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5">
                            <span className="flex items-center gap-1"><Calendar className="h-2.5 w-2.5" />{format(new Date(w.date), "MMM d")}</span>
                            <span className="flex items-center gap-1"><Clock className="h-2.5 w-2.5" />{w.durationMinutes}m</span>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-sm font-bold text-primary">{w.caloriesBurned}</span>
                          <span className="text-[10px] text-muted-foreground ml-0.5">kcal</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Nutrition Panel - 2 cols */}
            <div className="lg:col-span-2 space-y-4">
              <Card className="bg-card/20 border-border/30">
                <CardHeader className="pb-3 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-sm font-bold flex items-center gap-1.5">
                      <Utensils className="h-3.5 w-3.5 text-primary" /> Today's Nutrition
                    </CardTitle>
                    <CardDescription className="text-xs capitalize">{profile?.fitnessGoal?.replace(/_/g, " ") ?? "your goal"}</CardDescription>
                  </div>
                  <Link href="/nutrition">
                    <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80 text-xs h-7 px-2">Log food</Button>
                  </Link>
                </CardHeader>
                <CardContent>
                  {statsLoading ? (
                    <div className="space-y-3"><Skeleton className="h-20 w-20 rounded-full mx-auto" /></div>
                  ) : (
                    <div className="space-y-4">
                      {/* Calorie ring */}
                      <div className="flex items-center gap-4">
                        <div className="relative w-20 h-20 shrink-0">
                          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                            <circle cx="50" cy="50" r="38" fill="transparent" stroke="currentColor" strokeWidth="10" className="text-muted/15" />
                            <motion.circle
                              cx="50" cy="50" r="38"
                              fill="transparent"
                              stroke="currentColor"
                              strokeWidth="10"
                              strokeLinecap="round"
                              strokeDasharray="238.6"
                              initial={{ strokeDashoffset: 238.6 }}
                              animate={{ strokeDashoffset: 238.6 - (caloriePct / 100) * 238.6 }}
                              transition={{ duration: 0.9, ease: "easeOut" }}
                              className="text-primary"
                            />
                          </svg>
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-base font-bold leading-none">{stats?.totalCaloriesConsumedToday ?? 0}</span>
                            <span className="text-[8px] text-muted-foreground uppercase tracking-wider">kcal</span>
                          </div>
                        </div>
                        <div className="flex-1 space-y-1 text-xs">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Target</span>
                            <span className="font-semibold">{CALORIE_TARGET}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Remaining</span>
                            <span className="font-semibold text-primary">{Math.max(0, CALORIE_TARGET - (stats?.totalCaloriesConsumedToday ?? 0))}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Burned</span>
                            <span className="font-semibold">+{stats?.totalCaloriesBurnedToday ?? 0}</span>
                          </div>
                        </div>
                      </div>

                      {/* Macro bars */}
                      <div className="space-y-2.5 pt-2 border-t border-border/20">
                        <MacroBar label="Protein" value={stats?.totalProteinToday ?? 0} target={PROTEIN_TARGET} color="text-blue-400" />
                        <MacroBar label="Carbs" value={stats?.totalCarbsToday ?? 0} target={CARBS_TARGET} color="text-amber-400" />
                        <MacroBar label="Fat" value={stats?.totalFatToday ?? 0} target={FAT_TARGET} color="text-rose-400" />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Weekly goal */}
              <Card className="bg-card/20 border-border/30">
                <CardContent className="py-4 px-4">
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                      <Target className="h-3.5 w-3.5 text-primary" />
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Weekly Goal</span>
                    </div>
                    <span className="text-xs font-bold text-primary">{stats?.goalProgress ?? 0}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted/20 overflow-hidden">
                    <motion.div
                      key={stats?.goalProgress ?? "loading"}
                      className="h-full rounded-full bg-primary"
                      initial={{ width: 0 }}
                      animate={{ width: `${stats?.goalProgress ?? 0}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-2">
                    {stats?.totalWorkoutsThisWeek ?? 0} / 5 workouts this week
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </PageTransition>
    </AppLayout>
  );
}

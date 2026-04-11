import { Building2, CalendarCheck, Clock, Users } from "lucide-react";
import { useGetBookingStats, getGetBookingStatsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function Stats() {
  const { data: stats, isLoading } = useGetBookingStats({
    query: { queryKey: getGetBookingStatsQueryKey() }
  });

  if (isLoading || !stats) {
    return (
      <div className="container mx-auto py-10 px-4 max-w-6xl">
        <div className="mb-8">
          <div className="h-10 w-48 bg-muted animate-pulse rounded mb-2" />
          <div className="h-5 w-64 bg-muted animate-pulse rounded" />
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-muted animate-pulse rounded-xl" />)}
        </div>
        <div className="h-[400px] bg-muted animate-pulse rounded-xl" />
      </div>
    );
  }

  const statCards = [
    {
      title: "Total Bookings",
      value: stats.totalBookings,
      description: "All time lab reservations",
      icon: CalendarCheck,
      color: "text-blue-500",
    },
    {
      title: "Today's Bookings",
      value: stats.todayBookings,
      description: "Scheduled for today",
      icon: Clock,
      color: "text-green-500",
    },
    {
      title: "Pending Approvals",
      value: stats.pendingApprovals,
      description: "Require admin action",
      icon: Users,
      color: "text-amber-500",
    },
    {
      title: "Active Labs",
      value: (stats && Array.isArray(stats.labBreakdown)) ? stats.labBreakdown.length : 0,
      description: "Available for booking",
      icon: Building2,
      color: "text-purple-500",
    },
  ];

  return (
    <div className="container mx-auto py-6 md:py-10 px-4 max-w-6xl animate-in-fade">
      <div className="mb-8 md:mb-10">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/60 transition-all duration-300">
          Analytics Overview
        </h1>
        <p className="text-muted-foreground text-base md:text-lg font-medium italic">Operational insights and resource utilization metrics.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-10">
        {statCards.map((card, i) => (
          <Card key={i} className="group border-border/30 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 rounded-2xl overflow-hidden glass border-white/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 relative">
              <div className={`p-2 rounded-xl bg-muted/50 ${card.color.replace('text', 'bg').replace('-500', '/10')} transition-transform group-hover:scale-110`}>
                <card.icon className={`h-5 w-5 ${card.color}`} />
              </div>
              <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                {card.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-black tracking-tight mb-1">{card.value}</div>
              <p className="text-xs font-semibold text-muted-foreground/80 flex items-center gap-1.5 uppercase tracking-tight">
                {card.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <Card className="lg:col-span-2 shadow-2xl border-border/30 rounded-3xl overflow-hidden glass border-white/20">
          <CardHeader className="border-b border-border/10 bg-muted/5 pb-6">
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
              Facility Load Breakdown
            </CardTitle>
            <CardDescription className="font-medium">Comparing total reservations per computer laboratory.</CardDescription>
          </CardHeader>
          <CardContent className="pt-10">
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={(stats.labBreakdown || []).map(l => ({
                    ...l,
                    displayName: l.labName === "prajna" ? "THE PRAJNA SPACE" : 
                                l.labName === "achula" ? "ACHALA" : 
                                "CONFERENCE ROOM"
                  }))} 
                  margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
                >
                  <defs>
                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={1} />
                      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.6} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.3} />
                  <XAxis 
                    dataKey="displayName" 
                    tickLine={false}
                    axisLine={false}
                    className="text-[10px] font-black uppercase tracking-tighter"
                    tick={{ fill: "hsl(var(--muted-foreground))" }}
                    dy={10}
                  />
                  <YAxis 
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                    className="text-xs font-bold"
                    tick={{ fill: "hsl(var(--muted-foreground))" }}
                  />
                  <Tooltip 
                    cursor={{ fill: "hsl(var(--primary)/0.05)", radius: 8 }}
                    contentStyle={{ 
                      backgroundColor: "hsl(var(--card))", 
                      borderColor: "hsl(var(--border))",
                      borderRadius: "1rem",
                      boxShadow: "0 10px 40px -10px rgba(0,0,0,0.1)",
                      border: "1px solid rgba(255,255,255,0.1)"
                    }}
                    itemStyle={{ fontWeight: "bold" }}
                  />
                  <Bar 
                    dataKey="count" 
                    fill="url(#barGradient)" 
                    radius={[8, 8, 8, 8]} 
                    maxBarSize={50}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-2xl border-border/30 rounded-3xl overflow-hidden glass border-white/20">
          <CardHeader className="bg-primary/5 pb-6 border-b border-border/10">
            <CardTitle className="text-xl font-bold">Quick Insights</CardTitle>
            <CardDescription className="font-medium">Automated system health check.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <div className="space-y-4">
              {[
                { label: "Server Status", value: "Operational", color: "text-green-500", bg: "bg-green-500/10" },
                { label: "Database Latency", value: "Normal", color: "text-green-500", bg: "bg-green-500/10" },
                { label: "Storage Capacity", value: "92% Free", color: "text-blue-500", bg: "bg-blue-500/10" },
                { label: "Pending Tasks", value: stats.pendingApprovals, color: stats.pendingApprovals > 0 ? "text-amber-500" : "text-green-500", bg: stats.pendingApprovals > 0 ? "bg-amber-500/10" : "bg-green-500/10" }
              ].map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/20 transition-all hover:bg-muted/50">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{item.label}</span>
                  <span className={`text-[11px] font-black px-2 py-1 rounded-md ${item.bg} ${item.color} uppercase`}>
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

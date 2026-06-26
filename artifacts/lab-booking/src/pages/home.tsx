import { useState } from "react";
import { format } from "date-fns";
import { Link } from "wouter";
import { CalendarIcon, Users, Clock, CheckCircle2, Building2 } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useGetSchedule, getGetScheduleQueryKey, useAdminListBookings, getAdminListBookingsQueryKey, useListFacilities } from "@workspace/api-client-react";

export default function Home() {
  const [date, setDate] = useState<Date>(new Date());

  const dateStr = format(date, "yyyy-MM-dd");

  const { data: schedule, isLoading, error } = useGetSchedule(
    { date: dateStr },
    { query: { enabled: !!dateStr, queryKey: getGetScheduleQueryKey({ date: dateStr }) } }
  );

  const { data: pendingBookings } = useAdminListBookings(
    { status: "pending" },
    { query: { queryKey: getAdminListBookingsQueryKey({ status: "pending" }) } }
  );

  const { data: facilities } = useListFacilities();

  const getPendingCount = (labName: string) => (Array.isArray(pendingBookings) ? pendingBookings : []).filter(b => b.labName === labName && b.date === dateStr).length;

  return (
    <div className="container mx-auto py-6 md:py-10 px-4 max-w-6xl animate-in-fade">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 md:mb-10 gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-foreground to-foreground/70">
            Resource Schedule
          </h1>
          <p className="text-muted-foreground text-base md:text-lg">
            Real-time availability of computer facilities.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Current View</span>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-[260px] justify-start text-left font-semibold border-border/50 shadow-sm transition-all hover:bg-muted/50",
                  !date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-3 h-4 w-4 text-primary" />
                {date ? format(date, "EEEE, MMMM do") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 shadow-2xl border-border/20 rounded-xl overflow-hidden" align="end">
              <Calendar
                mode="single"
                selected={date}
                onSelect={(d) => d && setDate(d)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-8 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse bg-muted/40 h-80 rounded-2xl border border-border/20" />
          ))}
        </div>
      ) : error ? (
        <div className="bg-destructive/10 text-destructive p-6 rounded-2xl border border-destructive/20 text-center font-medium">
          Failed to load schedule. Please verify server connection.
        </div>
      ) : !schedule || !Array.isArray(schedule.labs) || schedule.labs.length === 0 ? (
        <div className="text-center py-20 bg-muted/10 rounded-2xl border border-dashed border-border/50">
          <div className="bg-muted/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <CalendarIcon className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground text-lg font-medium">No labs found for this date.</p>
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-3">
          {schedule.labs.map((lab) => {
            const facility = facilities?.find(f => f.name === lab.labName);
            const title = facility?.displayName || lab.labName;
            const subtitle = facility?.description || "";
            const pendingCount = getPendingCount(lab.labName);

            return (
              <Card key={lab.labName} className="flex flex-col h-full shadow-lg border-border/30 rounded-2xl overflow-hidden group transition-all hover:shadow-xl hover:-translate-y-1">
                <CardHeader className="bg-muted/5 pb-5 border-b border-border/30 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-125" />
                  <CardTitle className="text-xl font-black tracking-tighter flex items-center justify-between gap-2">
                    <div className="flex flex-col">
                      <span className="text-primary">{title}</span>
                      <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-1">
                        {facility?.type === "classroom" ? "Classroom" : "Laboratory"}
                      </span>
                    </div>
                    <Badge variant={lab.bookings.length > 0 ? "secondary" : "outline"} className="font-bold shrink-0">
                      {lab.bookings.length > 0 ? "Busy" : "Free"}
                    </Badge>
                  </CardTitle>
                  <p className="text-[10px] font-bold text-muted-foreground leading-tight mt-2 italic opacity-80 min-h-[24px]">
                    {subtitle}
                  </p>
                  
                  <div className="flex flex-col gap-3 mt-4">
                    <Link 
                      href={`/facility/${lab.labName}`} 
                      className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground h-9 rounded-lg text-xs font-black uppercase tracking-widest shadow-md shadow-primary/10 hover:shadow-lg transition-all active:scale-[0.98]"
                    >
                      <Building2 className="h-4 w-4" />
                      Book Now
                    </Link>
                    
                    <CardDescription className="font-bold text-xs flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-primary rounded-full" />
                      {lab.bookings.length} Reserving {lab.bookings.length === 1 ? 'Slot' : 'Slots'}
                    </CardDescription>
                  </div>
                  {pendingCount > 0 && (
                    <div className="flex items-center gap-2 mt-3 bg-amber-50 dark:bg-amber-900/20 px-3 py-1.5 rounded-full w-fit">
                      <Clock className="h-3.5 w-3.5 text-amber-500 animate-pulse" />
                      <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-tight">
                        {pendingCount} Waiting Approval
                      </span>
                    </div>
                  )}
                </CardHeader>
                <CardContent className="pt-6 flex-1 bg-gradient-to-b from-transparent to-muted/5 min-h-[220px] overflow-hidden">
                  {lab.bookings.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center min-h-[160px] text-center opacity-80">
                      <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center mb-3">
                        <CheckCircle2 className="h-6 w-6 text-green-600" />
                      </div>
                      <p className="text-sm font-semibold text-green-700">Available All Day</p>
                      <p className="text-[11px] text-muted-foreground mt-1 uppercase tracking-widest font-black opacity-60">Open for Research</p>
                    </div>
                  ) : (
                    <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar pb-2">
                      {lab.bookings.map((booking) => (
                        <div
                          key={booking.id}
                          className="flex flex-col gap-3 p-4 rounded-xl border border-border/50 bg-card/60 backdrop-blur-sm shadow-sm transition-all hover:border-primary/40 hover:shadow-md"
                        >
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2 bg-primary/10 text-primary px-2.5 py-1 rounded-md text-[13px] font-bold">
                              <Clock className="h-3.5 w-3.5" />
                              {booking.startTime} - {booking.endTime}
                            </div>
                            <Badge 
                              variant="outline" 
                              className="text-[10px] uppercase font-black tracking-widest bg-muted/40 border-none"
                            >
                              {booking.bookerType}
                            </Badge>
                          </div>
                          <div className="space-y-1">
                            <p className="font-bold text-base leading-none">{booking.bookerName}</p>
                            <p className="text-muted-foreground text-xs font-medium italic line-clamp-1">
                              "{booking.purpose}"
                            </p>
                          </div>
                          <div className="flex items-center justify-between border-t border-border/30 pt-3 mt-1">
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Users className="h-3.5 w-3.5" />
                              <span className="text-xs font-semibold">{booking.studentCount} Attendees</span>
                            </div>
                            <div className="w-2 h-2 bg-primary/40 rounded-full animate-pulse" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { CalendarIcon, LayoutDashboard, LogOut } from "lucide-react";
import { useLocation } from "wouter";
import { GoogleLogin } from "@react-oauth/google";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useCreateBooking, useListFacilities } from "@workspace/api-client-react";

// Helper to decode JWT without a library
const decodeJwt = (token: string) => {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch (e) {
    return null;
  }
};

const isValidTime = (time: string) => {
  const [hours, minutes] = time.split(":").map(Number);
  const timeInMinutes = hours * 60 + minutes;
  const startLimit = 8 * 60 + 50;
  const endLimit = 18 * 60 + 45;
  return timeInMinutes >= startLimit && timeInMinutes <= endLimit;
};

const formSchema = z.object({
  bookerName: z.string(),
  bookerEmail: z.string().email(),
  bookerType: z.literal("faculty").default("faculty"),
  labName: z.string({ required_error: "Please select a facility." }),
  date: z.date({ required_error: "A date is required." }),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .refine(isValidTime, { message: "Time must be between 08:50 and 18:45" }),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .refine(isValidTime, { message: "Time must be between 08:50 and 18:45" }),
  purpose: z.string().min(5, { message: "Purpose must be at least 5 characters." }),
  studentCount: z.coerce.number().min(1, { message: "Must have at least 1 attendee." }),
}).refine((data) => {
  if (!data.startTime || !data.endTime) return true;
  const start = data.startTime.split(":").map(Number);
  const end = data.endTime.split(":").map(Number);
  const startMins = start[0] * 60 + start[1];
  const endMins = end[0] * 60 + end[1];
  return endMins > startMins;
}, {
  message: "End time must be after start time.",
  path: ["endTime"],
});

export default function Book() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const createBooking = useCreateBooking();
  const { data: facilities } = useListFacilities();
  
  const [googleUser, setGoogleUser] = useState<{ name: string; email: string; token: string } | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      bookerName: "",
      bookerEmail: "",
      bookerType: "faculty",
      labName: (new URLSearchParams(window.location.search).get("lab") as any) || undefined,
      purpose: "",
      startTime: "08:50",
      endTime: "09:50",
      studentCount: 1,
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (!googleUser?.token) return;
    
    createBooking.mutate({
      data: {
        ...values,
        idToken: googleUser.token,
        date: format(values.date, "yyyy-MM-dd"),
      }
    }, {
      onSuccess: () => {
        toast({
          title: "Booking Submitted Successfully",
          description: "Your reservation request is now pending admin approval.",
          variant: "success",
        });
        setLocation("/");
      },
      onError: (err: any) => {
        toast({
          title: "Reservation Failed",
          description: err.data?.error || "Could not process your booking request.",
          variant: "destructive",
        });
      }
    });
  };

  const handleLoginSuccess = (credentialResponse: any) => {
    if (credentialResponse.credential) {
      const decoded = decodeJwt(credentialResponse.credential);
      if (decoded && decoded.email) {
        if (!decoded.email.toLowerCase().endsWith("@gmail.com")) {
          toast({
            title: "Access Denied",
            description: "Only official @gmail.com accounts are authorized.",
            variant: "destructive"
          });
          return;
        }
        
        setGoogleUser({
          name: decoded.name || decoded.email.split("@")[0],
          email: decoded.email,
          token: credentialResponse.credential
        });
        
        form.setValue("bookerName", decoded.name || decoded.email.split("@")[0]);
        form.setValue("bookerEmail", decoded.email);
        
        toast({
          title: "Authentication Successful",
          description: `Welcome, ${decoded.name || decoded.email.split("@")[0]}`,
          variant: "success"
        });
      }
    }
  };

  return (
    <div className="container mx-auto py-4 px-4 max-w-2xl animate-in-fade">
      <div className="mb-4 text-center">
        <h1 className="text-3xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600">
          Resource Concierge
        </h1>
        <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest opacity-70">Schedule Your Session</p>
      </div>

      <div className="glass shadow-xl rounded-3xl p-6 md:p-8 border-white/40 overflow-hidden">
        {!googleUser ? (
          <div className="flex flex-col items-center justify-center py-10 space-y-6">
            <div className="text-center space-y-2 max-w-md">
              <h2 className="text-2xl font-bold">Authentication Required</h2>
              <p className="text-muted-foreground text-sm">Please sign in with your official Google account to request a laboratory reservation.</p>
            </div>
            
            <div className="p-4 bg-background/50 rounded-2xl border border-border/50 shadow-inner">
              <GoogleLogin
                onSuccess={handleLoginSuccess}
                onError={() => {
                  toast({
                    title: "Authentication Error",
                    description: "Failed to connect to Google. Please try again.",
                    variant: "destructive"
                  });
                }}
                useOneTap
              />
            </div>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5 col-span-1 md:col-span-2 bg-primary/5 p-4 rounded-2xl border border-primary/10 relative overflow-hidden">
                  <div className="absolute right-4 top-4">
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => setGoogleUser(null)}>
                      <LogOut className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-primary/70">Authenticated Staff</div>
                  <div className="font-bold text-lg">{googleUser.name}</div>
                  <div className="text-xs font-medium text-muted-foreground">{googleUser.email}</div>
                </div>

                <FormField
                  control={form.control}
                  name="labName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold text-[10px] uppercase tracking-widest text-primary/70">Facility</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-11 bg-background/50 border-border/50">
                            <SelectValue placeholder="Choose a lab" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="rounded-xl border-border/20 shadow-2xl">
                          {facilities?.map((f) => (
                            <SelectItem key={f.id} value={f.name} className="font-bold">
                              {f.displayName} {f.capacity ? `(Capacity: ${f.capacity})` : ""}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="studentCount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold text-[10px] uppercase tracking-widest text-primary/70">Number of Attendees</FormLabel>
                      <FormControl>
                        <Input type="number" min={1} className="h-11 bg-background/50 border-border/50" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel className="font-bold text-[10px] uppercase tracking-widest text-primary/70 mb-1.5">Reservation Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full h-11 pl-3 text-left font-bold text-xs bg-background/50 border-border/50",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "MMMM do, yyyy")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 text-primary opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 shadow-2xl rounded-2xl border-border/20" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="startTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-bold text-[10px] uppercase tracking-widest text-primary/70">From</FormLabel>
                        <FormControl>
                          <Input type="time" className="h-11 bg-background/50 border-border/50 font-bold" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="endTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-bold text-[10px] uppercase tracking-widest text-primary/70">To</FormLabel>
                        <FormControl>
                          <Input type="time" className="h-11 bg-background/50 border-border/50 font-bold" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <FormField
                control={form.control}
                name="purpose"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-bold text-[10px] uppercase tracking-widest text-primary/70">Academic Purpose</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Explain the session goals..." 
                        className="resize-none min-h-[90px] bg-background/50 border-border/50 no-scrollbar focus:bg-background transition-all" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full h-14 text-lg font-black uppercase tracking-tighter shadow-xl shadow-primary/20 hover:shadow-2xl hover:shadow-primary/40 transition-all rounded-2xl" disabled={createBooking.isPending}>
                {createBooking.isPending ? "Connecting..." : "Confirm Reservation Request"}
              </Button>
            </form>
          </Form>
        )}
      </div>
    </div>
  );
}

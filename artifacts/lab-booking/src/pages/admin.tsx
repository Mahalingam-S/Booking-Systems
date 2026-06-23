import { useState } from "react";
import { format } from "date-fns";
import { Check, X, Lock } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useAdminListBookings,
  useApproveBooking,
  useRejectBooking,
  getAdminListBookingsQueryKey,
  AdminListBookingsStatus
} from "@workspace/api-client-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

export default function Admin() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { toast } = useToast();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    const admins: Record<string, string> = {
      "s_mahalingam@cb.amrita.edu": "maha@9486" // You can change this below
    };

    const normalizedEmail = email.toLowerCase().trim();
    if (admins[normalizedEmail] && admins[normalizedEmail] === password) {
      setIsAuthenticated(true);
    } else {
      toast({
        title: "Access Denied",
        description: "Invalid email or password.",
        variant: "destructive",
      });
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/5 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none opacity-20"
          style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, gray 1px, transparent 0)', backgroundSize: '24px 24px' }} />
        <Card className="w-full max-w-sm glass border-white/40 shadow-2xl rounded-3xl animate-in-fade">
          <CardHeader className="pb-8">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-primary/10 rounded-2xl shadow-inner border border-primary/5">
                <Lock className="w-8 h-8 text-primary animate-pulse" />
              </div>
            </div>
            <CardTitle className="text-center text-3xl font-black tracking-tighter">Admin Access</CardTitle>
            <CardDescription className="text-center font-bold text-[10px] uppercase tracking-widest text-muted-foreground mt-2">
              Multi-User Authentication
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pb-8">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Official ID</p>
                <Input
                  type="email"
                  placeholder="admin@gmail.com"
                  className="h-12 bg-background/50 border-border/50 rounded-xl px-4 font-bold focus:bg-background transition-all"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Secure Password</p>
                <Input
                  type="password"
                  placeholder="••••••••"
                  className="h-12 bg-background/50 border-border/50 rounded-xl px-4 font-bold focus:bg-background transition-all"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full h-12 rounded-xl bg-primary font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:shadow-2xl transition-all">
                Login System
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <AdminPanel />;
}

function AdminPanel() {
  const [activeTab, setActiveTab] = useState<AdminListBookingsStatus>("pending");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const approveBooking = useApproveBooking();
  const rejectBooking = useRejectBooking();

  const { data: bookings = [], isLoading } = useAdminListBookings(
    activeTab === "pending" || activeTab === "approved" || activeTab === "rejected"
      ? { status: activeTab as AdminListBookingsStatus }
      : undefined,
    { query: { queryKey: getAdminListBookingsQueryKey(activeTab !== "all" as any ? { status: activeTab } : undefined) } }
  );

  const handleApprove = (id: string) => {
    approveBooking.mutate({ id }, {
      onSuccess: () => {
        toast({ title: "Booking Authorized", variant: "success" });
        queryClient.invalidateQueries({ queryKey: getAdminListBookingsQueryKey() });
      },
      onError: (err: any) => {
        toast({ title: "Authorization Failed", description: err.data?.error || "Could not approve this request.", variant: "destructive" });
      }
    });
  };

  const handleReject = (id: string, reason: string) => {
    rejectBooking.mutate({ id, data: { reason } }, {
      onSuccess: () => {
        toast({ title: "Request Rejected", variant: "success" });
        queryClient.invalidateQueries({ queryKey: getAdminListBookingsQueryKey() });
      },
      onError: (err: any) => {
        toast({ title: "Operation Failed", description: err.data?.error || "Could not process the rejection.", variant: "destructive" });
      }
    });
  };

  return (
    <div className="container mx-auto py-10 px-4 max-w-6xl animate-in-fade">
      <div className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div className="space-y-1">
          <h1 className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/50">
            Admin Governance
          </h1>
          <p className="text-muted-foreground text-lg italic">Review and authorize laboratory access requests.</p>
        </div>
        <Badge variant="outline" className="px-4 py-1.5 rounded-full border-primary/20 text-primary font-bold uppercase tracking-tighter bg-primary/5">
          Authorized Session
        </Badge>
      </div>

      <Tabs defaultValue="pending" onValueChange={(v) => setActiveTab(v as AdminListBookingsStatus)} className="space-y-8">
        <div className="w-full overflow-x-auto no-scrollbar pb-1">
          <TabsList className="glass p-1 rounded-2xl h-14 w-full md:w-fit border-white/20">
            <TabsTrigger value="pending" className="flex-1 md:flex-none rounded-xl px-4 md:px-8 font-bold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all">Pending</TabsTrigger>
            <TabsTrigger value="approved" className="flex-1 md:flex-none rounded-xl px-4 md:px-8 font-bold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all">Approved</TabsTrigger>
            <TabsTrigger value="rejected" className="flex-1 md:flex-none rounded-xl px-4 md:px-8 font-bold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all">Rejected</TabsTrigger>
          </TabsList>
        </div>

        <div className="space-y-6">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse bg-muted/40 h-32 rounded-2xl border border-border/20" />
              ))}
            </div>
          ) : (!Array.isArray(bookings) || bookings.length === 0) ? (
            <div className="text-center py-20 bg-muted/10 rounded-2xl border border-dashed border-border/50">
              <p className="text-muted-foreground text-lg font-medium italic">No requests found in this category.</p>
            </div>
          ) : (
            (bookings as any[]).map((booking) => (
              <Card key={booking.id} className="overflow-hidden glass border-white/30 rounded-3xl shadow-lg transition-all hover:shadow-xl hover:border-primary/20 group">
                <div className="relative p-5 md:p-8">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-125" />

                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative z-10">
                    <div className="flex-1 space-y-4">
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="flex flex-wrap items-center gap-3">
                          <div className="flex flex-col">
                            <span className="font-black text-2xl tracking-tighter text-primary uppercase">
                              {booking.labName === "prajna" ? "THE PRAJNA SPACE" : 
                               booking.labName === "achula" ? "ACHALA" : 
                               "CONFERENCE ROOM"}
                            </span>
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none mt-1">
                              {booking.labName === "prajna" ? "AB-III Extension Block, Ground Floor" : 
                               booking.labName === "achula" ? "AB-III Extension Block, Third Floor" : 
                               "E-101 AB-III Ground Floor"}
                            </span>
                          </div>
                          <Badge variant={
                            booking.status === "approved" ? "default" :
                              booking.status === "rejected" ? "destructive" :
                                "secondary"
                          } className="font-bold py-1 px-3 rounded-md text-[10px] uppercase tracking-widest border-none">
                            {booking.status}
                          </Badge>
                          <Badge variant="outline" className="font-bold text-[10px] uppercase border-primary/20 bg-primary/5 text-primary">
                            {booking.bookerType}
                          </Badge>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="space-y-1 overflow-hidden">
                          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Requestor</p>
                          <p className="font-bold text-lg truncate">{booking.bookerName}</p>
                          <p className="text-[11px] font-medium text-primary/70 truncate">{booking.bookerEmail || "No Email Provided"}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Date</p>
                          <p className="font-bold text-lg">{format(new Date(booking.date), "MMM d, yyyy")}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Time Slot</p>
                          <p className="font-bold text-lg">{booking.startTime} - {booking.endTime}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Strength</p>
                          <p className="font-bold text-lg">{booking.studentCount} Attendees</p>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-col gap-2">
                        <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Statement of Purpose</div>
                        <div className="text-sm font-medium bg-muted/30 p-4 rounded-xl border border-border/10 italic leading-relaxed text-foreground/80">
                          {booking.purpose}
                        </div>
                      </div>

                      {booking.rejectionReason && (
                        <div className="mt-4 space-y-1 animate-in-fade">
                          <div className="text-[10px] font-black uppercase tracking-widest text-destructive">Administrative Feedback</div>
                          <div className="text-sm font-bold bg-destructive/5 text-destructive p-4 rounded-xl border border-destructive/10 leading-relaxed italic">
                            {booking.rejectionReason}
                          </div>
                        </div>
                      )}
                    </div>

                    {booking.status === "pending" && (
                      <div className="flex flex-row lg:flex-col gap-3 min-w-[160px]">
                        <Button
                          size="lg"
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-lg shadow-green-600/20"
                          onClick={() => handleApprove(booking.id)}
                          disabled={approveBooking.isPending}
                        >
                          <Check className="w-4 h-4 mr-2" /> Approve
                        </Button>

                        <RejectDialog bookingId={booking.id} onReject={handleReject} isPending={rejectBooking.isPending} />
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </Tabs>
    </div>
  );
}

function RejectDialog({ bookingId, onReject, isPending }: { bookingId: string, onReject: (id: string, reason: string) => void, isPending: boolean }) {
  const [reason, setReason] = useState("");
  const [open, setOpen] = useState(false);

  const handleConfirm = () => {
    onReject(bookingId, reason);
    setOpen(false);
    setReason("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="destructive" className="flex-1">
          <X className="w-4 h-4 mr-2" /> Reject
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reject Booking</DialogTitle>
          <DialogDescription>
            Provide a reason for rejecting this booking request.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Textarea
            placeholder="e.g. Lab maintenance scheduled for this time..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={!reason.trim() || isPending}>
            Confirm Rejection
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

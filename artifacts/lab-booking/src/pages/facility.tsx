import { useLocation, useRoute } from "wouter";
import { useListFacilities } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { CalendarIcon, ArrowRight, ArrowLeft } from "lucide-react";

export default function FacilityView() {
  const [, params] = useRoute("/facility/:name");
  const [, setLocation] = useLocation();
  const { data: facilities, isLoading } = useListFacilities();

  const facilityName = params?.name;
  const facility = facilities?.find((f) => f.name === facilityName);

  if (isLoading) {
    return <div className="text-center py-20 animate-pulse">Loading facility details...</div>;
  }

  if (!facility) {
    return (
      <div className="text-center py-20 space-y-4">
        <h2 className="text-2xl font-bold">Facility Not Found</h2>
        <Button onClick={() => setLocation("/")} variant="outline">Return Home</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl animate-in-fade">
      <Button 
        variant="ghost" 
        className="mb-6 hover:bg-transparent hover:text-primary"
        onClick={() => setLocation("/")}
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Home
      </Button>

      <div className="glass shadow-xl rounded-3xl p-6 md:p-10 border-white/40 overflow-hidden space-y-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-black tracking-widest uppercase">
              {facility.type}
            </span>
            <span className="text-muted-foreground text-sm font-medium">
              Capacity: {facility.capacity} {facility.systemCount ? `• Systems: ${facility.systemCount}` : ""}
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600">
            {facility.displayName}
          </h1>
          {facility.description && (
            <p className="mt-4 text-muted-foreground text-lg">{facility.description}</p>
          )}
        </div>

        <div className="bg-background/40 rounded-2xl p-6 border border-border/50">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-primary" />
            Official Timetable
          </h3>
          
          {facility.timetable ? (
            <div className="rounded-xl overflow-hidden shadow-inner border border-border/50 bg-white/50 p-2">
               {facility.timetable.startsWith("data:application/pdf") || facility.timetable.endsWith(".pdf") ? (
                  <iframe src={facility.timetable} className="w-full h-[600px] rounded-lg" title="Timetable PDF" />
               ) : (
                  <img src={facility.timetable} alt={`${facility.displayName} Timetable`} className="w-full h-auto rounded-lg object-contain" />
               )}
            </div>
          ) : (
            <div className="text-center py-12 bg-primary/5 rounded-xl border border-primary/10 border-dashed">
              <p className="text-muted-foreground font-medium">No official timetable has been uploaded for this facility.</p>
            </div>
          )}
        </div>

        <div className="pt-6 border-t border-border/50 flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="text-sm text-muted-foreground text-center md:text-left">
            Please check the timetable for available free slots before proceeding.
          </div>
          <Button 
            size="lg" 
            className="font-black uppercase tracking-widest rounded-xl shadow-lg shadow-primary/20 hover:shadow-xl hover:-translate-y-0.5 transition-all w-full md:w-auto"
            onClick={() => setLocation(`/book?lab=${facility.name}`)}
          >
            Proceed to Booking
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

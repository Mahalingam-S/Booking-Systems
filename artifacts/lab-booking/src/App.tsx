import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Nav } from "@/components/nav";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Book from "@/pages/book";
import Admin from "@/pages/admin";
import Stats from "@/pages/stats";

const queryClient = new QueryClient();

function Router() {
  return (
    <div className="h-[100dvh] flex flex-col bg-background overflow-hidden relative">
      <Nav />
      <main className="flex-1 overflow-hidden relative">
        <div className="absolute inset-0 overflow-y-auto w-full h-full p-2 visible-scrollbar">
          <Switch>
            <Route path="/" component={Home} />
            <Route path="/book" component={Book} />
            <Route path="/admin" component={Admin} />
            <Route path="/stats" component={Stats} />
            <Route component={NotFound} />
          </Switch>
        </div>
      </main>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

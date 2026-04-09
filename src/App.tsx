import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLayout } from "@/components/AppLayout";
import Rankings from "./pages/Rankings";
import FundDetail from "./pages/FundDetail";
import Categories from "./pages/Categories";
import SearchFunds from "./pages/SearchFunds";
import CompareFunds from "./pages/CompareFunds";
import RetirementCalc from "./pages/RetirementCalc";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppLayout>
          <Routes>
            <Route path="/" element={<Rankings />} />
            <Route path="/fund/:id" element={<FundDetail />} />
            <Route path="/search" element={<SearchFunds />} />
            <Route path="/compare" element={<CompareFunds />} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/retirement" element={<RetirementCalc />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AppLayout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

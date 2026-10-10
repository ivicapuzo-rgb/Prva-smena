import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { StoreProvider } from "@/lib/store";
import { BottomNav } from "@/components/BottomNav";
import Smena from "@/pages/Smena";
import Vozila from "@/pages/Vozila";
import Izvestaj from "@/pages/Izvestaj";
import Admin from "@/pages/Admin";

function App() {
  return (
    <StoreProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-[#f1f1ef]">
          <div className="relative mx-auto min-h-screen max-w-md bg-white pb-28 shadow-[0_0_40px_rgba(0,0,0,0.06)]">
            <Routes>
              <Route path="/" element={<Smena />} />
              <Route path="/vozila" element={<Vozila />} />
              <Route path="/izvestaj" element={<Izvestaj />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            <BottomNav />
          </div>
        </div>
        <Toaster position="top-center" richColors />
      </BrowserRouter>
    </StoreProvider>
  );
}

export default App;

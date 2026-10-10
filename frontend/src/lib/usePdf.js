import { useState } from "react";
import { toast } from "sonner";
import { deliver } from "@/lib/pdf";

const MSG = {
  shared: "PDF podeljen",
  saved: "PDF sačuvan na uređaju",
  fallback: "Deljenje nije podržano – PDF je preuzet",
};

export function usePdf() {
  const [busy, setBusy] = useState(null);
  const run = async (key, builder, share) => {
    setBusy(key);
    try {
      const res = await deliver(await builder(), share);
      if (MSG[res]) toast.success(MSG[res]);
    } catch (e) {
      toast.error("Greška pri pravljenju PDF-a");
    } finally {
      setBusy(null);
    }
  };
  return { busy, run };
}

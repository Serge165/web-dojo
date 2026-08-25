import { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import Builder from "@/pages/Builder";
import "@/App.css";
// Client diagnostics: uncaught errors, unhandled rejections, API timings and
// memory samples are captured into a bounded ring buffer and batch-reported
// to POST /api/client-logs (see src/lib/diagnostics.js). Strictly fail-safe —
// never throws into the app.
import { initDiagnostics, instrumentFetch, sampleMemory } from "@/lib/diagnostics";
// Full-UI skinning layer: remaps the hardcoded Dark Tailwind palette to
// --wd-* CSS custom properties so editor themes repaint the entire interface.
// Imported last so its equal-specificity rules win over Tailwind utilities.
import "@/themes/skinning.css";

function App() {
  useEffect(() => {
    initDiagnostics();
    instrumentFetch();
    const memTimer = setInterval(sampleMemory, 60000);
    return () => clearInterval(memTimer);
  }, []);

  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Builder />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="bottom-right" theme="dark" />
    </div>
  );
}

export default App;

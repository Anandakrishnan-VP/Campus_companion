import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { preCacheKeyData } from "./hooks/use-offline-cache";

createRoot(document.getElementById("root")!).render(<App />);

// Pre-cache key data for offline use after app loads
preCacheKeyData();

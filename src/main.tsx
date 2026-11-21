import { createRoot } from "react-dom/client";
import { StrictMode } from "react";
import App from "./App.tsx";
import "./index.css";

// Lets phones install the portal like an app. Production only, so local development never serves stale files.
if (import.meta.env.PROD && "serviceWorker" in navigator) {
    window.addEventListener("load", () => {
        navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    });
}

const rootElement = document.getElementById("root");

if (rootElement) {
    const root = createRoot(rootElement);
    root.render(
        <StrictMode>
            <App />
        </StrictMode>
    );
}

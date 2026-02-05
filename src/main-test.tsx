import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "./index.css";

const queryClient = new QueryClient();

// Minimal test to see if React renders at all
const TestApp = () => {
    return (
        <QueryClientProvider client={queryClient}>
            <div style={{ padding: "20px", backgroundColor: "#f0f0f0", minHeight: "100vh" }}>
                <h1 style={{ color: "#333", fontSize: "32px" }}>✅ React is Working!</h1>
                <p style={{ color: "#666" }}>If you see this, React is rendering correctly.</p>
                <p style={{ color: "#666" }}>The blank page issue is likely in a component, not React itself.</p>
            </div>
        </QueryClientProvider>
    );
};

const root = document.getElementById("root");
if (root) {
    createRoot(root).render(<TestApp />);
} else {
    console.error("❌ Root element not found!");
}

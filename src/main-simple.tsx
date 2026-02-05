import { createRoot } from "react-dom/client";

// Absolute zero-dependency test
const SimpleApp = () => {
    return (
        <div style={{
            padding: "50px",
            backgroundColor: "#1a1a1a",
            color: "#00ff00",
            minHeight: "100vh",
            fontFamily: "monospace",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center"
        }}>
            <h1 style={{ fontSize: "40px", marginBottom: "20px" }}>🚀 SYSTEM CHECK: ONLINE</h1>
            <p style={{ fontSize: "20px" }}>React is rendering successfully with 0 dependencies.</p>
            <div style={{ marginTop: "30px", padding: "20px", border: "1px solid #00ff00" }}>
                TIMESTAMP: {new Date().toLocaleTimeString()}
            </div>
        </div>
    );
};

const root = document.getElementById("root");
if (root) {
    createRoot(root).render(<SimpleApp />);
} else {
    document.body.innerHTML = "<h1>❌ FATAL ERROR: ROOT ELEMENT NOT FOUND</h1>";
}

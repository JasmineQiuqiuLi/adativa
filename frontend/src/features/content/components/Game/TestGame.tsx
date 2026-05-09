// "use client";

// import { useState } from "react";
// import Game from "./Game";
// import { gamePrompt } from "./gamePrompt";


// export default function TestGame() {
//   const [userInput, setUserInput] = useState("");
//   const [gameHTML, setGameHTML] = useState("");
//   const [genTime, setGenTime] = useState<number | null>(null);
//   const [loading, setLoading] = useState(false);
  

//   const handleGenerate = async () => {
//     if (!userInput.trim()) return;

//     setLoading(true);
//     setGameHTML("");
//     setGenTime(null);

//     const start = performance.now();

//     try {
//       const fullPrompt = `${gamePrompt}

// Task:
// ${userInput}`;

//       const res = await fetch("http://127.0.0.1:8000/anthropic-game", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({
//           prompt: fullPrompt,
//         }),
//       });

//       const data = await res.json();

//       let html = data.html;

//       // 🧼 clean markdown if needed
//       html = cleanHTML(html);

//       const end = performance.now();

//       setGenTime(end - start);
//       setGameHTML(html);
//     } catch (err) {
//       console.error("Anthropic Error:", err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const cleanHTML = (html: string) => {
//     if (typeof html !== "string") return "";
//     return html
//       .replace(/```html/g, "")
//       .replace(/```/g, "")
//       .trim();
//   };

//   return (
//     <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
//       <h2>🧪 Anthropic Game Generator</h2>

//       {/* Input */}
//       <textarea
//         placeholder="e.g. Create a game about identifying valid emails"
//         value={userInput}
//         onChange={(e) => setUserInput(e.target.value)}
//         style={{
//           width: "100%",
//           height: "100px",
//           padding: "10px",
//           marginBottom: "10px",
//           borderRadius: "8px",
//           border: "1px solid #ccc",
//         }}
//       />

//       {/* Button */}
//       <button
//         onClick={handleGenerate}
//         disabled={loading}
//         style={{
//           padding: "10px 16px",
//           borderRadius: "8px",
//           border: "none",
//           background: "#2563eb",
//           color: "white",
//           cursor: "pointer",
//         }}
//       >
//         {loading ? "Generating..." : "Generate Game"}
//       </button>

//       {/* Time */}
//       {genTime && (
//         <p style={{ marginTop: "10px", fontSize: "14px", color: "#555" }}>
//           ⏱ Generation time: {(genTime / 1000).toFixed(2)}s
//         </p>
//       )}

//       {/* Game */}
//       {gameHTML && (
//         <div style={{ marginTop: "20px" }}>
//           <Game htmlContent={gameHTML} user_id="123" content_id="abc" session_id="ufg" />
//         </div>
//       )}
//     </div>
//   );
// }
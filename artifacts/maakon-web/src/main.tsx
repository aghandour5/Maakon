import { createRoot } from "react-dom/client";
import App from "./App";
import { DevNoticeBar } from "@/components/layout/DevNoticeBar";
import "./index.css";

createRoot(document.getElementById("root")!).render( // createRoot is a function that creates a root for a React tree.
  <>
    <DevNoticeBar />
    <App />
  </>
);

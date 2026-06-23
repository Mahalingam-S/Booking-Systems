import { createRoot } from "react-dom/client";
import { GoogleOAuthProvider } from "@react-oauth/google";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <GoogleOAuthProvider clientId="666601473845-0cq4am2ff0qvjb8adu6lpiusc8psb2tj.apps.googleusercontent.com">
    <App />
  </GoogleOAuthProvider>
);

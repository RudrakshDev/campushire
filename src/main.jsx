
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

let appTree;
if (PUBLISHABLE_KEY) {
  const { ClerkProvider } = require("@clerk/clerk-react");
  const { shadesOfPurple } = require("@clerk/themes");
  appTree = (
    <React.StrictMode>
      <ClerkProvider
        appearance={{ baseTheme: shadesOfPurple }}
        publishableKey={PUBLISHABLE_KEY}
        afterSignOutUrl="/"
      >
        <App />
      </ClerkProvider>
    </React.StrictMode>
  );
} else {
  appTree = (
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(appTree);

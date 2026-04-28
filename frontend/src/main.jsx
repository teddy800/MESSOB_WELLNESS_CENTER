import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import App from "./App.jsx";
import "./styles/global.css";
import "./styles/layout.css";
import "./styles/login.css";
import "./styles/register.css";
import "./styles/dashboard.css";
import "./styles/dashboard-priority2.css";
import "./styles/dashboard-new-features.css";
import "./styles/manager-dashboard.css";
import "./styles/nurse-dashboard.css";
import "./styles/nurse-dashboard-new.css";
import "./styles/walkin-enhanced.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
);

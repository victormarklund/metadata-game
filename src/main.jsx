import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@radix-ui/themes/styles.css";
import { Theme } from "@radix-ui/themes";
import "src/styles/index.css";
import App from "src/App.jsx";
import { AppContextProvider } from "src/contexts/AppContext.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AppContextProvider>
      <Theme
        appearance="dark"
        accentColor="violet"
        grayColor="slate"
        radius="large"
      >
        <App />
      </Theme>
    </AppContextProvider>
  </StrictMode>,
);

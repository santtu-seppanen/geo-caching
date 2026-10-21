import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";
import { Tilannekuva } from "./features/tilannekuva/Tilannekuva";

// Ainoa erillinen alasivu: telkkarin tilannekuva (/tilannekuva). Muu
// sovellus vaihtaa näkymiä tilalla eikä URL:lla.
const onTilannekuva = window.location.pathname.replace(/\/+$/, "").endsWith("/tilannekuva");

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>{onTilannekuva ? <Tilannekuva /> : <App />}</React.StrictMode>,
);

/// <reference types="vite/client" />

// App.jsx and DevPortal.jsx are still JavaScript and are being migrated
// one module at a time. Until then, treat them as untyped React components.
declare module "*.jsx" {
  import type { ComponentType } from "react";
  const Component: ComponentType;
  export default Component;
}

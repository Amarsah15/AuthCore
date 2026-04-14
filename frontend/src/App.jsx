import { useEffect } from "react";
import { AppRouter } from "./routes/AppRouter";
import { useAuthStore } from "./store/auth.store";

export default function App() {
  const hydrateAuth = useAuthStore((state) => state.hydrateAuth);

  useEffect(() => {
    hydrateAuth();
  }, [hydrateAuth]);

  return <AppRouter />;
}

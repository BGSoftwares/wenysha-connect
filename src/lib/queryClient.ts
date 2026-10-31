import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient();

if (typeof window !== "undefined") {
  window.addEventListener("storage", (event) => {
    if (event.key === "ablegodcollege_user") queryClient.clear();
  });
}

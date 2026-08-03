import { createContext, useContext } from "react";

export const ShellToastContext = createContext(() => {});

export function useShellToast() {
  return useContext(ShellToastContext);
}

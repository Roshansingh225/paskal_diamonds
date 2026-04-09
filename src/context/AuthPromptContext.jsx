import { createContext, useContext, useMemo, useState } from 'react';

const AuthPromptContext = createContext(null);

export function AuthPromptProvider({ children }) {
  const [open, setOpen] = useState(false);

  function openAuthPrompt() {
    setOpen(true);
  }

  function closeAuthPrompt() {
    setOpen(false);
  }

  const value = useMemo(
    () => ({
      open,
      openAuthPrompt,
      closeAuthPrompt,
    }),
    [open],
  );

  return <AuthPromptContext.Provider value={value}>{children}</AuthPromptContext.Provider>;
}

export const useAuthPrompt = () => useContext(AuthPromptContext);

import React, { createContext, useState, useContext, useEffect } from "react";

interface BrandingContextType {
  projectName: string;
  setProjectName: (name: string) => void;
}

const BrandingContext = createContext<BrandingContextType | undefined>(undefined);

export const BrandingProvider: React.FC<{children: React.ReactNode}> = ({children}) => {
  const [projectName, setProjectNameState] = useState<string>(() => {
    return localStorage.getItem("projectName") || "Indian Kitchen";
  });

  const setProjectName = (name: string) => {
    setProjectNameState(name);
    localStorage.setItem("projectName", name);
  };

  useEffect(() => {
    // Keep in sync with localstorage changes from other tabs/windows, if needed.
    const listener = () => {
      const newName = localStorage.getItem("projectName") || "Indian Kitchen";
      setProjectNameState(newName);
    };
    window.addEventListener("storage", listener);
    return () => window.removeEventListener("storage", listener);
  }, []);

  return (
    <BrandingContext.Provider value={{projectName, setProjectName}}>
      {children}
    </BrandingContext.Provider>
  );
};

export const useBranding = () => {
  const ctx = useContext(BrandingContext);
  if (!ctx) throw new Error("useBranding must be used within BrandingProvider");
  return ctx;
};

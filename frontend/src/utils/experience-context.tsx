import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type Experience = 'modern' | 'legacy' | 'classic' | 'amateur';

interface ExperienceContextType {
  experience: Experience;
  setExperience: (exp: Experience) => void;
}

const ExperienceContext = createContext<ExperienceContextType | undefined>(undefined);

export function ExperienceProvider({ children }: { children: ReactNode }) {
  const [experience, setExperienceState] = useState<Experience>(() => {
    const saved = localStorage.getItem("experience");
    return (saved as Experience) || "modern";
  });

  const setExperience = (exp: Experience) => {
    setExperienceState(exp);
    localStorage.setItem("experience", exp);
    
    // Update body class for global CSS targeting
    document.body.classList.remove('exp-modern', 'exp-legacy', 'exp-classic', 'exp-amateur');
    document.body.classList.add(`exp-${exp}`);
  };

  useEffect(() => {
    // Initial class set
    document.body.classList.add(`exp-${experience}`);
  }, []);

  return (
    <ExperienceContext.Provider value={{ experience, setExperience }}>
      {children}
    </ExperienceContext.Provider>
  );
}

export function useExperience() {
  const context = useContext(ExperienceContext);
  if (context === undefined) {
    throw new Error("useExperience must be used within an ExperienceProvider");
  }
  return context;
}

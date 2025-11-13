import React, { createContext, useState, useContext } from 'react';

const SeedsContext = createContext();

export function SeedsProvider({ children }) {
  const [seeds, setSeeds] = useState([]);

  const addSeed = (taskType) => {
    const newSeed = {
      id: Date.now().toString(),
      taskType: taskType,
      createdAt: new Date(),
      progress: 0,
    };
    setSeeds([...seeds, newSeed]);
    return newSeed;
  };

  const updateSeedProgress = (seedId, progress) => {
    setSeeds(seeds.map(seed => 
      seed.id === seedId ? { ...seed, progress } : seed
    ));
  };

  return (
    <SeedsContext.Provider value={{ seeds, addSeed, updateSeedProgress }}>
      {children}
    </SeedsContext.Provider>
  );
}

export function useSeeds() {
  const context = useContext(SeedsContext);
  if (!context) {
    throw new Error('useSeeds must be used within a SeedsProvider');
  }
  return context;
}


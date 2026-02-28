import React, { createContext, useContext, useState } from 'react';

const CheckinContext = createContext(null);

export function CheckinProvider({ children }) {
  const [layer1, setLayer1] = useState(null);
  const [layer2, setLayer2] = useState(null);

  function reset() {
    setLayer1(null);
    setLayer2(null);
  }

  return (
    <CheckinContext.Provider value={{ layer1, setLayer1, layer2, setLayer2, reset }}>
      {children}
    </CheckinContext.Provider>
  );
}

export function useCheckin() {
  return useContext(CheckinContext);
}

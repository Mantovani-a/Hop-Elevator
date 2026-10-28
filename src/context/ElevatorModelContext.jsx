import { createContext, useContext, useMemo } from 'react';
import { elevatorRegions } from '../data/elevatorRegions';
import { buildDisplayNameMap } from '../utils/modelNameTranslator';

const allMeshNames = elevatorRegions.flatMap((region) => region.meshNames);
const defaultDisplayNameMap = buildDisplayNameMap(allMeshNames);

const fallbackContext = {
  elevatorId: null,
  dynamicRegions: elevatorRegions,
  displayNameMap: defaultDisplayNameMap,
  restoredFromDB: true,
};

const ElevatorModelContext = createContext(fallbackContext);

export function useElevatorModel() {
  return useContext(ElevatorModelContext) || fallbackContext;
}

export function ElevatorModelScope({ elevatorId, children }) {
  const value = useMemo(() => ({
    elevatorId,
    dynamicRegions: elevatorRegions,
    displayNameMap: defaultDisplayNameMap,
    restoredFromDB: true,
  }), [elevatorId]);

  return (
    <ElevatorModelContext.Provider value={value}>
      {children}
    </ElevatorModelContext.Provider>
  );
}

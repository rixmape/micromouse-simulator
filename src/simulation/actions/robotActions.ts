import type { Coordinates, SimulationAction } from '../../types';

export function updateRobotPosition(coords: Coordinates): SimulationAction {
  return {
    type: 'UPDATE_ROBOT_POSITION',
    payload: coords,
  };
}

export function addVisitedCell(coordString: string): SimulationAction {
  return {
    type: 'ADD_VISITED_CELL',
    payload: coordString,
  };
}

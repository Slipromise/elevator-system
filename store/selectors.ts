import { createSelector } from 'reselect'
import { RootState } from '.'

export const elevatorSelector = (state:RootState) => state.elevator

export const pickupPassengerListSelector = createSelector(elevatorSelector,({waitings,elevators})=>{
    const result:number[] =[];

    for (let i = 0; i < elevators.length; i++) {
        const elevator = elevators[i];

        if (elevator.isDoorOpen) {
            result.push(elevator.id);
          break;
        }

    }
    return result;
})
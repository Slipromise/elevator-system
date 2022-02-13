import { configureStore } from "@reduxjs/toolkit";
import elevatorSlice from "./elevatorSlice";


const store = configureStore({
  reducer: {
    elevator:elevatorSlice
  },
});


export default store;

export type RootState = ReturnType<typeof store.getState>;
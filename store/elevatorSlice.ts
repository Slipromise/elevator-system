import { createSlice, PayloadAction } from "@reduxjs/toolkit";

let passengerId = 0;

let elevationId = 0;

const randomNames = [
  "Emilie Stanley",
  "Randy Collins",
  "Maude Terry",
  "Alice Schneider",
  "Addie Brooks",
  "Nathaniel Taylor",
  "Juan White",
  "Danny Curtis",
  "Randall Gibbs",
  "Adam Lyons",
  "Micheal Williamson",
  "Harold Lindsey",
  "Albert Mason",
  "Glenn Hardy",
  "Harry Garza",
  "Rena King",
  "Addie Burke",
  "Dennis Roy",
  "Callie Gill",
  "Dean White",
  "Adeline Kennedy",
  "Alice Spencer",
  "Peter Hamilton",
  "Mario Wheeler",
  "Leona Mathis",
  "Mollie Gibbs",
  "Derrick Dixon",
  "Micheal Hudson",
  "Marcus Smith",
  "Bobby Gray",
  "Anne Scott",
  "Scott Burgess",
  "Lina Sherman",
  "Jeffery Roberts",
  "Sarah Sherman",
  "Isabelle Andrews",
  "Lucy Nguyen",
  "Philip Lynch",
  "Kathryn Drake",
  "Roy Rogers",
  "Michael Cobb",
  "Keith Norton",
  "Lena Watson",
  "Jason Walters",
  "Kathryn Wolfe",
  "Ricardo Henderson",
  "Mario Walker",
  "Matilda Barnes",
  "Landon Curtis",
  "Carolyn Lawrence",
];

type Passenger = {
  id: number;
  fromFloor: number;
  toFloor: number;
  name: string;
};

type State = {
  floorCount: number;
  elevatorCount: number;
  capacity: number;
  secondsOfFloor: number;
  secondsOfPickup: number;
  secondsOfPeople: number;
  numberOfPeopleGenerated: number;
  targetPeople: number;
  currentPeople: number;
  totalSeconds: number;
  status: "initialization" | "running" | "ending";
  waitings: Passenger[];
  elevators: {
    id: number;
    floor: number;
    passengers: Passenger[];
    status: "idle" | "down" | "up";
    isDoorOpen: boolean;
  }[];
};

const initialState: State = {
  floorCount: 10,
  elevatorCount: 2,
  capacity: 5,
  secondsOfFloor: 1,
  secondsOfPickup: 1,
  secondsOfPeople: 1,
  numberOfPeopleGenerated: 1,
  targetPeople: 40,
  currentPeople: 0,
  totalSeconds: 0,
  status: "initialization",
  waitings: [],
  elevators: [],
};

const elevatorSlice = createSlice({
  name: "elevatorSlice",
  initialState,
  reducers: {
    setting: (
      state,
      {
        payload,
      }: PayloadAction<
        Partial<
          Pick<
            State,
            | "capacity"
            | "floorCount"
            | "elevatorCount"
            | "secondsOfFloor"
            | "secondsOfPickup"
            | "secondsOfPeople"
            | "numberOfPeopleGenerated"
            | "targetPeople"
          >
        >
      >
    ) => {
      return { ...state, ...payload };
    },
    start: (state) => {
      const { elevatorCount } = state;
      const elevators = [...state.elevators];
      

      while (elevators.length < elevatorCount) {
        elevators.push({
          id: elevationId++,
          floor: 1,
          passengers: [],
          status: "idle",
          isDoorOpen: false,
        });
      }

      state.status = "running";
      state.elevators = elevators;
      state.totalSeconds = 0;
      state.waitings = [];
      state.currentPeople = 0;
    },
    timing: (state) => {
      state.totalSeconds = state.totalSeconds + 1;
    },
    randomPassengers: (state) => {
      const waitings = [...state.waitings];
      const {
        floorCount,
        currentPeople,
        elevators,
        numberOfPeopleGenerated,
        targetPeople,
      } = state;

      const hasCreatedCount =
        currentPeople +
        waitings.length +
        elevators.reduce((prev, curr) => prev + curr.passengers.length, 0);

      const createCount =
        hasCreatedCount + numberOfPeopleGenerated > targetPeople
          ? targetPeople - hasCreatedCount
          : numberOfPeopleGenerated;

      for (let i = 0; i < createCount; i++) {
        const fromFloor = getRandom(1, floorCount);
        let toFloor = getRandom(1, floorCount - 1);
        if (fromFloor === toFloor) {
          toFloor++;
        }
        passengerId++;
        waitings.push({
          toFloor,
          fromFloor,
          id: passengerId,
          name: randomNames[passengerId % randomNames.length],
        });
      }

      state.waitings = waitings;
    },
    pickupPassenger: (state, { payload }: PayloadAction<number>) => {
      // 1.更新各樓層等待人員 (上電梯) waitings
      // 2.更新電梯門開關 elevators>isDoorOpen
      // 3.更新電梯狀態 elevators>status
      // 4.更新電梯乘客 (上電梯) elevators>passengers
      // 5.達到目的人員數 currentPeople
      const { capacity, waitings, targetPeople, status } = state;
      const elevators = [...state.elevators];
      const foundElevation = elevators.find(({ id }) => id === payload);
      let currentPeople = state.currentPeople;

      if (!foundElevation || !foundElevation.isDoorOpen) return state;
      currentPeople += foundElevation.passengers.filter(
        ({ toFloor }) => toFloor === foundElevation.floor
      ).length;

      foundElevation.passengers = foundElevation.passengers.filter(
        ({ toFloor }) => toFloor !== foundElevation.floor
      );

      const waitingFounder = ({ fromFloor, toFloor }: Passenger) =>
        fromFloor === foundElevation.floor &&
        ((foundElevation.status === "up" && toFloor > fromFloor) ||
          (foundElevation.status === "down" && toFloor < fromFloor));

      let foundPassengerIndex = waitings.findIndex(waitingFounder);

      while (
        foundElevation.passengers.length < capacity &&
        foundPassengerIndex !== -1
      ) {
        foundElevation.passengers.push(waitings[foundPassengerIndex]);
        waitings.splice(foundPassengerIndex, 1);
        foundPassengerIndex = waitings.findIndex(waitingFounder);
      }

      foundElevation.status =
        foundElevation.passengers.length <= 0 ? "idle" : foundElevation.status;

      foundElevation.isDoorOpen = false;

      state.waitings = waitings;
      state.elevators = elevators;
      state.currentPeople = currentPeople;
      state.status = targetPeople === currentPeople ? "ending" : status;
    },
    updateElevators: (state) => {
      // 1.更新電梯狀態  elevators>status  "idle" | "down" | "up"
      // 2.更新電梯門開關  elevators>isDoorOpen
      const { waitings, capacity, floorCount } = state;
      const elevators = waitings
        .reduce(getElevationStatusReducer(capacity, floorCount), [
          ...state.elevators.map((item) => ({
            ...item,
            status: item.passengers.length === 0 ? "idle" : item.status,
          })),
        ])
        .map((elevator) => {
          const { floor, status, passengers } = elevator;

          const foundPickupPassenger = waitings.find(
            ({ fromFloor, toFloor }) =>
              fromFloor === floor &&
              ((status === "up" && toFloor > fromFloor) ||
                (status === "down" && toFloor < fromFloor))
          );
          // 是否有下電梯乘客 以及 有空位且須上電梯乘客
          const isDoorOpen =
            !!passengers.find(({ toFloor }) => floor === toFloor) ||
            (passengers.length < capacity && !!foundPickupPassenger);

          return {
            ...elevator,
            floor: isDoorOpen
              ? floor
              : status === "up"
              ? floor + 1
              : status === "down"
              ? floor - 1
              : floor,
            isDoorOpen,
          };
        });

      state.elevators = elevators;
    },
  },
});

const getElevationStatusReducer =
  (capacity: number, maxFloor: number) =>
  (prev: State["elevators"], curr: Passenger) => {
    const { fromFloor, toFloor } = curr;

    const isPassengerGotoUp = fromFloor < toFloor;

    // 移動中且同向電梯們（含末端狀況） 並 依近到遠排序
    const runningMatchElevations = prev
      .filter(
        ({ status, floor, passengers }) =>
          passengers.length < capacity &&
          ((isPassengerGotoUp && status === "up" && floor <= fromFloor) ||
            (isPassengerGotoUp &&
              status === "down" &&
              fromFloor === 1 &&
              floor === 1) ||
            (!isPassengerGotoUp && status === "down" && floor >= fromFloor) ||
            (!isPassengerGotoUp &&
              status === "up" &&
              fromFloor === maxFloor &&
              floor === maxFloor))
      )
      .sort(
        (a, b) => Math.abs(fromFloor - a.floor) - Math.abs(fromFloor - b.floor)
      );
    // 閒置電梯們 並 依近到遠排序
    const idleElevators = prev
      .filter(({ status }) => status === "idle")
      .sort(
        (a, b) => Math.abs(fromFloor - a.floor) - Math.abs(fromFloor - b.floor)
      );

    const foundElevation =
      runningMatchElevations.length === 0
        ? idleElevators[0]
        : runningMatchElevations[0];

    // 決定電梯狀態
    if (foundElevation?.status === "idle") {
      foundElevation.status =
        foundElevation.floor === fromFloor
          ? fromFloor < toFloor
            ? "up"
            : "down"
          : foundElevation.floor < fromFloor
          ? "up"
          : foundElevation.floor > fromFloor
          ? "down"
          : "idle";
    } else if (
      foundElevation?.status === "up" &&
      foundElevation?.floor === maxFloor
    ) {
      foundElevation.status = "down";
    } else if (
      foundElevation?.status === "down" &&
      foundElevation?.floor === 1
    ) {
      foundElevation.status = "up";
    }

    return prev;
  };

const getRandom = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

export const {
  setting,
  start,
  randomPassengers,
  timing,
  updateElevators,
  pickupPassenger,
} = elevatorSlice.actions;

export default elevatorSlice.reducer;

import type { Saga } from "redux-saga";

export interface UseReactSagaOptions<State, Action> {
  state: State;
  dispatch: (action: Action) => unknown;
  saga: Saga;
}

export function useReactSaga<State, Action>(
  options: UseReactSagaOptions<State, Action>,
): (action: Action) => void;

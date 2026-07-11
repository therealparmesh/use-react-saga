import { afterEach, describe, expect, test } from "bun:test";

import { act, createElement, useReducer } from "react";
import { createRoot } from "react-dom/client";
import { call, cancelled, put as sagaPut, select, take } from "redux-saga/effects";

import { useReactSaga } from "../src/index.js";

let root;
let container;

function mount(Component, props = {}) {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => root.render(createElement(Component, props)));
}

afterEach(() => {
  if (root) act(() => root.unmount());
  container?.remove();
  root = undefined;
  container = undefined;
  document.body.replaceChildren();
});

describe("useReactSaga", () => {
  test("selects the current React state", () => {
    let selectedState;

    function* saga() {
      selectedState = yield select((state) => state);
    }

    function Fixture() {
      useReactSaga({ state: 7, dispatch: () => {}, saga });
      return null;
    }

    mount(Fixture);
    expect(selectedState).toBe(7);
  });

  test("makes updated React state available to select after put", async () => {
    let send;
    let selectedState;

    function* saga() {
      yield take("start");
      yield call(() => Promise.resolve());
      yield sagaPut({ type: "increment" });
      selectedState = yield select((state) => state);
    }

    function Fixture() {
      const [state, dispatch] = useReducer(
        (value, action) => (action.type === "increment" ? value + 1 : value),
        0,
      );
      send = useReactSaga({ state, dispatch, saga });
      return createElement("output", null, state);
    }

    mount(Fixture);
    await act(async () => {
      send({ type: "start" });
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(container.textContent).toBe("1");
    expect(selectedState).toBe(1);
  });

  test("uses the latest dispatch without restarting the saga", () => {
    const calls = [];
    let send;
    const sagaStarts = [];

    function* saga() {
      sagaStarts.push(true);
      yield take("never");
    }

    function Fixture({ dispatch }) {
      send = useReactSaga({ state: 0, dispatch, saga });
      return null;
    }

    mount(Fixture, { dispatch: (action) => calls.push(["first", action]) });
    act(() =>
      root.render(
        createElement(Fixture, {
          dispatch: (action) => calls.push(["second", action]),
        }),
      ),
    );
    act(() => send({ type: "test" }));

    expect(calls).toEqual([["second", { type: "test" }]]);
    expect(sagaStarts).toHaveLength(1);
  });

  test("cancels the saga during cleanup", () => {
    let wasCancelled = false;

    function* saga() {
      try {
        yield take("never");
      } finally {
        wasCancelled = yield cancelled();
      }
    }

    function Fixture() {
      useReactSaga({ state: 0, dispatch: () => {}, saga });
      return null;
    }

    mount(Fixture);
    act(() => root.unmount());
    root = undefined;
    expect(wasCancelled).toBe(true);
  });
});

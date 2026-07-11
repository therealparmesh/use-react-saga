# use-react-saga

[![npm version](https://img.shields.io/npm/v/use-react-saga.svg)](https://www.npmjs.com/package/use-react-saga)
[![npm downloads](https://img.shields.io/npm/dt/use-react-saga.svg)](https://www.npmjs.com/package/use-react-saga)
[![Bun CI](https://github.com/therealparmesh/use-react-saga/actions/workflows/ci.yml/badge.svg)](https://github.com/therealparmesh/use-react-saga/actions/workflows/ci.yml)
[![license](https://img.shields.io/npm/l/use-react-saga.svg)](LICENSE)

Run a Redux Saga from a React hook without creating a Redux store. Based on an
idea by [@Andarist](https://github.com/Andarist).

## Installation

```sh
npm install use-react-saga redux-saga
```

Other package managers:

```sh
yarn add use-react-saga redux-saga
pnpm add use-react-saga redux-saga
bun add use-react-saga redux-saga
```

## Usage

```jsx
import * as React from "react";
import { call, delay, put, select, takeLatest } from "redux-saga/effects";
import { useReactSaga } from "use-react-saga";

function* incrementAsync() {
  const previousState = yield select();
  yield call(console.log, "Starting from", previousState);

  yield delay(2000);
  yield put({ type: "INCREMENT" });

  const state = yield select();
  yield call(console.log, "Finished at", state);
}

function* saga() {
  yield takeLatest("INCREMENT_ASYNC", incrementAsync);
}

export function Example() {
  const [state, dispatch] = React.useReducer((state, action) => {
    switch (action.type) {
      case "INCREMENT":
        return state + 1;
      default:
        return state;
    }
  }, 0);

  const send = useReactSaga({ state, dispatch, saga });

  return (
    <div>
      <p>Clicked {state} times!</p>
      <button type="button" onClick={() => send({ type: "INCREMENT_ASYNC" })}>
        Increment async
      </button>
    </div>
  );
}
```

TypeScript declarations are included with the package.

## API

### `useReactSaga({ state, dispatch, saga })`

Returns a stable function for sending actions to both the reducer and the saga
channel. After a Saga `put`, a following `select` waits until React has processed
the state update.

#### `state`

The current React state exposed to Redux Saga `select` effects.

#### `dispatch`

The React reducer dispatch function used for Saga `put` effects.

#### `saga`

The root saga to run while the component is mounted. The saga starts when the
hook mounts and is cancelled when it unmounts. Pass a stable saga function;
replacing it does not restart the running task.

## Runtime requirements

- React 16.8 or newer
- Redux Saga 1.5 or newer
- An ESM-compatible runtime or bundler

React and Redux Saga are peer dependencies.

## Development

Run the test suite:

```sh
bun run test
```

Inspect the package contents before publishing:

```sh
bun pm pack --dry-run
```

## License

[MIT](LICENSE)

import React from 'react';
import { stdChannel, runSaga } from 'redux-saga';
import { take, call, effectTypes } from 'redux-saga/effects';

const REACT_STATE_READY = '@@REACT_STATE_READY';

function* selectAsync(selector, args) {
  const { state } = yield take(REACT_STATE_READY);
  const selected = yield call(selector, state, ...args);

  return selected;
}

export function useReactSaga({ state, dispatch, saga }) {
  const environment = React.useRef({
    channel: stdChannel(),
    state,
    actions: [],
  });

  const [_, forceUpdate] = React.useState({});

  const put = React.useCallback(
    (action) => {
      dispatch(action);
      environment.current.actions.push(action);
      forceUpdate({});
    },
    [dispatch],
  );

  React.useEffect(() => {
    environment.current.state = state;

    if (environment.current.actions.length > 0) {
      const actions = environment.current.actions;
      environment.current.actions = [];

      actions.forEach((action) => environment.current.channel.put(action));
      environment.current.channel.put({
        type: REACT_STATE_READY,
        state,
      });
    }
  });

  React.useEffect(() => {
    const task = runSaga(
      {
        channel: environment.current.channel,
        getState: () => {},
        dispatch: put,
        effectMiddlewares: [
          (runEffect) => (effect) =>
            effect.type === effectTypes.SELECT
              ? runEffect(
                  call(
                    selectAsync,
                    effect.payload.selector,
                    effect.payload.args,
                  ),
                )
              : runEffect(effect),
        ],
      },
      saga,
    );

    return () => {
      task.cancel();
    };
  }, [put, saga]);

  return put;
}

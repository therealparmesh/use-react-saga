import React from 'react';
import { stdChannel, runSaga } from 'redux-saga';
import { take, call, effectTypes } from 'redux-saga/effects';

const STATE_READY = '@@STATE_READY';

export const useReactSaga = ({ state, dispatch, saga }) => {
  const environment = React.useRef({
    state,
    channel: stdChannel(),
    actions: [],
    stateChangePossible: false,
  });

  const [_, forceUpdate] = React.useState({});

  const put = React.useCallback((action) => {
    dispatch(action);
    environment.current.actions.push(action);
    forceUpdate({});
  }, []);

  React.useEffect(() => {
    environment.current.state = state;

    if (environment.current.actions.length > 0) {
      const actions = environment.current.actions;
      environment.current.actions = [];

      actions.forEach((action) => environment.current.channel.put(action));
      environment.current.channel.put({
        type: STATE_READY,
        payload: state,
      });

      environment.current.stateChangePossible = false;
    }
  });

  React.useEffect(() => {
    const task = runSaga(
      {
        getState: () => environment.current.state,
        dispatch: put,
        channel: environment.current.channel,
        effectMiddlewares: [
          (runEffect) => (effect) => {
            const stateChangePossible = environment.current.stateChangePossible;

            if (effect.type === effectTypes.PUT) {
              environment.current.stateChangePossible = true;
            }

            if (effect.type === effectTypes.SELECT && stateChangePossible) {
              environment.current.stateChangePossible = false;

              return runEffect(
                call(
                  function* (selector, args) {
                    const action = yield take(STATE_READY);

                    return yield call(selector, action.payload, ...args);
                  },
                  effect.payload.selector,
                  effect.payload.args,
                ),
              );
            }

            return runEffect(effect);
          },
        ],
      },
      saga,
    );

    return () => task.cancel();
  }, []);

  return put;
};

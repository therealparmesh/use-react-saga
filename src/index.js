import React from 'react';
import { stdChannel, runSaga } from 'redux-saga';
import { take, call, effectTypes } from 'redux-saga/effects';

const NEXT_STATE = '@@NEXT_STATE';

export const useReactSaga = ({ state, dispatch, saga }) => {
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
        type: NEXT_STATE,
        state,
      });
    }
  });

  React.useEffect(() => {
    const task = runSaga(
      {
        channel: environment.current.channel,
        dispatch: put,
        effectMiddlewares: [
          (runEffect) => (effect) =>
            runEffect(
              effect.type === effectTypes.SELECT
                ? call(
                    function* (selector, args) {
                      const { state } = yield take(NEXT_STATE);
                      const selected = yield call(selector, state, ...args);

                      return selected;
                    },
                    effect.payload.selector,
                    effect.payload.args,
                  )
                : effect,
            ),
        ],
      },
      saga,
    );

    return () => task.cancel();
  }, [put, saga]);

  return put;
};

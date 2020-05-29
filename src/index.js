import React from 'react';
import { stdChannel, runSaga } from 'redux-saga';
import { effectTypes } from 'redux-saga/effects';

export const useReactSaga = ({ state, dispatch, saga }) => {
  const environment = React.useRef({
    state,
    channel: stdChannel(),
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
      environment.current.channel.put({});
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
            if (effect.type === effectTypes.SELECT) {
              environment.current.channel.take(() => runEffect(effect));
            } else {
              runEffect(effect);
            }
          },
        ],
      },
      saga,
    );

    return () => task.cancel();
  }, [put, saga]);

  return put;
};

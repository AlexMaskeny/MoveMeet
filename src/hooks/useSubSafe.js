import { ConnectionState } from '@aws-amplify/pubsub';
import { Hub } from 'aws-amplify';
import { useRef } from 'react';

import * as logger from '../functions/logger';

export default function useSubSafe(update) {
    const priorConnectionState = useRef("Begin");
    Hub.listen('api', (data) => {
        const { payload } = data;
        const condition1 = (priorConnectionState.current === ConnectionState.Connecting && payload.message === ConnectionState.Connected)
        const condition2 = (priorConnectionState.current === ConnectionState.ConnectedPendingNetwork && payload.message === ConnectionState.Connected);
        if (condition1 || condition2) {
            logger.warn("[SUBSAFE] Refreshing...");
            update();
        }
        priorConnectionState.current = payload.message
    });
}
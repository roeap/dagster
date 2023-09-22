import {gql, NetworkStatus, useQuery} from '@apollo/client';
import uniq from 'lodash/uniq';
import React from 'react';

import {useQueryRefreshAtInterval} from '../app/QueryRefresh';
import {AssetKeyInput} from '../graphql/types';
import {useDidLaunchEvent} from '../runs/RunUtils';

import {observeAssetEventsInRuns} from './AssetRunLogObserver';
import {buildLiveData, tokenForAssetKey} from './Utils';
import {
  AssetGraphLiveQuery,
  AssetGraphLiveQueryVariables,
} from './types/useLiveDataForAssetKeys.types';
import {useLiveDataForAssetKeysBatcher} from './useLiveDataForAssetKeysBatcher';

const SUBSCRIPTION_IDLE_POLL_RATE = 30 * 1000;
const SUBSCRIPTION_MAX_POLL_RATE = 2 * 1000;

/** Fetches the last materialization, "upstream changed", and other live state
 * for the assets in the given pipeline or in the given set of asset keys (or both).
 *
 * Note: The "upstream changed" flag cascades, so it may not appear if the upstream
 * node that has changed is not in scope.
 */
export function useLiveDataForAssetKeys(assetKeys: AssetKeyInput[], batched?: boolean) {
  const {currentBatch, nextBatch, setBatchData, isLastBatch} =
    useLiveDataForAssetKeysBatcher(assetKeys);

  const liveResult = useQuery<AssetGraphLiveQuery, AssetGraphLiveQueryVariables>(
    ASSETS_GRAPH_LIVE_QUERY,
    {
      skip: assetKeys.length === 0,
      variables: {assetKeys: batched ? currentBatch : assetKeys},
      notifyOnNetworkStatusChange: true,
    },
  );

  const liveDataByNode = React.useMemo(() => {
    const data = liveResult.data ? buildLiveData(liveResult.data) : {};
    if (batched) {
      return setBatchData(data);
    }
    return data;
  }, [liveResult.data, setBatchData, batched]);

  React.useEffect(() => {
    if (batched && !isLastBatch && !liveResult.loading && liveResult.data) {
      nextBatch();
    }
  }, [batched, liveResult.loading, liveResult.data, isLastBatch, nextBatch]);

  // Track whether the data is being refetched so incoming asset events don't trigger
  // duplicate requests for live data.
  const fetching = React.useRef(false);
  fetching.current = [NetworkStatus.refetch, NetworkStatus.loading].includes(
    liveResult.networkStatus,
  );

  const timerRef = React.useRef<NodeJS.Timeout | null>(null);

  const refetch = React.useCallback(() => {
    if (batched) {
      if (isLastBatch) {
        // If we're not on the last batch we're still fetching so don't immediately refetch
        nextBatch();
      }
    } else {
      liveResult.refetch();
    }
  }, [batched, isLastBatch, liveResult, nextBatch]);

  const onRefreshDebounced = React.useCallback(() => {
    // This is a basic `throttle`, except that if it fires and finds the live
    // query is already refreshing it debounces again.
    const fire = () => {
      if (fetching.current) {
        timerRef.current = setTimeout(fire, SUBSCRIPTION_MAX_POLL_RATE);
      } else {
        timerRef.current = null;
        refetch();
      }
    };
    if (!timerRef.current) {
      timerRef.current = setTimeout(fire, SUBSCRIPTION_MAX_POLL_RATE);
    }
  }, [timerRef, refetch]);

  React.useEffect(() => {
    return () => {
      timerRef.current && clearTimeout(timerRef.current);
    };
  }, []);

  // If the event log storage does not support streaming us asset events, fall back to
  // a polling approach and trigger a single refresh when a run is launched for immediate feedback
  const liveDataRefreshState = useQueryRefreshAtInterval(
    liveResult,
    SUBSCRIPTION_IDLE_POLL_RATE,
    true,
    refetch,
  );

  useDidLaunchEvent(refetch, SUBSCRIPTION_MAX_POLL_RATE);

  React.useEffect(() => {
    const assetKeyTokens = new Set(assetKeys.map(tokenForAssetKey));
    const assetStepKeys = new Set(liveResult.data?.assetNodes.flatMap((n) => n.opNames) || []);
    const runInProgressId = uniq(
      Object.values(liveDataByNode).flatMap((p) => [
        ...p.unstartedRunIds,
        ...p.inProgressRunIds,
        ...p.assetChecks
          .map((c) => c.executionForLatestMaterialization)
          .filter(Boolean)
          .map((e) => e!.runId),
      ]),
    ).sort();

    const unobserve = observeAssetEventsInRuns(runInProgressId, (events) => {
      if (
        events.some(
          (e) =>
            (e.assetKey && assetKeyTokens.has(tokenForAssetKey(e.assetKey))) ||
            (e.stepKey && assetStepKeys.has(e.stepKey)),
        )
      ) {
        onRefreshDebounced();
      }
    });
    return unobserve;
  }, [onRefreshDebounced, assetKeys, liveDataByNode, liveResult]);

  return {
    liveDataByNode,
    liveDataRefreshState,
    assetKeys,
    isBatching: !isLastBatch,
  };
}

export const ASSET_LATEST_INFO_FRAGMENT = gql`
  fragment AssetLatestInfoFragment on AssetLatestInfo {
    assetKey {
      path
    }
    unstartedRunIds
    inProgressRunIds
    latestRun {
      id
      ...AssetLatestInfoRun
    }
  }

  fragment AssetLatestInfoRun on Run {
    status
    endTime
    id
  }
`;

const ASSET_NODE_LIVE_FRAGMENT = gql`
  fragment AssetNodeLiveFragment on AssetNode {
    id
    opNames
    repository {
      id
    }
    assetKey {
      path
    }
    assetMaterializations(limit: 1) {
      ...AssetNodeLiveMaterialization
    }
    assetObservations(limit: 1) {
      ...AssetNodeLiveObservation
    }
    assetChecks {
      name
      canExecuteIndividually
      executionForLatestMaterialization {
        id
        runId
        status
        evaluation {
          severity
        }
      }
    }
    freshnessInfo {
      ...AssetNodeLiveFreshnessInfo
    }
    staleStatus
    staleCauses {
      key {
        path
      }
      reason
      category
      dependency {
        path
      }
    }
    partitionStats {
      numMaterialized
      numMaterializing
      numPartitions
      numFailed
    }
  }

  fragment AssetNodeLiveFreshnessInfo on AssetFreshnessInfo {
    currentMinutesLate
  }

  fragment AssetNodeLiveMaterialization on MaterializationEvent {
    timestamp
    runId
  }

  fragment AssetNodeLiveObservation on ObservationEvent {
    timestamp
    runId
  }
`;

export const ASSETS_GRAPH_LIVE_QUERY = gql`
  query AssetGraphLiveQuery($assetKeys: [AssetKeyInput!]!) {
    assetNodes(assetKeys: $assetKeys, loadMaterializations: true) {
      id
      ...AssetNodeLiveFragment
    }
    assetsLatestInfo(assetKeys: $assetKeys) {
      ...AssetLatestInfoFragment
    }
  }

  ${ASSET_NODE_LIVE_FRAGMENT}
  ${ASSET_LATEST_INFO_FRAGMENT}
`;

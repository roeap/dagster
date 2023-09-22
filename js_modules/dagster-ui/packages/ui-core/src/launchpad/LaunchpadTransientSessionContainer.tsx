import * as React from 'react';

import {
  createSingleSession,
  IExecutionSession,
  IExecutionSessionChanges,
  useInitialDataForMode,
} from '../app/ExecutionSessionStorage';
import {useFeatureFlags} from '../app/Flags';
import {RepoAddress} from '../workspace/types';

import LaunchpadSession from './LaunchpadSession';
import {LaunchpadType} from './types';
import {
  LaunchpadSessionPartitionSetsFragment,
  LaunchpadSessionPipelineFragment,
} from './types/LaunchpadAllowedRoot.types';

interface Props {
  launchpadType: LaunchpadType;
  pipeline: LaunchpadSessionPipelineFragment;
  partitionSets: LaunchpadSessionPartitionSetsFragment;
  repoAddress: RepoAddress;
  sessionPresets: Partial<IExecutionSession>;
  rootDefaultYaml: string | undefined;
}

export const LaunchpadTransientSessionContainer = (props: Props) => {
  const {launchpadType, pipeline, partitionSets, repoAddress, sessionPresets, rootDefaultYaml} =
    props;

  const {flagDisableAutoLoadDefaults} = useFeatureFlags();
  const initialData = useInitialDataForMode(
    pipeline,
    partitionSets,
    rootDefaultYaml,
    !flagDisableAutoLoadDefaults,
  );

  // Avoid supplying an undefined `runConfigYaml` to the session.
  const initialSessionComplete = createSingleSession({
    ...sessionPresets,
    ...(initialData.runConfigYaml ? {runConfigYaml: initialData.runConfigYaml} : {}),
  });

  const [session, setSession] = React.useState<IExecutionSession>(initialSessionComplete);

  const onSaveSession = (changes: IExecutionSessionChanges) => {
    const newSession = {...session, ...changes};
    setSession(newSession);
  };

  return (
    <LaunchpadSession
      launchpadType={launchpadType}
      session={session}
      onSave={onSaveSession}
      pipeline={pipeline}
      partitionSets={partitionSets}
      repoAddress={repoAddress}
      rootDefaultYaml={rootDefaultYaml}
    />
  );
};

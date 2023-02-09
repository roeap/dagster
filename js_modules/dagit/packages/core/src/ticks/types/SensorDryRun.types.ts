// Generated GraphQL types, do not edit manually.

import * as Types from '../../graphql/types';

export type SensorDryRunMutationVariables = Types.Exact<{
  selectorData: Types.SensorSelector;
  cursor?: Types.InputMaybe<Types.Scalars['String']>;
}>;

export type SensorDryRunMutation = {
  __typename: 'DagitMutation';
  sensorDryRun:
    | {
        __typename: 'DryRunInstigationTick';
        timestamp: number | null;
        evaluationResult: {
          __typename: 'TickEvaluation';
          cursor: string | null;
          skipReason: string | null;
          runRequests: Array<{
            __typename: 'RunRequest';
            runConfigYaml: string;
            runKey: string | null;
            tags: Array<{__typename: 'PipelineTag'; key: string; value: string}>;
          }> | null;
          error: {
            __typename: 'PythonError';
            message: string;
            stack: Array<string>;
            errorChain: Array<{
              __typename: 'ErrorChainLink';
              isExplicitLink: boolean;
              error: {__typename: 'PythonError'; message: string; stack: Array<string>};
            }>;
          } | null;
        } | null;
      }
    | {
        __typename: 'PythonError';
        message: string;
        stack: Array<string>;
        errorChain: Array<{
          __typename: 'ErrorChainLink';
          isExplicitLink: boolean;
          error: {__typename: 'PythonError'; message: string; stack: Array<string>};
        }>;
      }
    | {__typename: 'SensorNotFoundError'};
};

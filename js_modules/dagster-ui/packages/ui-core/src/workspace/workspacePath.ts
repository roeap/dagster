import {buildRepoPathForURL} from './buildRepoAddress';
import {RepoAddress} from './types';

export const workspacePath = (repoName: string, repoLocation: string, path = '') => {
  const finalPath = path.startsWith('/') ? path : `/${path}`;
  return `/locations/${buildRepoPathForURL(repoName, repoLocation)}${finalPath}`;
};

type PathConfig = {
  repoName: string;
  repoLocation: string;
  pipelineName: string;
  isJob: boolean;
  path?: string;
};

export const workspacePipelinePath = ({
  repoName,
  repoLocation,
  pipelineName,
  isJob,
  path = '',
}: PathConfig) => {
  const finalPath = path === '' ? '' : path.startsWith('/') ? path : `/${path}`;
  return `/locations/${buildRepoPathForURL(repoName, repoLocation)}/${
    isJob ? 'jobs' : 'pipelines'
  }/${pipelineName}${finalPath}`;
};

export const workspacePipelinePathGuessRepo = (pipelineName: string, path = '') => {
  const finalPath = path === '' ? '' : path.startsWith('/') ? path : `/${path}`;
  return `/guess/${pipelineName}${finalPath}`;
};

export const workspacePathFromAddress = (repoAddress: RepoAddress, path = '') => {
  const {name, location} = repoAddress;
  return workspacePath(name, location, path);
};

type RunDetails = {
  id: string;
  pipelineName: string;
  repositoryName?: string;
  repositoryLocationName?: string;
  isJob: boolean;
};

export const workspacePathFromRunDetails = ({
  id,
  pipelineName,
  repositoryName,
  repositoryLocationName,
  isJob,
}: RunDetails) => {
  const path = `/playground/setup-from-run/${id}`;

  if (repositoryName != null && repositoryLocationName != null) {
    return workspacePipelinePath({
      repoName: repositoryName,
      repoLocation: repositoryLocationName,
      pipelineName,
      isJob,
      path,
    });
  }

  return workspacePipelinePathGuessRepo(pipelineName, path);
};

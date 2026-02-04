// Copyright 2026 The Kubeflow Authors.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import * as React from 'react';
import { IDocumentManager } from '@jupyterlab/docmanager';

import { DeployProgress } from './DeployProgress';

export type UploadPipelineResp = {
  pipeline: { pipelineid: string; versionid: string; name: string };
};

export type RunPipeline = {
  id: string;
  name: string;
  status: string | null;
};

export type DeployProgressState = {
  showValidationProgress?: boolean;
  notebookValidation?: boolean;
  validationWarnings?: string[];
  // showSnapshotProgress?: boolean;
  task?: Record<string, unknown>;
  // snapshotWarnings?: any;
  showCompileProgress?: boolean;
  compiledPath?: string;
  compileWarnings?: string[];
  showUploadProgress?: boolean;
  pipeline?: boolean | UploadPipelineResp;
  uploadWarnings?: string[];
  showRunProgress?: boolean;
  runPipeline?: boolean | RunPipeline;
  runWarnings?: string[];
  deleted?: boolean;
  docManager?: IDocumentManager;
  namespace?: string;
  message?: string;
  kfpUiHost?: string;
};

interface IDeploysProgress {
  deploys: { [key: number]: DeployProgressState };
  onPanelRemove: (index: number) => void;
  kfpUiHost: string;
}

export const DeploysProgress: React.FunctionComponent<
  IDeploysProgress
> = props => {
  const [items, setItems] = React.useState<React.JSX.Element[]>([]);
  const getItems = (_deploys: {
    [key: number]: DeployProgressState;
  }): React.JSX.Element[] => {
    return Object.entries(_deploys)
      .filter((dp): dp is [string, DeployProgressState] => {
        // Type guard to ensure proper typing
        return dp[1] && typeof dp[1] === 'object' && !dp[1].deleted;
      })
      .map((dp: [string, DeployProgressState]): React.JSX.Element => {
        const index = dp[0];
        const dpState = dp[1];
        return (
          <DeployProgress
            key={`d-${index}`}
            showValidationProgress={dpState.showValidationProgress}
            notebookValidation={dpState.notebookValidation}
            validationWarnings={dpState.validationWarnings}
            // showSnapshotProgress={dpState.showSnapshotProgress}
            task={dpState.task}
            // snapshotWarnings={dpState.snapshotWarnings}
            showCompileProgress={dpState.showCompileProgress}
            compiledPath={dpState.compiledPath}
            compileWarnings={dpState.compileWarnings}
            showUploadProgress={dpState.showUploadProgress}
            pipeline={dpState.pipeline}
            uploadWarnings={dpState.uploadWarnings}
            showRunProgress={dpState.showRunProgress}
            runPipeline={dpState.runPipeline}
            runWarnings={dpState.runWarnings}
            onRemove={_onPanelRemove(Number(index))}
            docManager={dpState.docManager}
            namespace={dpState.namespace}
            kfpUiHost={props.kfpUiHost}
          />
        );
      });
  };

  const _onPanelRemove = (index?: number) => {
    return () => {
      console.log('remove', index);
      if (typeof index === 'number') {
        props.onPanelRemove(index);
      }
    };
  };

  React.useEffect(() => {
    setItems(getItems(props.deploys));
  }, [props.deploys]); // Only re-run the effect if props.deploys changes

  return <div className="deploys-progress">{items}</div>;
};

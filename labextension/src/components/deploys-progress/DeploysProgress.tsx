/*
 * Copyright 2019-2020 The Kale Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import * as React from 'react';
import { CircularProgress } from '@material-ui/core';
import { IDocumentManager } from '@jupyterlab/docmanager';

import { DeployProgress } from './DeployProgress';

export type DeployProgressState = {
  showSnapshotProgress?: boolean;
  task?: any;
  snapshotWarnings?: any;
  showCompileProgress?: boolean;
  compiledPath?: string;
  compileWarnings?: any;
  showUploadProgress?: boolean;
  pipeline?: false | any;
  uploadWarnings?: any;
  showRunProgress?: boolean;
  runPipeline?: any;
  runWarnings?: any;
  deleted?: boolean;
  docManager?: IDocumentManager;
};

interface DeploysProgress {
  deploys: { [key: number]: DeployProgressState };
  onPanelRemove: (index: number) => void;
}

export const DeploysProgress: React.FunctionComponent<DeploysProgress> = props => {
  const [items, setItems] = React.useState([]);
  const getItems = (_deploys: any) => {
    return Object.entries(_deploys)
      .filter((dp: [string, DeployProgressState]) => !dp[1].deleted)
      .map((dp: [string, DeployProgressState]) => {
        const index = dp[0];
        const dpState = dp[1];
        return (
          <DeployProgress
            key={`d-${index}`}
            showSnapshotProgress={dpState.showSnapshotProgress}
            task={dpState.task}
            snapshotWarnings={dpState.snapshotWarnings}
            showCompileProgress={dpState.showCompileProgress}
            compiledPath={dpState.compiledPath}
            compileWarnings={dpState.compileWarnings}
            showUploadProgress={dpState.showUploadProgress}
            pipeline={dpState.pipeline}
            uploadWarnings={dpState.uploadWarnings}
            showRunProgress={dpState.showRunProgress}
            runPipeline={dpState.runPipeline}
            runWarnings={dpState.runWarnings}
            onRemove={_onPanelRemove(+index)}
            docManager={dpState.docManager}
          />
        );
      });
  };

  const _onPanelRemove = (index?: number) => {
    return () => {
      console.log('remove', index);
      props.onPanelRemove(index);
    };
  };

  React.useEffect(() => {
    setItems(getItems(props.deploys));
  }, [props.deploys]); // Only re-run the effect if props.deploys changes

  return <div className="deploys-progress">{items}</div>;
};

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

import { DeployProgress } from './DeployProgress';

export type DeployProgressState = {
  showSnapshotProgress?: boolean;
  task?: any;
  showUploadProgress?: boolean;
  pipeline?: false | any;
  showRunProgress?: boolean;
  runPipeline?: any;
  deleted?: boolean;
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
            showUploadProgress={dpState.showUploadProgress}
            pipeline={dpState.pipeline}
            showRunProgress={dpState.showRunProgress}
            runPipeline={dpState.runPipeline}
            onRemove={_onPanelRemove(+index)}
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

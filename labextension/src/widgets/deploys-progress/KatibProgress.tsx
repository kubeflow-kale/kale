/*
 * Copyright 2020 The Kale Authors
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
import * as yaml from 'js-yaml';
import { LinearProgress } from '@material-ui/core';
import UnknownIcon from '@material-ui/icons/Help';
import ErrorIcon from '@material-ui/icons/Error';
import SuccessIcon from '@material-ui/icons/CheckCircle';

import StatusRunning from '../../icons/statusRunning';
import { IKatibExperiment } from '../LeftPanelWidget';
import DeployUtils from './DeployUtils';

enum KatibExperimentStatus {
  CREATED = 'Created',
  RUNNING = 'Running',
  RESTARTING = 'Restarting',
  SUCCEEDED = 'Succeeded',
  FAILED = 'Failed',
  UNKNOWN = 'Unknown',
}

interface IKatibProgressProps {
  experiment: IKatibExperiment;
}

export const KatibProgress: React.FunctionComponent<IKatibProgressProps> = props => {
  const getLink = (experiment: IKatibExperiment) => {
    // link: /_/katib/#/katib/hp_monitor/<namespace>/<name>
    if (!experiment.name || !experiment.namespace) {
      return '#';
    }
    return `${window.location.origin}/_/katib/#/katib/hp_monitor/${experiment.namespace}/${experiment.name}`;
  };

  const getKatibBestResultInfo = (experiment: IKatibExperiment) => {
    let optimal = experiment ? experiment.currentOptimalTrial : null;
    // currentOptimalTrial is _never_ null,
    // so if there's no best trial so far we don't show the object
    return optimal && optimal.bestTrialName
      ? [yaml.safeDump(optimal)]
      : [
          'There are no results yet',
          'To have a result, there must be at least one successful trial',
        ];
  };

  const getKatibBestResultBadge = (experiment: IKatibExperiment) => {
    return (
      <LightTooltip
        title={'Show current best result'}
        placement="top-start"
        TransitionComponent={Zoom}
      >
        {DeployUtils.getInfoBadge(
          'Katib current best result',
          getKatibBestResultInfo(experiment),
        )}
      </LightTooltip>
    );
  };

  const getText = (experiment: IKatibExperiment) => {
    switch (experiment.status) {
      case KatibExperimentStatus.FAILED:
        return 'Failed';
      case KatibExperimentStatus.SUCCEEDED:
        return 'Done';
      default:
        return 'View';
    }
  };

  const getComponent = (experiment: IKatibExperiment) => {
    let IconComponent: any = UnknownIcon;
    let iconColor = '#5f6368';

    switch (experiment.status) {
      case KatibExperimentStatus.FAILED:
        IconComponent = ErrorIcon;
        iconColor = DeployUtils.color.errorText;
        break;
      case KatibExperimentStatus.CREATED:
      case KatibExperimentStatus.RUNNING:
      case KatibExperimentStatus.RESTARTING:
        IconComponent = StatusRunning;
        iconColor = DeployUtils.color.blue;
        break;
      case KatibExperimentStatus.SUCCEEDED:
        IconComponent = SuccessIcon;
        iconColor = DeployUtils.color.success;
        break;
      default:
        break;
    }

    return (
      <React.Fragment>
        {getText(experiment)}
        <IconComponent style={{ color: iconColor, height: 18, width: 18 }} />
      </React.Fragment>
    );
  };

  let katibTpl;
  if (!props.experiment) {
    katibTpl = <LinearProgress color="primary" />;
  } else if (props.experiment.status == 'error') {
    katibTpl = (
      <React.Fragment>
        <ErrorIcon
          style={{ color: DeployUtils.color.errorText, height: 18, width: 18 }}
        />
      </React.Fragment>
    );
  } else {
    katibTpl = (
      <React.Fragment>
        <a
          href={getLink(props.experiment)}
          target="_blank"
          rel="noopener noreferrer"
        >
          {getComponent(props.experiment)}
        </a>
      </React.Fragment>
    );
  }

  let katibRunsTpl = undefined;
  if (!props.experiment || props.experiment.trials === 0) {
    katibRunsTpl = (
      <React.Fragment>
        <div className="deploy-progress-label">Gathering suggestions...</div>
        <div className="deploy-progress-value">
          <LinearProgress color="primary" />
        </div>
      </React.Fragment>
    );
  } else if (props.experiment.status !== 'error') {
    // we have some katib trials
    katibRunsTpl = (
      <React.Fragment>
        <div className="deploy-progress-label labels-indented">
          <p>Running: {props.experiment.trialsRunning}</p>
          <p>Succeeded: {props.experiment.trialsSucceeded}</p>
          <p>Failed: {props.experiment.trialsFailed}</p>
        </div>
      </React.Fragment>
    );
  }

  return (
    <div>
      <div
        className="deploy-progress-row"
        style={{ borderBottom: 'transparent', paddingBottom: 0 }}
      >
        <div className="deploy-progress-label">Running Katib experiment...</div>
        <div className="deploy-progress-value">
          {katibTpl}
          {getKatibBestResultBadge(props.experiment)}
        </div>
      </div>
      <div className="deploy-progress-row">{katibRunsTpl}</div>
    </div>
  );
};

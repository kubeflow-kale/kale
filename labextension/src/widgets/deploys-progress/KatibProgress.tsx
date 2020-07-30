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
import { LinearProgress, Zoom } from '@material-ui/core';
import UnknownIcon from '@material-ui/icons/Help';
import ErrorIcon from '@material-ui/icons/Error';
import SuccessIcon from '@material-ui/icons/CheckCircle';

import StatusRunning from '../../icons/statusRunning';
import { IKatibExperiment } from '../LeftPanel';
import { LightTooltip } from '../../components/LightTooltip';
import DeployUtils from './DeployUtils';

enum KatibExperimentStatus {
  CREATED = 'Created',
  RUNNING = 'Running',
  RESTARTING = 'Restarting',
  SUCCEEDED = 'Succeeded',
  FAILED = 'Failed',
  UNKNOWN = 'Unknown',
}

enum KatibExperimentStatusReason {
  CREATED = 'ExperimentCreated',
  RUNNING = 'ExperimentRunning',
  RESTARTING = 'ExperimentRestarting',
  GOAL_REACHED = 'ExperimentGoalReached',
  MAX_TRIALS_REACHED = 'ExperimentMaxTrialsReached',
  SUGGESTION_END_REACHED = 'ExperimentSuggestionEndReached',
  FAILED = 'ExperimentFailed',
  KILLED = 'ExperimentKilled',
}

enum KatibExperimentStatusMessage {
  SUGGESTION_EXHAUSTED = 'Suggestion is exhausted',
}

interface IKatibProgressProps {
  experiment: IKatibExperiment;
}

export const KatibProgress: React.FunctionComponent<IKatibProgressProps> = props => {
  // Katib controller sets experiment's status, along with a reason and
  // message for the status. If the experiment is 'Succeeded' or 'Failed' and
  // the reason is 'MaxTrialsReached' or 'SuggestionEndReached' or there's a
  // message regarding Suggestion exhaustion, then we can derive that the goal
  // was not reached.
  const isKatibGoalNotReached = (experiment: IKatibExperiment) => {
    const isSucceedOrFailed =
      experiment.status === KatibExperimentStatus.SUCCEEDED ||
      experiment.status === KatibExperimentStatus.FAILED;
    const isMaxTrialsOrEndReached =
      experiment.reason === KatibExperimentStatusReason.MAX_TRIALS_REACHED ||
      experiment.reason === KatibExperimentStatusReason.SUGGESTION_END_REACHED;
    const isExhausted =
      experiment.message === KatibExperimentStatusMessage.SUGGESTION_EXHAUSTED;
    return isSucceedOrFailed && (isMaxTrialsOrEndReached || isExhausted);
  };

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
        return isKatibGoalNotReached(experiment) ? 'GoalNotReached' : 'Failed';
      case KatibExperimentStatus.SUCCEEDED:
        return 'Done';
      default:
        return 'View';
    }
  };

  const getStatusWarningBadge = (
    experiment: IKatibExperiment,
    tooltip: string,
  ) => {
    const title =
      experiment.status === KatibExperimentStatus.SUCCEEDED
        ? 'Experiment succeeded!'
        : 'Experiment failed!';
    return (
      <LightTooltip
        title={tooltip}
        placement="top-start"
        TransitionComponent={Zoom}
      >
        {DeployUtils.getWarningBadge(title, [
          tooltip,
          `Status: ${experiment.status}`,
          `Reason: ${experiment.reason}`,
          `Message: ${experiment.message}`,
        ])}
      </LightTooltip>
    );
  };

  const getComponent = (experiment: IKatibExperiment) => {
    let tooltipSet = false;
    let styles = { color: '#5f6368', height: 18, width: 18 };
    let IconComponent = <UnknownIcon style={styles} />;

    switch (experiment.status) {
      case KatibExperimentStatus.SUCCEEDED:
      case KatibExperimentStatus.FAILED:
        isKatibGoalNotReached(experiment)
          ? (() => {
              tooltipSet = true;
              IconComponent = getStatusWarningBadge(
                experiment,
                'The experiment has completed but the goal was not reached',
              );
            })()
          : (IconComponent =
              experiment.status === KatibExperimentStatus.SUCCEEDED ? (
                <SuccessIcon
                  style={{ ...styles, color: DeployUtils.color.success }}
                />
              ) : (
                <ErrorIcon
                  style={{ ...styles, color: DeployUtils.color.errorText }}
                />
              ));
        break;
      case KatibExperimentStatus.CREATED:
      case KatibExperimentStatus.RUNNING:
      case KatibExperimentStatus.RESTARTING:
        IconComponent = (
          <StatusRunning style={{ ...styles, color: DeployUtils.color.blue }} />
        );
        break;
      default:
        break;
    }

    return tooltipSet ? (
      <React.Fragment>
        <a href={getLink(experiment)} target="_blank" rel="noopener noreferrer">
          {getText(experiment)}
        </a>
        {IconComponent}
      </React.Fragment>
    ) : (
      <React.Fragment>
        <a href={getLink(experiment)} target="_blank" rel="noopener noreferrer">
          {getText(experiment)}
          {IconComponent}
        </a>
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
    katibTpl = getComponent(props.experiment);
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

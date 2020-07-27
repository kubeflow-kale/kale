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
import { LinearProgress } from '@material-ui/core';
import CloseIcon from '@material-ui/icons/Close';
import LaunchIcon from '@material-ui/icons/Launch';
import ErrorIcon from '@material-ui/icons/Error';
import UnknownIcon from '@material-ui/icons/Help';
import PendingIcon from '@material-ui/icons/Schedule';
import SkippedIcon from '@material-ui/icons/SkipNext';
import SuccessIcon from '@material-ui/icons/CheckCircle';
import CancelIcon from '@material-ui/icons/Cancel';

import StatusRunning from '../../icons/statusRunning';
import TerminatedIcon from '../../icons/statusTerminated';
import { DeployProgressState } from './DeploysProgress';
import DeployUtils from './DeployUtils';
import { KatibProgress } from './KatibProgress';

// From kubeflow/pipelines repo
enum PipelineStatus {
  ERROR = 'Error',
  FAILED = 'Failed',
  PENDING = 'Pending',
  RUNNING = 'Running',
  SKIPPED = 'Skipped',
  SUCCEEDED = 'Succeeded',
  TERMINATING = 'Terminating',
  TERMINATED = 'Terminated',
  UNKNOWN = 'Unknown',
}

interface DeployProgress extends DeployProgressState {
  onRemove?: () => void;
}

export const DeployProgress: React.FunctionComponent<DeployProgress> = props => {
  const getSnapshotLink = (task: any) => {
    if (!task.result || !task.result.event) {
      return '#';
    }
    return `${window.location.origin}/_/rok/buckets/${task.bucket}/files/${task.result.event.object}/versions/${task.result.event.version}`;
  };

  const getTaskLink = (task: any) => {
    return `${window.location.origin}/_/rok/buckets/${task.bucket}/tasks/${task.id}`;
  };

  const getUploadLink = (pipeline: any) => {
    // link: /_/pipeline/#/pipelines/details/<id>
    // id = uploadPipeline.pipeline.id
    if (!pipeline.pipeline || !pipeline.pipeline.id) {
      return '#';
    }
    return `${window.location.origin}/_/pipeline/#/pipelines/details/${pipeline.pipeline.id}`;
  };

  const getRunLink = (pipeline: any) => {
    // link: /_/pipeline/#/runs/details/<id>
    // id = runPipeline.id
    if (!pipeline.id) {
      return '#';
    }
    return `${window.location.origin}/_/pipeline/#/runs/details/${pipeline.id}`;
  };

  const getRunText = (pipeline: any) => {
    switch (pipeline.status) {
      case null:
      case 'Running':
        return 'View';
      case 'Terminating':
      case 'Failed':
        return pipeline.status as string;
      default:
        return 'Done';
    }
  };

  const getRunComponent = (pipeline: any) => {
    let title = 'Unknown status';
    let IconComponent: any = UnknownIcon;
    let iconColor = '#5f6368';

    switch (pipeline.status) {
      case PipelineStatus.ERROR:
        IconComponent = ErrorIcon;
        iconColor = DeployUtils.color.errorText;
        // title = 'Error';
        break;
      case PipelineStatus.FAILED:
        IconComponent = ErrorIcon;
        iconColor = DeployUtils.color.errorText;
        // title = 'Failed';
        break;
      case PipelineStatus.PENDING:
        IconComponent = PendingIcon;
        iconColor = DeployUtils.color.weak;
        // title = 'Pendig';
        break;
      case PipelineStatus.RUNNING:
        IconComponent = StatusRunning;
        iconColor = DeployUtils.color.blue;
        // title = 'Running';
        break;
      case PipelineStatus.TERMINATING:
        IconComponent = StatusRunning;
        iconColor = DeployUtils.color.blue;
        // title = 'Terminating';
        break;
      case PipelineStatus.SKIPPED:
        IconComponent = SkippedIcon;
        // title = 'Skipped';
        break;
      case PipelineStatus.SUCCEEDED:
        IconComponent = SuccessIcon;
        iconColor = DeployUtils.color.success;
        // title = 'Succeeded';
        break;
      case PipelineStatus.TERMINATED:
        IconComponent = TerminatedIcon;
        iconColor = DeployUtils.color.terminated;
        // title = 'Terminated';
        break;
      case PipelineStatus.UNKNOWN:
        break;
      default:
        console.error('pipeline status:', pipeline.status);
    }

    return (
      <React.Fragment>
        {getRunText(pipeline)}
        <IconComponent style={{ color: iconColor, height: 18, width: 18 }} />
      </React.Fragment>
    );
  };

  const getKatibKfpExperimentLink = (experimentId: string) => {
    // link: /_/pipeline/#/experiments/details/<ud>
    if (!experimentId) {
      return '#';
    }
    return `${window.location.origin}/_/pipeline/#/experiments/details/${experimentId}`;
  };

  const getSnapshotTpl = () => {
    if (!props.task) {
      return (
        <React.Fragment>
          Unknown status
          <UnknownIcon
            style={{
              color: DeployUtils.color.terminated,
              height: 18,
              width: 18,
            }}
          />
        </React.Fragment>
      );
    }

    if (!['success', 'error', 'canceled'].includes(props.task.status)) {
      const progress = props.task.progress || 0;
      return (
        <LinearProgress
          variant="determinate"
          color="primary"
          value={progress}
        />
      );
    }

    let getLink: (task: any) => string = () => '#';
    let message = props.task.message;
    let IconComponent: any = UnknownIcon;
    let iconColor = DeployUtils.color.blue;

    switch (props.task.status) {
      case 'success':
        getLink = getSnapshotLink;
        message = 'Done';
        IconComponent = LaunchIcon;
        break;
      case 'error':
        getLink = getTaskLink;
        IconComponent = ErrorIcon;
        iconColor = DeployUtils.color.errorText;
        break;
      case 'canceled':
        IconComponent = CancelIcon;
        getLink = getTaskLink;
        iconColor = DeployUtils.color.canceled;
        break;
    }

    return (
      <React.Fragment>
        <a href={getLink(props.task)} target="_blank" rel="noopener noreferrer">
          {message}
          <IconComponent style={{ color: iconColor, height: 18, width: 18 }} />
        </a>
      </React.Fragment>
    );
  };

  let validationTpl;
  if (props.notebookValidation === true) {
    validationTpl = (
      <React.Fragment>
        <SuccessIcon
          style={{ color: DeployUtils.color.success, height: 18, width: 18 }}
        />
      </React.Fragment>
    );
  } else if (props.notebookValidation === false) {
    validationTpl = (
      <React.Fragment>
        <ErrorIcon
          style={{ color: DeployUtils.color.errorText, height: 18, width: 18 }}
        />
      </React.Fragment>
    );
  } else {
    validationTpl = <LinearProgress color="primary" />;
  }

  let compileTpl;
  if (props.compiledPath && props.compiledPath !== 'error') {
    compileTpl = (
      <React.Fragment>
        <a onClick={_ => props.docManager.openOrReveal(props.compiledPath)}>
          Done
          <SuccessIcon
            style={{ color: DeployUtils.color.success, height: 18, width: 18 }}
          />
        </a>
      </React.Fragment>
    );
  } else if (props.compiledPath === 'error') {
    compileTpl = (
      <React.Fragment>
        <ErrorIcon
          style={{ color: DeployUtils.color.errorText, height: 18, width: 18 }}
        />
      </React.Fragment>
    );
  } else {
    compileTpl = <LinearProgress color="primary" />;
  }

  let uploadTpl;
  if (props.pipeline) {
    uploadTpl = (
      <React.Fragment>
        <a
          href={getUploadLink(props.pipeline)}
          target="_blank"
          rel="noopener noreferrer"
        >
          Done
          <LaunchIcon style={{ height: 18, width: 18 }} />
        </a>
      </React.Fragment>
    );
  } else if (props.pipeline === false) {
    uploadTpl = (
      <React.Fragment>
        <ErrorIcon
          style={{ color: DeployUtils.color.errorText, height: 18, width: 18 }}
        />
      </React.Fragment>
    );
  } else {
    uploadTpl = <LinearProgress color="primary" />;
  }

  let runTpl;
  if (props.runPipeline) {
    runTpl = (
      <React.Fragment>
        <a
          href={getRunLink(props.runPipeline)}
          target="_blank"
          rel="noopener noreferrer"
        >
          {getRunComponent(props.runPipeline)}
        </a>
      </React.Fragment>
    );
  } else if (props.runPipeline == false) {
    runTpl = (
      <React.Fragment>
        <ErrorIcon
          style={{ color: DeployUtils.color.errorText, height: 18, width: 18 }}
        />
      </React.Fragment>
    );
  } else {
    runTpl = <LinearProgress color="primary" />;
  }

  let katibKfpExpTpl;
  if (!props.katibKFPExperiment) {
    katibKfpExpTpl = <LinearProgress color="primary" />;
  } else if (props.katibKFPExperiment.id !== 'error') {
    katibKfpExpTpl = (
      <React.Fragment>
        <a
          href={getKatibKfpExperimentLink(props.katibKFPExperiment.id)}
          target="_blank"
          rel="noopener noreferrer"
        >
          Done
          <LaunchIcon style={{ fontSize: '1rem' }} />
        </a>
      </React.Fragment>
    );
  } else {
    katibKfpExpTpl = (
      <React.Fragment>
        <ErrorIcon
          style={{ color: DeployUtils.color.errorText, height: 18, width: 18 }}
        />
      </React.Fragment>
    );
  }

  return (
    <div className="deploy-progress">
      <div
        style={{
          justifyContent: 'flex-end',
          textAlign: 'right',
          paddingRight: '4px',
          height: '1rem',
        }}
      >
        <CloseIcon
          style={{ fontSize: '1rem', cursor: 'pointer' }}
          onClick={_ => props.onRemove()}
        />
      </div>

      {props.showValidationProgress ? (
        <div className="deploy-progress-row">
          <div className="deploy-progress-label">Validating notebook...</div>
          <div className="deploy-progress-value">
            {validationTpl}
            {DeployUtils.getWarningBadge(
              'Validation Warnings',
              props.validationWarnings,
            )}
          </div>
        </div>
      ) : null}

      {props.showSnapshotProgress ? (
        <div className="deploy-progress-row">
          <div className="deploy-progress-label">Taking snapshot...</div>
          <div className="deploy-progress-value">
            {getSnapshotTpl()}{' '}
            {DeployUtils.getWarningBadge(
              'Snapshot Warnings',
              props.snapshotWarnings,
            )}
          </div>
        </div>
      ) : null}

      {props.showCompileProgress ? (
        <div className="deploy-progress-row">
          <div className="deploy-progress-label">Compiling notebook...</div>
          <div className="deploy-progress-value">
            {compileTpl}
            {DeployUtils.getWarningBadge(
              'Compile Warnings',
              props.compileWarnings,
            )}
          </div>
        </div>
      ) : null}

      {props.showUploadProgress ? (
        <div className="deploy-progress-row">
          <div className="deploy-progress-label">Uploading pipeline...</div>
          <div className="deploy-progress-value">
            {uploadTpl}
            {DeployUtils.getWarningBadge(
              'Upload Warnings',
              props.uploadWarnings,
            )}
          </div>
        </div>
      ) : null}

      {props.showRunProgress ? (
        <div className="deploy-progress-row">
          <div className="deploy-progress-label">Running pipeline...</div>
          <div className="deploy-progress-value">
            {runTpl}
            {DeployUtils.getWarningBadge('Run Warnings', props.runWarnings)}
          </div>
        </div>
      ) : null}

      {props.showKatibKFPExperiment ? (
        <div className="deploy-progress-row">
          <div className="deploy-progress-label">
            Creating KFP experiment...
          </div>
          <div className="deploy-progress-value">{katibKfpExpTpl}</div>
        </div>
      ) : null}

      {props.showKatibProgress ? (
        <KatibProgress experiment={props.katib} />
      ) : null}
    </div>
  );
};

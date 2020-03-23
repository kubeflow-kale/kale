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
import { LinearProgress, CircularProgress } from '@material-ui/core';
import CloseIcon from '@material-ui/icons/Close';
import LinkIcon from '@material-ui/icons/Link';
import LaunchIcon from '@material-ui/icons/Launch';
import ErrorIcon from '@material-ui/icons/Error';
import UnknownIcon from '@material-ui/icons/Help';
import PendingIcon from '@material-ui/icons/Schedule';
import SkippedIcon from '@material-ui/icons/SkipNext';
import SuccessIcon from '@material-ui/icons/CheckCircle';
import CancelIcon from '@material-ui/icons/Cancel';
import WarningIcon from '@material-ui/icons/Warning';

import StatusRunning from '../../icons/statusRunning';
import TerminatedIcon from '../../icons/statusTerminated';
import { DeployProgressState } from './DeploysProgress';
import NotebookUtils from '../../utils/NotebookUtils';

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

const color = {
  // From kubeflow/pipelines repo
  activeBg: '#eaf1fd',
  alert: '#f9ab00', // Google yellow 600
  background: '#fff',
  blue: '#4285f4', // Google blue 500
  disabledBg: '#ddd',
  divider: '#e0e0e0',
  errorBg: '#fbe9e7',
  errorText: '#d50000',
  foreground: '#000',
  graphBg: '#f2f2f2',
  grey: '#5f6368', // Google grey 500
  inactive: '#5f6368',
  lightGrey: '#eee', // Google grey 200
  lowContrast: '#80868b', // Google grey 600
  secondaryText: 'rgba(0, 0, 0, .88)',
  separator: '#e8e8e8',
  strong: '#202124', // Google grey 900
  success: '#34a853',
  successWeak: '#e6f4ea', // Google green 50
  terminated: '#80868b',
  theme: '#1a73e8',
  themeDarker: '#0b59dc',
  warningBg: '#f9f9e1',
  warningText: '#ee8100',
  weak: '#9aa0a6',
  // From Rok repo
  canceled: '#ff992a',
};

interface DeployProgress extends DeployProgressState {
  onRemove?: () => void;
}

export const DeployProgress: React.FunctionComponent<DeployProgress> = props => {
  const getWarningBadge = (title: string, content: any) => {
    return content ? (
      <a
        onClick={_ => {
          NotebookUtils.showMessage(title, content);
        }}
      >
        <WarningIcon style={{ color: color.alert, height: 18, width: 18 }} />
      </a>
    ) : (
      ''
    );
  };

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
        iconColor = color.errorText;
        // title = 'Error';
        break;
      case PipelineStatus.FAILED:
        IconComponent = ErrorIcon;
        iconColor = color.errorText;
        // title = 'Failed';
        break;
      case PipelineStatus.PENDING:
        IconComponent = PendingIcon;
        iconColor = color.weak;
        // title = 'Pendig';
        break;
      case PipelineStatus.RUNNING:
        IconComponent = StatusRunning;
        iconColor = color.blue;
        // title = 'Running';
        break;
      case PipelineStatus.TERMINATING:
        IconComponent = StatusRunning;
        iconColor = color.blue;
        // title = 'Terminating';
        break;
      case PipelineStatus.SKIPPED:
        IconComponent = SkippedIcon;
        // title = 'Skipped';
        break;
      case PipelineStatus.SUCCEEDED:
        IconComponent = SuccessIcon;
        iconColor = color.success;
        // title = 'Succeeded';
        break;
      case PipelineStatus.TERMINATED:
        IconComponent = TerminatedIcon;
        iconColor = color.terminated;
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

  const getSnapshotTpl = () => {
    if (!props.task) {
      return (
        <React.Fragment>
          Unknown status
          <UnknownIcon
            style={{ color: color.terminated, height: 18, width: 18 }}
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
    let iconColor = color.terminated;

    switch (props.task.status) {
      case 'success':
        getLink = getSnapshotLink;
        message = 'Done';
        IconComponent = LaunchIcon;
        break;
      case 'error':
        getLink = getTaskLink;
        IconComponent = ErrorIcon;
        iconColor = color.errorText;
        break;
      case 'canceled':
        IconComponent = CancelIcon;
        getLink = getTaskLink;
        iconColor = color.canceled;
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

  let compileTpl;
  if (props.compiledPath && props.compiledPath !== 'error') {
    compileTpl = (
      <React.Fragment>
        <a onClick={_ => props.docManager.openOrReveal(props.compiledPath)}>
          Done
          <SuccessIcon
            style={{ color: color.success, height: 18, width: 18 }}
          />
        </a>
      </React.Fragment>
    );
  } else if (props.compiledPath === 'error') {
    compileTpl = (
      <React.Fragment>
        <ErrorIcon style={{ color: color.errorText, height: 18, width: 18 }} />
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
        <ErrorIcon style={{ color: color.errorText, height: 18, width: 18 }} />
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
        <ErrorIcon style={{ color: color.errorText, height: 18, width: 18 }} />
      </React.Fragment>
    );
  } else {
    runTpl = <LinearProgress color="primary" />;
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

      {props.showSnapshotProgress ? (
        <div className="deploy-progress-row">
          <div className="deploy-progress-label">Taking snapshot...</div>
          <div className="deploy-progress-value">
            {getSnapshotTpl()}{' '}
            {getWarningBadge('Snapshot Warnings', props.snapshotWarnings)}
          </div>
        </div>
      ) : null}

      {props.showCompileProgress ? (
        <div className="deploy-progress-row">
          <div className="deploy-progress-label">Compiling Notebook...</div>
          <div className="deploy-progress-value">
            {compileTpl}
            {getWarningBadge('Compile Warnings', props.compileWarnings)}
          </div>
        </div>
      ) : null}

      {props.showUploadProgress ? (
        <div className="deploy-progress-row">
          <div className="deploy-progress-label">Uploading pipeline...</div>
          <div className="deploy-progress-value">
            {uploadTpl}
            {getWarningBadge('Upload Warnings', props.uploadWarnings)}
          </div>
        </div>
      ) : null}

      {props.showRunProgress ? (
        <div className="deploy-progress-row">
          <div className="deploy-progress-label">Running pipeline...</div>
          <div className="deploy-progress-value">
            {runTpl}
            {getWarningBadge('Run Warnings', props.runWarnings)}
          </div>
        </div>
      ) : null}
    </div>
  );
};

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
import { LinearProgress } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import LaunchIcon from '@mui/icons-material/Launch';
import ErrorIcon from '@mui/icons-material/Error';
import UnknownIcon from '@mui/icons-material/Help';
import PendingIcon from '@mui/icons-material/Schedule';
import SkippedIcon from '@mui/icons-material/SkipNext';
import SuccessIcon from '@mui/icons-material/CheckCircle';

import StatusRunning from '../../icons/statusRunning';
import TerminatedIcon from '../../icons/statusTerminated';
import { DeployProgressState } from './DeploysProgress';
import DeployUtils from './DeployUtils';
import { UploadPipelineResp, RunPipeline } from './DeploysProgress';
import NotebookUtils from '../../lib/NotebookUtils';

// From kubeflow/pipelines repo
enum PipelineStatus {
  ERROR = 'ERROR',
  FAILED = 'FAILED',
  PENDING = 'PENDING',
  RUNNING = 'RUNNING',
  SKIPPED = 'SKIPPED',
  SUCCEEDED = 'SUCCEEDED',
  TERMINATING = 'TERMINATING',
  TERMINATED = 'TERMINATED',
  UNKNOWN = 'UNKNOWN',
}

const logLinksHint = (kfpUiHost: string) => {
  console.info(
    `default for upload and run links is ${kfpUiHost} ` +
      'if your kpf ui is running somewhere else, set the KF_PIPELINES_UI_ENDPOINT environment variable.',
  );
};

interface IDeployProgressProps extends DeployProgressState {
  onRemove?: () => void;
}

export const DeployProgress: React.FunctionComponent<
  IDeployProgressProps
> = props => {
  const getUploadLink = (pipeline: UploadPipelineResp) => {
    if (!pipeline.pipeline || !pipeline.pipeline.pipelineid) {
      return '#';
    }
    const base = props.kfpUiHost;
    const link = `${base}/#/pipelines/details/${pipeline.pipeline.pipelineid}/version/${pipeline.pipeline.versionid}`;
    return props.namespace
      ? link.replace('#', `?ns=${props.namespace}#`)
      : link;
  };

  const getRunLink = (run: RunPipeline) => {
    if (!run.id) {
      return '#';
    }
    const base = props.kfpUiHost;
    const link = `${base}/#/runs/details/${run.id}`;
    return props.namespace
      ? link.replace('#', `?ns=${props.namespace}#`)
      : link;
  };

  const getRunText = (pipeline: RunPipeline) => {
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

  const getRunComponent = (pipeline: RunPipeline) => {
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
        // title = 'Pending';
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

  const handleCompileClick = async () => {
    if (props.docManager && props.compiledPath) {
      try {
        await props.docManager.services.contents.get(props.compiledPath);
        await props.docManager.openOrReveal(props.compiledPath);
      } catch (error) {
        console.error('Error opening compiled path:', error);
        const title = 'Failed to open compiled file';
        const message = [
          `File path: <pre><b>${props.compiledPath}</b></pre>`,
          '',
          'Probable cause: the file is hidden, try running jupyterlab with the --ContentsManager.allow_hidden=True flag',
        ];
        NotebookUtils.showMessage(title, message);
      }
    }
  };

  // Handle close click safely
  const handleCloseClick = () => {
    if (props.onRemove) {
      props.onRemove();
    }
  };

  let validationTpl;
  if (props.notebookValidation === true) {
    validationTpl = (
      <React.Fragment>
        Done
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
        <a
          onClick={handleCompileClick}
          style={{ cursor: 'pointer' }}
          role="button"
          tabIndex={0}
          onKeyPress={e => {
            if (e.key === 'Enter' || e.key === ' ') {
              handleCompileClick();
            }
          }}
        >
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
          href={getUploadLink(props.pipeline as UploadPipelineResp)}
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
          href={getRunLink(props.runPipeline as RunPipeline)}
          target="_blank"
          rel="noopener noreferrer"
        >
          {getRunComponent(props.runPipeline as RunPipeline)}
        </a>
      </React.Fragment>
    );
    logLinksHint(props.kfpUiHost || '');
  } else if (props.runPipeline === false) {
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
          onClick={handleCloseClick}
        />
      </div>

      {props.showValidationProgress ? (
        <div className="deploy-progress-row">
          <div className="deploy-progress-label">Validating notebook...</div>
          <div className="deploy-progress-value">
            {validationTpl}
            {DeployUtils.getWarningBadge(
              'Validation Warnings',
              props.validationWarnings || [],
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
              props.compileWarnings || [],
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
              props.uploadWarnings || [],
            )}
          </div>
        </div>
      ) : null}

      {props.showRunProgress ? (
        <div className="deploy-progress-row">
          <div className="deploy-progress-label">Running pipeline...</div>
          <div className="deploy-progress-value">
            {runTpl}
            {DeployUtils.getWarningBadge(
              'Run Warnings',
              props.runWarnings || [],
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
};

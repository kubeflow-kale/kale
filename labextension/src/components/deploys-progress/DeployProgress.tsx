import * as React from "react";
import { LinearProgress, CircularProgress } from "@material-ui/core";
import CloseIcon from '@material-ui/icons/Close';
import LinkIcon from '@material-ui/icons/Link';
import LaunchIcon from '@material-ui/icons/Launch';
import ErrorIcon from '@material-ui/icons/Error';
import UnknownIcon from '@material-ui/icons/Help';
import PendingIcon from '@material-ui/icons/Schedule';
import SkippedIcon from '@material-ui/icons/SkipNext';
import SuccessIcon from '@material-ui/icons/CheckCircle';


import StatusRunning from '../../icons/statusRunning';
import TerminatedIcon from '../../icons/statusTerminated';
import { DeployProgressState } from './DeploysProgress';

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

// From kubeflow/pipelines repo
const color = {
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
};

interface DeployProgress extends DeployProgressState {
    onRemove?: () => void;
}

export const DeployProgress: React.FunctionComponent<DeployProgress> = (props) => {
    const getTaskLink = (task: any) => {
        if (!task.result || !task.result.event) {
            return '#';
        }
        return `${window.location.origin}/rok/buckets/${task.bucket}/files/${task.result.event.object}/versions/${task.result.event.version}`
    }

    const getUploadLink = (pipeline: any) => {
        // link: /_/pipeline/#/pipelines/details/<id>
        // id = uploadPipeline.pipeline.id
        if (!pipeline.pipeline || !pipeline.pipeline.id) {
            return '#';
        }
        return `${window.location.origin}/_/pipeline/#/pipelines/details/${pipeline.pipeline.id}`
    }

    const getRunLink = (pipeline: any) => {
        // link: /_/pipeline/#/runs/details/<id>
        // id = runPipeline.id
        if (!pipeline.id) {
            return '#';
        }
        return `${window.location.origin}/_/pipeline/#/runs/details/${pipeline.id}`
    }

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
    }



    const getRunComponent = (pipeline: any) => {
        let title = 'Unknown status';
        let IconComponent: any = UnknownIcon;
        let iconColor = '#5f6368'

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
        )
    }

    let snapshotTpl;
    if (props.task) {
        if (props.task.progress === 100) {
            snapshotTpl =
                <React.Fragment>
                    <a href={getTaskLink(props.task)} target="_blank" rel="noopener noreferrer">
                        Done
                        <LaunchIcon style={{ fontSize: "1rem" }} />
                    </a>
                </React.Fragment>
        } else {
            // FIXME: handle error and canceled in DeployProgress
            const progress = props.task.progress || 0;
            snapshotTpl = <LinearProgress variant="determinate" color='primary' value={progress} />

        }
    }

    let uploadTpl;
    if (props.pipeline) {
        uploadTpl =
            <React.Fragment>
                <a href={getUploadLink(props.pipeline)} target="_blank" rel="noopener noreferrer">
                    Done
                    <LaunchIcon style={{ fontSize: "1rem" }} />
                </a>
            </React.Fragment>
    } else if (props.pipeline === false) {
        uploadTpl =
            <React.Fragment>
                Canceled
            </React.Fragment>
    } else {
        uploadTpl = <LinearProgress color='primary' />
    }

    let runTpl;
    if (props.runPipeline) {
        runTpl =
            <React.Fragment>
                <a href={getRunLink(props.runPipeline)} target="_blank" rel="noopener noreferrer">
                    {getRunComponent(props.runPipeline)}
                </a>
            </React.Fragment>
    } else {
        runTpl = <LinearProgress color='primary' />
    }

    return (
        <div className='deploy-progress'>
            <div style={{ justifyContent: "flex-end", textAlign: "right", paddingRight: "4px", height: "1rem" }}>
                <CloseIcon style={{ fontSize: "1rem", cursor: "pointer" }} onClick={_ => props.onRemove()} />
            </div>

            {props.showSnapshotProgress ?
                (<div className='deploy-progress-row'>
                    <div className="deploy-progress-label">Taking snapshot... </div>
                    <div className="deploy-progress-value">{snapshotTpl}</div>
                </div>) : null}

            {props.showUploadProgress ?
                (<div className='deploy-progress-row'>
                    <div className="deploy-progress-label">Uploading pipeline... </div>
                    <div className="deploy-progress-value">{uploadTpl}</div>
                </div>) : null}

            {props.showRunProgress ?
                (<div className='deploy-progress-row'>
                    <div className="deploy-progress-label">Running pipeline... </div>
                    <div className="deploy-progress-value">{runTpl}</div>
                </div>) : null}
        </div>
    );
};
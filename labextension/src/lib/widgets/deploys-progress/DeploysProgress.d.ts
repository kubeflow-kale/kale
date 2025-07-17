import * as React from 'react';
import { IDocumentManager } from '@jupyterlab/docmanager';
import { IKatibExperiment } from '../LeftPanel';
export declare type DeployProgressState = {
    showValidationProgress?: boolean;
    notebookValidation?: boolean;
    validationWarnings?: boolean;
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
    showKatibProgress?: boolean;
    katib?: IKatibExperiment;
    showKatibKFPExperiment?: boolean;
    katibKFPExperiment?: {
        id: string;
        name: string;
    };
    deleted?: boolean;
    docManager?: IDocumentManager;
    namespace?: string;
};
interface DeploysProgress {
    deploys: {
        [key: number]: DeployProgressState;
    };
    onPanelRemove: (index: number) => void;
}
export declare const DeploysProgress: React.FunctionComponent<DeploysProgress>;
export {};

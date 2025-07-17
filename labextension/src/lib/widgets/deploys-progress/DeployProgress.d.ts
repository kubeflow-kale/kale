import * as React from 'react';
import { DeployProgressState } from './DeploysProgress';
interface DeployProgress extends DeployProgressState {
    onRemove?: () => void;
}
export declare const DeployProgress: React.FunctionComponent<DeployProgress>;
export {};

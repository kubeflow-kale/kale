import * as React from 'react';
import { IExperiment } from '../widgets/LeftPanel';
interface IExperimentInput {
    updateValue: Function;
    options: IExperiment[];
    selected: string;
    value: string;
    loading: boolean;
}
export declare const ExperimentInput: React.FunctionComponent<IExperimentInput>;
export {};

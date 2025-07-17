import * as React from 'react';
export interface IAnnotation {
    key: string;
    value: string;
}
interface AnnotationInputProps {
    label: string;
    volumeIdx: number;
    annotationIdx: number;
    rokAvailable?: boolean;
    cannotBeDeleted?: boolean;
    annotation: {
        key: string;
        value: string;
    };
    deleteValue: Function;
    updateValue: Function;
}
export declare const AnnotationInput: React.FunctionComponent<AnnotationInputProps>;
export {};

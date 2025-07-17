import * as React from 'react';
interface AdvancedSettingsProps {
    title: string;
    debug: boolean;
    dockerImageValue: string;
    dockerImageDefaultValue: string;
    dockerChange: Function;
    changeDebug: Function;
    volsPanel: any;
}
export declare const AdvancedSettings: React.FunctionComponent<AdvancedSettingsProps>;
export {};

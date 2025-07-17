import * as React from 'react';
import { IVolumeMetadata } from './LeftPanel';
import { IRPCError } from '../lib/RPCUtils';
import { ISelectOption } from '../components/Select';
export declare const SELECT_VOLUME_SIZE_TYPES: {
    label: string;
    value: string;
    base: number;
}[];
export declare const SELECT_VOLUME_TYPES: ISelectOption[];
interface VolumesPanelProps {
    volumes: IVolumeMetadata[];
    notebookVolumes: IVolumeMetadata[];
    metadataVolumes: IVolumeMetadata[];
    notebookMountPoints: {
        label: string;
        value: string;
    }[];
    selectVolumeTypes: ISelectOption[];
    useNotebookVolumes: boolean;
    autosnapshot: boolean;
    rokError: IRPCError;
    updateVolumes: Function;
    updateVolumesSwitch: Function;
    updateAutosnapshotSwitch: Function;
    storageClassName: string;
    updateStorageClassName: Function;
    volumeAccessMode: string;
    updateVolumeAccessMode: Function;
}
export declare const VolumesPanel: React.FunctionComponent<VolumesPanelProps>;
export {};

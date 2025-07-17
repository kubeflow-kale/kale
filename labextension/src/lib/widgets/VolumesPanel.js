"use strict";
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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const React = __importStar(require("react"));
const core_1 = require("@material-ui/core");
const Add_1 = __importDefault(require("@material-ui/icons/Add"));
const Delete_1 = __importDefault(require("@material-ui/icons/Delete"));
const RPCUtils_1 = require("../lib/RPCUtils");
const Input_1 = require("../components/Input");
const Select_1 = require("../components/Select");
const LightTooltip_1 = require("../components/LightTooltip");
const AnnotationInput_1 = require("../components/AnnotationInput");
const Utils_1 = require("../lib/Utils");
const VolumeAccessModeSelect_1 = require("../components/VolumeAccessModeSelect");
const DEFAULT_EMPTY_VOLUME = {
    type: 'new_pvc',
    name: '',
    mount_point: '',
    annotations: [],
    size: 1,
    size_type: 'Gi',
    snapshot: false,
    snapshot_name: '',
};
const DEFAULT_EMPTY_ANNOTATION = {
    key: '',
    value: '',
};
exports.SELECT_VOLUME_SIZE_TYPES = [
    { label: 'Gi', value: 'Gi', base: 1024 ** 3 },
    { label: 'Mi', value: 'Mi', base: 1024 ** 2 },
    { label: 'Ki', value: 'Ki', base: 1024 ** 1 },
    { label: '', value: '', base: 1024 ** 0 },
];
var VOLUME_TOOLTIP;
(function (VOLUME_TOOLTIP) {
    VOLUME_TOOLTIP["CREATE_EMTPY_VOLUME"] = "Mount an empty volume on your pipeline steps";
    VOLUME_TOOLTIP["CLONE_NOTEBOOK_VOLUME"] = "Clone a Notebook Server's volume and mount it on your pipeline steps";
    VOLUME_TOOLTIP["CLONE_EXISTING_SNAPSHOT"] = "Clone a Rok Snapshot and mount it on your pipeline steps";
    VOLUME_TOOLTIP["USE_EXISTING_VOLUME"] = "Mount an existing volume on your pipeline steps";
})(VOLUME_TOOLTIP || (VOLUME_TOOLTIP = {}));
exports.SELECT_VOLUME_TYPES = [
    {
        label: 'Create Empty Volume',
        value: 'new_pvc',
        invalid: false,
        tooltip: VOLUME_TOOLTIP.CREATE_EMTPY_VOLUME,
    },
    {
        label: 'Clone Notebook Volume',
        value: 'clone',
        invalid: true,
        tooltip: VOLUME_TOOLTIP.CLONE_NOTEBOOK_VOLUME,
    },
    {
        label: 'Clone Existing Snapshot',
        value: 'snap',
        invalid: true,
        tooltip: VOLUME_TOOLTIP.CLONE_EXISTING_SNAPSHOT,
    },
    {
        label: 'Use Existing Volume',
        value: 'pvc',
        invalid: false,
        tooltip: VOLUME_TOOLTIP.USE_EXISTING_VOLUME,
    },
];
exports.VolumesPanel = props => {
    // Volume managers
    const deleteVolume = (idx) => {
        // If we delete the last volume, turn autosnapshot off
        const autosnapshot = props.volumes.length === 1 ? false : props.autosnapshot;
        props.updateVolumes(Utils_1.removeIdxFromArray(idx, props.volumes), Utils_1.removeIdxFromArray(idx, props.metadataVolumes));
        props.updateAutosnapshotSwitch(autosnapshot);
    };
    const addVolume = () => {
        // If we add a volume to an empty list, turn autosnapshot on
        const autosnapshot = !props.rokError && props.volumes.length === 0
            ? true
            : !props.rokError && props.autosnapshot;
        props.updateVolumes([...props.volumes, DEFAULT_EMPTY_VOLUME], [...props.metadataVolumes, DEFAULT_EMPTY_VOLUME]);
        props.updateAutosnapshotSwitch(autosnapshot);
    };
    const updateVolumeType = (type, idx) => {
        const kaleType = type === 'snap' ? 'new_pvc' : type;
        const annotations = type === 'snap' ? [{ key: 'rok/origin', value: '' }] : [];
        props.updateVolumes(props.volumes.map((item, key) => {
            return key === idx
                ? Object.assign(Object.assign({}, item), { type: type, annotations: annotations }) : item;
        }), props.metadataVolumes.map((item, key) => {
            return key === idx
                ? Object.assign(Object.assign({}, item), { type: kaleType, annotations: annotations }) : item;
        }));
    };
    const updateVolumeName = (name, idx) => {
        props.updateVolumes(props.volumes.map((item, key) => {
            return key === idx ? Object.assign(Object.assign({}, item), { name: name }) : item;
        }), props.metadataVolumes.map((item, key) => {
            return key === idx ? Object.assign(Object.assign({}, item), { name: name }) : item;
        }));
    };
    const updateVolumeMountPoint = (mountPoint, idx) => {
        let cloneVolume = null;
        if (props.volumes[idx].type === 'clone') {
            cloneVolume = props.notebookVolumes.filter(v => v.mount_point === mountPoint)[0];
        }
        const updateItem = (item, key) => {
            if (key === idx) {
                if (item.type === 'clone') {
                    return Object.assign({}, cloneVolume);
                }
                else {
                    return Object.assign(Object.assign({}, props.volumes[idx]), { mount_point: mountPoint });
                }
            }
            else {
                return item;
            }
        };
        props.updateVolumes(props.volumes.map((item, key) => {
            return updateItem(item, key);
        }), props.metadataVolumes.map((item, key) => {
            return updateItem(item, key);
        }));
    };
    const updateVolumeSnapshot = (idx) => {
        props.updateVolumes(props.volumes.map((item, key) => {
            return key === idx
                ? Object.assign(Object.assign({}, props.volumes[idx]), { snapshot: !props.volumes[idx].snapshot }) : item;
        }), props.metadataVolumes.map((item, key) => {
            return key === idx
                ? Object.assign(Object.assign({}, props.metadataVolumes[idx]), { snapshot: !props.metadataVolumes[idx].snapshot }) : item;
        }));
    };
    const updateVolumeSnapshotName = (name, idx) => {
        props.updateVolumes(props.volumes.map((item, key) => {
            return key === idx
                ? Object.assign(Object.assign({}, props.volumes[idx]), { snapshot_name: name }) : item;
        }), props.metadataVolumes.map((item, key) => {
            return key === idx
                ? Object.assign(Object.assign({}, props.metadataVolumes[idx]), { snapshot_name: name }) : item;
        }));
    };
    const updateVolumeSize = (size, idx) => {
        props.updateVolumes(props.volumes.map((item, key) => {
            return key === idx ? Object.assign(Object.assign({}, props.volumes[idx]), { size: size }) : item;
        }), props.metadataVolumes.map((item, key) => {
            return key === idx
                ? Object.assign(Object.assign({}, props.metadataVolumes[idx]), { size: size }) : item;
        }));
    };
    const updateVolumeSizeType = (sizeType, idx) => {
        props.updateVolumes(props.volumes.map((item, key) => {
            return key === idx
                ? Object.assign(Object.assign({}, props.volumes[idx]), { size_type: sizeType }) : item;
        }), props.metadataVolumes.map((item, key) => {
            return key === idx
                ? Object.assign(Object.assign({}, props.metadataVolumes[idx]), { size_type: sizeType }) : item;
        }));
    };
    const addAnnotation = (idx) => {
        const updateItem = (item, key) => {
            if (key === idx) {
                return Object.assign(Object.assign({}, item), { annotations: [...item.annotations, DEFAULT_EMPTY_ANNOTATION] });
            }
            else {
                return item;
            }
        };
        props.updateVolumes(props.volumes.map((item, key) => {
            return updateItem(item, key);
        }), props.metadataVolumes.map((item, key) => {
            return updateItem(item, key);
        }));
    };
    const deleteAnnotation = (volumeIdx, annotationIdx) => {
        const updateItem = (item, key) => {
            if (key === volumeIdx) {
                return Object.assign(Object.assign({}, item), { annotations: Utils_1.removeIdxFromArray(annotationIdx, item.annotations) });
            }
            else {
                return item;
            }
        };
        props.updateVolumes(props.volumes.map((item, key) => {
            return updateItem(item, key);
        }), props.metadataVolumes.map((item, key) => {
            return updateItem(item, key);
        }));
    };
    const updateVolumeAnnotation = (annotation, volumeIdx, annotationIdx) => {
        const updateItem = (item, key) => {
            if (key === volumeIdx) {
                return Object.assign(Object.assign({}, item), { annotations: Utils_1.updateIdxInArray(annotation, annotationIdx, item.annotations) });
            }
            else {
                return item;
            }
        };
        props.updateVolumes(props.volumes.map((item, key) => {
            return updateItem(item, key);
        }), props.metadataVolumes.map((item, key) => {
            return updateItem(item, key);
        }));
    };
    let vols = (React.createElement("div", { className: "toolbar" },
        React.createElement("div", { className: "input-container" }, "No volumes mounts defined")));
    if (props.volumes.length > 0) {
        vols = (React.createElement("div", null,
            ' ',
            props.volumes.map((v, idx) => {
                const nameLabel = props.selectVolumeTypes.filter(d => {
                    return d.value === v.type;
                })[0].label;
                const mountPointPicker = v.type === 'clone' ? (React.createElement("div", null,
                    React.createElement(Select_1.Select, { variant: "standard", label: "Select from currently mounted points", index: idx, updateValue: updateVolumeMountPoint, values: props.notebookMountPoints, value: v.mount_point }))) : (React.createElement("div", null,
                    React.createElement(Input_1.Input, { variant: "standard", label: 'Mount Point', inputIndex: idx, updateValue: updateVolumeMountPoint, value: v.mount_point })));
                const sizePicker = v.type === 'pvc' ? null : (React.createElement("div", { className: "toolbar" },
                    React.createElement("div", { style: { marginRight: '10px', width: '50%' } },
                        React.createElement(Input_1.Input, { updateValue: updateVolumeSize, value: v.size, label: 'Volume size', inputIndex: idx, type: "number", variant: "standard" })),
                    React.createElement("div", { style: { width: '50%' } },
                        React.createElement(Select_1.Select, { variant: "standard", updateValue: updateVolumeSizeType, values: exports.SELECT_VOLUME_SIZE_TYPES, value: v.size_type, label: 'Type', index: idx }))));
                const annotationField = v.type === 'pv' || v.type === 'new_pvc' || v.type === 'snap' ? (React.createElement("div", null,
                    v.annotations && v.annotations.length > 0 ? (React.createElement("div", { style: { padding: '10px 0' } },
                        React.createElement("div", { className: "switch-label" }, "Annotations"))) : (''),
                    v.annotations && v.annotations.length > 0
                        ? v.annotations.map((a, a_idx) => {
                            return (React.createElement(AnnotationInput_1.AnnotationInput, { key: `vol-${idx}-annotation-${a_idx}`, label: 'Annotation', volumeIdx: idx, annotationIdx: a_idx, updateValue: updateVolumeAnnotation, deleteValue: deleteAnnotation, annotation: a, cannotBeDeleted: v.type === 'snap' && a_idx === 0, rokAvailable: !props.rokError }));
                        })
                        : null,
                    React.createElement("div", { className: "add-button", style: { padding: 0 } },
                        React.createElement(core_1.Button, { variant: "contained", color: "primary", size: "small", title: "Add Annotation", onClick: _ => addAnnotation(idx) },
                            React.createElement(Add_1.default, null),
                            "Add Annotation")))) : null;
                return (React.createElement("div", { className: "input-container volume-container", key: `v-${idx}` },
                    React.createElement("div", { className: "toolbar" },
                        React.createElement(Select_1.Select, { variant: "standard", updateValue: updateVolumeType, values: props.selectVolumeTypes, value: v.type, label: 'Select Volume Type', index: idx }),
                        React.createElement("div", { className: "delete-button" },
                            React.createElement(core_1.Button, { variant: "contained", size: "small", title: "Remove Volume", onClick: _ => deleteVolume(idx) },
                                React.createElement(Delete_1.default, null)))),
                    mountPointPicker,
                    React.createElement(Input_1.Input, { variant: "standard", label: nameLabel + ' Name', inputIndex: idx, updateValue: updateVolumeName, value: v.name, regex: '^([\\.\\-a-z0-9]+)$', regexErrorMsg: 'Resource name must consist of lower case alphanumeric characters, -, and .' }),
                    sizePicker,
                    annotationField,
                    React.createElement("div", { className: "toolbar", style: { padding: '10px 0' } },
                        React.createElement("div", { className: 'switch-label' }, "Snapshot Volume"),
                        React.createElement(core_1.Switch, { checked: v.snapshot, onChange: _ => updateVolumeSnapshot(idx), color: "primary", name: "enableKale", inputProps: { 'aria-label': 'primary checkbox' }, id: "snapshot-switch", className: "material-switch" })),
                    v.snapshot ? (React.createElement(Input_1.Input, { variant: "standard", label: 'Snapshot Name', 
                        // key={idx}
                        inputIndex: idx, updateValue: updateVolumeSnapshotName, value: v.snapshot_name, regex: '^([\\.\\-a-z0-9]+)$', regexErrorMsg: 'Resource name must consist of lower case alphanumeric ' +
                            'characters, -, and .' })) : null));
            })));
    }
    const addButton = (React.createElement("div", { className: "add-button" },
        React.createElement(core_1.Button, { color: "primary", variant: "contained", size: "small", title: "Add Volume", onClick: _ => addVolume(), style: { marginLeft: '10px' } },
            React.createElement(Add_1.default, null),
            "Add Volume")));
    const useNotebookVolumesSwitch = (React.createElement("div", { className: "input-container" },
        React.createElement(LightTooltip_1.LightTooltip, { title: props.rokError
                ? RPCUtils_1.rokErrorTooltip(props.rokError)
                : "Enable this option to mount clones of this notebook's volumes " +
                    'on your pipeline steps', placement: "top-start", interactive: props.rokError ? true : false, TransitionComponent: core_1.Zoom },
            React.createElement("div", { className: "toolbar" },
                React.createElement("div", { className: "switch-label" }, "Use this notebook's volumes"),
                React.createElement(core_1.Switch, { checked: props.useNotebookVolumes, disabled: !!props.rokError || props.notebookMountPoints.length === 0, onChange: _ => props.updateVolumesSwitch(), color: "primary", name: "enableKale", inputProps: { 'aria-label': 'primary checkbox' }, id: "nb-volumes-switch", className: "material-switch" })))));
    const autoSnapshotSwitch = (React.createElement("div", { className: "input-container" },
        React.createElement(LightTooltip_1.LightTooltip, { title: props.rokError
                ? RPCUtils_1.rokErrorTooltip(props.rokError)
                : 'Enable this option to take Rok snapshots of your steps during ' +
                    'pipeline execution', placement: "top-start", interactive: props.rokError ? true : false, TransitionComponent: core_1.Zoom },
            React.createElement("div", { className: "toolbar" },
                React.createElement("div", { className: "switch-label" }, "Take Rok snapshots during each step"),
                React.createElement(core_1.Switch, { checked: props.autosnapshot, disabled: !!props.rokError || props.volumes.length === 0, onChange: _ => props.updateAutosnapshotSwitch(), color: "primary", name: "enableKale", inputProps: { 'aria-label': 'primary checkbox' }, id: "autosnapshot-switch", classes: { root: 'material-switch' } })))));
    // FIXME: There is no separating bottom horizontal bar when there are no
    //  volumes
    const volumesClassNameAndMode = (React.createElement("div", { className: "input-container volume-container" },
        React.createElement(Input_1.Input, { label: "Storage class name", updateValue: props.updateStorageClassName, value: props.storageClassName, placeholder: 'default', variant: "standard" }),
        React.createElement(VolumeAccessModeSelect_1.VolumeAccessModeSelect, { value: props.volumeAccessMode, updateValue: props.updateVolumeAccessMode })));
    return (React.createElement(React.Fragment, null,
        useNotebookVolumesSwitch,
        autoSnapshotSwitch,
        !props.useNotebookVolumes && volumesClassNameAndMode,
        props.notebookMountPoints.length > 0 && props.useNotebookVolumes
            ? null
            : vols,
        props.notebookMountPoints.length > 0 && props.useNotebookVolumes
            ? null
            : addButton));
};

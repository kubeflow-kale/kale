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
import { Button, Switch, Zoom } from '@material-ui/core';
import AddIcon from '@material-ui/icons/Add';
import DeleteIcon from '@material-ui/icons/Delete';
import { IVolumeMetadata } from './LeftPanel';
import { IRPCError, rokErrorTooltip } from '../lib/RPCUtils';
import { Input } from '../components/Input';
import { Select, ISelectOption } from '../components/Select';
import { LightTooltip } from '../components/LightTooltip';
import { AnnotationInput, IAnnotation } from '../components/AnnotationInput';
import { removeIdxFromArray, updateIdxInArray } from '../lib/Utils';

const DEFAULT_EMPTY_VOLUME: IVolumeMetadata = {
  type: 'new_pvc',
  name: '',
  mount_point: '',
  annotations: [],
  size: 1,
  size_type: 'Gi',
  snapshot: false,
  snapshot_name: '',
};

const DEFAULT_EMPTY_ANNOTATION: IAnnotation = {
  key: '',
  value: '',
};

export const SELECT_VOLUME_SIZE_TYPES = [
  { label: 'Gi', value: 'Gi', base: 1024 ** 3 },
  { label: 'Mi', value: 'Mi', base: 1024 ** 2 },
  { label: 'Ki', value: 'Ki', base: 1024 ** 1 },
  { label: '', value: '', base: 1024 ** 0 },
];

enum VOLUME_TOOLTIP {
  CREATE_EMTPY_VOLUME = 'Mount an empty volume on your pipeline steps',
  CLONE_NOTEBOOK_VOLUME = "Clone a Notebook Server's volume and mount it on your pipeline steps",
  CLONE_EXISTING_SNAPSHOT = 'Clone a Rok Snapshot and mount it on your pipeline steps',
  USE_EXISTING_VOLUME = 'Mount an existing volume on your pipeline steps',
}

export const SELECT_VOLUME_TYPES: ISelectOption[] = [
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

interface VolumesPanelProps {
  volumes: IVolumeMetadata[];
  notebookVolumes: IVolumeMetadata[];
  metadataVolumes: IVolumeMetadata[];
  notebookMountPoints: { label: string; value: string }[];
  selectVolumeTypes: ISelectOption[];
  useNotebookVolumes: boolean;
  autosnapshot: boolean;
  rokError: IRPCError;
  updateVolumes: Function;
  updateVolumesSwitch: Function;
  updateAutosnapshotSwitch: Function;
}

export const VolumesPanel: React.FunctionComponent<VolumesPanelProps> = props => {
  // Volume managers
  const deleteVolume = (idx: number) => {
    // If we delete the last volume, turn autosnapshot off
    const autosnapshot =
      props.volumes.length === 1 ? false : props.autosnapshot;
    props.updateVolumes(
      removeIdxFromArray(idx, props.volumes),
      removeIdxFromArray(idx, props.metadataVolumes),
    );
    props.updateAutosnapshotSwitch(autosnapshot);
  };

  const addVolume = () => {
    // If we add a volume to an empty list, turn autosnapshot on
    const autosnapshot =
      !props.rokError && props.volumes.length === 0
        ? true
        : !props.rokError && props.autosnapshot;
    props.updateVolumes(
      [...props.volumes, DEFAULT_EMPTY_VOLUME],
      [...props.metadataVolumes, DEFAULT_EMPTY_VOLUME],
    );
    props.updateAutosnapshotSwitch(autosnapshot);
  };

  const updateVolumeType = (type: string, idx: number) => {
    const kaleType: string = type === 'snap' ? 'new_pvc' : type;
    const annotations: IAnnotation[] =
      type === 'snap' ? [{ key: 'rok/origin', value: '' }] : [];

    props.updateVolumes(
      props.volumes.map((item, key) => {
        return key === idx
          ? { ...item, type: type, annotations: annotations }
          : item;
      }),
      props.metadataVolumes.map((item, key) => {
        return key === idx
          ? { ...item, type: kaleType, annotations: annotations }
          : item;
      }),
    );
  };
  const updateVolumeName = (name: string, idx: number) => {
    props.updateVolumes(
      props.volumes.map((item, key) => {
        return key === idx ? { ...item, name: name } : item;
      }),
      props.metadataVolumes.map((item, key) => {
        return key === idx ? { ...item, name: name } : item;
      }),
    );
  };
  const updateVolumeMountPoint = (mountPoint: string, idx: number) => {
    let cloneVolume: IVolumeMetadata = null;
    if (props.volumes[idx].type === 'clone') {
      cloneVolume = props.notebookVolumes.filter(
        v => v.mount_point === mountPoint,
      )[0];
    }
    const updateItem = (
      item: IVolumeMetadata,
      key: number,
    ): IVolumeMetadata => {
      if (key === idx) {
        if (item.type === 'clone') {
          return { ...cloneVolume };
        } else {
          return { ...props.volumes[idx], mount_point: mountPoint };
        }
      } else {
        return item;
      }
    };
    props.updateVolumes(
      props.volumes.map((item, key) => {
        return updateItem(item, key);
      }),
      props.metadataVolumes.map((item, key) => {
        return updateItem(item, key);
      }),
    );
  };
  const updateVolumeSnapshot = (idx: number) => {
    props.updateVolumes(
      props.volumes.map((item, key) => {
        return key === idx
          ? {
              ...props.volumes[idx],
              snapshot: !props.volumes[idx].snapshot,
            }
          : item;
      }),
      props.metadataVolumes.map((item, key) => {
        return key === idx
          ? {
              ...props.metadataVolumes[idx],
              snapshot: !props.metadataVolumes[idx].snapshot,
            }
          : item;
      }),
    );
  };
  const updateVolumeSnapshotName = (name: string, idx: number) => {
    props.updateVolumes(
      props.volumes.map((item, key) => {
        return key === idx
          ? { ...props.volumes[idx], snapshot_name: name }
          : item;
      }),
      props.metadataVolumes.map((item, key) => {
        return key === idx
          ? { ...props.metadataVolumes[idx], snapshot_name: name }
          : item;
      }),
    );
  };
  const updateVolumeSize = (size: number, idx: number) => {
    props.updateVolumes(
      props.volumes.map((item, key) => {
        return key === idx ? { ...props.volumes[idx], size: size } : item;
      }),
      props.metadataVolumes.map((item, key) => {
        return key === idx
          ? { ...props.metadataVolumes[idx], size: size }
          : item;
      }),
    );
  };
  const updateVolumeSizeType = (sizeType: string, idx: number) => {
    props.updateVolumes(
      props.volumes.map((item, key) => {
        return key === idx
          ? { ...props.volumes[idx], size_type: sizeType }
          : item;
      }),
      props.metadataVolumes.map((item, key) => {
        return key === idx
          ? { ...props.metadataVolumes[idx], size_type: sizeType }
          : item;
      }),
    );
  };
  const addAnnotation = (idx: number) => {
    const updateItem = (item: IVolumeMetadata, key: number) => {
      if (key === idx) {
        return {
          ...item,
          annotations: [...item.annotations, DEFAULT_EMPTY_ANNOTATION],
        };
      } else {
        return item;
      }
    };
    props.updateVolumes(
      props.volumes.map((item, key) => {
        return updateItem(item, key);
      }),
      props.metadataVolumes.map((item, key) => {
        return updateItem(item, key);
      }),
    );
  };
  const deleteAnnotation = (volumeIdx: number, annotationIdx: number) => {
    const updateItem = (item: IVolumeMetadata, key: number) => {
      if (key === volumeIdx) {
        return {
          ...item,
          annotations: removeIdxFromArray(annotationIdx, item.annotations),
        };
      } else {
        return item;
      }
    };
    props.updateVolumes(
      props.volumes.map((item, key) => {
        return updateItem(item, key);
      }),
      props.metadataVolumes.map((item, key) => {
        return updateItem(item, key);
      }),
    );
  };
  const updateVolumeAnnotation = (
    annotation: { key: string; value: string },
    volumeIdx: number,
    annotationIdx: number,
  ) => {
    const updateItem = (item: IVolumeMetadata, key: number) => {
      if (key === volumeIdx) {
        return {
          ...item,
          annotations: updateIdxInArray(
            annotation,
            annotationIdx,
            item.annotations,
          ),
        };
      } else {
        return item;
      }
    };
    props.updateVolumes(
      props.volumes.map((item, key) => {
        return updateItem(item, key);
      }),
      props.metadataVolumes.map((item, key) => {
        return updateItem(item, key);
      }),
    );
  };

  let vols = (
    <div className="toolbar">
      <div className="input-container">No volumes mounts defined</div>
    </div>
  );

  if (props.volumes.length > 0) {
    vols = (
      <div>
        {' '}
        {props.volumes.map((v, idx) => {
          const nameLabel = props.selectVolumeTypes.filter(d => {
            return d.value === v.type;
          })[0].label;

          const mountPointPicker =
            v.type === 'clone' ? (
              <div>
                <Select
                  variant="standard"
                  label="Select from currently mounted points"
                  index={idx}
                  updateValue={updateVolumeMountPoint}
                  values={props.notebookMountPoints}
                  value={v.mount_point}
                />
              </div>
            ) : (
              <div>
                <Input
                  variant="standard"
                  label={'Mount Point'}
                  inputIndex={idx}
                  updateValue={updateVolumeMountPoint}
                  value={v.mount_point}
                />
              </div>
            );
          const sizePicker =
            v.type === 'pvc' ? null : (
              <div className="toolbar">
                <div style={{ marginRight: '10px', width: '50%' }}>
                  <Input
                    updateValue={updateVolumeSize}
                    value={v.size}
                    label={'Volume size'}
                    inputIndex={idx}
                    type="number"
                    variant="standard"
                  />
                </div>
                <div style={{ width: '50%' }}>
                  <Select
                    variant="standard"
                    updateValue={updateVolumeSizeType}
                    values={SELECT_VOLUME_SIZE_TYPES}
                    value={v.size_type}
                    label={'Type'}
                    index={idx}
                  />
                </div>
              </div>
            );

          const annotationField =
            v.type === 'pv' || v.type === 'new_pvc' || v.type === 'snap' ? (
              <div>
                {v.annotations && v.annotations.length > 0 ? (
                  <div style={{ padding: '10px 0' }}>
                    <div className="switch-label">Annotations</div>
                  </div>
                ) : (
                  ''
                )}

                {v.annotations && v.annotations.length > 0
                  ? v.annotations.map((a, a_idx) => {
                      return (
                        <AnnotationInput
                          key={`vol-${idx}-annotation-${a_idx}`}
                          label={'Annotation'}
                          volumeIdx={idx}
                          annotationIdx={a_idx}
                          updateValue={updateVolumeAnnotation}
                          deleteValue={deleteAnnotation}
                          annotation={a}
                          cannotBeDeleted={v.type === 'snap' && a_idx === 0}
                          rokAvailable={!props.rokError}
                        />
                      );
                    })
                  : null}

                <div className="add-button" style={{ padding: 0 }}>
                  <Button
                    variant="contained"
                    color="primary"
                    size="small"
                    title="Add Annotation"
                    onClick={_ => addAnnotation(idx)}
                  >
                    <AddIcon />
                    Add Annotation
                  </Button>
                </div>
              </div>
            ) : null;

          return (
            <div className="input-container volume-container" key={`v-${idx}`}>
              <div className="toolbar">
                <Select
                  variant="standard"
                  updateValue={updateVolumeType}
                  values={props.selectVolumeTypes}
                  value={v.type}
                  label={'Select Volume Type'}
                  index={idx}
                />
                <div className="delete-button">
                  <Button
                    variant="contained"
                    size="small"
                    title="Remove Volume"
                    onClick={_ => deleteVolume(idx)}
                  >
                    <DeleteIcon />
                  </Button>
                </div>
              </div>

              {mountPointPicker}

              <Input
                variant="standard"
                label={nameLabel + ' Name'}
                inputIndex={idx}
                updateValue={updateVolumeName}
                value={v.name}
                regex={'^([\\.\\-a-z0-9]+)$'}
                regexErrorMsg={
                  'Resource name must consist of lower case alphanumeric characters, -, and .'
                }
              />

              {sizePicker}

              {annotationField}

              <div className="toolbar" style={{ padding: '10px 0' }}>
                <div className={'switch-label'}>Snapshot Volume</div>
                <Switch
                  checked={v.snapshot}
                  onChange={_ => updateVolumeSnapshot(idx)}
                  color="primary"
                  name="enableKale"
                  inputProps={{ 'aria-label': 'primary checkbox' }}
                  id="snapshot-switch"
                  className="material-switch"
                />
              </div>

              {v.snapshot ? (
                <Input
                  variant="standard"
                  label={'Snapshot Name'}
                  // key={idx}
                  inputIndex={idx}
                  updateValue={updateVolumeSnapshotName}
                  value={v.snapshot_name}
                  regex={'^([\\.\\-a-z0-9]+)$'}
                  regexErrorMsg={
                    'Resource name must consist of lower case alphanumeric ' +
                    'characters, -, and .'
                  }
                />
              ) : null}
            </div>
          );
        })}
      </div>
    );
  }
  const addButton = (
    <div className="add-button">
      <Button
        color="primary"
        variant="contained"
        size="small"
        title="Add Volume"
        onClick={_ => addVolume()}
        style={{ marginLeft: '10px' }}
      >
        <AddIcon />
        Add Volume
      </Button>
    </div>
  );
  const useNotebookVolumesSwitch = (
    <div className="input-container">
      <LightTooltip
        title={
          props.rokError
            ? rokErrorTooltip(props.rokError)
            : "Enable this option to mount clones of this notebook's volumes " +
              'on your pipeline steps'
        }
        placement="top-start"
        interactive={props.rokError ? true : false}
        TransitionComponent={Zoom}
      >
        <div className="toolbar">
          <div className="switch-label">Use this notebook's volumes</div>
          <Switch
            checked={props.useNotebookVolumes}
            disabled={
              !!props.rokError || props.notebookMountPoints.length === 0
            }
            onChange={_ => props.updateVolumesSwitch()}
            color="primary"
            name="enableKale"
            inputProps={{ 'aria-label': 'primary checkbox' }}
            id="nb-volumes-switch"
            className="material-switch"
          />
        </div>
      </LightTooltip>
    </div>
  );
  const autoSnapshotSwitch = (
    <div className="input-container">
      <LightTooltip
        title={
          props.rokError
            ? rokErrorTooltip(props.rokError)
            : 'Enable this option to take Rok snapshots of your steps during ' +
              'pipeline execution'
        }
        placement="top-start"
        interactive={props.rokError ? true : false}
        TransitionComponent={Zoom}
      >
        <div className="toolbar">
          <div className="switch-label">
            Take Rok snapshots during each step
          </div>
          <Switch
            checked={props.autosnapshot}
            disabled={!!props.rokError || props.volumes.length === 0}
            onChange={_ => props.updateAutosnapshotSwitch()}
            color="primary"
            name="enableKale"
            inputProps={{ 'aria-label': 'primary checkbox' }}
            id="autosnapshot-switch"
            classes={{ root: 'material-switch' }}
          />
        </div>
      </LightTooltip>
    </div>
  );

  return (
    <React.Fragment>
      {useNotebookVolumesSwitch}
      {autoSnapshotSwitch}
      {props.notebookMountPoints.length > 0 && props.useNotebookVolumes
        ? null
        : vols}
      {props.notebookMountPoints.length > 0 && props.useNotebookVolumes
        ? null
        : addButton}
    </React.Fragment>
  );
};

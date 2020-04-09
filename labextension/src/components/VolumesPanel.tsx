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
import { Button, Switch, Tooltip, Zoom } from '@material-ui/core';
import AddIcon from '@material-ui/icons/Add';
import DeleteIcon from '@material-ui/icons/Delete';
import {
  AnnotationInput,
  MaterialInput,
  MaterialSelect,
  LightTooltip,
} from './Components';
import { IVolumeMetadata, ISelectVolumeTypes } from './LeftPanelWidget';
import { IRPCError, rokErrorTooltip } from '../utils/RPCUtils';

interface IProps {
  volumes: IVolumeMetadata[];
  addVolume: Function;
  deleteVolume: Function;
  updateVolumeType: Function;
  updateVolumeName: Function;
  updateVolumeMountPoint: Function;
  updateVolumeSnapshot: Function;
  updateVolumeSnapshotName: Function;
  updateVolumeSize: Function;
  updateVolumeSizeType: Function;
  updateVolumeAnnotation: Function;
  addAnnotation: Function;
  deleteAnnotation: Function;
  notebookMountPoints: { label: string; value: string }[];
  selectVolumeSizeTypes: { label: string; value: string; base: number }[];
  selectVolumeTypes: ISelectVolumeTypes[];
  useNotebookVolumes: boolean;
  updateVolumesSwitch: Function;
  autosnapshot: boolean;
  updateAutosnapshotSwitch: Function;
  rokError: IRPCError;
}

export class VolumesPanel extends React.Component<IProps, any> {
  render() {
    let vols = (
      <div className="toolbar">
        <div className="input-container">No volumes mounts defined</div>
      </div>
    );

    if (this.props.volumes.length > 0) {
      vols = (
        <div>
          {' '}
          {this.props.volumes.map((v, idx) => {
            const nameLabel = this.props.selectVolumeTypes.filter(d => {
              return d.value === v.type;
            })[0].label;

            const mountPointPicker =
              v.type === 'clone' ? (
                <div>
                  <MaterialSelect
                    label={'Select from currently mounted points'}
                    index={idx}
                    updateValue={this.props.updateVolumeMountPoint}
                    values={this.props.notebookMountPoints}
                    value={v.mount_point}
                  />
                </div>
              ) : (
                <div>
                  <MaterialInput
                    label={'Mount Point'}
                    inputIndex={idx}
                    updateValue={this.props.updateVolumeMountPoint}
                    value={v.mount_point}
                  />
                </div>
              );
            const sizePicker =
              v.type === 'pvc' ? null : (
                <div className="toolbar">
                  <div style={{ marginRight: '10px', width: '50%' }}>
                    <MaterialInput
                      updateValue={this.props.updateVolumeSize}
                      value={v.size}
                      label={'Volume size'}
                      inputIndex={idx}
                      numeric
                    />
                  </div>
                  <div style={{ width: '50%' }}>
                    <MaterialSelect
                      updateValue={this.props.updateVolumeSizeType}
                      values={this.props.selectVolumeSizeTypes}
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
                            updateValue={this.props.updateVolumeAnnotation}
                            deleteValue={this.props.deleteAnnotation}
                            annotation={a}
                            cannotBeDeleted={v.type === 'snap' && a_idx === 0}
                            rokAvailable={!this.props.rokError}
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
                      onClick={_ => this.props.addAnnotation(idx)}
                    >
                      <AddIcon />
                      Add Annotation
                    </Button>
                  </div>
                </div>
              ) : null;

            return (
              <div
                className="input-container volume-container"
                key={`v-${idx}`}
              >
                <div className="toolbar">
                  <MaterialSelect
                    updateValue={this.props.updateVolumeType}
                    values={this.props.selectVolumeTypes}
                    value={v.type}
                    label={'Select Volume Type'}
                    index={idx}
                  />
                  <div className="delete-button">
                    <Button
                      variant="contained"
                      size="small"
                      title="Remove Volume"
                      onClick={_ => this.props.deleteVolume(idx)}
                    >
                      <DeleteIcon />
                    </Button>
                    {/* <button type="button"
                                        className="minimal-toolbar-button"
                                        title="Delete Volume"
                                        onClick={_ => this.props.deleteVolume(idx)}
                                >
                                    <span
                                        className="jp-CloseIcon jp-Icon jp-Icon-16"
                                        style={{padding: 0, flex: "0 0 auto", marginRight: 0}}/>
                                </button> */}
                  </div>
                </div>

                {mountPointPicker}

                <MaterialInput
                  label={nameLabel + ' Name'}
                  inputIndex={idx}
                  updateValue={this.props.updateVolumeName}
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
                    onChange={_ => this.props.updateVolumeSnapshot(idx)}
                    color="primary"
                    name="enableKale"
                    inputProps={{ 'aria-label': 'primary checkbox' }}
                    id="snapshot-switch"
                    className="material-switch"
                  />
                </div>

                {v.snapshot ? (
                  <MaterialInput
                    label={'Snapshot Name'}
                    // key={idx}
                    inputIndex={idx}
                    updateValue={this.props.updateVolumeSnapshotName}
                    value={v.snapshot_name}
                    regex={'^([\\.\\-a-z0-9]+)$'}
                    regexErrorMsg={
                      'Resource name must consist of lower case alphanumeric characters, -, and .'
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
          onClick={_ => this.props.addVolume()}
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
            this.props.rokError
              ? rokErrorTooltip(this.props.rokError)
              : "Enable this option to mount clones of this notebook's volumes on your pipeline steps"
          }
          placement="top-start"
          interactive={this.props.rokError ? true : false}
          TransitionComponent={Zoom}
        >
          <div className="toolbar">
            <div className="switch-label">Use this notebook's volumes</div>
            <Switch
              checked={this.props.useNotebookVolumes}
              disabled={
                !!this.props.rokError ||
                this.props.notebookMountPoints.length === 0
              }
              onChange={_ => this.props.updateVolumesSwitch()}
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
            this.props.rokError
              ? rokErrorTooltip(this.props.rokError)
              : 'Enable this option to take Rok snapshots of your steps during pipeline execution'
          }
          placement="top-start"
          interactive={this.props.rokError ? true : false}
          TransitionComponent={Zoom}
        >
          <div className="toolbar">
            <div className="switch-label">
              Take Rok snapshots before each step
            </div>
            <Switch
              checked={this.props.autosnapshot}
              disabled={
                !!this.props.rokError || this.props.volumes.length === 0
              }
              onChange={_ => this.props.updateAutosnapshotSwitch()}
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
        {this.props.notebookMountPoints.length > 0 &&
        this.props.useNotebookVolumes
          ? null
          : vols}
        {this.props.notebookMountPoints.length > 0 &&
        this.props.useNotebookVolumes
          ? null
          : addButton}
      </React.Fragment>
    );
  }
}

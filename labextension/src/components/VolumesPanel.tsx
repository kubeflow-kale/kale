import * as React from "react";
import {MaterialInput} from "./Components";
import Select from "react-select";
import {IVolumeMetadata} from "./LeftPanelWidget";
import Switch from "react-switch";

interface IProps {
    volumes: IVolumeMetadata[],
    addVolume: Function,
    deleteVolume: Function,
    updateVolumeType: Function,
    updateVolumeName: Function,
    updateVolumeMountPoint: Function,
    updateVolumeSnapshot: Function,
    updateVolumeSize: Function,
    valid?: Function
}

const selectValues = [
    {label: "Existing PVC", value: 'pvc'},
    {label: "Existing PV", value: 'pv'},
    {label: "Rok Resource", value: 'rok'}
];

export class VolumesPanel extends React.Component<IProps, any> {

    render() {

        let vols =
                <div className="jp-Toolbar toolbar" style={{padding: 0, marginLeft: "10px"}}>
                    <div className="jp-Toolbar-item"  style={{fontSize: 'var(--jp-ui-font-size0)'}}>
                        No volumes mounts defined
                    </div>
                </div>;
        if (this.props.volumes.length > 0) {
            vols =
                <div> {
                this.props.volumes.map((v, idx) => {
                    const nameLabel = selectValues.filter((d) => {return (d.value === v.type)})[0].label;
                    return (
                    <div className='input-container'>
                        <div className="toolbar">
                            <Select
                                className='react-select-container volumes-select'
                                classNamePrefix='react-select'
                                // getting correct label from selectValue based on this volume type
                                value={{label: nameLabel, value: v.type}}
                                onChange={(v: any) => this.props.updateVolumeType(v.value, idx)}
                                options={selectValues}
                                theme={theme => ({
                                    ...theme,
                                    borderRadius: 0,
                                    colors: {
                                        ...theme.colors,
                                        neutral0: 'var(--jp-input-active-background)',
                                        neutral10: 'var(--md-indigo-300)',
                                        neutral20: 'var(--jp-input-border-color)',
                                        primary: 'var(--jp-input-active-border-color)',
                                        primary25: 'var(--jp-layout-color3)',
                                        neutral80: 'var(--jp-ui-font-color0)'
                                    },
                                })}
                            />
                            <div>
                                <button type="button"
                                        className="minimal-toolbar-button"
                                        title="Delete Volume"
                                        onClick={_ => this.props.deleteVolume(idx)}
                                >
                                    <span
                                        className="jp-CloseIcon jp-Icon jp-Icon-16"
                                        style={{padding: 0, flex: "0 0 auto", marginRight: 0}}/>
                                </button>
                            </div>
                        </div>

                        {/*// TODO: Input validation with regex: In case of pv and pvc need one validation, *}
                        {/* in case of rok url validate url*/}

                        <MaterialInput
                            label={nameLabel + " Name"}
                            key={idx}
                            inputIndex={idx}
                            updateValue={this.props.updateVolumeName}
                            value={v.name}
                        />

                        <MaterialInput
                            label={"Mount Point"}
                            key={idx}
                            inputIndex={idx}
                            updateValue={this.props.updateVolumeMountPoint}
                            value={v.mount_point}
                        />

                        <div className="toolbar">
                            <div className={"switch-label"}>Snapshot Volume</div>
                            <Switch
                                checked={v.snapshot}
                                onChange={_ => this.props.updateVolumeSnapshot(idx)}
                                onColor="#599EF0"
                                onHandleColor="#477EF0"
                                handleDiameter={18}
                                uncheckedIcon={false}
                                checkedIcon={false}
                                boxShadow="0px 1px 5px rgba(0, 0, 0, 0.6)"
                                activeBoxShadow="0px 0px 1px 7px rgba(0, 0, 0, 0.2)"
                                height={10}
                                width={20}
                                className="skip-switch"
                                id="skip-switch"
                            />
                        </div>
                    </div>
                    )
                }

            )}
                </div>
        }

        return (
            <div>
                <div className={"kale-header-switch"} style={{paddingTop: "20px"}}>
                    <div className="kale-header" style={{paddingTop: "0"}}>
                        Volumes
                    </div>
                    <div className={"skip-switch-container"}>
                        <button type="button"
                                className="minimal-toolbar-button"
                                title="Add Volume"
                                onClick={_ => this.props.addVolume()}
                        >
                        <span className="jp-Icon" style={{padding: 0, flex: "0 0 auto", marginRight: 0}}>
                            Add Volume
                        </span>
                        </button>
                    </div>
                </div>

                {vols}

            </div>
        )

    }

}
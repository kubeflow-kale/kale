import * as React from "react";
import {InputText} from "./Components";

interface IProps {
    volumes: string[],
    addVolume: Function,
    updateVolume: Function,
    deleteVolume: Function,
    valid?: Function
}

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
                this.props.volumes.map((v, idx) =>
                <div className="jp-Toolbar toolbar">
                    <div className="jp-Toolbar-item" style={{width: "80%"}}>
                        {/*<div className="input-container" style={{padding: 0}}>*/}
                        {/*    <div className="input-wrapper" style={{margin: 0}}>*/}
                        {/*        <input*/}
                        {/*            placeholder="pvcName;mountPoint"*/}
                        {/*            value={v}*/}
                        {/*            onChange={evt => this.props.updateVolume(idx, (evt.target as HTMLInputElement).value)}*/}
                        {/*        />*/}
                        {/*    </div>*/}
                        {/*</div>*/}
                        <InputText
                            key={idx}
                            tight
                            inputIndex={idx}
                            placeholder={"pvc-name;mount-point"}
                            updateValue={this.props.updateVolume}
                            value={v}
                            regex={"^[a-z0-9]([-a-z0-9]*[a-z0-9])?;[^\\0\\s][^\\0]*$"}
                            regexErrorMsg={"Volume spec must consist of `pvc-name`;`unix-path` where PVC name consists of lower case alphanumeric characters or '-', and must start and end with an alphanumeric character."}
                            valid={this.props.valid}
                        />
                    </div>

                    <div className="jp-ToolbarButton jp-Toolbar-item">
                        <button type="button"
                                className="bp3-button bp3-minimal jp-ToolbarButtonComponent minimal jp-Button"
                                title="Add Volume"
                                onClick={_ => this.props.deleteVolume(idx)}
                        >
                            <span className="bp3-button-text">
                                <span className="jp-CloseIcon jp-ToolbarButtonComponent-icon jp-Icon jp-Icon-16">
                                </span>
                            </span>
                        </button>
                    </div>
                </div>

            )}
                </div>
        }

        return (
            <div className="jp-KeySelector">
                <div className="jp-Toolbar toolbar">
                    <div className="jp-Toolbar-item">Volumes</div>
                    <div className="jp-ToolbarButton jp-Toolbar-item">
                        <button type="button"
                                className="bp3-button bp3-minimal jp-ToolbarButtonComponent minimal jp-Button"
                                title="Add Volume"
                                onClick={_ => this.props.addVolume('')}
                        >
                            <span className="bp3-button-text">
                                <span className="jp-AddIcon jp-ToolbarButtonComponent-icon jp-Icon jp-Icon-16">
                                </span>
                            </span>
                        </button>
                    </div>
                </div>
                {vols}
            </div>
        )

    }

}
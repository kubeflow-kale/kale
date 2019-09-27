import * as React from "react";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faSyncAlt} from "@fortawesome/free-solid-svg-icons";

export class InputText extends React.Component<
    {
        label?: string,
        placeholder: string,
        updateValue: Function,
        value: string,
        regex?: string,
        regexErrorMsg?: string,
        valid?: Function,
        inputIndex?: number,
        tight?: boolean,
    },
    {
        focus: boolean,
        error: boolean,
    }>
{
    state = {
        focus: false,
        error: false,
    };

    onChange = (value: string, index: number) => {
        // if the input domain is restricted by a regex
        if (this.props.regex) {
            let re = new RegExp(this.props.regex);
            if (!re.test(value)) {
                this.setState({error: true});
                this.props.valid(false);
            } else {
                this.setState({error: false});
                this.props.valid(true)
            }
        }
        this.props.updateValue(value, index)
    };

    render() {
        const onFocusClass = (this.state.focus) ? 'input-focus' : '';
        const lbl = (this.props.label) ? <label>{this.props.label}</label>: null;
        const lbl_error = (this.state.error) ? <div className="input-error-label">{this.props.regexErrorMsg}</div> : null;

        const containerStyle = (this.props.tight) ? {padding: 0, minWidth: "100%"}: null;
        const inputStyle = (this.props.tight) ? {margin: 0}: null;

        return (
            <div className="input-container" style={containerStyle}>
                {lbl}
                <div className={"input-wrapper " + onFocusClass} style={inputStyle}>
                    <input placeholder={this.props.placeholder}
                           value={this.props.value}
                           onChange={evt => this.onChange((evt.target as HTMLInputElement).value, this.props.inputIndex)}
                           onFocus={_ => this.setState({focus: !this.state.focus})}
                           onBlur={_ => this.setState({focus: !this.state.focus})}
                    />
                </div>
                { lbl_error }
            </div>
        )
    }
}


export class DeployButton extends React.Component<
    {
        callback: Function,
        deployment: boolean
    },
    any>
{

    render() {
        const buttonText = this.props.deployment ? "Running Deployment..." : "Deploy Notebook to Kubeflow Pipelines";

        return (
            <div className="deploy-button">
                <button onClick={() => {
                    this.props.callback()
                }}>
                    {this.props.deployment ?
                        <FontAwesomeIcon icon={faSyncAlt} spin style={{marginRight: "5px"}}/> : null}
                    <span>{buttonText}</span>
                </button>
            </div>
        )
    }
}

export class CollapsablePanel extends React.Component<
    {
        title: string,
        dockerImageValue: string,
        dockerChange: Function,
        deployChecked: boolean,
        deployClick: Function
    },
    {
        collapsed: boolean
    }>
{
    state = {
        collapsed: true
    };

    render() {

        let wrapper_class = '';
        let content_class = 'p-mod-hidden';
        if (!this.state.collapsed) {
            wrapper_class = 'jp-Collapse-open';
            content_class = '';
        }
        return (
            <div className={'jp-Collapse ' + wrapper_class}>
                <div
                    className='jp-Collapse-header'
                    onClick={_ => this.setState({collapsed: !this.state.collapsed})}
                >{this.props.title}</div>
                <div className={'p-Panel jp-Collapse-contents ' + content_class} style={{padding: "0 0 10px 0"}}>
                    <InputText
                        label={"Docker image"}
                        placeholder={"Image name"}
                        updateValue={this.props.dockerChange}
                        value={this.props.dockerImageValue}/>

                    <div className="input-container">
                        <label>
                          <input
                            type="checkbox"
                            value={"deploy"}
                            checked={this.props.deployChecked}
                            onChange={_ => this.props.deployClick()}
                          />

                          {"Deploy pipeline to KFP"}
                        </label>
                      </div>
                </div>
            </div>
        )
    }
}

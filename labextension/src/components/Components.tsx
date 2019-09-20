import * as React from "react";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faSyncAlt} from "@fortawesome/free-solid-svg-icons";

export class InputText extends React.Component<
    {
        label?: string,
        placeholder: string,
        updateValue: Function,
        value: string
    },
    {
        focus: boolean
    }>
{
    state = {
        focus: false
    };
    render() {
        const onFocusClass = (this.state.focus) ? 'input-focus' : '';
        let lbl = null;
        if (this.props.label) {
            lbl = <label>{this.props.label}</label>
        }

        return (
            <div className="input-container">
                {lbl}
                <div className={"input-wrapper " + onFocusClass}>
                    <input placeholder={this.props.placeholder}
                           value={this.props.value}
                           onChange={evt => this.props.updateValue((evt.target as HTMLInputElement).value)}
                           onFocus={_ => this.setState({focus: !this.state.focus})}
                           onBlur={_ => this.setState({focus: !this.state.focus})}
                    />
                </div>
            </div>
        )
    }
}

export class InputArea extends React.Component<
    {
        label: string,
        placeholder: string,
        updateValue: Function,
        value: string
    },
    {
        focus: boolean
    }>
{
     state = {
        focus: false
    };
    render() {
        const onFocusClass = (this.state.focus) ? 'input-focus' : '';
        return (
            <div className="input-container">
                <div className={"input-wrapper " + onFocusClass}>
                    <textarea rows={4} cols={50} placeholder={this.props.placeholder} value={this.props.value}
                              onChange={evt => this.props.updateValue((evt.target as HTMLTextAreaElement).value)}
                              onFocus={_ => this.setState({focus: !this.state.focus})}
                              onBlur={_ => this.setState({focus: !this.state.focus})}
                    />
                </div>
            </div>
        )
    }
}

export class Checkbox extends React.Component<{ isChecked: boolean, label: string, handleChange: Function }, any> {
  render() {
    return (
      <div className="input-container">
        <label>
          <input
            type="checkbox"
            value={this.props.label}
            checked={this.props.isChecked}
            onClick={evt => this.props.handleChange}
          />

          {this.props.label}
        </label>
      </div>
    );
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
        deployChange: Function
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
                    <Checkbox
                        label={"Deploy pipeline to KFP"}
                        isChecked={this.props.deployChecked}
                        handleChange={this.props.deployChange}
                    />
                </div>
            </div>
        )
    }
}

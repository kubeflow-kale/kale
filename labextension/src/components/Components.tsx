import * as React from "react";
import {findDOMNode} from "react-dom";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faSyncAlt} from "@fortawesome/free-solid-svg-icons";
import Switch from "react-switch";
import {
    makeStyles, createStyles, createMuiTheme
} from '@material-ui/core/styles';
import TextField from '@material-ui/core/TextField';
import { ThemeProvider } from '@material-ui/styles';
import { indigo } from '@material-ui/core/colors';
import {MenuItem, Select} from "@material-ui/core";
import Chip from "@material-ui/core/Chip";
import InputLabel from "@material-ui/core/InputLabel";
import FormControl from '@material-ui/core/FormControl';
import OutlinedInput from "@material-ui/core/OutlinedInput";


const useStyles = makeStyles(() =>
    createStyles({
        label: {
            backgroundColor: "var(--jp-layout-color1)",
            color: 'var(--jp-input-border-color)',
        },
        input: {
            borderRadius: 4,
            position: 'relative',
            color: "var(--jp-ui-font-color1)",
            backgroundColor: "var(--jp-layout-color1)",
            '&$cssFocused $notchedOutline': {
                borderColor: "var(--md-indigo-300) !important",
            }
        },
        focused: {},
        notchedOutline: {
            borderWidth: '1px',
            borderColor: 'var(--jp-input-border-color)',
          },
        textField: {
            width: "100%",
        },
        menu: {
            backgroundColor: "var(--jp-layout-color1)",
            color: "var(--jp-ui-font-color1)"
        },
        helperLabel: {
            color: "var(--jp-info-color0)"
        }
    }),
);

const theme = createMuiTheme({
  palette: {
    primary: indigo,
  },
});


interface IMaterialInput {
    updateValue: Function,
    value: string,
    label: string,
    regex?: string,
    regexErrorMsg?: string,
    valid?: Function,
    inputIndex?: number,
    helperText?: string,
}

export const MaterialInput: React.FunctionComponent<IMaterialInput> = (props) => {

    const [error, updateError] = React.useState(
        false
    );
    const classes = useStyles({});

    const onChange = (value: string, index: number) => {
        // if the input domain is restricted by a regex
        if (props.regex) {
            let re = new RegExp(props.regex);
            if (value !== '' && !re.test(value)) {
                updateError(true);
                props.valid(false);
            } else {
                updateError(false);
                props.valid(true)
            }
        }
        props.updateValue(value, index)
    };

    let helperText = (props.helperText) ? props.helperText: null;
    helperText = (error)? props.regexErrorMsg: helperText;

    return <ThemeProvider theme={theme}><TextField
            InputLabelProps={{
                classes: {
                    root: classes.label
                }
            }}
            InputProps={{
                classes: {
                    root: classes.input,
                    focused: classes.focused,
                    notchedOutline: classes.notchedOutline,
                }
            }}
            FormHelperTextProps={{
                classes: {
                    root: classes.helperLabel
                }
            }}
            className={classes.textField}
            error={error}
            id="outlined-name"
            label={props.label}
            value={props.value}
            onChange={evt => onChange((evt.target as HTMLInputElement).value, props.inputIndex)}
            margin="dense"
            variant="outlined"
            helperText={helperText}
    /></ThemeProvider>
};

interface IMaterialSelect {
    updateValue: Function,
    values: any,
    value: any,
    label: string,
    index: number,
}

export const MaterialSelect: React.FunctionComponent<IMaterialSelect> = (props) => {

    const classes = useStyles({});

    return <ThemeProvider theme={theme}>
        <TextField
            select
            InputLabelProps={{
                classes: {
                    root: classes.label
                }
            }}
            InputProps={{
                classes: {
                    root: classes.input,
                    focused: classes.focused,
                    notchedOutline: classes.notchedOutline,
                }
            }}
            SelectProps={{
              MenuProps: {
                  PaperProps: {
                    className: classes.menu,
                  }
              },
            }}
            className={classes.textField}
            id={props.label}
            label={props.label}
            value={props.value}
            onChange={evt => props.updateValue((evt.target as HTMLInputElement).value, props.index)}
            margin="dense"
            variant="outlined"
        >
            {props.values.map((option: any) => (
                <MenuItem key={option.value} value={option.value}>
                    {option.label}
                </MenuItem>
            ))}
        </TextField>
    </ThemeProvider>
};


const useStylesSelectMulti = makeStyles(() =>
    createStyles({
        root: {
            '&outlined': {
                borderColor: 'var(--jp-input-border-color)',
            },
        },
        outlined: {},
        menu: {
            backgroundColor: "var(--jp-layout-color1)",
            color: "var(--jp-ui-font-color1)"
        },
        chips: {
            display: 'flex',
            flexWrap: 'wrap',
        },
        chip: {
            margin: 2,
        },
        multiSelectForm: {
            width: "100%"
        },

    }),
);

interface IMaterialSelectMultiple {
    updateSelected: Function,
    options: string[],
    selected: string[]
}
export const MaterialSelectMulti: React.FunctionComponent<IMaterialSelectMultiple> = (props) => {

    const classes = useStylesSelectMulti({});
    const [inputLabelRef, setInputLabelRef] = React.useState(undefined);
    const labelOffsetWidth = inputLabelRef
        //@ts-ignore
        ? findDOMNode(inputLabelRef).offsetWidth
    : 0;

    return <ThemeProvider theme={theme}>
        <FormControl variant='outlined' margin='dense' className={classes.multiSelectForm}>
            <InputLabel
            ref={ref => {
              setInputLabelRef(ref);
            }}
            htmlFor="select-previous-blocks"
          >
            Select previous blocks
          </InputLabel>
        <Select
            multiple
            classes={{
                root: classes.root,
                outlined: classes.outlined,
            }}
            MenuProps={{
                PaperProps: {
                    className: classes.menu,
                }
            }}
            onChange={evt => props.updateSelected((evt.target as HTMLInputElement).value)}
            margin="dense"
            variant="outlined"
            input={<OutlinedInput margin='dense' labelWidth={labelOffsetWidth} name="previous"  id="select-previous-blocks" />}
            value={props.selected}
            renderValue={elements => (
                <div className={classes.chips}>
                  {(elements as string[]).map(value => (
                    <Chip key={value} label={value} className={classes.chip} />
                  ))}
                </div>
              )}
        >
            {props.options.map((option: any) => (
                <MenuItem key={option} value={option}>
                    {option}
                </MenuItem>
            ))}
        </Select>
        </FormControl>
    </ThemeProvider>
};



export class DeployButton extends React.Component<
    {
        callback: Function,
        deployment: boolean,
        // weather deployment to kfp is active or not
        deploy: boolean
    },
    any>
{

    render() {
        const buttonText = (this.props.deploy)?
            this.props.deployment ? "Running Deployment..." : "Deploy Notebook to KFP" :
            this.props.deployment ? "Running Conversion..." : "Generate KFP Pipeline";

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
        collapsed: false
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
                <div className={'input-container p-Panel jp-Collapse-contents ' + content_class}>
                    <MaterialInput
                        label={"Docker image"}
                        updateValue={this.props.dockerChange}
                        value={this.props.dockerImageValue}/>

                    <div className={'toolbar'} style={{padding: "12px 4px 0 4px"}}>
                        <label className={"switch-label"}>Deploy pipeline to KFP</label>
                        <Switch
                            checked={this.props.deployChecked}
                            onChange={_ => this.props.deployClick()}
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
            </div>
        )
    }
}

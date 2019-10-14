import * as React from "react";
import Grid from '@material-ui/core/Grid';
import Button from '@material-ui/core/Button';
import ButtonGroup from '@material-ui/core/ButtonGroup';
import ArrowDropDownIcon from '@material-ui/icons/ArrowDropDown';
import ClickAwayListener from '@material-ui/core/ClickAwayListener';
import Grow from '@material-ui/core/Grow';
import Paper from '@material-ui/core/Paper';
import Popper from '@material-ui/core/Popper';
import MenuItem from '@material-ui/core/MenuItem';
import MenuList from '@material-ui/core/MenuList';
import CircularProgress from '@material-ui/core/CircularProgress'

const options = [
    {label: "Compile and Run", value: "run"},
    {label: "Compile and Upload", value: "upload"},
    {label: "Compile to DSL", value: "compile"}
];

interface ISplitDeployButton {
    running: boolean,
    handleClick: Function
}

export const SplitDeployButton: React.FunctionComponent<ISplitDeployButton> = (props) => {
    const [open, setOpen] = React.useState(false);
    const anchorRef = React.useRef(null);
    const [selectedIndex, setSelectedIndex] = React.useState(0);

    const handleMenuItemClick = (event: React.MouseEvent<HTMLLIElement>, index: number) => {
        setSelectedIndex(index);
        setOpen(false);
    };

    const handleToggle = () => {
        setOpen(prevOpen => !prevOpen);
    };

    const handleClose = (event: React.MouseEvent<Document>) => {
        if (anchorRef.current && anchorRef.current.contains(event.target)) {
            return;
        }

        setOpen(false);
    };

    return (
    <div className='deploy-button'>
        <Grid container>
          <Grid item xs={12} style={{padding: '4px 10px 2px'}}>
            <ButtonGroup style={{width: '100%'}} variant="contained" color="primary" ref={anchorRef} aria-label="split button">
              <Button style={{width: '100%'}} onClick={_ => props.handleClick(options[selectedIndex].value)}>
                  {(props.running)? <CircularProgress thickness={6} size={14} color={'primary'} />: options[selectedIndex].label}
                  {/*{"  " + options[selectedIndex].label}*/}
              </Button>
              <Button
                color="primary"
                size="small"
                aria-owns={open ? 'menu-list-grow' : undefined}
                aria-haspopup="true"
                onClick={handleToggle}
                style={{width: 'auto'}}
              >
                <ArrowDropDownIcon />
              </Button>
            </ButtonGroup>
            <Popper style={{zIndex: 2}} open={open} anchorEl={anchorRef.current} transition disablePortal>
              {({ TransitionProps, placement }) => (
                <Grow
                  {...TransitionProps}
                  style={{
                    transformOrigin: placement === 'bottom' ? 'center top' : 'center bottom',
                  }}
                >
                  <Paper id="menu-list-grow">
                    <ClickAwayListener onClickAway={handleClose}>
                      <MenuList>
                        {options.map((option, index) => (
                          <MenuItem
                            key={option.value}
                            // disabled={index === 2}
                            selected={index === selectedIndex}
                            onClick={event => handleMenuItemClick(event, index)}
                          >
                            {option.label}
                          </MenuItem>
                        ))}
                      </MenuList>
                    </ClickAwayListener>
                  </Paper>
                </Grow>
              )}
            </Popper>
          </Grid>
        </Grid>
    </div>
  );
};
// Copyright 2026 The Kubeflow Authors.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import * as React from 'react';
import { Button, CircularProgress, Tooltip } from '@mui/material';
import { styled } from '@mui/material/styles';
import { Input } from './Input';
import { executeRpc, RPCError } from '../lib/RPCUtils';
import { Kernel } from '@jupyterlab/services';
import { Notification } from '@jupyterlab/apputils';
import { theme } from '../Theme';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

const Container = styled('div')(({ theme }) => ({
  marginTop: '16px',
}));

const CollapseHeader = styled('div')(({ theme }) => ({
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
  },
}));

const FieldLabelContainer = styled('div')({
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  marginBottom: '4px',
});

const FieldLabel = styled('span')({
  fontSize: '0.75rem',
  color: 'var(--jp-ui-font-color1)',
});

const InfoIconStyled = styled(InfoOutlinedIcon)({
  fontSize: '14px',
  color: 'var(--jp-ui-font-color2)',
  cursor: 'help',
});

const CollapseContents = styled('div')<{ collapsed: boolean }>(
  ({ collapsed }) => ({
    display: collapsed ? 'none' : 'block',
  }),
);

const ButtonContainer = styled('div')({
  display: 'flex',
  gap: '8px',
  marginTop: '16px',
});

const StatusMessage = styled('div')<{ success: boolean }>(
  ({ success, theme }) => ({
    padding: '8px',
    marginTop: '8px',
    borderRadius: '4px',
    backgroundColor: success
      ? theme.palette.success.light
      : theme.palette.error.light,
    color: success
      ? theme.palette.success.contrastText
      : theme.palette.error.contrastText,
    fontSize: '0.875rem',
  }),
);

export interface IKFPServerConfig {
  host: string | null;
  namespace: string;
  cookies: string | null;
  existing_token: string | null;
}

interface IProps {
  kernel: Kernel.IKernelConnection | null;
  onConfigChange?: () => void;
}

interface IState {
  collapsed: boolean;
  config: IKFPServerConfig;
  loading: boolean;
  testing: boolean;
  statusMessage: { success: boolean; message: string } | null;
}

export class KFPServerSettings extends React.Component<IProps, IState> {
  constructor(props: IProps) {
    super(props);
    this.state = {
      collapsed: true,
      config: {
        host: null,
        namespace: 'kubeflow',
        cookies: null,
        existing_token: null,
      },
      loading: false,
      testing: false,
      statusMessage: null,
    };
  }

  async componentDidMount() {
    await this.loadConfig();
  }

  async componentDidUpdate(prevProps: IProps) {
    if (prevProps.kernel !== this.props.kernel && this.props.kernel) {
      await this.loadConfig();
    }
  }

  loadConfig = async () => {
    if (!this.props.kernel) {
      return;
    }

    this.setState({ loading: true });
    try {
      const config = await executeRpc(
        this.props.kernel,
        'kfp.get_kfp_server_config',
      );
      this.setState({ config, loading: false });
    } catch (error) {
      console.error('Failed to load KFP server config:', error);
      this.setState({ loading: false });
      if (error instanceof RPCError) {
        await error.showDialog();
      }
    }
  };

  saveConfig = async () => {
    if (!this.props.kernel) {
      return;
    }

    this.setState({ loading: true, statusMessage: null });
    try {
      const savedConfig = await executeRpc(
        this.props.kernel,
        'kfp.set_kfp_server_config',
        { config: this.state.config },
      );
      this.setState({
        config: savedConfig,
        loading: false,
        statusMessage: {
          success: true,
          message: 'Configuration saved successfully',
        },
      });
      Notification.success('KFP server configuration saved');
      if (this.props.onConfigChange) {
        this.props.onConfigChange();
      }
    } catch (error) {
      console.error('Failed to save KFP server config:', error);
      this.setState({ loading: false });
      if (error instanceof RPCError) {
        await error.showDialog();
      }
    }
  };

  testConnection = async () => {
    if (!this.props.kernel) {
      return;
    }

    this.setState({ testing: true, statusMessage: null });
    try {
      const result = await executeRpc(
        this.props.kernel,
        'kfp.validate_kfp_server_config',
        { config: this.state.config },
      );
      this.setState({
        testing: false,
        statusMessage: {
          success: result.success,
          message: result.message,
        },
      });
    } catch (error) {
      console.error('Failed to test KFP server connection:', error);
      this.setState({
        testing: false,
        statusMessage: {
          success: false,
          message: 'Failed to test connection',
        },
      });
      if (error instanceof RPCError) {
        await error.showDialog();
      }
    }
  };

  resetToDefault = async () => {
    this.setState({
      config: {
        host: null,
        namespace: 'kubeflow',
        cookies: null,
        existing_token: null,
      },
      statusMessage: null,
    });
  };

  updateField = (field: keyof IKFPServerConfig, value: string) => {
    this.setState(prevState => ({
      config: {
        ...prevState.config,
        [field]: value || null,
      },
      statusMessage: null,
    }));
  };

  renderFieldWithInfo = (
    label: string,
    tooltipText: string,
    inputProps: any,
  ) => {
    return (
      <div>
        <FieldLabelContainer>
          <FieldLabel>{label}</FieldLabel>
          <Tooltip title={tooltipText} placement="top">
            <InfoIconStyled />
          </Tooltip>
        </FieldLabelContainer>
        <Input {...inputProps} label="" />
      </div>
    );
  };

  render() {
    const { collapsed, config, loading, testing, statusMessage } = this.state;

    return (
      <Container>
        <CollapseHeader
          onClick={() => this.setState({ collapsed: !collapsed })}
        >
          <p
            className="kale-header"
            style={{ color: theme.kale.headers.main, margin: 0 }}
          >
            KFP Server Settings
          </p>
          {collapsed ? (
            <ExpandMoreIcon style={{ color: theme.kale.headers.main }} />
          ) : (
            <ExpandLessIcon style={{ color: theme.kale.headers.main }} />
          )}
        </CollapseHeader>
        <CollapseContents collapsed={collapsed}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <CircularProgress size={24} />
            </div>
          ) : (
            <div className="input-container">
              {this.renderFieldWithInfo(
                'KFP Host',
                'Leave empty for in-cluster default discovery',
                {
                  updateValue: (value: string) =>
                    this.updateField('host', value),
                  value: config.host || '',
                  placeholder:
                    'http://ml-pipeline.kubeflow.svc.cluster.local:8888',
                  variant: 'standard',
                  inputIndex: 0,
                },
              )}

              <Input
                label="Namespace"
                updateValue={(value: string) =>
                  this.updateField('namespace', value)
                }
                value={config.namespace}
                placeholder="kubeflow"
                variant="standard"
                inputIndex={1}
              />

              {this.renderFieldWithInfo(
                'Cookies (optional)',
                'For cookie-based authentication',
                {
                  updateValue: (value: string) =>
                    this.updateField('cookies', value),
                  value: config.cookies || '',
                  placeholder: 'authservice_session=...',
                  variant: 'standard',
                  inputIndex: 2,
                },
              )}

              {this.renderFieldWithInfo(
                'Bearer Token (optional)',
                'For token-based authentication',
                {
                  updateValue: (value: string) =>
                    this.updateField('existing_token', value),
                  value: config.existing_token || '',
                  placeholder: 'Bearer token...',
                  variant: 'standard',
                  inputIndex: 3,
                },
              )}

              {statusMessage && (
                <StatusMessage success={statusMessage.success}>
                  {statusMessage.message}
                </StatusMessage>
              )}

              <ButtonContainer>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={this.testConnection}
                  disabled={testing || loading}
                  size="small"
                >
                  {testing ? <CircularProgress size={16} /> : 'Test Connection'}
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={this.saveConfig}
                  disabled={loading}
                  size="small"
                >
                  Save
                </Button>
                <Button
                  variant="outlined"
                  onClick={this.resetToDefault}
                  disabled={loading}
                  size="small"
                >
                  Reset to Default
                </Button>
              </ButtonContainer>
            </div>
          )}
        </CollapseContents>
      </Container>
    );
  }
}

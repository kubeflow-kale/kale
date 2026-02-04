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
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import TrendingFlatIcon from '@mui/icons-material/TrendingFlat';
import CloudQueueIcon from '@mui/icons-material/CloudQueue';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import { theme } from '../Theme';
import { NotebookPanel } from '@jupyterlab/notebook';

interface IKaleEmptyStateProps {
  activeNotebook: NotebookPanel | null;
}

export class KaleEmptyState extends React.Component<IKaleEmptyStateProps> {
  render() {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 20px',
          textAlign: 'center',
          maxWidth: '500px',
          margin: '0 auto',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '32px',
            color: theme.kale.headers.main,
          }}
        >
          <MenuBookIcon sx={{ fontSize: 60 }} />
          <TrendingFlatIcon sx={{ mx: 1.5, fontSize: 32 }} />
          <AccountTreeIcon sx={{ fontSize: 60 }} />
          <TrendingFlatIcon sx={{ mx: 1.5, fontSize: 32 }} />
          <CloudQueueIcon sx={{ fontSize: 60 }} />
        </Box>

        <Typography
          variant="h5"
          component="h1"
          sx={{
            fontWeight: 700,
            color: 'var(--jp-ui-font-color1)',
            marginBottom: '12px',
            fontSize: '22px',
          }}
        >
          Transform your Notebooks into Pipelines
        </Typography>
        <Typography
          sx={{
            color: 'var(--jp-ui-font-color1)',
            marginBottom: '32px',
            fontSize: 'var(--jp-ui-font-size1)',
            lineHeight: 1.6,
            paddingX: '20px',
          }}
        >
          Deploy to Kubeflow Pipelines with one click and manage dependencies
          without leaving the environment.
        </Typography>

        <List sx={{ marginBottom: '24px', width: '100%', maxWidth: '400px' }}>
          {[
            {
              label: 'Automate',
              desc: 'Convert cells to pipeline steps instantly.',
            },
            {
              label: 'Simplify',
              desc: 'Manage metadata and dependencies visually.',
            },
            {
              label: 'Deploy',
              desc: 'One-click deployment to Kubeflow Pipelines.',
            },
          ].map(item => (
            <ListItem
              key={item.label}
              disableGutters
              sx={{ alignItems: 'flex-start', paddingY: '4px' }}
            >
              <ListItemIcon sx={{ minWidth: 32, marginTop: '2px' }}>
                <CheckCircleIcon
                  sx={{
                    color: theme.kale.headers.main,
                    fontSize: 20,
                  }}
                />
              </ListItemIcon>
              <ListItemText
                primary={
                  <Typography
                    component="span"
                    sx={{
                      fontSize: 'var(--jp-ui-font-size1)',
                      color: 'var(--jp-ui-font-color1)',
                      lineHeight: 1.5,
                    }}
                  >
                    <strong>{item.label}:</strong> {item.desc}
                  </Typography>
                }
                sx={{ margin: 0 }}
              />
            </ListItem>
          ))}
        </List>
      </Box>
    );
  }
}

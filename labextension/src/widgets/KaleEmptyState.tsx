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
import { Box } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import TrendingFlatIcon from '@mui/icons-material/TrendingFlat';
import CloudQueueIcon from '@mui/icons-material/CloudQueue';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import { theme } from '../Theme';

export const KaleEmptyState = () => {
  return (
    <Box className="kale-empty-state-container">
      <Box
        className="kale-empty-state-icons"
        sx={{ color: theme.kale.headers.main }}
      >
        <MenuBookIcon sx={{ fontSize: 48 }} />
        <TrendingFlatIcon sx={{ mx: 1, fontSize: 24 }} />
        <AccountTreeIcon sx={{ fontSize: 48 }} />
        <TrendingFlatIcon sx={{ mx: 1, fontSize: 24 }} />
        <CloudQueueIcon sx={{ fontSize: 48 }} />
      </Box>

      <h1 className="kale-empty-state-title">
        Transform your Notebooks into Pipelines
      </h1>
      <p className="kale-empty-state-description">
        Deploy to Kubeflow Pipelines with one click and manage dependencies
        without leaving the environment.
      </p>

      <ul className="kale-empty-state-list">
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
          <li key={item.label} className="kale-empty-state-list-item">
            <CheckCircleIcon
              className="kale-empty-state-check-icon"
              sx={{ color: theme.kale.headers.main }}
            />
            <span className="kale-empty-state-text">
              <strong>{item.label}:</strong> {item.desc}
            </span>
          </li>
        ))}
      </ul>

      <p className="kale-empty-state-footer">
        Learn more about Kale{' '}
        <a
          href="https://github.com/kubeflow/kale"
          target="_blank"
          rel="noopener noreferrer"
        >
          here
        </a>
      </p>
    </Box>
  );
};

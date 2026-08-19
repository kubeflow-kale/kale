# Copyright 2026 The Kubeflow Authors.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""Tests for the constants shared with the frontend.

The tag patterns are now assembled from ``kale/shared_constants.json`` instead of
being spelled out in ``nbprocessor``. These tests pin the tag language that
assembly has to keep producing, so editing the shared file cannot silently change
which cell tags Kale accepts.
"""

import re

import pytest

from kale import pipeline, shared_constants
from kale.processors import nbprocessor


@pytest.mark.parametrize(
    "pattern,tag",
    [
        (nbprocessor.SKIP_TAG, "skip"),
        (nbprocessor.IMPORT_TAG, "imports"),
        (nbprocessor.FUNCTIONS_TAG, "functions"),
        (nbprocessor.PIPELINE_PARAMETERS_TAG, "pipeline-parameters"),
        (nbprocessor.PIPELINE_METRICS_TAG, "pipeline-metrics"),
        (nbprocessor.STEP_TAG, "step:my_step"),
        (nbprocessor.STEP_TAG, "step:_private"),
        # A `step:` tag with no name yet: the user is still typing it.
        (nbprocessor.STEP_TAG, "step:"),
        (nbprocessor.PREV_TAG, "prev:my_step"),
        (nbprocessor.LIMITS_TAG, "limit:nvidia.com/gpu:2"),
        (nbprocessor.IMAGE_TAG, "image:python:3.11-slim"),
        (nbprocessor.CACHE_TAG, "cache:enabled"),
        (nbprocessor.CACHE_TAG, "cache:disabled"),
        (nbprocessor.REPORT_TAG, "report:enabled"),
        (nbprocessor.REPORT_TAG, "report:disabled"),
    ],
)
def test_tag_patterns_accept_valid_tags(pattern, tag):
    assert re.match(pattern, tag)


@pytest.mark.parametrize(
    "pattern,tag",
    [
        (nbprocessor.SKIP_TAG, "skip:"),
        (nbprocessor.IMPORT_TAG, "import"),
        (nbprocessor.PIPELINE_PARAMETERS_TAG, "pipeline_parameters"),
        # Step names are Python identifiers: no upper case, no hyphens, no
        # leading digit.
        (nbprocessor.STEP_TAG, "step:My_Step"),
        (nbprocessor.STEP_TAG, "step:my-step"),
        (nbprocessor.STEP_TAG, "step:1step"),
        # Unlike `step:`, a `prev:` tag with no name refers to nothing.
        (nbprocessor.PREV_TAG, "prev:"),
        (nbprocessor.CACHE_TAG, "cache:yes"),
        (nbprocessor.REPORT_TAG, "report:"),
    ],
)
def test_tag_patterns_reject_invalid_tags(pattern, tag):
    assert not re.match(pattern, tag)


def test_reserved_cell_names_have_a_tag_pattern():
    """Every reserved name must be a tag the notebook processor recognises."""
    for name in shared_constants.RESERVED_CELL_NAMES:
        assert any(re.match(pattern, name) for pattern in nbprocessor._TAGS_LANGUAGE)


def test_default_base_image_comes_from_the_shared_file():
    assert pipeline.DEFAULT_BASE_IMAGE == shared_constants.DEFAULT_BASE_IMAGE

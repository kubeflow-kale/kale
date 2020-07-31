#  Copyright 2020 The Kale Authors
#
#  Licensed under the Apache License, Version 2.0 (the "License");
#  you may not use this file except in compliance with the License.
#  You may obtain a copy of the License at
#
#       http://www.apache.org/licenses/LICENSE-2.0
#
#  Unless required by applicable law or agreed to in writing, software
#  distributed under the License is distributed on an "AS IS" BASIS,
#  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#  See the License for the specific language governing permissions and
#  limitations under the License.

import re
import copy

from kale.common.utils import random_string
from kale.common.podutils import is_workspace_dir

DEFAULT_METADATA = {
    'experiment_name': '',
    'pipeline_name': '',
    'pipeline_description': '',
    'pipeline_args': '',
    'pipeline_args_names': '',
    'docker_image': '',
    'volumes': [],
    'abs_working_dir': None,
    'marshal_volume': False,
    'marshal_path': '',
    'snapshot_volumes': False,
    'autosnapshot': False,
    'steps_defaults': [],
}

METADATA_REQUIRED_KEYS = (
    'experiment_name',
    'pipeline_name',
)
KALE_STEP_NAME_REGEX = r'^[a-z0-9]([-a-z0-9]*[a-z0-9])?$'
KALE_NAME_MSG = ("must consist of lower case alphanumeric characters"
                 " or '-', and must start and end with an alphanumeric"
                 " character.")
K8S_VALID_NAME_REGEX = r'^[a-z]([a-z0-9-]*[a-z0-9])?$'
K8S_NAME_MSG = ("must consist of lower case alphanumeric characters or"
                " '-', and must start with a lowercase character and end with"
                " a lowercase alphanumeric character.")
VOLUME_TYPES = ('pv', 'pvc', 'new_pvc', 'clone')
VOLUME_REQUIRED_FIELDS = ('name', 'annotations', 'size', 'type', 'mount_point')


def parse_metadata(notebook_metadata):
    """Parse the Notebook's metadata and update it when needed.

    Args:
        notebook_metadata (dict): metadata annotated by Kale.
        Refer to DEFAULT_METADATA for defaults

    Returns (dict): updated and validated metadata
    """
    # check for required fields before adding all possible defaults
    validated_notebook_metadata = copy.deepcopy(notebook_metadata)
    for required in METADATA_REQUIRED_KEYS:
        if required not in validated_notebook_metadata:
            raise ValueError("Key {} not found. Add this field either on"
                             " the notebook metadata or as an override"
                             .format(required))

    metadata = copy.deepcopy(DEFAULT_METADATA)
    metadata.update(validated_notebook_metadata)

    if not re.match(KALE_STEP_NAME_REGEX, metadata['pipeline_name']):
        raise ValueError("Pipeline name {}".format(KALE_NAME_MSG))

    # update the pipeline name with a random string
    random_pipeline_name = "{}-{}".format(metadata['pipeline_name'],
                                          random_string())
    metadata['pipeline_name'] = random_pipeline_name

    volumes = metadata.get('volumes', [])
    if isinstance(volumes, list):
        metadata.update({'volumes': _parse_volumes_metadata(volumes)})
    else:
        raise ValueError("Volumes spec must be a list")

    katib = metadata.get('katib', False)
    if not isinstance(katib, bool):
        raise ValueError("The field `katib` is not a boolean")
    if katib:
        _validate_katib_metadata(metadata.get("katib_metadata", {}))
        if not re.match(K8S_VALID_NAME_REGEX, metadata['experiment_name']):
            raise ValueError("When choosing HP Tuning, experiment name"
                             " {}".format(K8S_NAME_MSG))
    return metadata


def _parse_volumes_metadata(volumes):
    """Parse the volume spec.

    The transformations applied are the following:
        - The annotations dict from a list of {'key': k, 'value': v} to {k: v}
        - Convert the size field to str
        -  Sort the volumes dict to place the workspace volume first

    Args:
        volumes: Volume spec

    Returns: Updated and validated volume spec
    """
    validated_volumes = copy.deepcopy(volumes)
    for v in validated_volumes:
        for required in VOLUME_REQUIRED_FIELDS:
            if required not in v:
                raise ValueError(
                    "Volume spec: missing {} value".format(required))

        if not re.match(K8S_VALID_NAME_REGEX, v['name']):
            raise ValueError(
                "Volume spec: PV/PVC name {}".format(K8S_NAME_MSG))
        if ('snapshot' in v
                and v['snapshot']
                and (('snapshot_name' not in v)
                     or not re.match(K8S_VALID_NAME_REGEX,
                                     v['snapshot_name']))):
            raise ValueError("Provide a valid snapshot resource name if you"
                             " want to snapshot a volume. Snapshot resource"
                             " name {}".format(K8S_NAME_MSG))

        if not v['type'] in VOLUME_TYPES:
            raise ValueError("Volume spec: volume type {} not recognized."
                             " Allowed volumes type: {}"
                             .format(v['type'], VOLUME_TYPES))

        if not isinstance(v['annotations'], list):
            raise ValueError('Volume spec: annotations must be a list')

        # Convert annotations to a {k: v} dictionary
        try:
            # TODO: Make JupyterLab annotate with {k: v} instead of
            #  {'key': k, 'value': v}
            annotations = {a['key']: a['value'] for a in v['annotations'] or []
                           if a['key'] != '' and a['value'] != ''}
        except KeyError as e:
            if str(e) in ["'key'", "'value'"]:
                raise ValueError("Volume spec: volume annotations must be a"
                                 " list of {'key': k, 'value': v} dicts")
            else:
                raise e

        v['annotations'] = annotations
        v['size'] = str(v['size'])

    # The Jupyter Web App assumes the first volume of the notebook is the
    # working directory, so we make sure to make it appear first in the spec.
    validated_volumes = sorted(validated_volumes,
                               reverse=True,
                               key=lambda _v: is_workspace_dir(
                                   _v['mount_point']))
    return validated_volumes


def _validate_katib_metadata(katib_metadata):
    """Validate the Katib metadata.

    This is not a comprehensive validation of all the katib fields. We just
    care about validating that some fields exist and have the proper types.
    The rest of the validation is left for when the Katib's Experiment CRD is
    submitted.
    """
    parsed_metadata = copy.deepcopy(katib_metadata)

    parameters = parsed_metadata.get('katib_parameters')
    if not parameters or not isinstance(parameters, list):
        raise ValueError("Katib parameters are either missing or must be"
                         " converted to a list.")

    objective = parsed_metadata.get('katib_objective')
    if not objective:
        raise ValueError("Katib metadata must contain a valid objective spec")

    algorithm = parsed_metadata.get('katib_algorithm')
    if not algorithm:
        raise ValueError("Katib metadata must contain a valid algorithm spec")

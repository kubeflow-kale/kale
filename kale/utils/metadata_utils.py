import re
import copy

from kale.utils.utils import random_string
from kale.utils.pod_utils import is_workspace_dir

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
    'auto_snapshot': False
}

METADATA_REQUIRED_KEYS = (
    'experiment_name',
    'pipeline_name',
)
KALE_STEP_NAME_REGEX = r'^[a-z0-9]([-a-z0-9]*[a-z0-9])?$'
KALE_NAME_MSG = ("must consist of lower case alphanumeric characters"
                 " or '-', and must start and end with an alphanumeric"
                 " character.")
K8S_VALID_NAME_REGEX = r'^[a-z]([a-z0-9-.]*[a-z])?$'
K8S_NAME_MSG = ("must consist of lower case alphanumeric characters,"
                " '-' or '.', and must start and end with a character.")
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
    for required in METADATA_REQUIRED_KEYS:
        if required not in notebook_metadata:
            raise ValueError("Key {} not found. Add this field either on"
                             " the notebook metadata or as an override"
                             .format(required))

    metadata = copy.deepcopy(DEFAULT_METADATA)
    metadata.update(notebook_metadata)

    if not re.match(KALE_STEP_NAME_REGEX, metadata['pipeline_name']):
        raise ValueError("Pipeline name  {}".format(KALE_NAME_MSG))

    # update the pipeline name with a random string
    random_pipeline_name = "{}-{}".format(metadata['pipeline_name'],
                                          random_string())
    metadata['pipeline_name'] = random_pipeline_name

    volumes = metadata.get('volumes', [])
    if isinstance(volumes, list):
        metadata.update({'volumes': _parse_volumes_metadata(volumes)})
    else:
        raise ValueError("Volumes spec must be a list")
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
    for v in volumes:
        for required in VOLUME_REQUIRED_FIELDS:
            if required not in v:
                raise ValueError(
                    "Volume spec: missing {} value".format(required))

        if not re.match(K8S_VALID_NAME_REGEX, v['name']):
            raise ValueError(
                "Volume spec: PV/PVC name {}".format(K8S_NAME_MSG))
        if ('snapshot' in v and
                v['snapshot'] and
                (('snapshot_name' not in v) or
                 not re.match(K8S_VALID_NAME_REGEX,
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
    volumes = sorted(volumes,
                     reverse=True,
                     key=lambda _v: is_workspace_dir(_v['mount_point']))
    return volumes

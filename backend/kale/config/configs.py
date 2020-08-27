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

import os

from kubernetes.config import ConfigException

from kale.common import utils, podutils
from kale.config import Config, Field, validators


class VolumeConfig(Config):
    """Used for validating the `volumes` field of NotebookConfig."""
    name = Field(type=str, required=True,
                 validators=[validators.K8sNameValidator])
    mount_point = Field(type=str, required=True)
    snapshot = Field(type=bool, default=False)
    snapshot_name = Field(type=str)
    size = Field(type=int)  # fixme: validation for this field?
    size_type = Field(type=str)  # fixme: validation for this field?
    type = Field(type=str, required=True,
                 validators=[validators.VolumeTypeValidator])
    annotations = Field(type=list, default=list())

    def _postprocess(self):
        # Convert annotations to a {k: v} dictionary
        try:
            # TODO: Make JupyterLab annotate with {k: v} instead of
            #  {'key': k, 'value': v}
            self.annotations = {a['key']: a['value']
                                for a in self.annotations
                                if a['key'] != '' and a['value'] != ''}
        except KeyError as e:
            if str(e) in ["'key'", "'value'"]:
                raise ValueError("Volume spec: volume annotations must be a"
                                 " list of {'key': k, 'value': v} dicts")
            else:
                raise e


class KatibConfig(Config):
    """Used to validate the `katib_metadata` field of NotebookConfig."""
    # fixme: improve validation of single fields
    parameters = Field(type=list, default=[])
    objective = Field(type=dict, default={})
    algorithm = Field(type=dict, default={})
    # fixme: Change these names to be Pythonic (need to change how the
    #  labextension passes them)
    maxTrialCount = Field(type=int, default=12)
    maxFailedTrialCount = Field(type=int, default=3)
    parallelTrialCount = Field(type=int, default=3)


# XXX: this is meant to replace the use of metadatautils.py
class NotebookConfig(Config):
    """Main config class to validate the notebook metadata."""
    notebook_path = Field(type=str, required=True)
    pipeline_name = Field(type=str, required=True,
                          validators=[validators.PipelineNameValidator])
    experiment_name = Field(type=str, required=True)
    # FIXME: Probably this can be removed. The labextension passes both
    #  'experiment_name' and 'experiment', but the latter is not used in the
    #  backend.
    experiment = Field(type=dict)
    pipeline_description = Field(type=str, default="")
    docker_image = Field(type=str, default="")
    volumes = Field(type=list, items_config=VolumeConfig, default=[])
    katib_run = Field(type=bool, default=False)
    katib_metadata = Field(type=KatibConfig)
    abs_working_dir = Field(type=str, default="")
    marshal_volume = Field(type=bool, default=True)
    marshal_path = Field(type=str, default="/marshal")
    snapshot_volumes = Field(type=bool, default=False)
    autosnapshot = Field(type=bool, default=False)
    steps_defaults = Field(type=list, default=[])

    def _postprocess(self):
        self._randomize_pipeline_name()
        self._set_docker_image()
        self._sort_volumes()
        self._set_abs_working_dir()
        self._set_marshal_path()

    def _randomize_pipeline_name(self):
        self.pipeline_name = "%s-%s" % (self.pipeline_name,
                                        utils.random_string())

    def _set_docker_image(self):
        if not self.docker_image:
            try:
                # will fail in case in cluster config is not found
                self.docker_image = podutils.get_docker_base_image()
            except ConfigException:
                # no K8s config found; use kfp default image
                self.docker_image = ""

    def _sort_volumes(self):
        # The Jupyter Web App assumes the first volume of the notebook is the
        # working directory, so we make sure to make it appear first in the
        # spec.
        self.volumes = sorted(self.volumes,
                              reverse=True,
                              key=lambda _v: podutils.is_workspace_dir(
                                  _v.mount_point))

    def _set_abs_working_dir(self):
        if not self.abs_working_dir:
            self.abs_working_dir = utils.abs_working_dir(self.notebook_path)

    def _set_marshal_path(self):
        # Check if the workspace directory is under a mounted volume.
        # If so, marshal data into a folder in that volume,
        # otherwise create a new volume and mount it at /marshal
        wd = os.path.realpath(self.abs_working_dir)
        # get the volumes for which the working directory is a sub-path of
        # the mount point
        vols = list(
            filter(lambda x: wd.startswith(x.mount_point), self.volumes))
        # if we found any, then set marshal directory inside working directory
        if len(vols) > 0:
            basename = os.path.basename(self.notebook_path)
            marshal_dir = ".{}.kale.marshal.dir".format(basename)
            self.marshal_volume = False
            self.marshal_path = os.path.join(wd, marshal_dir)

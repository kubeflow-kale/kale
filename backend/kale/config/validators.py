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

import re

from typing import Any, Dict

from abc import ABC, abstractmethod


class Validator(ABC):
    """Base validator class.

    All Validator classes must inherit from this one.
    """

    @abstractmethod
    def _validate(self, *args, **kwargs) -> bool:
        pass

    def __call__(self, *args, **kwargs):
        """Run validation."""
        self._validate(*args, **kwargs)


class TypeValidator(Validator):
    """Validates a Field based on a primitive type."""

    valid_type = None

    def __init__(self, valid_type: type):
        self.valid_type = valid_type or self.valid_type
        if not self.valid_type:
            raise ValueError("Not a valid type")

    def _validate(self, value):
        if not isinstance(value, self.valid_type):
            raise ValueError("'%s' must be of type '%s'"
                             % (value, self.valid_type))


class DictValidator(Validator):
    """Validates a dictionary, applying `key` and `value` validators."""

    key_validator = None
    value_validator = None

    def __init__(self,
                 key_validator: Validator = None,
                 value_validator: Validator = None):
        self.key_validator = key_validator or self.key_validator
        if not self.key_validator:
            raise ValueError("Set an appropriate key_validator")
        self.value_validator = value_validator or self.value_validator
        if not self.value_validator:
            raise ValueError("Set an appropriate value_validator")

    def _validate(self, dictionary: Dict):
        if not isinstance(dictionary, dict):
            raise ValueError("Trying to use %s to validate a non dict object"
                             % self.__class__.__name__)
        for k, v in dictionary.items():
            self.key_validator(k)
            self.value_validator(v)
        return True


class RegexValidator(Validator):
    """Validates a string against a RegEx."""

    regex = None
    error_message = "Regex validation failed"

    def __init__(self, regex: str = None, error_message: str = None):
        self.regex = regex or self.regex
        if not self.regex:
            raise ValueError("Invalid 'regex' argument")

        self.error_message = error_message or self.error_message

    def _validate(self, value: str):
        if not isinstance(value, str):
            raise ValueError(
                "%s cannot validate object of type %s. String expected."
                % (self.__class__.__name__, str(type(value))))
        if not re.match(self.regex, value):
            raise ValueError("%s: '%s'. Must match regex '%s'"
                             % (self.error_message, value, self.regex))
        return True


class EnumValidator(Validator):
    """Validates a value against a whitelist."""

    enum = None

    def __init__(self, enum: tuple = None):
        self.enum = enum or self.enum
        if not self.enum:
            raise ValueError("Invalid 'enum' argument")

    def _validate(self, value: Any):
        if value not in self.enum:
            raise ValueError("%s: Value %s is not allowed"
                             % (self.__class__.__name__, str(value)))


class K8sNameValidator(RegexValidator):
    """Validates K8s resource names."""

    regex = r"^[a-z]([a-z0-9-]*[a-z0-9])?$"
    error_message = "Not a valid K8s resource name"


class StepNameValidator(RegexValidator):
    """Validates the name of a pipeline step."""

    regex = r"^[_a-z]([_a-z0-9]*)?$"
    error_message = "Not a valid Step name"


class PipelineNameValidator(RegexValidator):
    """Validates the name of a pipeline."""

    regex = r"^[a-z0-9]([-a-z0-9]*[a-z0-9])?$"
    error_message = "Not a valid Pipeline name"


class K8sAnnotationKeyValidator(RegexValidator):
    """Validates the keys of a K8s annotations dictionary."""

    _segment = "[a-zA-Z0-9]+([a-zA-Z0-9-_.]*[a-zA-Z0-9])?"
    regex = r"^%s([/]%s)?$" % (_segment, _segment)
    error_message = "Not a valid K8s annotation key"


class K8sAnnotationsValidator(DictValidator):
    """Validates a K8s annotations dictionary."""

    key_validator = K8sAnnotationKeyValidator
    value_validator = TypeValidator(str)


class K8sLimitKeyValidator(RegexValidator):
    """Validates the keys of a K8s limits dictionary."""

    regex = r"[_a-z-\.\/]+"
    error_message = "Not a valid K8s limit key"


class K8sLimitValueValidator(RegexValidator):
    """Validates the values of a K8s limits dictionary."""

    regex = r"^[_a-zA-Z0-9\.]+$"
    error_message = "Not a valid K8s limit value"


class K8sLimitsValidator(DictValidator):
    """Validates a K8s limits dictionary."""

    key_validator = K8sLimitKeyValidator
    value_validator = K8sLimitValueValidator


class K8sLabelKeyValidator(K8sAnnotationKeyValidator):
    """Validates the keys of a K8s labels dictionary."""

    error_message = "Not a valid K8s label key"


class K8sLabelsValidator(DictValidator):
    """Validates a K8s labels dictionary."""

    key_validator = K8sLabelKeyValidator
    value_validator = TypeValidator(str)


class VolumeTypeValidator(EnumValidator):
    """Validates the type of a Volume."""

    enum = ('pv', 'pvc', 'new_pvc', 'clone')


class VolumeAccessModeValidator(EnumValidator):
    """Validates the access mode of a Volume."""

    enum = ("", "rom", "rwo", "rwm")


class IsLowerValidator(Validator):
    """Validates if a string is all lowercase."""

    def _validate(self, value: str):
        return value == value.lower()


class PositiveIntegerValidator(Validator):
    """Validates a Field to be a positive integer."""
    def _validate(self, value):
        if not isinstance(value, int):
            raise ValueError("'%s' is not of type 'int'" % value)
        if value <= 0:
            raise ValueError("'%s' is not a positive integer" % value)

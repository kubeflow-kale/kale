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

import logging
import inspect

from abc import ABC
from typing import Any, Callable, Dict, List, Optional

log = logging.getLogger(__name__)


class Field:
    """Define a strongly typed config field.

    A Field will be validated based on its primitive type and (when provided)
    all its validators (for more information about how Validators work, check
    the Validator's documentation).
    """

    def __init__(self,
                 type: type,
                 # XXX: items_config_type should be of type Config. However, we
                 # don't annotate it because some IDEs don't recognize
                 # inheritance and complain
                 items_config_type=None,
                 default: Any = None,
                 validators: Optional[List[Callable]] = None,
                 required: bool = False,
                 dict_name: Optional[str] = None):
        self.type = type
        # when using items_config_type, each element of the list becomes a
        # config object.
        self.items_config_type = items_config_type
        self.default_value = default
        self.validators = validators or []
        self.required = required
        self.dict_name = dict_name
        # set by a Config object
        self._value = None

        if items_config_type and type != list:
            raise RuntimeError("items_config_type can be used only with a"
                               " Field of type list.")

    def set_value(self, value):
        """Set the field's value."""
        self._value = value

    def validate(self):
        """Run the validators over the field's value."""
        # If the Field's value is `None` don't run the validation process.
        # Validators are *not* supposed to check if the value is set or not,
        # we should control that by setting the `required` flag to True.
        if self._value is None:
            return
        for v in self.validators:
            validator = v() if inspect.isclass(v) else v
            # XXX: The validator is supposed to raise an Exception if
            # validation fails.
            validator(self._value)


class Config(ABC):
    """Store and validate configurations.

    This class can be used as a base to define a reusable configuration
    classes, where the fields are strongly typed and can be validated with
    custom Validators.

    To create a new Config class, extend this base and create the config spec
    using the Field object as follows:

    ```
    class TestConfig(Config):
        name = Field(type=str, required=True)
        action = Field(type=int, default=2)
        # ...
    ```

    For more information about the type of fields, look at the Field class
    documentation.

    When creating the Config object, fields values must be passed in as keyword
    arguments. Accessing the values of the config objects is done using the dot
    notation, just like any other object. E.g.

    ```
    config = TestConfig(name="test", action=3)
    print(config.action)

    # >>> 3
    ```

    Note here how printing `config.action` returns the Field's value, not the
    object. This is because, during initialization, Config will save all the
    original Field objects in the class-level `_fields` attribute, while
    overriding the original fields with their corresponding values.

    Validators are useful for single-field checks. To performs post
    initialization/validation checks, over multiple fields, or postprocess the
    validated fields, override the `_validate` and `_postprocess` functions,
    respectively.

    To preprocess the incoming fields, even before they get validated or
    type-checked, override the `_preprocess` function. Check the functions'
    docstring for more details.
    """

    _fields: Dict[str, Field]

    @classmethod
    def _get_exception_msg_prefix(cls):
        return cls.__name__

    @classmethod
    def _add_to_class(cls, name, value):
        setattr(cls, name, value)

    def __new__(cls, *args, **kwargs):
        """Create a new Config class.

        When a new config is created all the Field objects are replaced with
        their value (or default value) and the original Field objects are saved
        under the `_fields` class field.

        Creating a new cls instance makes it so that replacing the cls instance
        variable in __init__ doesn't  affect other classes of the same type as
        well.
        """
        new_class = super().__new__(cls)
        fields = inspect.getmembers(cls, lambda x: isinstance(x, Field))
        # Save the fields in a 'backup' variable, since during __init__ they
        # will be replaced with the input value
        new_class._add_to_class("_fields", dict(fields))
        return new_class

    def __init__(self, *args, **kwargs):
        if args:
            raise RuntimeError("Cannot provide positional arguments to a"
                               " Config class.")
        self._preprocess(kwargs)
        self._validate_kwargs(*args, **kwargs)

        for name, field_obj in self._fields.items():
            if field_obj.default_value is not None and field_obj.required:
                log.info("The 'required' flag for field '%s' is being ignored"
                         " since a default value was provided."
                         % name)
            input_value = kwargs.get(name)
            if input_value is None:
                # We get here either if kwarg 'name' is not passed, or if it is
                # passed with value None. This is an important design decision
                input_value = field_obj.default_value
            if input_value is None and field_obj.required:
                raise RuntimeError("%s: Field '%s' is required."
                                   % (self._get_exception_msg_prefix(), name))
            if input_value is not None and issubclass(field_obj.type, Config):
                # In case the Field is a nested Config, we expect the values
                # to be passed as a dictionary.
                config = field_obj.type(**input_value)
                field_obj.set_value(config)
                self._set(name, config)
            else:
                self._init_field(name, field_obj, input_value)
        # abstract functions, should be implemented in user-specialized configs
        self._validate()
        self._postprocess()

    def _validate_kwargs(self, **kwargs):
        for input_var in kwargs.keys():
            if input_var not in self._fields.keys():
                raise RuntimeError("%s: '%s' was provided but the config spec"
                                   " does not contain any field with that"
                                   " name."
                                   % (self._get_exception_msg_prefix(),
                                      input_var))

    def _init_field(self, name: str, field: Field, input_value: Any):
        if (input_value is not None
                and not isinstance(input_value, field.type)):
            raise RuntimeError("%s: Field '%s' is expected of type '%s' but"
                               " type '%s' was found."
                               % (self._get_exception_msg_prefix(),
                                  name, field.type.__name__,
                                  type(input_value).__name__))
        if field.items_config_type:
            # if the fields requires a list of other Config objects,
            # convert the values of the list to the respective Configs.
            input_value = [field.items_config_type(**v)
                           for v in input_value]
        field.set_value(input_value)
        field.validate()
        self._set(name, input_value)

    def _set(self, name: str, value: Any):
        """Set a new value to the field."""
        self.__setattr__(name, value)

    def _get(self, name: str):
        """Get the value of a field."""
        return self.__getattribute__(name)

    def to_dict(self) -> Dict[str, Any]:
        """Return the config class as a dictionary."""
        config_dict = dict()
        for field_name, field_obj in self._fields.items():
            attr_value = self.__getattribute__(field_name)
            dict_name = field_obj.dict_name
            if dict_name:
                field_name = dict_name
            if attr_value is None:
                pass  # don't add this to the output dict
            elif field_obj.items_config_type:  # the field is a list of Configs
                config_dict[field_name] = [v.to_dict() for v in attr_value]
            elif issubclass(field_obj.type, Config):
                # recursively call Config's to_dict()
                config_dict[field_name] = attr_value.to_dict()
            else:
                config_dict[field_name] = attr_value
        return config_dict

    def _preprocess(self, kwargs):
        """Preprocess the input values before they get validated.

        NOTE: Edit inplace the input dictionary to process it.

        Args:
            kwargs (dict): raw input arguments
        """
        pass

    def _validate(self):
        """Validate configs after single Field-validations.

        Useful when some fields needs some sort of cross validation
        """
        pass

    def _postprocess(self):
        """Process fields after their validation.

        Useful when some fields need to be parsed or processed, based on
        contextual information.

        Called after `validate`.
        """
        pass

    def update(self, configs: Dict[str, Any], patch=False):
        """Update the existing configurations.

        Args:
            configs: A dict of <name>:<value> pairs
            patch: If set to True, patch existing configs with provided ones.
              If set to False, add just new configs and ignore existing ones.
        """
        for name, value in configs.items():
            if not isinstance(value, type(self._get(name))):
                raise RuntimeError("Trying to merge two configs with different"
                                   " types")
            if isinstance(value, dict):
                # the existing dict fields take precedence in case of overlap
                if patch:
                    self._set(name, {**value, **self._get(name)})
                else:
                    self._set(name, {**self._get(name), **value})
            else:
                # XXX: We raise an error if we are asked to update/patch a
                # non-dict attribute. We can consider implementing this if we
                # need it. It should perform recursive patching on mutable
                # fields.
                raise RuntimeError("Cannot update or patch a non-dict"
                                   " attribute")

    def patch(self, configs: Dict[str, Any]):
        """Equivalent to self.update(configs, patch=True)."""
        self.update(configs, patch=True)

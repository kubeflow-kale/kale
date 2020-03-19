#  Copyright 2019-2020 The Kale Authors
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

_pattern_type = type(re.compile(''))


def normalize(r):
    """Normalize a regex to be wrapped in '^' and '$'.

    Args:
        r: str or Pattern
            The pattern to normalize.

    Returns: Pattern
                The compiled regex.
    """
    if isinstance(r, _pattern_type):
        r = r.pattern
    return re.compile('^' + r.lstrip('^').rstrip('$') + '$')


class PatternDispatcher(object):
    """Regular Expression Dispatcher."""

    def __init__(self, name):
        self.name = name
        self.funcs = {}
        self.priorities = {}

    def add(self, regex, func, priority=10):
        """Add a new regex to the dispatcher."""
        self.funcs[normalize(regex)] = func
        self.priorities[func] = priority

    def register(self, regex, priority=10):
        """Register a new handler in this regex dispatcher.

        Args:
            regex: str or Pattern
                    The pattern to match against.
            priority: int, optional
                        The priority for this pattern. This is used to resolve
                        ambigious matches. The highest priority match wins.

        Returns: callable
                    A decorator that registers the function with this
                    RegexDispatcher but otherwise returns the function
                    unchanged.
        """

        def _(func):
            self.add(regex, func, priority)
            return func

        return _

    def dispatch(self, s):
        """Dispatch to a function based on the matching regex.

        Args:
            s (str): string to be matched against the list of registered regex

        Returns: Associated function
        """
        funcs = (func for r, func in self.funcs.items() if r.match(s))
        return max(funcs, key=self.priorities.get)

    def __call__(self, s, *args, **kwargs):
        """Run dispatch."""
        return self.dispatch(s)(s, *args, **kwargs)


class TypeDispatcher(PatternDispatcher):
    """Object Type Dispatcher."""

    def dispatch(self, obj):
        """Dispatch to a function based on the object's type matching regex.

        Args:
            obj: any Python object

        Returns: function
                    The function matching the obj type

        """
        # object types are printed as <class 'obj type'>
        _type = re.sub(r"'>$", "",
                       re.sub(r"^<class '", "",
                              str(type(obj))))
        # type of base class
        _type_base = re.sub(r"'>$", "",
                            re.sub(r"^<class '", "",
                                   str(obj.__class__.__bases__[0])))
        funcs = [func for r, func in list(self.funcs.items())
                 if r.match(_type)]
        # try to match a parent class of the object in case this was a custom
        # extended class
        if len(list(funcs)) == 1:
            funcs = [func for r, func in list(self.funcs.items())
                     if r.match(_type_base)]

        return max(iter(funcs), key=self.priorities.get)

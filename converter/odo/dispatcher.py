from odo.regex import RegexDispatcher


class RegexDispatcherSave(RegexDispatcher):

    def dispatch(self, obj):
        """
        Dispatch to the proper save handler for the input object
        :param s: This is a proper object
        :return: The function to save the object `s` to file
        """
        # get the type of the object
        s = str(type(obj))
        # object types are printed as <class 'obj type'>
        s = s.lstrip("<class '").rstrip("'>")

        funcs = (func for r, func in self.funcs.items() if r.match(s))
        # try to match a parent class of the object in case this was a custom extended class
        # we always have one default function (the one that matches all)
        if len(list(funcs)) == 1:
            # TODO: for now taking as default the first parent class
            p = str(obj.__class__.__bases__[0])
            p = p.lstrip("<class '").rstrip("'>")
            funcs = (func for r, func in self.funcs.items() if r.match(p))
        else:
            funcs = (func for r, func in self.funcs.items() if r.match(s))

        return max(funcs, key=self.priorities.get)

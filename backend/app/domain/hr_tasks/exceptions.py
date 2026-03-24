from __future__ import annotations


class HrTasksError(Exception):
    pass


class NotFound(HrTasksError):
    pass


class Forbidden(HrTasksError):
    pass


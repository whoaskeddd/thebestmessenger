from __future__ import annotations


class EmployeesError(Exception):
    pass


class NotFound(EmployeesError):
    pass


class Conflict(EmployeesError):
    pass


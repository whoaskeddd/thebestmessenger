from __future__ import annotations


class LeaveRequestsError(Exception):
    pass


class NotFound(LeaveRequestsError):
    pass


class Forbidden(LeaveRequestsError):
    pass


class InvalidTransition(LeaveRequestsError):
    pass


from __future__ import annotations


class MessengerError(Exception):
    pass


class NotFound(MessengerError):
    pass


class Forbidden(MessengerError):
    pass


class InvalidInput(MessengerError):
    pass


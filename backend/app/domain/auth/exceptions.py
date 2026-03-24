from __future__ import annotations


class AuthError(Exception):
    pass


class InvalidCredentials(AuthError):
    pass


class EmailAlreadyExists(AuthError):
    pass


class InactiveUser(AuthError):
    pass


class InvalidRefreshToken(AuthError):
    pass


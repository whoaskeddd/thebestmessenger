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


class InvalidCurrentPassword(AuthError):
    pass


class ForbiddenUserCreation(AuthError):
    pass


class InvalidUserRole(AuthError):
    pass


class BootstrapAdminConfigError(AuthError):
    pass

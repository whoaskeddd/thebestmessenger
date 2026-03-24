from __future__ import annotations


class AnnouncementsError(Exception):
    pass


class NotFound(AnnouncementsError):
    pass


class Forbidden(AnnouncementsError):
    pass


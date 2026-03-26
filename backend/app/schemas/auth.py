from __future__ import annotations

from pydantic import BaseModel, EmailStr, Field
from pydantic import field_validator


PASSWORD_MIN_LENGTH = 8


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=PASSWORD_MIN_LENGTH, max_length=128)

    @field_validator("password")
    @classmethod
    def validate_password(cls, value: str) -> str:
        if not any(ch.islower() for ch in value):
            raise ValueError("password must include at least one lowercase letter")
        if not any(ch.isupper() for ch in value):
            raise ValueError("password must include at least one uppercase letter")
        if not any(ch.isdigit() for ch in value):
            raise ValueError("password must include at least one digit")
        return value


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class RefreshRequest(BaseModel):
    refresh_token: str


class ChangePasswordRequest(BaseModel):
    current_password: str = Field(min_length=1, max_length=128)
    new_password: str = Field(min_length=PASSWORD_MIN_LENGTH, max_length=128)

    @field_validator("new_password")
    @classmethod
    def validate_new_password(cls, value: str) -> str:
        return RegisterRequest.validate_password(value)


class TokenPairResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class MeResponse(BaseModel):
    id: str
    email: EmailStr
    role: str

"""
Schemas Pydantic para Usuario
"""
from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, EmailStr, Field


class UsuarioBase(BaseModel):
    nome: str = Field(..., min_length=2, max_length=255)
    email: EmailStr


class UsuarioCreate(UsuarioBase):
    senha: str = Field(..., min_length=6)
    tipo: Optional[str] = None
    propriedade: Optional[str] = None
    localizacao: Optional[str] = None


class UsuarioLogin(BaseModel):
    email: EmailStr
    senha: str


class UsuarioUpdate(BaseModel):
    nome: Optional[str] = Field(None, min_length=2, max_length=255)
    senha: Optional[str] = Field(None, min_length=6)
    localizacao: Optional[str] = None
    propriedade: Optional[str] = None


class UsuarioResponse(UsuarioBase):
    id: UUID
    tipo: Optional[str] = None
    propriedade: Optional[str] = None
    localizacao: Optional[str] = None
    ativo: bool
    criado_em: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    user_id: Optional[str] = None


class SolicitarRecuperacaoSenha(BaseModel):
    email: EmailStr


class RedefinirSenha(BaseModel):
    token: str
    nova_senha: str = Field(..., min_length=6)

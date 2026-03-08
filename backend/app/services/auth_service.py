"""
Serviço de autenticação
"""
from datetime import datetime, timedelta
from typing import Optional
from uuid import UUID

import bcrypt
from jose import JWTError, jwt
from sqlalchemy.orm import Session
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

from ..config import SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES
from ..database import get_db
from ..models.usuario import Usuario
from ..schemas.usuario import TokenData

# OAuth2
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifica se a senha está correta"""
    return bcrypt.checkpw(
        plain_password.encode("utf-8"),
        hashed_password.encode("utf-8")
    )


def get_password_hash(password: str) -> str:
    """Gera hash da senha"""
    return bcrypt.hashpw(
        password.encode("utf-8"),
        bcrypt.gensalt()
    ).decode("utf-8")


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Cria token JWT"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def get_user_by_email(db: Session, email: str) -> Optional[Usuario]:
    """Busca usuário por email"""
    return db.query(Usuario).filter(Usuario.email == email).first()


def get_user_by_id(db: Session, user_id: UUID) -> Optional[Usuario]:
    """Busca usuário por ID"""
    return db.query(Usuario).filter(Usuario.id == user_id).first()


def authenticate_user(db: Session, email: str, password: str) -> Optional[Usuario]:
    """Autentica usuário"""
    user = get_user_by_email(db, email)
    if not user:
        return None
    if not verify_password(password, user.senha_hash):
        return None
    return user


def create_user(db: Session, nome: str, email: str, senha: str, tipo: str = None, propriedade: str = None, localizacao: str = None) -> Usuario:
    """Cria novo usuário"""
    hashed_password = get_password_hash(senha)
    db_user = Usuario(
        nome=nome,
        email=email,
        senha_hash=hashed_password,
        tipo=tipo,
        propriedade=propriedade,
        localizacao=localizacao
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


def update_user(
    db: Session,
    user: Usuario,
    nome: str = None,
    senha: str = None,
    localizacao: str = None,
    propriedade: str = None
) -> Usuario:
    """Atualiza dados do usuario (nome, senha, localização, propriedade)"""
    if nome:
        user.nome = nome
    if senha:
        user.senha_hash = get_password_hash(senha)
    if localizacao is not None:
        user.localizacao = localizacao
    if propriedade is not None:
        user.propriedade = propriedade
    db.commit()
    db.refresh(user)
    return user


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> Usuario:
    """Obtém usuário atual a partir do token"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Credenciais inválidas",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
        token_data = TokenData(user_id=user_id)
    except JWTError:
        raise credentials_exception

    user = get_user_by_id(db, UUID(token_data.user_id))
    if user is None:
        raise credentials_exception
    if not user.ativo:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Usuário inativo"
        )
    return user

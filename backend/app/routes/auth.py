"""
Rotas de autenticação
"""
from datetime import timedelta
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from jose import JWTError, jwt

from ..database import get_db
from ..config import ACCESS_TOKEN_EXPIRE_MINUTES, PASSWORD_RESET_EXPIRE_MINUTES, FRONTEND_URL, SECRET_KEY, ALGORITHM
from ..schemas.usuario import (
    UsuarioCreate,
    UsuarioResponse,
    UsuarioLogin,
    UsuarioUpdate,
    Token,
    SolicitarRecuperacaoSenha,
    RedefinirSenha
)
from ..services.auth_service import (
    authenticate_user,
    create_access_token,
    create_user,
    update_user,
    get_user_by_email,
    get_current_user,
    get_password_hash
)
from ..services.email_service import enviar_email_recuperacao
from ..models.usuario import Usuario

router = APIRouter(prefix="/auth", tags=["Autenticação"])


@router.post("/registrar", response_model=UsuarioResponse, status_code=status.HTTP_201_CREATED)
async def registrar(usuario: UsuarioCreate, db: Session = Depends(get_db)):
    """Registra um novo usuário"""
    # Verificar se email já existe
    db_user = get_user_by_email(db, usuario.email)
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email já registrado"
        )

    # Criar usuário
    new_user = create_user(
        db, usuario.nome, usuario.email, usuario.senha,
        tipo=usuario.tipo, propriedade=usuario.propriedade, localizacao=usuario.localizacao
    )
    return new_user


@router.post("/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """Login do usuário - retorna token JWT"""
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou senha incorretos",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user.id)},
        expires_delta=access_token_expires
    )

    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/login-json", response_model=Token)
async def login_json(usuario: UsuarioLogin, db: Session = Depends(get_db)):
    """Login do usuário via JSON - retorna token JWT"""
    user = authenticate_user(db, usuario.email, usuario.senha)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou senha incorretos",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user.id)},
        expires_delta=access_token_expires
    )

    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/me", response_model=UsuarioResponse)
async def get_me(current_user: Usuario = Depends(get_current_user)):
    """Retorna dados do usuário logado"""
    return current_user


@router.put("/me", response_model=UsuarioResponse)
async def update_me(
    dados: UsuarioUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """Atualiza dados do usuario logado"""
    updated = update_user(
        db,
        current_user,
        nome=dados.nome,
        senha=dados.senha,
        localizacao=dados.localizacao,
        propriedade=dados.propriedade
    )
    return updated


@router.post("/solicitar-recuperacao")
async def solicitar_recuperacao(
    dados: SolicitarRecuperacaoSenha,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    Solicita recuperação de senha.
    Sempre retorna sucesso (segurança: não revela se o email existe).
    """
    user = get_user_by_email(db, dados.email)

    if user and user.ativo:
        reset_token = create_access_token(
            data={"sub": str(user.id), "purpose": "password_reset"},
            expires_delta=timedelta(minutes=PASSWORD_RESET_EXPIRE_MINUTES)
        )
        link = f"{FRONTEND_URL}/redefinir-senha?token={reset_token}"

        background_tasks.add_task(
            enviar_email_recuperacao,
            user.email,
            user.nome,
            link
        )

    return {
        "mensagem": "Se o email estiver registrado, enviaremos instruções para recuperação de senha."
    }


@router.post("/redefinir-senha")
async def redefinir_senha(
    dados: RedefinirSenha,
    db: Session = Depends(get_db)
):
    """Redefine a senha usando o token de recuperação."""
    try:
        payload = jwt.decode(dados.token, SECRET_KEY, algorithms=[ALGORITHM])

        if payload.get("purpose") != "password_reset":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Token inválido"
            )

        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Token inválido"
            )

    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Token inválido ou expirado"
        )

    user = db.query(Usuario).filter(Usuario.id == UUID(user_id)).first()

    if not user or not user.ativo:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Token inválido"
        )

    user.senha_hash = get_password_hash(dados.nova_senha)
    db.commit()

    return {"mensagem": "Senha redefinida com sucesso"}

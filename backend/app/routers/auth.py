from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models.user import User
from app.schemas.auth import (
    TokenResponse,
    UserLogin,
    UserRegister,
    UserResponse,
)
from app.services.security import (
    create_access_token,
    hash_password,
    verify_password,
)
from app.schemas.user import (
    ProfileUpdate,
    ChangePassword,
    NotificationPreferences,
)

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/token")


@router.post("/register", response_model=UserResponse, status_code=201)
def register(payload: UserRegister, db: Session = Depends(get_db)):
    existing_user = (
        db.query(User)
        .filter(
            (User.username == payload.username)
            | (User.email == payload.email)
        )
        .first()
    )

    if existing_user:
        raise HTTPException(
            status_code=409,
            detail="Username or email already registered",
        )

    user = User(
        username=payload.username,
        email=str(payload.email),
        hashed_password=hash_password(payload.password),
        role="EMPLOYEE",
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    return user


def authenticate_user(username: str, password: str, db: Session):
    user = db.query(User).filter(User.username == username).first()

    if (
        not user
        or not user.is_active
        or not verify_password(password, user.hashed_password)
    ):
        return None

    return user

def build_token_response(user: User) -> TokenResponse:
    token = create_access_token(user.id, user.role)

    return TokenResponse(
        access_token=token,
        user=user,
    )


@router.post("/login", response_model=TokenResponse)
def login(payload: UserLogin, db: Session = Depends(get_db)):
    user = authenticate_user(payload.username, payload.password, db)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return build_token_response(user)


@router.post("/token", response_model=TokenResponse)
def login_with_form(
    form: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    user = authenticate_user(form.username, form.password, db)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return build_token_response(user)


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
):
    credentials_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired token",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM],
        )
        user_id = payload.get("sub")

        if user_id is None:
            raise credentials_error

        user_id = int(user_id)
    except (JWTError, ValueError, TypeError):
        raise credentials_error

    user = db.query(User).filter(User.id == user_id).first()

    if not user or not user.is_active:
        raise credentials_error

    return user


def require_roles(*roles: str):
    def role_checker(current_user: User = Depends(get_current_user)):
        if current_user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied.",
            )
        return current_user

    return role_checker

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user


from app.models.notification_preference import NotificationPreference


@router.put("/me", response_model=UserResponse)
def update_profile(
    payload: ProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    duplicate = db.query(User).filter(
        (User.id != current_user.id)
        & (
            (User.username == payload.username)
            | (User.email == str(payload.email))
        )
    ).first()

    if duplicate:
        raise HTTPException(
            status_code=409,
            detail="Username or email is already in use",
        )

    current_user.username = payload.username
    current_user.email = str(payload.email)
    db.commit()
    db.refresh(current_user)
    return current_user


@router.post("/change-password")
def change_password(
    payload: ChangePassword,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not verify_password(
        payload.current_password,
        current_user.hashed_password,
    ):
        raise HTTPException(
            status_code=400,
            detail="Current password is incorrect",
        )

    if payload.current_password == payload.new_password:
        raise HTTPException(
            status_code=400,
            detail="New password must differ from current password",
        )

    current_user.hashed_password = hash_password(payload.new_password)
    db.commit()

    return {"message": "Password changed successfully"}


@router.get("/notification-preferences",
            response_model=NotificationPreferences)
def get_notification_preferences(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    preferences = db.query(NotificationPreference).filter(
        NotificationPreference.user_id == current_user.id
    ).first()

    if not preferences:
        preferences = NotificationPreference(user_id=current_user.id)
        db.add(preferences)
        db.commit()
        db.refresh(preferences)

    return preferences


@router.put("/notification-preferences",
            response_model=NotificationPreferences)
def update_notification_preferences(
    payload: NotificationPreferences,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    preferences = db.query(NotificationPreference).filter(
        NotificationPreference.user_id == current_user.id
    ).first()

    if not preferences:
        preferences = NotificationPreference(user_id=current_user.id)
        db.add(preferences)

    preferences.email_notifications = payload.email_notifications
    preferences.announcement_notifications = (
        payload.announcement_notifications
    )
    preferences.leave_notifications = payload.leave_notifications
    preferences.payroll_notifications = payload.payroll_notifications

    db.commit()
    db.refresh(preferences)

    return preferences

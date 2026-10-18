from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app import config, models  # noqa: F401  (importing models registers the tables)
from app.database import Base, engine
from app.routers import auth, feedback, history, profile, scan


@asynccontextmanager
async def lifespan(_app: FastAPI):
    Base.metadata.create_all(bind=engine)  # creates missing tables, never alters existing ones
    yield


app = FastAPI(
    title="CyberGuard AI",
    version="2.0.0",
    lifespan=lifespan,
    # Interactive docs are handy locally but not something to expose in production.
    docs_url=None if config.IS_PRODUCTION else "/docs",
    redoc_url=None,
    openapi_url=None if config.IS_PRODUCTION else "/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=config.CORS_ORIGINS,
    allow_origin_regex=config.CORS_ORIGIN_REGEX,
    allow_credentials=False,  # the token travels in the Authorization header, not a cookie
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)


@app.middleware("http")
async def security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers.setdefault("X-Content-Type-Options", "nosniff")
    response.headers.setdefault("X-Frame-Options", "DENY")
    response.headers.setdefault("Referrer-Policy", "no-referrer")
    response.headers.setdefault("Cache-Control", "no-store")
    return response


@app.exception_handler(RequestValidationError)
async def validation_error_handler(_request: Request, exc: RequestValidationError):
    """Return one readable sentence in `detail` instead of FastAPI's list of error objects."""
    first = exc.errors()[0]
    message = first.get("msg", "Invalid input")
    field = ".".join(str(part) for part in first.get("loc", ()) if part not in ("body", "query"))
    if message.startswith("Value error, "):
        message = message.removeprefix("Value error, ")
    elif field:
        message = f"{field}: {message}"
    return JSONResponse(status_code=422, content={"detail": message, "field": field})


app.include_router(auth.router)
app.include_router(scan.router)
app.include_router(history.router)
app.include_router(profile.router)
app.include_router(feedback.router)


@app.get("/")
def home():
    return {"message": "CyberGuard AI is running", "version": app.version}


@app.get("/health")
def health():
    return {"status": "ok"}

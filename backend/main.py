from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from scanner import check_https
from ssl_checker import check_ssl
from header_checker import check_headers
from score import calculate_score

from urllib.parse import urlparse
from ai_engine import generate_ai_report


app = FastAPI(
    title="CyberGuard AI"
)


app.add_middleware(

    CORSMiddleware,

    allow_origins=[
        "http://localhost:5173"
    ],

    allow_credentials=True,

    allow_methods=["*"],

    allow_headers=["*"],

)


@app.get("/")
def home():

    return {
        "message":"CyberGuard AI Running"
    }


@app.get("/full-scan")
def full_scan(url:str):

    https = check_https(url)

    domain = urlparse(url).hostname

    ssl = check_ssl(domain)

    headers = check_headers(url)

    score = calculate_score(
        https,
        ssl["status"],
        headers
    )

    ai_report = generate_ai_report(

    https,

    ssl["status"],

    headers,

    score

)


    return {

        "website":url,

        "https":https,

        "ssl":ssl,

        "headers":headers,

        "security_score":score,

        "ai_analysis": ai_report

    }
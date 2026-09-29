from datetime import datetime, timedelta
from jose import jwt


SECRET_KEY = "cyberguard-secret-key"

ALGORITHM = "HS256"



def create_token(data):


    to_encode = data.copy()


    expire = datetime.utcnow() + timedelta(minutes=30)


    to_encode.update({

        "exp": expire

    })


    return jwt.encode(

        to_encode,

        SECRET_KEY,

        algorithm=ALGORITHM

    )
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer
from jose import jwt, JWTError


SECRET_KEY = "cyberguard-secret-key"

ALGORITHM = "HS256"



security = HTTPBearer()



def get_current_user(

    credentials = Depends(security)

):


    token = credentials.credentials


    try:


        payload = jwt.decode(

            token,

            SECRET_KEY,

            algorithms=[ALGORITHM]

        )


        username = payload.get(
            "username"
        )


        if username is None:

            raise HTTPException(
                status_code=401,
                detail="Invalid token"
            )


        return username



    except JWTError:


        raise HTTPException(

            status_code=401,

            detail="Token expired"

        )
from sqlalchemy import Column, Integer, String, ForeignKey, Text
from database import Base


class User(Base):

    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)

    username = Column(String, unique=True)

    email = Column(String, unique=True)

    password = Column(String)


class ScanHistory(Base):

    __tablename__ = "scan_history"

    id = Column(Integer, primary_key=True, index=True)

    website = Column(String)

    score = Column(Integer)

    risk = Column(String)

    date = Column(String)

    details = Column(Text, nullable=True)

    user_id = Column(
        Integer,
        ForeignKey("users.id")
    )


class Feedback(Base):

    __tablename__ = "feedback"

    id = Column(Integer, primary_key=True, index=True)

    username = Column(String, nullable=True)

    rating = Column(Integer)

    comment = Column(Text, nullable=True)

    date = Column(String)
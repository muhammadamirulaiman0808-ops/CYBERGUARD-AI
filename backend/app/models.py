"""Table definitions.

The columns are intentionally identical to the first version of the project so the
existing Supabase tables keep working without a migration.
"""

from sqlalchemy import Column, ForeignKey, Integer, String, Text

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True)
    email = Column(String, unique=True)
    password = Column(String)  # bcrypt hash, never the plain password


class ScanHistory(Base):
    __tablename__ = "scan_history"

    id = Column(Integer, primary_key=True, index=True)
    website = Column(String)
    score = Column(Integer)
    risk = Column(String)  # "Low" | "Medium" | "High"
    date = Column(String)
    details = Column(Text, nullable=True)  # full scan result as JSON text
    user_id = Column(Integer, ForeignKey("users.id"))


class Feedback(Base):
    __tablename__ = "feedback"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, nullable=True)
    rating = Column(Integer)
    comment = Column(Text, nullable=True)
    date = Column(String)

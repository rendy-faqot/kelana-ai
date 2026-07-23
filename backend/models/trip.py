from sqlalchemy import BigInteger, Column, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base


class Trip(Base):
  __tablename__ = "trips"
  id                = Column(BigInteger, primary_key=True)
  user_id           = Column(BigInteger, ForeignKey("users.id"), nullable=False)
  destination       = Column(String,   nullable=False)
  days              = Column(Integer,  nullable=False)
  budget            = Column(Float,    nullable=False)
  category          = Column(String,   nullable=False)
  daily_budget      = Column(Float,    nullable=False)
  ai_recommendation = Column(Text,     nullable=True)
  created_at   = Column(
      DateTime(timezone=True),
      nullable=False,
      server_default=func.now(),
  )

  user = relationship("User", back_populates="trips")

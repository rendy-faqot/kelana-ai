from sqlalchemy import BigInteger, Column, DateTime, ForeignKey, String
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from database import Base


class Conversation(Base):
  __tablename__ = "conversations"

  id         = Column(BigInteger, primary_key=True)
  user_id    = Column(BigInteger, ForeignKey("users.id"), nullable=False)
  title      = Column(String(255), nullable=True)
  created_at = Column(
      DateTime(timezone=True),
      nullable=False,
      server_default=func.now(),
  )

  user = relationship("User", back_populates="conversations")
  messages = relationship("Message", back_populates="conversation")

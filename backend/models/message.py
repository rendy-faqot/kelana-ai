from sqlalchemy import BigInteger, Column, DateTime, ForeignKey, String, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from database import Base


class Message(Base):
  __tablename__ = "messages"

  id              = Column(BigInteger, primary_key=True)
  conversation_id = Column(BigInteger, ForeignKey("conversations.id"), nullable=False)
  role            = Column(String(16), nullable=False)
  content         = Column(Text, nullable=False)
  created_at      = Column(
      DateTime(timezone=True),
      nullable=False,
      server_default=func.now(),
  )

  conversation = relationship("Conversation", back_populates="messages")

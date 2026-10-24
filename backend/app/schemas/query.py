from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import QueryStatus


class PatientQueryCreate(BaseModel):
    subject: str = Field(min_length=3, max_length=255)
    body: str = Field(min_length=10, max_length=5000)
    doctor_id: UUID | None = None


class QueryAnswer(BaseModel):
    response: str = Field(min_length=1, max_length=5000)


class PatientQueryRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    patient_id: UUID
    doctor_id: UUID | None
    subject: str
    body: str
    status: QueryStatus
    response: str | None
    responded_at: datetime | None
    created_at: datetime
    updated_at: datetime

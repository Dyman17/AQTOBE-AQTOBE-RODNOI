from pydantic import BaseModel, Field


class DemoCheckoutRequest(BaseModel):
    plan: str = Field(..., pattern="^(simple|standard|premium|pro)$")


class DemoCheckoutResponse(BaseModel):
    status: str
    plan: str
    subscription_type: str
    message: str

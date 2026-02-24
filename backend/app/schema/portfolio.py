from pydantic import BaseModel
from typing import List, Optional

class Holding(BaseModel):
    symbol: str
    quantity: float
    avg_price: float
    current_price: float
    pnl: float

class PortfolioResponse(BaseModel):
    total_investment: float
    current_value: float
    profit_loss: float
    holdings: List[Holding]

class ZerodhaProfileResponse(BaseModel):
    user_id: str
    user_name: str
    user_shortname: str
    email: str
    broker: str
    exchanges: List[str]
    products: List[str]
    order_types: List[str]
    avatar_url: Optional[str] = None

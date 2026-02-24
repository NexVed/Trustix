import os
import datetime
from kiteconnect import KiteConnect
from fastapi import HTTPException
from app.config import settings
from app.utils.encryption import encrypt_token, decrypt_token
from app.services.database import get_supabase_client

class ZerodhaService:
    def __init__(self):
        # API Keys from environment
        self.api_key = os.environ.get("ZERODHA_API_KEY", "")
        self.api_secret = os.environ.get("ZERODHA_API_SECRET", "")
        self.supabase = get_supabase_client()
        
    def get_login_url(self) -> str:
        """Returns the Zerodha OAuth login URL."""
        if not self.api_key:
            raise HTTPException(status_code=500, detail="Zerodha API Key not configured.")
        kite = KiteConnect(api_key=self.api_key)
        return kite.login_url()
        
    def generate_and_store_token(self, request_token: str, user_id: str) -> dict:
        """
        Uses the `request_token` from OAuth step 1 to generate an `access_token`.
        Encrypts and stores it in the database for future API calls.
        """
        if not self.api_key or not self.api_secret:
            raise HTTPException(status_code=500, detail="Zerodha API credentials not configured.")
            
        kite = KiteConnect(api_key=self.api_key)
        
        try:
            # Step 1: Request access token using KiteConnect
            data = kite.generate_session(request_token, api_secret=self.api_secret)
            access_token = data["access_token"]
            zerodha_user_id = data["user_id"]
            
            # Step 2: Encrypt token for secure PostgreSQL storage
            encrypted_token = encrypt_token(access_token)
            
            # Step 3: Upsert the token in the vault configuration database table.
            # In Trustix, since it is a Vault, we can assume the user has a vault or we just save it directly to the user's profile.
            # We'll create a dedicated table or upsert it in user profiles.
            
            # For this MVP, let's assume we store it in a generic `user_secure_profiles` or similar 
            # table that we have control over, or we create a new table `zerodha_connections`.
            # We'll use a new `zerodha_connections` table schema for clarity.
            upsert_data = {
                "user_id": user_id,
                "zerodha_user_id": zerodha_user_id,
                "encrypted_access_token": encrypted_token,
                "updated_at": datetime.datetime.utcnow().isoformat()
            }
            
            result = self.supabase.table("zerodha_connections").upsert(upsert_data, on_conflict="user_id").execute()
            if not result.data:
                 raise Exception("Failed to save connection to database.")
            
            return {
                "status": "success",
                "zerodha_user_id": zerodha_user_id
            }
            
        except Exception as e:
            # KiteConnect exceptions or DB exceptions
            raise HTTPException(status_code=400, detail=f"OAuth verification failed: {e}")

    def fetch_portfolio(self, user_id: str) -> dict:
        """
        Retrieves the encrypted token, decrypts it, and fetches Kite API holdings/positions.
        """
        # Fetch connection
        response = self.supabase.table("zerodha_connections").select("encrypted_access_token").eq("user_id", user_id).execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Zerodha account not connected.")
            
        encrypted_token = response.data[0]["encrypted_access_token"]
        access_token = decrypt_token(encrypted_token)
        
        kite = KiteConnect(api_key=self.api_key)
        kite.set_access_token(access_token)
        
        try:
            holdings = kite.holdings()
            
            # Aggregate portfolio snapshot
            total_investment = 0.0
            current_value = 0.0
            
            portfolio_holdings = []
            
            for h in holdings:
                qty = h.get("quantity", 0)
                avg_price = h.get("average_price", 0.0)
                last_price = h.get("last_price", 0.0)
                
                investment = qty * avg_price
                value = qty * last_price
                pnl = value - investment
                
                total_investment += investment
                current_value += value
                
                portfolio_holdings.append({
                    "symbol": h.get("tradingsymbol"),
                    "quantity": qty,
                    "avg_price": round(avg_price, 2),
                    "current_price": round(last_price, 2),
                    "pnl": round(pnl, 2)
                })
                
            total_pnl = current_value - total_investment
            
            return {
                "total_investment": round(total_investment, 2),
                "current_value": round(current_value, 2),
                "profit_loss": round(total_pnl, 2),
                "holdings": portfolio_holdings
            }
            
        except Exception as e:
            # Token Expired or Network Failure
            raise HTTPException(status_code=401, detail=f"Failed to fetch portfolio. Your session may have expired. Error: {e}")

zerodha_service = ZerodhaService()

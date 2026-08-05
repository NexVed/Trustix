from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger
from app.services.database import get_supabase_client, get_nominee_emails, mark_vault_triggered, log_trigger_activation
from app.services.email_service import send_trigger_activation_email
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)

scheduler = BackgroundScheduler()


def check_dead_man_triggers():
    """Check all vaults for inactivity > threshold and trigger if needed."""
    client = get_supabase_client()
    
    try:
        # Get vaults that are not triggered and have last_activity_at
        # Check if last_activity_at is older than 30 days (or vault's trigger_threshold_days)
        cutoff = datetime.utcnow() - timedelta(days=30)
        
        vaults = client.table("vaults").select("*").eq("is_triggered", False).not_.is_("last_activity_at", "null").lte("last_activity_at", cutoff.isoformat()).execute()
        
        for vault in vaults.data or []:
            logger.info(f"Dead-man trigger activated for vault {vault['id']} ({vault['vault_code']})")
            
            # Mark vault as triggered
            mark_vault_triggered(vault["id"])
            
            # Log trigger activation
            log_trigger_activation(vault["id"])
            
            # Notify nominees
            nominee_emails = get_nominee_emails(vault["id"])
            if nominee_emails:
                send_trigger_activation_email(
                    emails=nominee_emails,
                    vault_code=vault["vault_code"],
                    owner_name=vault.get("user_id", "Vault Owner")
                )
                logger.info(f"Trigger notification sent to {len(nominee_emails)} nominees for vault {vault['id']}")
                
    except Exception as e:
        logger.error(f"Error in dead-man trigger check: {e}")


def send_trigger_activation_email(emails: list, vault_code: str, owner_name: str) -> bool:
    """Send trigger activation notification to nominees."""
    from app.services.email_service import RESEND_API_KEY
    import resend
    
    if not RESEND_API_KEY or not emails:
        return False
    
    if RESEND_API_KEY:
        resend.api_key = RESEND_API_KEY
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1f2937; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #7c2d12 0%, #ea580c 100%); border-radius: 16px; padding: 40px; text-align: center; margin-bottom: 24px;">
            <h1 style="color: white; margin: 0; font-size: 28px;">⚠️ Dead-Man Switch Activated</h1>
        </div>
        
        <div style="background: #f9fafb; border-radius: 12px; padding: 32px;">
            <h2 style="color: #1f2937; margin: 0 0 16px;">Vault Trigger Alert</h2>
            <p style="color: #4b5563;">The dead-man switch for vault <strong>{vault_code}</strong> has been activated due to inactivity.</p>
            <p style="color: #4b5563;">The vault owner (<strong>{owner_name}</strong>) has not shown activity for over 30 days.</p>
            
            <div style="background: #fef3c7; border: 1px solid #fcd34d; border-radius: 8px; padding: 16px; margin: 24px 0;">
                <h3 style="color: #92400e; margin: 0 0 8px;">Next Steps</h3>
                <ul style="color: #92400e; margin: 0; padding-left: 20px;">
                    <li>Coordinate with other nominees to unlock the vault</li>
                    <li>Each nominee needs their secret key</li>
                    <li>Threshold number of keys required to access</li>
                </ul>
            </div>
            
            <p style="color: #6b7280; font-size: 14px;">This is an automated security notification from TRUSTIX.</p>
        </div>
    </body>
    </html>
    """
    
    try:
        params = {
            "from": "TRUSTIX Vault <noreply@trustix.app>",
            "to": emails,
            "subject": f"TRUSTIX Alert: Dead-Man Switch Activated for Vault {vault_code}",
            "html": html_content
        }
        
        resend.Emails.send(params)
        return True
    except Exception as e:
        logger.error(f"Failed to send trigger activation email: {e}")
        return False


def start_scheduler():
    """Start the background scheduler."""
    if not scheduler.running:
        scheduler.add_job(
            check_dead_man_triggers,
            IntervalTrigger(hours=6),
            id="dead_man_check",
            replace_existing=True
        )
        scheduler.start()
        logger.info("Dead-man trigger scheduler started (checks every 6 hours)")


def shutdown_scheduler():
    """Shutdown the background scheduler."""
    if scheduler.running:
        scheduler.shutdown()
        logger.info("Dead-man trigger scheduler stopped")
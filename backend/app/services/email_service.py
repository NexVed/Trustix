import os
import resend
from typing import List, Dict, Any
from app.config import settings


RESEND_API_KEY = os.environ.get("RESEND_API_KEY", "")

if RESEND_API_KEY:
    resend.api_key = RESEND_API_KEY


def send_inheritor_key_email(
    email: str,
    name: str,
    role: str,
    secret_key: str,
    vault_code: str,
    threshold: int,
    total_keys: int
) -> bool:
    """
    Send secret key to inheritor via email using Resend.
    """
    if not RESEND_API_KEY:
        print(f"WARNING: RESEND_API_KEY not configured. Would send key to {email}")
        return False
    
    role_display = role.replace("_", " ").title()
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1f2937; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); border-radius: 16px; padding: 40px; text-align: center; margin-bottom: 24px;">
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">TRUSTIX Vault</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0; font-size: 16px;">Digital Inheritance Vault</p>
        </div>
        
        <div style="background: #f9fafb; border-radius: 12px; padding: 32px; margin-bottom: 24px;">
            <h2 style="color: #1f2937; margin: 0 0 16px; font-size: 22px;">You've Been Added as an Inheritor</h2>
            <p style="color: #4b5563; margin: 0 0 16px;">Hello <strong>{name}</strong>,</p>
            <p style="color: #4b5563; margin: 0 0 16px;">
                You have been designated as a <strong>{role_display}</strong> for a TRUSTIX Digital Inheritance Vault. 
                The vault creator has entrusted you with a secret key to access this vault when the time comes.
            </p>
            
            <div style="background: white; border: 2px solid #e5e7eb; border-radius: 12px; padding: 24px; margin: 24px 0;">
                <h3 style="color: #1f2937; margin: 0 0 12px; font-size: 16px;">Your Secret Key</h3>
                <div style="font-family: 'Monaco', 'Menlo', monospace; font-size: 14px; background: #f3f4f6; padding: 16px; border-radius: 8px; word-break: break-all; letter-spacing: 0.5px;">
                    <strong>{secret_key}</strong>
                </div>
                <p style="color: #ef4444; font-size: 13px; margin: 12px 0 0; font-weight: 600;">
                    ⚠️ IMPORTANT: Save this key securely. It will NOT be shown again.
                </p>
            </div>
            
            <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 16px; margin: 24px 0;">
                <h4 style="color: #1e40af; margin: 0 0 8px; font-size: 14px;">Vault Details</h4>
                <p style="color: #1e40af; margin: 4px 0; font-size: 14px;"><strong>Vault Code:</strong> {vault_code}</p>
                <p style="color: #1e40af; margin: 4px 0; font-size: 14px;"><strong>Your Role:</strong> {role_display}</p>
                <p style="color: #1e40af; margin: 4px 0; font-size: 14px;"><strong>Unlock Threshold:</strong> {threshold} of {total_keys} keys required</p>
            </div>
            
            <p style="color: #6b7280; font-size: 14px; margin: 24px 0 0;">
                To access the vault, visit the TRUSTIX platform and enter the Vault Code along with your Secret Key. 
                The vault requires {threshold} key(s) from the {total_keys} designated inheritors to unlock.
            </p>
        </div>
        
        <div style="text-align: center; padding: 16px;">
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                This email was sent from TRUSTIX Digital Inheritance Vault.<br>
                If you didn't expect this, please contact the vault creator directly.
            </p>
        </div>
    </body>
    </html>
    """
    
    try:
        params = {
            "from": "TRUSTIX Vault <noreply@trustix.app>",
            "to": [email],
            "subject": f"TRUSTIX Vault: Your Secret Key as {role_display}",
            "html": html_content
        }
        
        result = resend.Emails.send(params)
        print(f"Email sent to {email}: {result}")
        return True
        
    except Exception as e:
        print(f"Failed to send email to {email}: {e}")
        return False


def send_vault_created_notification(
    owner_email: str,
    vault_code: str,
    inheritors: List[Dict[str, Any]],
    owner_secret_key: str
) -> bool:
    """
    Send confirmation to vault creator with all keys.
    """
    if not RESEND_API_KEY:
        print(f"WARNING: RESEND_API_KEY not configured. Would send confirmation to {owner_email}")
        return False
    
    inheritor_list = ""
    for inh in inheritors:
        inheritor_list += f"""
        <tr>
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">{inh.get('name', '')}</td>
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">{inh.get('role', '').replace('_', ' ').title()}</td>
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">{inh.get('email', '')}</td>
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; font-family: monospace; font-size: 12px;">{inh.get('secret_key', '')}</td>
        </tr>
        """
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1f2937; max-width: 700px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #065f46 0%, #10b981 100%); border-radius: 16px; padding: 40px; text-align: center; margin-bottom: 24px;">
            <h1 style="color: white; margin: 0; font-size: 28px;">✅ Vault Created Successfully</h1>
        </div>
        
        <div style="background: #f9fafb; border-radius: 12px; padding: 32px; margin-bottom: 24px;">
            <h2 style="color: #1f2937; margin: 0 0 16px;">Your TRUSTIX Vault is Ready</h2>
            
            <div style="background: #fef3c7; border: 1px solid #fcd34d; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
                <h3 style="color: #92400e; margin: 0 0 8px;">🔑 Your Owner Secret Key</h3>
                <div style="font-family: monospace; background: white; padding: 12px; border-radius: 6px;">
                    <strong>{owner_secret_key}</strong>
                </div>
                <p style="color: #92400e; font-size: 13px; margin: 8px 0 0;">Save this securely. It will NOT be shown again.</p>
            </div>
            
            <p style="color: #1f2937;"><strong>Vault Code:</strong> <code style="background: #e5e7eb; padding: 4px 8px; border-radius: 4px;">{vault_code}</code></p>
            
            <h3 style="color: #1f2937; margin-top: 32px;">Inheritors & Keys (emailed to each)</h3>
            <table style="width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                <thead>
                    <tr style="background: #f3f4f6;">
                        <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb;">Name</th>
                        <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb;">Role</th>
                        <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb;">Email</th>
                        <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb;">Secret Key</th>
                    </tr>
                </thead>
                <tbody>
                    {inheritor_list}
                </tbody>
            </table>
        </div>
    </body>
    </html>
    """
    
    try:
        params = {
            "from": "TRUSTIX Vault <noreply@trustix.app>",
            "to": [owner_email],
            "subject": "TRUSTIX Vault Created - Your Keys & Inheritor Details",
            "html": html_content
        }
        
        result = resend.Emails.send(params)
        print(f"Confirmation email sent to {owner_email}: {result}")
        return True
        
    except Exception as e:
        print(f"Failed to send confirmation email: {e}")
        return False


def send_vault_access_notification(
    inheritor_emails: List[str],
    vault_code: str,
    accessed_by: str
) -> bool:
    """
    Notify all inheritors when vault is accessed.
    """
    if not RESEND_API_KEY or not inheritor_emails:
        return False
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1f2937; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #7c2d12 0%, #ea580c 100%); border-radius: 16px; padding: 40px; text-align: center; margin-bottom: 24px;">
            <h1 style="color: white; margin: 0; font-size: 28px;">⚠️ Vault Access Alert</h1>
        </div>
        
        <div style="background: #f9fafb; border-radius: 12px; padding: 32px;">
            <h2 style="color: #1f2937; margin: 0 0 16px;">Vault Accessed</h2>
            <p style="color: #4b5563;">The vault <strong>{vault_code}</strong> has been accessed by <strong>{accessed_by}</strong>.</p>
            <p style="color: #6b7280; font-size: 14px;">This is a security notification. If this was unexpected, please contact the other inheritors immediately.</p>
        </div>
    </body>
    </html>
    """
    
    try:
        params = {
            "from": "TRUSTIX Vault <noreply@trustix.app>",
            "to": inheritor_emails,
            "subject": f"TRUSTIX Alert: Vault {vault_code} Accessed",
            "html": html_content
        }
        
        resend.Emails.send(params)
        return True
    except Exception as e:
        print(f"Failed to send access notification: {e}")
        return False
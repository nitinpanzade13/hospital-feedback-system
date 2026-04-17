import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional
import os
from dotenv import load_dotenv

load_dotenv()

class EmailService:
    def __init__(self):
        self.sender_email = os.getenv("EMAIL_USER", "noreply@hospital.com")
        self.sender_password = os.getenv("EMAIL_PASSWORD", "")
        self.smtp_server = os.getenv("SMTP_SERVER", "smtp.gmail.com")
        self.smtp_port = int(os.getenv("SMTP_PORT", "587"))
        self.app_name = "Hospital Feedback System"
        self.app_url = os.getenv("APP_URL", "http://localhost:3000")

    def send_email(self, to_email: str, subject: str, html_content: str) -> bool:
        """Send email with HTML content"""
        try:
            message = MIMEMultipart("alternative")
            message["Subject"] = subject
            message["From"] = self.sender_email
            message["To"] = to_email

            part = MIMEText(html_content, "html")
            message.attach(part)

            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                server.starttls()
                server.login(self.sender_email, self.sender_password)
                server.sendmail(self.sender_email, to_email, message.as_string())
            
            print(f"✓ Email sent successfully to {to_email}")
            return True
        except smtplib.SMTPAuthenticationError as e:
            print(f"❌ SMTP Authentication Error: Invalid email or password")
            print(f"   From: {self.sender_email}")
            print(f"   Server: {self.smtp_server}:{self.smtp_port}")
            print(f"   Error: {str(e)}")
            return False
        except smtplib.SMTPException as e:
            print(f"❌ SMTP Error: {str(e)}")
            return False
        except Exception as e:
            print(f"❌ Error sending email to {to_email}: {str(e)}")
            return False

    def send_verification_email(self, to_email: str, full_name: str, verification_link: str) -> bool:
        """Send email verification link"""
        html_content = f"""
        <html>
            <body style="font-family: Arial, sans-serif; background-color: #f5f5f5; padding: 20px;">
                <div style="background-color: white; padding: 30px; border-radius: 10px; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #333;">Welcome to {self.app_name}! 🏥</h2>
                    <p>Hi <strong>{full_name}</strong>,</p>
                    
                    <p>Your admin account has been created. Please verify your email and set your password to complete the setup.</p>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="{verification_link}" 
                           style="background-color: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                            Verify Email & Set Password
                        </a>
                    </div>
                    
                    <p style="color: #666; font-size: 14px;">
                        Or copy this link: <br/>
                        <code style="background-color: #f0f0f0; padding: 5px;">{verification_link}</code>
                    </p>
                    
                    <p style="color: #999; font-size: 12px;">
                        This link expires in 24 hours. If you didn't expect this email, please contact your superadmin.
                    </p>
                    
                    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                    <p style="color: #999; font-size: 12px;">
                        {self.app_name}<br/>
                        Hospital Management System
                    </p>
                </div>
            </body>
        </html>
        """
        return self.send_email(to_email, f"Welcome to {self.app_name} - Verify Your Email", html_content)

    def send_password_reset_email(self, to_email: str, full_name: str, reset_link: str) -> bool:
        """Send password reset link"""
        html_content = f"""
        <html>
            <body style="font-family: Arial, sans-serif; background-color: #f5f5f5; padding: 20px;">
                <div style="background-color: white; padding: 30px; border-radius: 10px; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #333;">Password Reset Request</h2>
                    <p>Hi <strong>{full_name}</strong>,</p>
                    
                    <p>We received a request to reset your password. Click the button below to reset it.</p>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="{reset_link}" 
                           style="background-color: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                            Reset Password
                        </a>
                    </div>
                    
                    <p style="color: #666; font-size: 14px;">
                        Or copy this link: <br/>
                        <code style="background-color: #f0f0f0; padding: 5px;">{reset_link}</code>
                    </p>
                    
                    <p style="color: #999; font-size: 12px;">
                        This link expires in 1 hour. If you didn't request this, you can ignore this email.
                    </p>
                    
                    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                    <p style="color: #999; font-size: 12px;">
                        {self.app_name}<br/>
                        Hospital Management System
                    </p>
                </div>
            </body>
        </html>
        """
        return self.send_email(to_email, "Password Reset Request", html_content)

    def send_admin_deleted_email(self, to_email: str, full_name: str) -> bool:
        """Notify admin that their account was deleted"""
        html_content = f"""
        <html>
            <body style="font-family: Arial, sans-serif; background-color: #f5f5f5; padding: 20px;">
                <div style="background-color: white; padding: 30px; border-radius: 10px; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #d32f2f;">Account Deleted</h2>
                    <p>Hi <strong>{full_name}</strong>,</p>
                    
                    <p>Your admin account in {self.app_name} has been deleted by a superadmin.</p>
                    
                    <p>If you believe this was done in error, please contact your superadmin.</p>
                    
                    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                    <p style="color: #999; font-size: 12px;">
                        {self.app_name}<br/>
                        Hospital Management System
                    </p>
                </div>
            </body>
        </html>
        """
        return self.send_email(to_email, "Account Deleted Notification", html_content)

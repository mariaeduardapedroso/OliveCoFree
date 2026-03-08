"""
Serviço de envio de email via SMTP
"""
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from ..config import SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, SMTP_FROM, SMTP_FROM_NAME


def enviar_email_recuperacao(destinatario: str, nome_usuario: str, link_recuperacao: str) -> bool:
    """
    Envia email de recuperação de senha via SMTP genérico.
    Retorna True se enviado com sucesso, False caso contrário.
    """
    if not SMTP_HOST or not SMTP_USER:
        print("[AVISO] SMTP não configurado. Email não enviado.")
        print(f"[DEBUG] Link de recuperação: {link_recuperacao}")
        return False

    assunto = "Recuperação de Senha - OliveCoFree"

    corpo_html = f"""
    <html>
    <body style="font-family: Arial, sans-serif; background-color: #f9fafb; padding: 20px;">
      <div style="max-width: 500px; margin: 0 auto; background: white; border-radius: 12px; padding: 32px; border: 1px solid #e5e7eb;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h2 style="color: #1f2937; margin: 0;">OliveCoFree</h2>
          <p style="color: #6b7280; font-size: 14px;">Sistema de Previsão de Infeção</p>
        </div>
        <p style="color: #374151;">Olá <strong>{nome_usuario}</strong>,</p>
        <p style="color: #374151;">Recebemos um pedido para redefinir a sua senha. Clique no botão abaixo:</p>
        <div style="text-align: center; margin: 24px 0;">
          <a href="{link_recuperacao}"
             style="background-color: #16a34a; color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">
            Redefinir Senha
          </a>
        </div>
        <p style="color: #6b7280; font-size: 13px;">Este link expira em 15 minutos.</p>
        <p style="color: #6b7280; font-size: 13px;">Se não solicitou esta alteração, ignore este email.</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
        <p style="color: #9ca3af; font-size: 12px; text-align: center;">
          &copy; 2025 OliveCoFree - IPB
        </p>
      </div>
    </body>
    </html>
    """

    corpo_texto = (
        f"Olá {nome_usuario},\n\n"
        f"Recebemos um pedido para redefinir a sua senha.\n"
        f"Acesse o link: {link_recuperacao}\n\n"
        f"Este link expira em 15 minutos.\n"
        f"Se não solicitou esta alteração, ignore este email."
    )

    msg = MIMEMultipart("alternative")
    msg["Subject"] = assunto
    msg["From"] = f"{SMTP_FROM_NAME} <{SMTP_FROM}>"
    msg["To"] = destinatario

    msg.attach(MIMEText(corpo_texto, "plain"))
    msg.attach(MIMEText(corpo_html, "html"))

    try:
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.sendmail(SMTP_FROM, destinatario, msg.as_string())
        print(f"[OK] Email de recuperação enviado para {destinatario}")
        return True
    except Exception as e:
        print(f"[ERRO] Falha ao enviar email: {e}")
        return False

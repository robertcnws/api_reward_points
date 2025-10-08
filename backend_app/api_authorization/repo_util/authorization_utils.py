from django.http import JsonResponse
from django.utils import timezone
from django.conf import settings
from django.template.loader import render_to_string
from django.core.mail import EmailMessage
from api_authorization.repo_util.gained_points_utils import get_rewards_points as user_get_rewards_points
import logging
import boto3

logging.basicConfig(level=logging.WARNING)
logger = logging.getLogger(__name__)

def send_sms_verification_code(phone_number, message):
    try:
        sns = boto3.client(
            'sns', 
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
            region_name=settings.AWS_REGION,
        )
        sns.publish(
            PhoneNumber=phone_number,
            Message=message
        )
        logger.info(f'SMS sent to {phone_number}')
        print(f'SMS sent to {phone_number}')
    except Exception as e:
        logger.error(f'Error sending SMS: {e}')
        print(f'Error sending SMS: {e}')
        raise e


def send_email_verification_code(
    list_emails, 
    code, 
    template, 
    response_message, 
    subject, 
    first_name, 
    last_name, 
    current_year
):
        email_html_message = render_to_string(
            f"api_authorization/{template}",  
            {"code": code, "first_name": first_name, "last_name": last_name, "current_year": current_year}, 
        )
        return send_generic_email(
            list_emails, 
            email_html_message, 
            subject, 
            message_response=response_message
        )
        

def send_email_pending_approval(
    points, 
    username, 
    first_name, 
    last_name, 
    email, 
    role_name, 
    company_name, 
    created_time,
    current_year, 
    list_receivers, 
    pending_url
):
    email_html_message = render_to_string(
            "api_authorization/email_send_pending_approval_user.html",  
            {
                "username": username, 
                "first_name": first_name, 
                "last_name": last_name, 
                "points": points,
                "email": email,
                "role_name": role_name,
                "company_name": company_name,
                "created_time": created_time,
                "current_year": current_year,
                "pending_url": pending_url,
            }, 
    )
    message = "Pending approval email sent successfully."
    return send_generic_email(
        list_receivers, 
        email_html_message, 
        f"Pending Approval (user: {username}) for Customer Portal",
        message_response=message
    )
    

def send_email_approved_user(
    username, 
    first_name, 
    last_name, 
    email,
    login_url
):
    email_html_message = render_to_string(
            "api_authorization/email_send_approved_user.html",  
            {
                "username": username, 
                "first_name": first_name, 
                "last_name": last_name, 
                "email": email,
                "login_url": login_url,
            }, 
    )
    message = "Approved user email sent successfully."
    return send_generic_email(
        [email], 
        email_html_message, 
        f"Approved User (user: {username}) for Customer Portal",
        message_response=message
    )
    
    
def send_generic_email(list_receivers, email_html_message, subject, sender=settings.EMAIL_HOST_USER, message_response=None):
        email_msg = EmailMessage(
            subject,
            email_html_message,
            f'New Window System <{sender}>',
            list_receivers,
        )
        email_msg.content_subtype = "html"  
        email_msg.send(fail_silently=False)
        message = message_response or "Email sent successfully."
        return JsonResponse({"message": message}, status=200)

    
def generate_verification_code():
    import random
    return str(random.randint(100000, 999999)) 


# --- Helpers ---------------------------------------------------------------

# --- Función principal -----------------------------------------------------

def get_rewards_points(user, description=None):
    return user_get_rewards_points(user, description=description)


def set_initial_tour_and_intro(user):
    user.show_tour_guide_modal = True
    user.took_tour_guide = False
    user.show_intro_guide_modal = True
    user.took_intro_guide = False
    # user.save()
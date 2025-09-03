from django.conf import settings

#############################################
# HEADERS
#############################################

def config_headers():
    token = settings.API_MAIN_DATA_TOKEN
    headers = {
        "Authorization": f"Token {token}"
    }
    return headers
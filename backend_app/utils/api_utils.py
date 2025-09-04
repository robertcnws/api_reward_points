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


class ApiError(Exception):
    def __init__(self, status: int, payload: dict):
        super().__init__()
        self.status = status
        self.payload = payload
        
    
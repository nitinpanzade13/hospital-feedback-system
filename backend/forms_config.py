# ==========================================
# GOOGLE FORMS CONFIGURATION
# ==========================================
# 
# Store your Google Form IDs here
# Get Form ID from the URL:
# https://docs.google.com/forms/d/FORM_ID_HERE/edit
#
# Extract just the FORM_ID_HERE part
# ==========================================

DEPARTMENT_FORM_CONFIG = {
    "Emergency": {
        "form_id": "1FAIpQLSePB5SMiD2Ar7auhl46GTq6AfZpAf5CygFiaNOwZFif241F4w",
        "form_url": "https://docs.google.com/forms/d/e/1FAIpQLSePB5SMiD2Ar7auhl46GTq6AfZpAf5CygFiaNOwZFif241F4w/viewform",
        "backend_url": "https://script.google.com/macros/s/AKfycbye9H9EFc4r6VXEcbdKvtQvSQm9ibWTwjFY7zvz7zUprIE46gB7UJ9prcACKpzdI6Eg/exec"
    },
    "ICU": {
        "form_id": "1FAIpQLSfljGTuTRKgVPbRsye_Hf6eGhDpsahLqPgHldaI5JwcwQx5uw",
        "form_url": "https://docs.google.com/forms/d/e/1FAIpQLSfljGTuTRKgVPbRsye_Hf6eGhDpsahLqPgHldaI5JwcwQx5uw/viewform",
        "backend_url": "https://script.google.com/macros/s/AKfycbwofh5cFxBmrggcWwcs11PTXBEwFF2nzL6zMMkEeY3yZUuaAGvhxIJJiAWVGiu0hcwnYQ/exec"
    },
    "Cardiology": {
        "form_id": "1FAIpQLSc-0YNL2k6Y1WkMZWCPb6d4o-RS32zIJI9E0QvOKZw9cSUQQQ",
        "form_url": "https://docs.google.com/forms/d/e/1FAIpQLSc-0YNL2k6Y1WkMZWCPb6d4o-RS32zIJI9E0QvOKZw9cSUQQQ/viewform",
        "backend_url": "https://script.google.com/macros/s/AKfycbwoTL756Om1bRfxJmMRV8qls77ejdK7WK-P5OvcFBdv74s-bytsRpOb-f9kSemO0DxKPg/exec"
    },
    "Pediatrics": {
        "form_id": "1FAIpQLScJuwXnWCZrIMld5EPpotWTzsDfKH5yOtPhcZZfOdldJqT6gA",
        "form_url": "https://docs.google.com/forms/d/e/1FAIpQLScJuwXnWCZrIMld5EPpotWTzsDfKH5yOtPhcZZfOdldJqT6gA/viewform",
        "backend_url": "https://script.google.com/macros/s/AKfycbzZ6LHVHz0uvsWBCAklkcJCrVqeIaNc_3ModKQfMwAGOz-5mWvr7SPflO9CMq_CQ7n8BA/exec"
    },
    "Oncology": {
        "form_id": "1FAIpQLSd8ZG_y6LbAkVOJikfqGbVqcK92aNxl6PX2d5mt6NxhB8stoA",
        "form_url": "https://docs.google.com/forms/d/e/1FAIpQLSd8ZG_y6LbAkVOJikfqGbVqcK92aNxl6PX2d5mt6NxhB8stoA/viewform",
        "backend_url": "https://script.google.com/macros/s/AKfycbwFGiO6QXFIkjccXRlXr8cW30UG7XHASKVbVyXq8rZ3QgpPs9nZW0oXi2nGQ4il9-o/exec"
    }
}

def get_form_config(department):
    """Get form configuration for a department"""
    return DEPARTMENT_FORM_CONFIG.get(department, {})

def get_form_id(department):
    """Get form ID for a department"""
    config = get_form_config(department)
    return config.get("form_id")

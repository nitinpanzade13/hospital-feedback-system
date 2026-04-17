// ==========================================
// FORM URL CONFIGURATION
// ==========================================
// 
// This file maps each department to its Google Form URL
// 
// INSTRUCTIONS:
// 1. Create the 5 Google Forms (Emergency, ICU, Cardiology, Pediatrics, Oncology)
// 2. Get each form's published URL
// 3. Replace the placeholder URLs below with your actual form URLs
// 4. Save this file
// 5. Import this in your dashboard code
//
// HOW TO GET FORM URL:
// - Open the form
// - Click "Send" button (top right)
// - Copy the link (it's the blue hyperlink)
// - Example: https://docs.google.com/forms/d/1A2B3C4D5E6F7G8H/viewform
//
// ==========================================

export const DEPARTMENT_FORM_URLS = {
  "Emergency": "https://docs.google.com/forms/d/e/1FAIpQLSePB5SMiD2Ar7auhl46GTq6AfZpAf5CygFiaNOwZFif241F4w/viewform",
  "ICU": "https://docs.google.com/forms/d/e/1FAIpQLSfljGTuTRKgVPbRsye_Hf6eGhDpsahLqPgHldaI5JwcwQx5uw/viewform",
  "Cardiology": "https://docs.google.com/forms/d/e/1FAIpQLSc-0YNL2k6Y1WkMZWCPb6d4o-RS32zIJI9E0QvOKZw9cSUQQQ/viewform",
  "Pediatrics": "https://docs.google.com/forms/d/e/1FAIpQLScJuwXnWCZrIMld5EPpotWTzsDfKH5yOtPhcZZfOdldJqT6gA/viewform",
  "Oncology": "https://docs.google.com/forms/d/e/1FAIpQLSd8ZG_y6LbAkVOJikfqGbVqcK92aNxl6PX2d5mt6NxhB8stoA/viewform"
};

// Function to redirect user to the appropriate form
export function redirectToForm(department) {
  if (!department) {
    console.error('❌ No department specified');
    return false;
  }
  
  const formUrl = DEPARTMENT_FORM_URLS[department];
  
  if (!formUrl) {
    console.error('❌ No form found for department: ' + department);
    console.warn('Available departments: ' + Object.keys(DEPARTMENT_FORM_URLS).join(', '));
    return false;
  }
  
  console.log('📍 Redirecting to ' + department + ' form');
  console.log('Form URL: ' + formUrl);
  
  // Redirect to the form
  window.location.href = formUrl;
  return true;
}

// Function to check if all forms are configured
export function validateConfiguration() {
  const requiredDepts = ["Emergency", "ICU", "Cardiology", "Pediatrics", "Oncology"];
  const missingForms = [];
  
  for (let dept of requiredDepts) {
    const url = DEPARTMENT_FORM_URLS[dept];
    
    if (!url || url.includes('YOUR_')) {
      missingForms.push(dept);
    }
  }
  
  if (missingForms.length > 0) {
    console.warn('⚠️ Missing form URLs for: ' + missingForms.join(', '));
    return false;
  }
  
  console.log('✅ All form URLs configured correctly');
  return true;
}

// ==========================================
// STEP-BY-STEP SETUP GUIDE
// ==========================================
//
// STEP 1: Create Google Forms
// ============================
// 1. Go to forms.google.com
// 2. Create new form for Emergency
// 3. Add questions specific to Emergency
// 4. Click "Send" → Copy link → Paste as value for "Emergency"
// 5. Repeat for ICU, Cardiology, Pediatrics, Oncology
//
// STEP 2: Update This File
// =========================
// Replace each placeholder with the actual form URLs
// Example format:
// "Emergency": "https://docs.google.com/forms/d/1A2B3C4D5E6F7G8H/viewform"
//
// STEP 3: Update Apps Scripts
// ==============================
// For each form:
// 1. Open form
// 2. Click "More" (⋮) → "Script editor"
// 3. Paste the corresponding FORM_SCRIPTS_[DEPT].gs code
// 4. Change BACKEND_URL if needed  
// 5. Deploy
//
// STEP 4: Update Dashboard
// =========================
// Import this file and call redirectToForm() when user clicks
// "Open Feedback Form" button
//
// ==========================================

// QUICK REFERENCE TABLE
// =====================
//
// Department  | Script File                | Form Status
// ------------|---------------------------|-------------
// Emergency   | FORM_SCRIPTS_EMERGENCY.gs | [ ] Deployed
// ICU         | FORM_SCRIPTS_ICU.gs       | [ ] Deployed
// Cardiology  | FORM_SCRIPTS_CARDIOLOGY.gs | [ ] Deployed
// Pediatrics  | FORM_SCRIPTS_PEDIATRICS.gs | [ ] Deployed
// Oncology    | FORM_SCRIPTS_ONCOLOGY.gs  | [ ] Deployed
//
// Check boxes as you complete each form!
//
// ==========================================

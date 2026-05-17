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
  "Emergency": {
    "english": "https://docs.google.com/forms/d/e/1FAIpQLSePB5SMiD2Ar7auhl46GTq6AfZpAf5CygFiaNOwZFif241F4w/viewform",
    "hindi": "https://docs.google.com/forms/d/e/1FAIpQLScjI80Gl-rYAsxTHB8N8GMGAiz0_CjN0EvA6V5MZ8g1uGhV2g/viewform",
    "marathi": "https://docs.google.com/forms/d/e/1FAIpQLSfkNlSm4b33-Uor3bgazCmJnnRm774YznnhCdN9zjQ81LLHWQ/viewform"
  },
  "ICU": {
    "english": "https://docs.google.com/forms/d/e/1FAIpQLSfljGTuTRKgVPbRsye_Hf6eGhDpsahLqPgHldaI5JwcwQx5uw/viewform",
    "hindi": "https://docs.google.com/forms/d/e/1FAIpQLSfb4Ql4VBVx-YRpOyg_yRypzBDkUiPbbsGnd507aJY0uIPesA/viewform",
    "marathi": "https://docs.google.com/forms/d/e/1FAIpQLSeC3EAfc7CLtQLToJQEywhZVcFQakp_U0PL2MSmntUUKLOQHg/viewform"
  },
  "Cardiology": {
    "english": "https://docs.google.com/forms/d/e/1FAIpQLSc-0YNL2k6Y1WkMZWCPb6d4o-RS32zIJI9E0QvOKZw9cSUQQQ/viewform",
    "hindi": "https://docs.google.com/forms/d/e/1FAIpQLSd5t0OMSwGy14wQVBwTSjMPzLVAPtnqOpozh6_SCShnGsH54g/viewform",
    "marathi": "https://docs.google.com/forms/d/e/1FAIpQLSd1VuuV04Hjv7_o-79j3MFIYnpz1rfS7-Q1AXEinf1_OcHKpA/viewform"
  },
  "Pediatrics": {
    "english": "https://docs.google.com/forms/d/e/1FAIpQLScJuwXnWCZrIMld5EPpotWTzsDfKH5yOtPhcZZfOdldJqT6gA/viewform",
    "hindi": "https://docs.google.com/forms/d/e/1FAIpQLSfuQgg3ypqJP2d4z3ceUMINnVH--eAVTt9GdWXQvftWfQlbvg/viewform",
    "marathi": "https://docs.google.com/forms/d/e/1FAIpQLSf-0nzh0BlQutrpms3Hi-_Z105FNPACo1CxfaHyiGqEwLbpkA/viewform"
  },
  "Oncology": {
    "english": "https://docs.google.com/forms/d/e/1FAIpQLSd8ZG_y6LbAkVOJikfqGbVqcK92aNxl6PX2d5mt6NxhB8stoA/viewform",
    "hindi": "https://docs.google.com/forms/d/e/1FAIpQLScVC8LlibfFKZUMtJF7ggSzTOnrJX-6H8iyCDBB7salAIufFQ/viewform",
    "marathi": "https://docs.google.com/forms/d/e/1FAIpQLSdC_i96_fRqnd0q07AxZaotW2eTHvbsyEJ9xP79j5tOYOtOHA/viewform"
  }
};

const REQUIRED_DEPTS = ["Emergency", "ICU", "Cardiology", "Pediatrics", "Oncology"];
const REQUIRED_LANGS = ["english", "hindi", "marathi"];

function isPlaceholder(value) {
  if (!value) {
    return true;
  }
  return value.includes('REPLACE_') || value.includes('YOUR_');
}

export function getFormUrl(department, language = 'english') {
  if (!department) {
    return '';
  }

  const deptConfig = DEPARTMENT_FORM_URLS[department];
  if (!deptConfig) {
    return '';
  }

  return deptConfig[language] || '';
}

// Function to redirect user to the appropriate form
export function redirectToForm(department, language = 'english') {
  if (!department) {
    console.error('❌ No department specified');
    return false;
  }
  
  const formUrl = getFormUrl(department, language);
  
  if (!formUrl) {
    console.error('❌ No form found for department/language: ' + department + ' / ' + language);
    console.warn('Available departments: ' + Object.keys(DEPARTMENT_FORM_URLS).join(', '));
    return false;
  }
  
  console.log('📍 Redirecting to ' + department + ' form (' + language + ')');
  console.log('Form URL: ' + formUrl);
  
  // Redirect to the form
  window.location.href = formUrl;
  return true;
}

// Function to check if all forms are configured
export function validateConfiguration() {
  const missingForms = [];
  
  for (let dept of REQUIRED_DEPTS) {
    const deptConfig = DEPARTMENT_FORM_URLS[dept];
    if (!deptConfig) {
      missingForms.push(dept + ' (all languages)');
      continue;
    }

    for (let lang of REQUIRED_LANGS) {
      const url = deptConfig[lang];
      if (isPlaceholder(url)) {
        missingForms.push(dept + ' / ' + lang);
      }
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

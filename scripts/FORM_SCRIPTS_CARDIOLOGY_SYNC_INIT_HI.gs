// ===========================================
// FORM_SCRIPTS_CARDIOLOGY_SYNC_INIT_HI.gs
// Deploy this to the Cardiology - Hindi Form
// Syncs questions from backend to Google Form
// ===========================================

const BACKEND_URL = "https://idealist-riches-curled.ngrok-free.dev"; // Or your deployment URL
const DEPARTMENT_NAME = "Cardiology";
const LANGUAGE_CODE = "hindi"; // english | hindi | marathi

const NAME_QUESTION_KEYS = {
  english: ["Patient Name"],
  hindi: ["मरीज़ का नाम", "रोगी का नाम", "मरीज का नाम"],
  marathi: ["रुग्णाचे नाव", "रुग्णाचे नाव"]
};

const FIXED_QUESTION_TRANSLATIONS = {
  "How would you rate your overall experience?": {
    hindi: "आप अपने समग्र अनुभव को कैसे रेट करेंगे?",
    marathi: "तुम्ही तुमचा एकूण अनुभव कसा रेट कराल?"
  },
  "How satisfied are you with care?": {
    hindi: "आप देखभाल से कितने संतुष्ट हैं?",
    marathi: "तुम्ही देखभालीबद्दल किती समाधानी आहात?"
  },
  "How would you rate cleanliness?": {
    hindi: "आप सफाई को कैसे रेट करेंगे?",
    marathi: "स्वच्छतेला तुम्ही कसा रेट कराल?"
  },
  "Additional comments?": {
    hindi: "अतिरिक्त टिप्पणियाँ?",
    marathi: "अतिरिक्त टिप्पण्या?"
  }
};

const FIXED_QUESTION_DEFINITIONS = {
  "How would you rate your overall experience?": {
    question_type: "rating",
    required: true
  },
  "How satisfied are you with care?": {
    question_type: "rating",
    required: true
  },
  "How would you rate cleanliness?": {
    question_type: "rating",
    required: true
  },
  "Additional comments?": {
    question_type: "paragraph",
    required: false
  }
};

function onInstall() {
  setupTrigger();
}

function setupTrigger() {
  try {
    const form = FormApp.getActiveForm();
    const triggers = ScriptApp.getProjectTriggers();

    let submitTriggerExists = false;
    let openTriggerExists = false;
    for (let trigger of triggers) {
      if (
        trigger.getEventType() === ScriptApp.EventType.ON_FORM_SUBMIT &&
        trigger.getHandlerFunction() === "onFormSubmit"
      ) {
        submitTriggerExists = true;
      }
      if (
        trigger.getEventType() === ScriptApp.EventType.ON_OPEN &&
        trigger.getHandlerFunction() === "onOpenInstallable"
      ) {
        openTriggerExists = true;
      }
    }

    if (!submitTriggerExists) {
      ScriptApp.newTrigger("onFormSubmit").forForm(form).onFormSubmit().create();
      Logger.log("✅ onFormSubmit trigger created successfully");
    } else {
      Logger.log("✓ onFormSubmit trigger already exists");
    }

    if (!openTriggerExists) {
      ScriptApp.newTrigger("onOpenInstallable").forForm(form).onOpen().create();
      Logger.log("✅ onOpenInstallable trigger created successfully");
    } else {
      Logger.log("✓ onOpenInstallable trigger already exists");
    }
  } catch (error) {
    Logger.log(`❌ Error setting up trigger: ${error}`);
  }
}

function onOpen() {
  FormApp.getUi()
    .createMenu("Sync Questions")
    .addItem("Sync from Backend (Manual)", "syncQuestionsFromBackend")
    .addToUi();
}

function onOpenInstallable() {
  Logger.log("📋 Form opened - syncing questions from backend (installable trigger)...");
  syncQuestionsFromBackend();
}

function onFormSubmit(e) {
  Logger.log("📝 Form submitted - capturing response and syncing questions...");

  try {
    captureFormResponse(e);
    syncQuestionsFromBackend();
  } catch (error) {
    Logger.log(`❌ Error on form submit: ${error}`);
  }
}

function captureFormResponse(e) {
  try {
    const itemResponses = e.response.getItemResponses();

    Logger.log(`📨 Captured ${itemResponses.length} responses`);

    const allResponses = {};
    for (let itemResponse of itemResponses) {
      const question = itemResponse.getItem().getTitle();
      const response = itemResponse.getResponse();
      allResponses[question] = response;
    }

    const patientName = pickResponse(allResponses, NAME_QUESTION_KEYS.hindi) || "Anonymous";
    const feedbackText = firstNonNameResponse(allResponses);

    const feedbackData = {
      patient_name: patientName,
      department: DEPARTMENT_NAME,
      feedback_text: feedbackText,
      language: LANGUAGE_CODE,
      all_responses: allResponses
    };

    Logger.log(`📦 Sending to backend: ${JSON.stringify(feedbackData)}`);

    sendToBackend(feedbackData);
    Logger.log("✅ Response saved to database");
  } catch (error) {
    Logger.log(`❌ Error capturing response: ${error}`);
  }
}

function sendToBackend(feedbackData) {
  try {
    const url = `${BACKEND_URL}/api/feedback`;
    Logger.log(`📤 Sending to: ${url}`);
    Logger.log(`📦 Data: ${JSON.stringify(feedbackData)}`);

    const payload = JSON.stringify(feedbackData);

    const options = {
      method: "post",
      contentType: "application/json",
      payload: payload,
      muteHttpExceptions: true,
      timeout: 15000,
      headers: {
        "ngrok-skip-browser-warning": "true",
        "User-Agent": "Google-Apps-Script",
        "Content-Type": "application/json"
      },
      validateHttpsCertificates: false
    };

    const response = UrlFetchApp.fetch(url, options);
    const responseCode = response.getResponseCode();
    const responseBody = response.getContentText();

    Logger.log(`📥 Response code: ${responseCode}`);
    Logger.log(`📄 Response: ${responseBody.substring(0, 500)}`);

    if (responseCode === 200 || responseCode === 201) {
      Logger.log("✅ Successfully saved to backend");
      return true;
    }

    Logger.log(`⚠️ Backend returned ${responseCode}: ${responseBody}`);
    return false;
  } catch (error) {
    Logger.log(`❌ Error sending to backend: ${error.toString()}`);
    Logger.log(`💾 Stack trace: ${error.stack}`);
    return false;
  }
}

function syncQuestionsFromBackend() {
  try {
    Logger.log("🔄 Starting sync from backend...");

    const form = FormApp.getActiveForm();
    ensureNameQuestionLanguage(form);
    ensureFixedQuestions(form);
    const questions = getQuestionsFromBackend();

    if (!questions || questions.length === 0) {
      Logger.log("❌ No questions received from backend");
      return;
    }

    Logger.log(`📥 Received ${questions.length} questions from backend`);

    let addedCount = 0;
    for (let question of questions) {
      const questionText = getQuestionText(question, LANGUAGE_CODE);
      const englishText = question.question_text || "";

      if (
        LANGUAGE_CODE !== "english" &&
        englishText &&
        questionText &&
        englishText !== questionText
      ) {
        if (questionExists(form, questionText)) {
          if (removeQuestionByTitle(form, englishText)) {
            Logger.log(`  🧹 Removed English duplicate: ${englishText}`);
            continue;
          }
        }

        if (renameQuestionIfEnglish(form, englishText, questionText)) {
          Logger.log(`  ✏️ Renamed: ${englishText} -> ${questionText}`);
          continue;
        }
      }

      if (!questionExists(form, questionText)) {
        addQuestionToForm(form, question, questionText);
        addedCount++;
        Logger.log(`  ✓ Added: ${questionText}`);
      } else {
        Logger.log(`  - Already exists: ${questionText}`);
      }
    }

    const expectedTitles = buildExpectedQuestionTitles(questions);
    removeObsoleteQuestions(form, expectedTitles);

    Logger.log(`✅ Sync complete! Added ${addedCount} new questions`);
  } catch (error) {
    Logger.log(`❌ Error during sync: ${error}`);
  }
}

function ensureNameQuestionLanguage(form) {
  const targetTitle = NAME_QUESTION_KEYS.hindi[0];
  const englishKeys = NAME_QUESTION_KEYS.english || [];
  const hindiKeys = NAME_QUESTION_KEYS.hindi || [];

  const items = form.getItems();
  for (let item of items) {
    if (!item.getTitle) {
      continue;
    }

    const title = item.getTitle();

    if (hindiKeys.indexOf(title) >= 0) {
      return;
    }

    if (englishKeys.indexOf(title) >= 0) {
      item.setTitle(targetTitle);
      Logger.log(`✏️ Renamed patient name field to Hindi: ${targetTitle}`);
      return;
    }
  }
}

function ensureFixedQuestions(form) {
  const fixedKeys = Object.keys(FIXED_QUESTION_DEFINITIONS);
  for (let key of fixedKeys) {
    const localized =
      (FIXED_QUESTION_TRANSLATIONS[key] || {})[LANGUAGE_CODE] || key;

    if (LANGUAGE_CODE !== "english") {
      if (questionExists(form, localized)) {
        if (removeQuestionByTitle(form, key)) {
          Logger.log(`  🧹 Removed English fixed duplicate: ${key}`);
        }
        continue;
      }

      if (renameQuestionIfEnglish(form, key, localized)) {
        Logger.log(`  ✏️ Renamed fixed question: ${key} -> ${localized}`);
        continue;
      }
    }

    if (!questionExists(form, localized)) {
      const definition = FIXED_QUESTION_DEFINITIONS[key];
      addQuestionToForm(form, definition, localized);
      Logger.log(`  ✓ Added fixed question: ${localized}`);
    }
  }
}

function buildExpectedQuestionTitles(questions) {
  const titles = new Set();

  const allNameKeys = []
    .concat(NAME_QUESTION_KEYS.english || [])
    .concat(NAME_QUESTION_KEYS.hindi || [])
    .concat(NAME_QUESTION_KEYS.marathi || []);
  for (let key of allNameKeys) {
    titles.add(key);
  }

  const fixedKeys = Object.keys(FIXED_QUESTION_DEFINITIONS);
  for (let key of fixedKeys) {
    const localized =
      (FIXED_QUESTION_TRANSLATIONS[key] || {})[LANGUAGE_CODE] || key;
    titles.add(localized);
  }

  for (let question of questions || []) {
    const questionText = getQuestionText(question, LANGUAGE_CODE);
    if (questionText) {
      titles.add(questionText);
    }
  }

  return titles;
}

function removeObsoleteQuestions(form, expectedTitles) {
  if (!form || !expectedTitles) {
    return;
  }

  const items = form.getItems();
  let removedCount = 0;
  for (let item of items) {
    if (!item.getTitle) {
      continue;
    }

    const title = item.getTitle();
    if (!title || expectedTitles.has(title)) {
      continue;
    }

    form.deleteItem(item);
    removedCount += 1;
  }

  if (removedCount > 0) {
    Logger.log(`🧹 Removed ${removedCount} obsolete questions`);
  }
}

function getQuestionsFromBackend() {
  try {
    const url = `${BACKEND_URL}/api/departments/${DEPARTMENT_NAME}/questions`;
    Logger.log(`📍 Fetching from: ${url}`);

    const options = {
      method: "get",
      muteHttpExceptions: true,
      timeout: 10000,
      headers: {
        Accept: "application/json",
        "ngrok-skip-browser-warning": "true",
        "User-Agent": "Google-Apps-Script"
      }
    };

    const response = UrlFetchApp.fetch(url, options);
    const responseCode = response.getResponseCode();
    const responseText = response.getContentText();

    Logger.log(`📊 Response code: ${responseCode}`);
    Logger.log(`📦 Response length: ${responseText.length} chars`);

    if (responseCode !== 200) {
      Logger.log(`❌ Backend returned status ${responseCode}`);
      Logger.log(`📝 Response: ${responseText.substring(0, 200)}`);
      return null;
    }

    if (!responseText.trim().startsWith("{")) {
      Logger.log(`❌ Response is not JSON. First 100 chars: ${responseText.substring(0, 100)}`);
      return null;
    }

    const data = JSON.parse(responseText);
    Logger.log("✅ Parsed JSON successfully");
    return data.questions || [];
  } catch (error) {
    Logger.log(`❌ Error: ${error.toString()}`);
    Logger.log(`❌ Stack: ${error.stack}`);
    return null;
  }
}

function getQuestionText(questionData, language) {
  if (!questionData) {
    return "";
  }

  const fixedText = getFixedQuestionText(questionData, language);
  if (fixedText) {
    return fixedText;
  }

  if (language === "english") {
    return questionData.question_text || "";
  }

  if (questionData.translations && questionData.translations[language]) {
    return questionData.translations[language];
  }

  return questionData.question_text || "";
}

function getFixedQuestionText(questionData, language) {
  if (!questionData || language === "english") {
    return "";
  }

  const englishText = questionData.question_text || "";
  const normalized = normalizeQuestionKey(englishText);
  const fixedKeys = Object.keys(FIXED_QUESTION_TRANSLATIONS);
  for (let key of fixedKeys) {
    const fixedKeyNormalized = normalizeQuestionKey(key);
    if (
      normalized === fixedKeyNormalized ||
      normalized.indexOf(fixedKeyNormalized) >= 0 ||
      fixedKeyNormalized.indexOf(normalized) >= 0
    ) {
      const fixed = FIXED_QUESTION_TRANSLATIONS[key];
      if (fixed && fixed[language]) {
        return fixed[language];
      }
    }
  }

  return "";
}

function normalizeQuestionKey(text) {
  if (!text) {
    return "";
  }

  return text
    .toLowerCase()
    .replace(/["']/g, "")
    .replace(/\s*\(.*\)\s*$/, "")
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function renameQuestionIfEnglish(form, englishText, localizedText) {
  if (!englishText || !localizedText || englishText === localizedText) {
    return false;
  }

  if (questionExists(form, localizedText)) {
    return false;
  }

  const items = form.getItems();
  for (let item of items) {
    if (item.getTitle && item.getTitle() === englishText) {
      item.setTitle(localizedText);
      return true;
    }
  }

  return false;
}

function removeQuestionByTitle(form, title) {
  if (!title) {
    return false;
  }

  const items = form.getItems();
  for (let item of items) {
    if (item.getTitle && item.getTitle() === title) {
      form.deleteItem(item);
      return true;
    }
  }

  return false;
}

function questionExists(form, questionText) {
  const items = form.getItems();
  for (let item of items) {
    if (item.getTitle && item.getTitle() === questionText) {
      return true;
    }
  }
  return false;
}

function addQuestionToForm(form, questionData, questionText) {
  const type = questionData.question_type;
  const required = questionData.required || false;
  const options = questionData.options || [];

  let item = null;

  if (type === "short_answer") {
    item = form.addTextItem();
  } else if (type === "paragraph") {
    item = form.addParagraphTextItem();
  } else if (type === "multiple_choice") {
    item = form.addMultipleChoiceItem();
    if (options.length > 0) {
      item.setChoiceValues(options);
    }
  } else if (type === "rating") {
    item = form.addScaleItem();
    item.setBounds(1, 5);
  } else {
    item = form.addTextItem();
  }

  if (item) {
    item.setTitle(questionText);
    item.setRequired(required);
  }
}

function pickResponse(allResponses, keys) {
  if (!allResponses || !keys) {
    return "";
  }

  for (let key of keys) {
    const value = allResponses[key];
    if (typeof value === "string" && value.trim().length > 0) {
      return value;
    }
  }
  return "";
}

function firstNonEmptyResponse(allResponses) {
  if (!allResponses) {
    return "";
  }

  const values = Object.values(allResponses);
  for (let value of values) {
    if (typeof value === "string" && value.trim().length > 0) {
      return value;
    }
  }
  return "";
}

function isNameQuestion(title) {
  const keys = []
    .concat(NAME_QUESTION_KEYS.english || [])
    .concat(NAME_QUESTION_KEYS.hindi || [])
    .concat(NAME_QUESTION_KEYS.marathi || []);
  return keys.indexOf(title) >= 0;
}

function firstNonNameResponse(allResponses) {
  if (!allResponses) {
    return "";
  }

  const entries = Object.entries(allResponses);
  for (let [question, value] of entries) {
    if (!isNameQuestion(question) && typeof value === "string" && value.trim().length > 0) {
      return value;
    }
  }

  return "";
}

function removeAllQuestions(form) {
  const items = form.getItems();
  for (let i = items.length - 1; i >= 0; i--) {
    form.deleteItem(items[i]);
  }
  Logger.log("🗑️ Removed all existing questions");
}

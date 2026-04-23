// Multi-language support
export const LANGUAGES = {
  ENGLISH: 'english',
  HINDI: 'hindi',
  MARATHI: 'marathi'
};

export const LANGUAGE_NAMES = {
  english: 'English',
  hindi: 'हिन्दी',
  marathi: 'मराठी'
};

export const TRANSLATIONS = {
  english: {
    'Select Language': 'Select Language',
    'Select Department': 'Select Department',
    'Scan to Give Feedback': 'Scan to Give Feedback',
    'Open Feedback Form': '📝 Open Feedback Form',
    'Point your phone camera': '📸 Point your phone camera at this QR code or tap the button below',
    'Questions for': 'Questions for',
    'Type': 'Type',
    'Optional': 'Optional',
    'Form URL not configured': 'Form URL not configured. Please set GOOGLE_FORM_URL in environment.',
    'Could not load departments': 'Could not load departments',
    'Could not load form': 'Could not load form',
    'Department not selected': 'Department not selected',
    'Loading departments': 'Loading departments...'
  },
  hindi: {
    'Select Language': 'भाषा चुनें',
    'Select Department': 'विभाग चुनें',
    'Scan to Give Feedback': 'प्रतिक्रिया देने के लिए स्कैन करें',
    'Open Feedback Form': '📝 प्रतिक्रिया फॉर्म खोलें',
    'Point your phone camera': '📸 इस QR कोड पर अपने फोन कैमरे को इंगित करें या नीचे दिए गए बटन को टैप करें',
    'Questions for': 'के लिए प्रश्न',
    'Type': 'प्रकार',
    'Optional': 'वैकल्पिक',
    'Form URL not configured': 'फॉर्म URL कॉन्फ़िगर नहीं किया गया है। कृपया पर्यावरण में GOOGLE_FORM_URL सेट करें।',
    'Could not load departments': 'विभाग लोड नहीं कर सके',
    'Could not load form': 'फॉर्म लोड नहीं कर सके',
    'Department not selected': 'विभाग नहीं चुना गया',
    'Loading departments': 'विभाग लोड हो रहे हैं...',
    'Add Question': 'प्रश्न जोड़ें',
    'Cancel': 'रद्द करें',
    'Save': 'बचाएं',
    'Delete': 'हटाएं',
    'Edit': 'संपादित करें',
    'Question Text': 'प्रश्न पाठ',
    'Question Type': 'प्रश्न का प्रकार',
    'Required': 'आवश्यक',
    'Add Option': 'विकल्प जोड़ें',
    'Questions added successfully': 'प्रश्न सफलतापूर्वक जोड़े गए',
    'Failed to add question': 'प्रश्न जोड़ने में विफल',
    'Failed to delete question': 'प्रश्न हटाने में विफल',
    'Loading questions': 'प्रश्न लोड हो रहे हैं...',
    'No questions yet': 'अभी तक कोई प्रश्न नहीं। शुरुआत करने के लिए कुछ जोड़ें!',
    'Add a new question': 'एक नया प्रश्न जोड़ें'
  },
  marathi: {
    'Select Language': 'भाषा निवडा',
    'Select Department': 'विभाग निवडा',
    'Scan to Give Feedback': 'प्रतिक्रिया देण्यासाठी स्कॅन करा',
    'Open Feedback Form': '📝 प्रतिक्रिया फॉर्म उघडा',
    'Point your phone camera': '📸 या QR कोडवर आपले फोन कॅमेरा निर्देश करा किंवा खालील बटण दाबा',
    'Questions for': 'साठी प्रश्न',
    'Type': 'प्रकार',
    'Required': 'आवश्यक',
    'Optional': 'वैकल्पिक',
    'Form URL not configured': 'फॉर्म URL कॉन्फिगर केलेले नाही. कृपया पर्यावरणामध्ये GOOGLE_FORM_URL सेट करा.',
    'Could not load departments': 'विभाग लोड करू शकले नाही',
    'Could not load form': 'फॉर्म लोड करू शकले नाही',
    'Department not selected': 'विभाग निवडलेला नाही',
    'Loading departments': 'विभाग लोड होत आहेत...',
    'Add Question': 'प्रश्न जोडा',
    'Cancel': 'रद्द करा',
    'Save': 'जतन करा',
    'Delete': 'हटवा',
    'Edit': 'संपादित करा',
    'Question Text': 'प्रश्न मजकूर',
    'Question Type': 'प्रश्नाचा प्रकार',
    'Add Option': 'पर्याय जोडा',
    'Questions added successfully': 'प्रश्न यशस्वीरित्या जोडले गेले',
    'Failed to add question': 'प्रश्न जोडणे अयशस्वी',
    'Failed to delete question': 'प्रश्न हटवणे अयशस्वी',
    'Loading questions': 'प्रश्न लोड होत आहेत...',
    'No questions yet': 'अद्याप कोणतेही प्रश्न नाही. सुरुवातीसाठी काही जोडा!',
    'Add a new question': 'नवीन प्रश्न जोडा'
  }
};

// Question translations for feedback forms
export const QUESTION_TRANSLATIONS = {
  "How would you rate your overall experience?": {
    english: "How would you rate your overall experience?",
    hindi: "आपके समग्र अनुभव को आप कैसे रेट करेंगे?",
    marathi: "आपला एकूण अनुभव कसा होता?"
  },
  "What did you appreciate most about our service?": {
    english: "What did you appreciate most about our service?",
    hindi: "आपको हमारी सेवा में सबसे ज्यादा क्या पसंद आया?",
    marathi: "आमच्या सेवेत तुम्हाला सर्वात जास्त काय आवडले?"
  },
  "What areas can we improve?": {
    english: "What areas can we improve?",
    hindi: "हम किन क्षेत्रों में सुधार कर सकते हैं?",
    marathi: "आम्ही कोणत्या क्षेत्रांमध्ये सुधारणा करू शकतो?"
  },
  "How would you rate the waiting time?": {
    english: "How would you rate the waiting time?",
    hindi: "प्रतीक्षा समय को आप कैसे रेट करेंगे?",
    marathi: "प्रतीक्षा वेळा तुम्ही कसा रेट करता?"
  },
  "How satisfied are you with the cleanliness?": {
    english: "How satisfied are you with the cleanliness?",
    hindi: "क्या आप सफाई से संतुष्ट हैं?",
    marathi: "तुम स्वच्छतेने संतुष्ट आहात का?"
  },
  "How would you rate the staff behavior?": {
    english: "How would you rate the staff behavior?",
    hindi: "कर्मचारियों के व्यवहार को आप कैसे रेट करेंगे?",
    marathi: "कर्मचाऱ्यांचे वर्तन तुम्ही कसा रेट करता?"
  },
  "Would you recommend us to others?": {
    english: "Would you recommend us to others?",
    hindi: "क्या आप हमें दूसरों को सुझाएंगे?",
    marathi: "तुम आम्हाला इतरांना शिफारस कराल का?"
  },
  "How is the quality of medical care?": {
    english: "How is the quality of medical care?",
    hindi: "चिकित्सा सेवा की गुणवत्ता कैसी है?",
    marathi: "वैद्यकीय सेवेची गुणवत्ता कशी आहे?"
  },
  "Add Translations": {
    english: "Add Translations",
    hindi: "अनुवाद जोड़ें",
    marathi: "भाषांतर जोडा"
  },
  "Question in Hindi": {
    english: "Question in Hindi",
    hindi: "हिंदी में प्रश्न",
    marathi: "हिंदीतील प्रश्न"
  },
  "Question in Marathi": {
    english: "Question in Marathi",
    hindi: "मराठी में प्रश्न",
    marathi: "मराठीतील प्रश्न"
  }
};

export const t = (key, language = 'english') => {
  if (TRANSLATIONS[language] && TRANSLATIONS[language][key]) {
    return TRANSLATIONS[language][key];
  }
  return key; // Fallback to key
};

export const getLanguageFromUrl = () => {
  const params = new URLSearchParams(window.location.search);
  return params.get('language') || LANGUAGES.ENGLISH;
};

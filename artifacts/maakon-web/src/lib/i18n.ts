import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

const resources = {
  ar: {
    translation: {
      app_name: "معكن",
      home_subtitle: "تطبيق الاستجابة للأزمات في لبنان",
      home_tagline: "<strong>ابحث</strong> عن مساعدة. <strong>قدّم</strong> مساعدة. <span class=\"block mt-1 sm:mt-2 pb-2 text-3xl sm:text-4xl lg:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-emerald-200\">ادعم لبنان.</span>",
      i_need_help: "أحتاج مساعدة",
      i_want_to_help: "أريد المساعدة",
      view_map: "عرض الخريطة",
      
      // Navigation
      back: "رجوع",
      
      // Map & Filters
      filters: "تصفية",
      map_legend: "مفتاح الخريطة",
      needs: "احتياجات",
      need: "حاجة",
      offers: "عروض",
      offer: "عرض",
      ngos: "منظمات غير حكومية",
      active_only: "النشطة فقط",
      verified_ngo_only: "منظمات موثقة فقط",
      apply_filters: "تطبيق",
      clear_filters: "مسح الكل",
      post_type: "نوع المنشور",
      category: "الفئة",
      governorate: "المحافظة",
      urgency: "مستوى الأهمية",
      all_categories: "جميع الفئات",
      all_governorates: "جميع المحافظات",
      all_districts: "جميع الأقضية",
      loading: "جاري التحميل...",
      results_count: "{{count}} نتيجة",
      
      // Empty / error states
      no_results: "لا توجد نتائج",
      no_results_hint: "جرّب تغيير الفلاتر أو توسيع نطاق البحث",
      no_description: "لا يوجد وصف",

      // Card details
      view_details: "عرض التفاصيل",
      last_updated: "آخر تحديث",
      verified: "موثق",
      verified_ngo: "منظمة موثقة",
      report_post: "الإبلاغ عن المنشور",
      contact_info: "معلومات التواصل",
      contact_method: "وسيلة التواصل",
      website: "الموقع الإلكتروني",
      open_website: "فتح الموقع",
      
      // Post status
      status: "الحالة",
      status_active: "نشط",
      status_pending: "قيد المراجعة",
      status_expired: "منتهي",
      expires: "تنتهي",

      // Provider type
      provider_type: "نوع المزود",
      
      // Form: Post Need
      post_need_title: "طلب مساعدة",
      step_1_need: "ماذا تحتاج؟",
      step_2_desc: "وصف الحالة",
      step_3_loc: "الموقع والتواصل",
      title_label: "عنوان موجز",
      desc_label: "تفاصيل",
      district: "القضاء",
      exact_address: "العنوان الدقيق (اختياري)",
      exact_address_private: "خاص — لن يتم عرضه للعامة لحمايتك",
      submit: "إرسال",
      next: "التالي",
      prev: "السابق",
      select_placeholder: "اختر...",
      title_placeholder_need: "مثال: نحتاج حليب أطفال",
      desc_placeholder_need: "صف ما تحتاجه بالتفصيل، والكميات...",
      address_placeholder: "الشارع، المبنى، الطابق...",
      phone_placeholder: "+961...",

      // Form: Post Offer
      post_offer_title: "تقديم مساعدة",
      step_1_offer: "ماذا تقدم؟",
      individual: "فرد",
      organization: "مؤسسة",
      business: "شركة",
      title_placeholder_offer: "مثال: تقديم خدمة نقل مجانية",
      desc_placeholder_offer: "صف عرضك بالتفصيل...",
      
      // Success
      success_title: "تم النشر بنجاح",
      success_desc: "تم حفظ طلبك وسيظهر على الخريطة قريباً.",
      return_home: "العودة للرئيسية",
      
      // Validation
      required: "هذا الحقل مطلوب",
      min_length: "يجب أن يكون {{min}} أحرف على الأقل",

      // Urgencies
      critical: "حرج جداً",
      high: "عالي",
      medium: "متوسط",
      low: "منخفض",

      // Expiry presets
      expiry_label: "صلاحية المنشور",
      expiry_1d: "يوم",
      expiry_3d: "٣ أيام",
      expiry_1w: "أسبوع",
      expiry_1m: "شهر",
      expiry_default: "شهر",

      // Submit error
      submit_error: "فشل الإرسال. تحقق من الاتصال وحاول مرة أخرى.",

      // Map FAB
      create_need: "طلب مساعدة",
      create_offer: "تقديم مساعدة",

      // Actions
      close: "إغلاق",
      cancel: "إلغاء",

      // Report flow
      report_reason: "سبب البلاغ",
      report_details_label: "تفاصيل إضافية (اختياري)",
      report_details_placeholder: "أي معلومات إضافية...",
      submit_report: "إرسال البلاغ",
      report_thanks: "شكراً على البلاغ. سنراجعه في أقرب وقت.",
      report_error: "فشل إرسال البلاغ. حاول مرة أخرى.",
      reason_fake: "معلومات كاذبة",
      reason_scam: "احتيال",
      reason_unsafe: "محتوى غير آمن",
      reason_outdated: "منتهي الصلاحية",
      reason_spam: "محتوى مزعج",
      reason_other: "أخرى",

      // Categories
      food: "غذاء",
      transportation: "نقل",
      psychological: "دعم نفسي",
      water: "مياه",
      shelter: "مأوى",
      medical: "طبي",
      clothing: "ملابس",
      education: "تعليم",
      psychosocial: "دعم نفسي",
      legal: "قانوني",
      financial: "مالي",
      logistics: "لوجستي",
      other: "أخرى",

      // Auth UI
      sign_in: "تسجيل الدخول",
      logout: "تسجيل الخروج",
      sign_in_required: "تسجيل الدخول مطلوب",
      sign_in_continue: "تسجيل الدخول للمتابعة",
      
      auth_title_phone: "تسجيل الدخول أو إنشاء حساب",
      auth_title_account: "نوع الحساب",
      auth_title_otp: "رمز التحقق",
      auth_title_profile: "إكمال الملف الشخصي",
      auth_title_ngo: "طلب توثيق جمعية",

      auth_phone_subtitle: "أدخل رقم هاتفك لتلقي رمز التحقق. لا حاجة لكلمة مرور.",
      phone_number: "رقم الهاتف",
      sending: "جاري الإرسال...",
      send_code: "إرسال الرمز",
      invalid_phone: "رقم غير صحيح، تجنب المسافات واستخدم رمز الدولة (مثال: +96170123456)",
      failed_send_code: "فشل إرسال الرمز",

      otp_subtitle: "أرسلنا رمزاً من ٦ أرقام إلى ",
      resend_code_in_s: "إعادة إرسال الرمز خلال {{s}}ث",
      resend_code: "إعادة إرسال الرمز",
      login_success: "تم تسجيل الدخول بنجاح!",
      invalid_code: "الرمز غير صحيح",
      code_resent: "تم إعادة إرسال الرمز",
      failed_resend: "فشل إعادة الإرسال",
      
      account_individual: "حساب فردي",
      account_ngo: "مؤسسة / جمعية",
      indiv_desc: "للمواطنين والمتطوعين لطلب أو تقديم المساعدة",
      ngo_desc: "للمنظمات والجمعيات الموثقة للعمل على الأرض",
      
      profile_name_label: "الاسم الكامل أو اسم العرض",
      profile_name_placeholder: "مثال: علي خازم",
      profile_subtitle: "خطوة أخيرة! ماذا نناديك؟",
      complete_profile: "إكمال التسجيل",
      saving: "جاري الحفظ...",

      ngo_profile_subtitle: "أدخل تفاصيل المؤسسة. نقوم بمراجعة الحسابات يدوياً لضمان الموثوقية.",
      ngo_profile_name: "اسم المؤسسة / الجمعية *",
      ngo_gov: "المحافظة الأساسية *",
      ngo_desc_label: "وصف موجز",
      ngo_desc_placeholder: "ما هي نشاطات المؤسسة؟",
      ngo_phone: "رقم هاتف عام للتواصل",
      ngo_website: "موقع إلكتروني / صفحة تواصل",
      submitting: "جاري الإرسال...",
      submit_verify: "إرسال للتوثيق",
      req_submitted: "تم إرسال طلب التوثيق!",
      req_failed: "فشل إرسال الطلب",
      
      // Post Flow Specifics
      indiv_need_desc: "أنا شخص بحاجة للمساعدة",
      ngo_need_desc: "نحن منظمة بحاجة لمتطوعين",
      who_requesting_help: "من يطلب المساعدة؟",
      who_requesting_help_desc: "حدد ما إذا كنت منظمة تبحث عن متطوعين أو فرداً يحتاج إلى مساعدة.",
      who_offering_help: "من يقدم المساعدة؟",
      who_offering_help_desc: "حدد ما إذا كنت فرداً أو منظمة تقدم المساعدة.",
      indiv_offer_desc: "أريد تقديم مساعدة بصفة شخصية",
      ngo_offer_desc: "نحن منظمة أو مؤسسة نقدم المساعدة",
      what_do_you_need_help_with: "ما الذي تحتاج المساعدة فيه؟",
      ngo_details_title: "تفاصيل العمل التطوعي",
      ngo_details_desc: "أخبرنا بنوع المتطوعين الذين تحتاجهم المنظمة.",
      ngo_initiative_name: "اسم المؤسسة / المبادرة",
      ngo_initiative_ph: "مثال: الصليب الأحمر الميداني...",
      volunteers_needed: "المتطوعون المطلوبون",
      volunteers_ph: "مثال: ٥ أشخاص للمساعدة في تعبئة حصص غذائية",
      short_description_activity: "وصف موجز للنشاط",
      activity_desc_ph: "ماذا سيفعل المتطوعون؟ صف باختصار المهام والجدول الزمني.",
      optional_notes: "ملاحظات إضافية (اختياري)",
      optional_notes_ph: "أي متطلبات خاصة (مثال: خبرة طبية، امتلاك سيارة)؟",
      where_located_contact: "أين تتواجد وكيف يمكن للناس التواصل معك؟",
      exact_org_address: "العنوان الدقيق / نقطة التجمع للمنظمة",
      ngo_exact_map_desc: "مواقع الجمعيات يمكن أن تظهر بشكل علني ودقيق على الخريطة للمتطوعين.",
      contact_person_name: "اسم الشخص المسؤول عن التواصل",
      contact_person_ph: "مثال: سميرة",
      
      sign_in_required_need_desc: "يجب تسجيل الدخول لنشر طلب مساعدة جديد.",
      sign_in_required_offer_desc: "يجب تسجيل الدخول لنشر عرض مساعدة ومساندة مجتمعك.",
      invalid_lb_phone: "رقم لبناني غير صالح (مثال: 70 123 456)",
      invalid_phone_len: "يجب أن يتكون الرقم من 5 إلى 15 رقماً",
      invalid_email: "عنوان بريد إلكتروني غير صالح",
      
      exit_console: "الخروج من لوحة التحكم"
    }
  },
  en: {
    translation: {
      app_name: "Maakon",
      home_subtitle: "Lebanon Crisis Response App",
      home_tagline: "<strong>Find</strong> help. <strong>Offer</strong> help. <span class=\"block mt-1 sm:mt-2 pb-2 text-3xl sm:text-4xl lg:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-emerald-200\">Support Lebanon.</span>",
      i_need_help: "I Need Help",
      i_want_to_help: "I Want to Help",
      view_map: "View Map",
      
      back: "Back",
      
      filters: "Filters",
      map_legend: "Legend",
      needs: "Needs",
      need: "Need",
      offers: "Offers",
      offer: "Offer",
      ngos: "Verified NGOs",
      active_only: "Active Only",
      verified_ngo_only: "Verified NGOs Only",
      apply_filters: "Apply",
      clear_filters: "Clear All",
      post_type: "Post Type",
      category: "Category",
      governorate: "Governorate",
      urgency: "Urgency",
      all_categories: "All Categories",
      all_governorates: "All Governorates",
      all_districts: "All Districts",
      loading: "Loading...",
      results_count: "{{count}} results",

      no_results: "No results",
      no_results_hint: "Try adjusting your filters or broadening your search",
      no_description: "No description provided",
      
      view_details: "View Details",
      last_updated: "Last updated",
      verified: "Verified",
      verified_ngo: "Verified NGO",
      report_post: "Report this post",
      contact_info: "Contact Info",
      contact_method: "Contact Method",
      website: "Website",
      open_website: "Open Website",

      status: "Status",
      status_active: "Active",
      status_pending: "Pending Review",
      status_expired: "Expired",
      expires: "Expires",

      provider_type: "Provider Type",
      
      post_need_title: "Post a Need",
      step_1_need: "What do you need?",
      step_2_desc: "Describe your situation",
      step_3_loc: "Location & Contact",
      title_label: "Short Title",
      desc_label: "Details",
      district: "District",
      exact_address: "Exact Address (Optional)",
      exact_address_private: "Private — never shown publicly for your safety",
      submit: "Submit",
      next: "Next",
      prev: "Previous",
      select_placeholder: "Select...",
      title_placeholder_need: "e.g. Need baby formula",
      desc_placeholder_need: "Describe what you need, quantities, etc...",
      address_placeholder: "Street, building, floor...",
      phone_placeholder: "+961...",

      post_offer_title: "Post an Offer",
      step_1_offer: "What are you offering?",
      individual: "Individual",
      organization: "Organization",
      business: "Business",
      title_placeholder_offer: "e.g. Offering free transportation",
      desc_placeholder_offer: "Describe your offer in detail...",
      
      success_title: "Posted Successfully",
      success_desc: "Your post has been saved and will appear on the map soon.",
      return_home: "Return to Home",
      
      required: "This field is required",
      min_length: "Must be at least {{min}} characters",

      critical: "Critical",
      high: "High",
      medium: "Medium",
      low: "Low",

      // Expiry presets
      expiry_label: "Post expiry",
      expiry_1d: "1 Day",
      expiry_3d: "3 Days",
      expiry_1w: "1 Week",
      expiry_1m: "1 Month",
      expiry_default: "1 Month",

      // Submit error
      submit_error: "Submission failed. Check your connection and try again.",

      // Map FAB
      create_need: "Post Need",
      create_offer: "Post Offer",

      close: "Close",
      cancel: "Cancel",

      report_reason: "Reason for report",
      report_details_label: "Additional details (optional)",
      report_details_placeholder: "Any extra information...",
      submit_report: "Submit Report",
      report_thanks: "Thanks for your report. We will review it shortly.",
      report_error: "Failed to submit report. Please try again.",
      reason_fake: "Fake information",
      reason_scam: "Scam",
      reason_unsafe: "Unsafe content",
      reason_outdated: "Outdated / expired",
      reason_spam: "Spam",
      reason_other: "Other",

      food: "Food",
      transportation: "Transportation",
      psychological: "Psychological Support",
      water: "Water",
      shelter: "Shelter",
      medical: "Medical",
      clothing: "Clothing",
      education: "Education",
      psychosocial: "Psychosocial",
      legal: "Legal",
      financial: "Financial",
      logistics: "Logistics",
      other: "Other",

      // Auth UI
      sign_in: "Sign In",
      logout: "Logout",
      sign_in_required: "Sign In Required",
      sign_in_continue: "Sign In to Continue",

      auth_title_phone: "Sign in or Register",
      auth_title_account: "Account Type",
      auth_title_otp: "Verification Code",
      auth_title_profile: "Complete Profile",
      auth_title_ngo: "NGO Verification Request",

      auth_phone_subtitle: "Enter your phone number to receive a verification code. No password needed.",
      phone_number: "Phone Number",
      sending: "Sending...",
      send_code: "Send Code",
      invalid_phone: "Must be a valid phone number with country code (e.g. +96170123456)",
      failed_send_code: "Failed to send code",

      otp_subtitle: "We sent a 6-digit code to ",
      resend_code_in_s: "Resend code in {{s}}s",
      resend_code: "Resend code",
      login_success: "Login successful!",
      invalid_code: "Invalid code",
      code_resent: "Code resent",
      failed_resend: "Failed to resend",

      account_individual: "Individual",
      account_ngo: "NGO / Organization",
      indiv_desc: "For citizens and volunteers to request or offer help",
      ngo_desc: "For verified organizations to operate",

      profile_name_label: "Full Name or Display Name",
      profile_name_placeholder: "e.g. Ali Khazem",
      profile_subtitle: "Just one more step! What should we call you?",
      complete_profile: "Complete Registration",
      saving: "Saving...",
      
      ngo_profile_subtitle: "Submit your NGO details. We manually verify all organizations to maintain trust.",
      ngo_profile_name: "Organization Name *",
      ngo_gov: "Main Governorate *",
      ngo_desc_label: "Short Description",
      ngo_desc_placeholder: "What does your organization do?",
      ngo_phone: "Public Contact Phone",
      ngo_website: "Website / Social Media Link",
      submitting: "Submitting...",
      submit_verify: "Submit for Verification",
      req_submitted: "Verification request submitted!",
      req_failed: "Failed to submit request",

      // Post Flow Specifics
      indiv_need_desc: "I am a person needing help",
      ngo_need_desc: "We are an org needing volunteers",
      who_requesting_help: "Who is requesting help?",
      who_requesting_help_desc: "Select whether you are an organization seeking volunteers or an individual needing aid.",
      who_offering_help: "Who is offering help?",
      who_offering_help_desc: "Select whether you are an individual or an organization offering help.",
      indiv_offer_desc: "I want to offer help personally",
      ngo_offer_desc: "We are an organization offering help",
      what_do_you_need_help_with: "What do you need help with?",
      ngo_details_title: "Organization Details",
      ngo_details_desc: "Tell us what kind of volunteers your organization needs.",
      ngo_initiative_name: "NGO / Initiative Name",
      ngo_initiative_ph: "e.g. Lebanese Red Cross, Local Shelter Initiative...",
      volunteers_needed: "Volunteers Needed",
      volunteers_ph: "e.g. 5 people to help pack food boxes",
      short_description_activity: "Short Description of Activity",
      activity_desc_ph: "What will the volunteers be doing? Briefly describe the timeline and tasks.",
      optional_notes: "Optional Notes",
      optional_notes_ph: "Any specific requirements (e.g. medical background, vehicle required)?",
      where_located_contact: "Where are you located and how can people reach out?",
      exact_org_address: "Exact organization / meeting point address",
      ngo_exact_map_desc: "NGO locations can be publicly mapped exactly for volunteers.",
      contact_person_name: "Contact Person Name",
      contact_person_ph: "e.g. Samira",

      sign_in_required_need_desc: "You must be signed in to post a new request for help.",
      sign_in_required_offer_desc: "You must be signed in to post an offer and help your community.",
      invalid_lb_phone: "Invalid Lebanon number (e.g. 70 123 456)",
      invalid_phone_len: "Number must be 5-15 digits",
      invalid_email: "Invalid email address",

      exit_console: "Exit Console"
    }
  }
};

const LANG_KEY = 'maakon-lang';
const storedLang = localStorage.getItem(LANG_KEY);

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    lng: storedLang ?? 'ar',
    fallbackLng: 'ar',
    detection: {
      order: ['localStorage'],
      caches: ['localStorage'],
      lookupLocalStorage: LANG_KEY,
    },
    interpolation: {
      escapeValue: false
    }
  });

document.documentElement.dir = i18n.dir();
document.documentElement.lang = i18n.language;

i18n.on('languageChanged', (lng) => {
  document.documentElement.dir = i18n.dir(lng);
  document.documentElement.lang = lng;
  localStorage.setItem(LANG_KEY, lng);
});

export default i18n;

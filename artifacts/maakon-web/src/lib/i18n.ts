import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

const resources = {
  ar: {
    translation: {
      app_name: "معكن",
      home_subtitle: "تطبيق الاستجابة للأزمات في لبنان",
      home_tagline: "ابحث عن مساعدة. قدّم مساعدة. ادعم لبنان.",
      i_need_help: "أحتاج مساعدة",
      i_want_to_help: "أريد المساعدة",
      view_map: "عرض الخريطة",
      
      // Navigation
      back: "رجوع",
      
      // Map & Filters
      filters: "تصفية",
      map_legend: "مفتاح الخريطة",
      needs: "احتياجات",
      offers: "عروض",
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
    }
  },
  en: {
    translation: {
      app_name: "Maakon",
      home_subtitle: "Lebanon Crisis Response App",
      home_tagline: "Find help. Offer help. Support Lebanon.",
      i_need_help: "I Need Help",
      i_want_to_help: "I Want to Help",
      view_map: "View Map",
      
      back: "Back",
      
      filters: "Filters",
      map_legend: "Legend",
      needs: "Needs",
      offers: "Offers",
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

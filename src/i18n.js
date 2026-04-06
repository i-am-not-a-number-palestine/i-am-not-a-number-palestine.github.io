const translations = {
  en: {
    title: 'I Am Not a Number',
    subtitle: 'In memory of the <span id="count">72,000+</span> Palestinians killed in the Israeli genocide in Gaza.',
    toggle: 'عربي',
    footer: 'Each light represents a life. Hover to remember them.',
    age: 'Age',
    born: 'Born',
    loading: 'Loading 60,199 lives...',
    filterTitle: 'Filter by Age',
    filterShowing: 'Showing:',
    filterReset: 'Reset',
    searchTitle: 'Search by Name',
    searchPlaceholder: 'Enter a name / أدخل اسمًا',
    searchShowing: 'Showing:',
    searchReset: 'Reset',
    infoBody: `<p>This visual shows the names of 60,199 Palestinians killed by Israeli forces in Gaza from 7 Oct 2023 to 31 Jul 2025. This staggering figure includes only those whose names and ages could be identified by the Ministry of Health in Gaza up to that date. The number as of February 2026 has increased to 73,188+. Thousands of people remain unidentified because their bodies are damaged beyond recognition, they have no surviving family to identify them, or the Ministry of Health in Gaza has been unable to recover their bodies amid the ongoing genocide.</p>
<p>The names were translated by <a href='https://iraqbodycount.org/' target="_blank">Iraq Body Count</a>. We are grateful for their work, which they have released as a <a href='https://www.iraqbodycount.org/pal/moh_2025-07-31.xlsx'>public spreadsheet.</a></p>
<p>We will continue to update this visual as more information becomes available.</p>
<p>This visualization is inspired by <a href='https://visualizingpalestine.org/gaza-names/en.html' target='_blank'>Remember Their Names</a>.</p>
`,
  },
  ar: {
    title: 'أنا لست مجرّد رقم',
    subtitle: 'في ذكرى <span id="count">٧٢,٠٠٠+</span> فلسطينيًّا قُتلوا في غزّة في الإبادة الجماعية الإسرائيلية.',
    toggle: 'English',
    footer: 'كل ضوء يمثّل حياة. مرّر المؤشر لتتذكّرهم.',
    age: 'العمر',
    born: 'تاريخ الميلاد',
    loading: '...جارٍ تحميل ٦٠,١٩٩ حياة',
    filterTitle: 'تصفية حسب العمر',
    filterShowing: ':يُعرَض',
    filterReset: 'إعادة تعيين',
    searchTitle: 'البحث بالاسم',
    searchPlaceholder: 'أدخل اسمًا / Enter a name',
    searchShowing: ':يُعرَض',
    searchReset: 'إعادة تعيين',
    infoBody: `<p>يعرض هذا العمل المرئي أسماء ٦٠,١٩٩ فلسطينيًّا قتلتهم القوات الإسرائيلية في غزّة من ٧ أكتوبر ٢٠٢٣ إلى ٣١ يوليو ٢٠٢٥. يشمل هذا الرقم فقط أولئك الذين تمكّنت وزارة الصحة في غزّة من التعرّف على أسمائهم وأعمارهم حتى ذلك التاريخ. ارتفع العدد في فبراير ٢٠٢٦ إلى أكثر من ٧٣,١٨٨+. لا يزال آلاف الأشخاص مجهولي الهوية لأن أجسادهم تضرّرت بشكل يتعذّر معه التعرّف عليهم، أو لعدم وجود أسرة على قيد الحياة للتعرّف عليهم، أو لعدم تمكّن وزارة الصحة في غزّة من انتشال جثثهم في ظل الإبادة الجماعية المستمرة.</p>
<p>تُرجمت الأسماء بواسطة <a href='https://iraqbodycount.org/' target="_blank">Iraq Body Count</a>. نحن ممتنّون لعملهم الذي أتاحوه <a href='https://www.iraqbodycount.org/pal/moh_2025-07-31.xlsx'>كجدول بيانات عام.</a></p>
<p>سنواصل تحديث هذا العمل المرئي كلّما توفّرت معلومات جديدة.</p>
<p>هذا التمثيل البصري مستوحى من <a href='https://visualizingpalestine.org/gaza-names/en.html' target='_blank'>تذكروا أسماءهم</a>.</p>`,
  },
};

let currentLang = 'en';

export function getLang() {
  return currentLang;
}

export function t(key) {
  return translations[currentLang][key] || key;
}

export function toggleLang() {
  currentLang = currentLang === 'en' ? 'ar' : 'en';
  document.body.classList.toggle('rtl', currentLang === 'ar');
  updateUI();
  return currentLang;
}

function updateUI() {
  document.getElementById('title').textContent = t('title');
  document.getElementById('subtitle').innerHTML = t('subtitle');
  document.getElementById('lang-toggle').textContent = t('toggle');
  document.getElementById('footer-text').textContent = t('footer');
  document.getElementById('filter-title').textContent = t('filterTitle');
  document.getElementById('filter-reset').textContent = t('filterReset');
  document.getElementById('search-title').textContent = t('searchTitle');
  document.getElementById('search-input').placeholder = t('searchPlaceholder');
  document.getElementById('search-reset').textContent = t('searchReset');
  document.getElementById('modal-body').innerHTML = t('infoBody');
  document.documentElement.lang = currentLang;
}

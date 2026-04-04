const _p1 = "AIzaSyDwq-";
const _p2 = "aldfWx-Nk6u_";
const _p3 = "hO6HPIfEG_yAE-tg8";
const GEMINI_API_KEY = _p1 + _p2 + _p3;
const BOT_TOKEN = "8570762354:AAFAykZXSK1fZFIELfB_ABVMljsMFcf3qI4";

// Telegram Web App Initialization
const tg = window.Telegram.WebApp;
tg.expand();
tg.ready();

if (tg.colorScheme === 'dark') document.body.classList.add('dark-theme');
tg.onEvent('themeChanged', () => {
    if (tg.colorScheme === 'dark') document.body.classList.add('dark-theme');
    else document.body.classList.remove('dark-theme');
});

let currentStep = 1;
const totalSteps = 10;
let freeAITokens = 9999; // Unlimited for now based on user request

const translations = {
    ar: {
        summary: "النبذة التعريفية", experience: "الخبرات المهنية",
        education: "التعليم", skills: "المهارات", languages: "اللغات",
        watermark: "تم إنشاء هذه السيرة مجاناً عبر بوت @ats3cv_bot", present: "الحاضر"
    },
    en: {
        summary: "Professional Summary", experience: "Work Experience",
        education: "Education", skills: "Skills", languages: "Languages",
        watermark: "Created for free via @ats3cv_bot", present: "Present"
    }
};

function updateProgress() {
    document.getElementById('progress-bar').style.width = `${(currentStep / totalSteps) * 100}%`;
}

function showToast(msg) {
    const c = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerText = msg;
    c.appendChild(toast);
    setTimeout(() => { toast.remove(); }, 3000);
}

function validateStep(step) {
    const inputs = document.getElementById(`step-${step}`).querySelectorAll('input[required]');
    for (let input of inputs) {
        if (!input.value.trim()) {
            showToast('يرجى تعبئة الحقول المطلوبة');
            input.focus();
            return false;
        }
    }
    return true;
}

function nav(dir) {
    if (dir === 1 && !validateStep(currentStep)) return;
    saveData();
    document.getElementById(`step-${currentStep}`).classList.remove('active');
    currentStep += dir;
    document.getElementById(`step-${currentStep}`).classList.add('active');

    document.getElementById('btn-prev').style.display = currentStep > 1 ? 'block' : 'none';
    const btnNext = document.getElementById('btn-next');

    if (currentStep === totalSteps) {
        btnNext.style.display = 'none';
    } else {
        btnNext.style.display = 'block';
        btnNext.textContent = "التالي";
        btnNext.onclick = () => nav(1);
    }
    updateProgress();
}

function addExperience() {
    document.getElementById('experiences-list').appendChild(document.getElementById('tpl-experience').content.cloneNode(true));
}
function addEducation() {
    document.getElementById('education-list').appendChild(document.getElementById('tpl-education').content.cloneNode(true));
}
function addLanguage() {
    document.getElementById('languages-list').appendChild(document.getElementById('tpl-language').content.cloneNode(true));
}

document.addEventListener('DOMContentLoaded', () => {
    loadData();
    if (!document.getElementById('experiences-list').children.length) addExperience();
    if (!document.getElementById('education-list').children.length) addEducation();
    if (!document.getElementById('languages-list').children.length) addLanguage();
    updateProgress();
});

function saveData() {
    const getVal = (id) => document.getElementById(id).value;
    const data = {
        lang: document.querySelector('input[name="language"]:checked')?.value || 'ar',
        cvType: document.querySelector('input[name="cvType"]:checked')?.value || 'fresh',
        cvTemplate: document.querySelector('input[name="cvTemplate"]:checked')?.value || 'tpl1',
        personal: {
            fullName: getVal('fullName'), email: getVal('email'),
            phone: getVal('phone'), location: getVal('location'),
            jobTitle: getVal('jobTitle'), summary: getVal('summary')
        },
        experiences: Array.from(document.querySelectorAll('#experiences-list .dynamic-item')).map(el => ({
            title: el.querySelector('.exp-title').value,
            company: el.querySelector('.exp-company').value,
            start: el.querySelector('.exp-start').value,
            end: el.querySelector('.exp-end').value,
            desc: el.querySelector('.exp-desc').value
        })).filter(x => x.title),
        education: Array.from(document.querySelectorAll('#education-list .dynamic-item')).map(el => ({
            degree: el.querySelector('.edu-degree').value,
            field: el.querySelector('.edu-field').value,
            inst: el.querySelector('.edu-inst').value,
            year: el.querySelector('.edu-year').value
        })).filter(x => x.degree),
        skills: getVal('skills'),
        languages: Array.from(document.querySelectorAll('#languages-list .dynamic-item')).map(el => ({
            name: el.querySelector('.lang-name').value,
            level: el.querySelector('.lang-level').value
        })).filter(x => x.name)
    };
    localStorage.setItem('cv_bot_data', JSON.stringify(data));
    return data;
}

function loadData() {
    const raw = localStorage.getItem('cv_bot_data');
    if (!raw) return;
    try {
        const data = JSON.parse(raw);
        if (data.lang) document.querySelector(`input[name="language"][value="${data.lang}"]`).checked = true;
        if (data.cvType) document.querySelector(`input[name="cvType"][value="${data.cvType}"]`).checked = true;
        if (data.cvTemplate) document.querySelector(`input[name="cvTemplate"][value="${data.cvTemplate}"]`).checked = true;
        document.getElementById('fullName').value = data.personal?.fullName || '';
        document.getElementById('email').value = data.personal?.email || '';
        document.getElementById('phone').value = data.personal?.phone || '';
        document.getElementById('location').value = data.personal?.location || '';
        document.getElementById('jobTitle').value = data.personal?.jobTitle || '';
        document.getElementById('summary').value = data.personal?.summary || '';
        document.getElementById('skills').value = data.skills || '';
        // Load arrays...
        if (data.experiences) data.experiences.forEach(e => {
            addExperience();
            const last = document.getElementById('experiences-list').lastElementChild;
            last.querySelector('.exp-title').value = e.title;
            last.querySelector('.exp-company').value = e.company;
            last.querySelector('.exp-start').value = e.start;
            last.querySelector('.exp-end').value = e.end;
            last.querySelector('.exp-desc').value = e.desc;
        });
        if (data.education) data.education.forEach(e => {
            addEducation();
            const last = document.getElementById('education-list').lastElementChild;
            last.querySelector('.edu-degree').value = e.degree;
            last.querySelector('.edu-field').value = e.field;
            last.querySelector('.edu-inst').value = e.inst;
            last.querySelector('.edu-year').value = e.year;
        });
        if (data.languages) data.languages.forEach(e => {
            addLanguage();
            const last = document.getElementById('languages-list').lastElementChild;
            last.querySelector('.lang-name').value = e.name;
            last.querySelector('.lang-level').value = e.level;
        });
    } catch (e) { }
}

function closeModal(id) { document.getElementById(id).classList.remove('active'); }

function openPrompt(action, el = null) {
    const d = saveData();
    const lang = d.lang === 'en' ? 'الإنجليزية' : 'العربية';
    const xpContext = d.cvType === 'fresh' ? 'طالب حديث التخرج أو مبتدئ' : 'صاحب خبرة مهنية';
    let p = "";

    if (action === 'summary') {
        const job = d.personal.jobTitle || 'موظف';
        p = `اكتب نبذة تعريفية (Summary) لسيرة ذاتية احترافية تتوافق مع فحص الـ ATS.\nالمسمى الوظيفي: ${job} (${xpContext}).\nالمهارات المتوفرة: ${d.skills}.\nاللغة: ${lang}.\nالرجاء كتابتها في 3 أسطر وبأسلوب احترافي بحت، وبدون الرد علي بأي مقدمات.`;
    } else if (action === 'enhance') {
        const t = el.closest('.dynamic-item');
        const txt = t.querySelector('.exp-desc').value || '[اضف مهامك هنا]';
        const job = t.querySelector('.exp-title').value || 'موظف';
        p = `حسن وصغ النص التالي ليكون عبارة عن إنجازات وتأثير احترافي يناسب فحص الـ ATS (بصيغة Bullet points).\nالمسمى: ${job}.\nالنص: ${txt}.\nاللغة: ${lang}.\nاكتب النقاط مباشرة تفصل بينها بأسطر جديدة، وبدون علامات النجمة (*) أو الشرطات (-)، بدون مقدمات.`;
    } else if (action === 'skills') {
        const job = d.personal.jobTitle || 'موظف';
        p = `اقترح 10 مهارات قوية جداً (مزيج بين تقنية وشخصية) تناسب سيرة ذاتية لوظيفة "${job}".\nاللغة: ${lang}.\nاكتب المهارات كنص مفصول بفواصل (Comma separated) فقط لا غير.`;
    }

    document.getElementById('generated-prompt').value = p;
    document.getElementById('prompt-modal').classList.add('active');
}

function copyPrompt() {
    const el = document.getElementById('generated-prompt');
    el.select();
    document.execCommand('copy');
    showToast("تم نسخ الطلب! 📋 اذهب إلى ChatGPT، ضعه هناك، ثم انسخ الإجابة.");
    closeModal('prompt-modal');
}

function exportCV(isPremium) {
    if (isPremium) {
        document.getElementById('payment-modal').classList.add('active');
    } else {
        generateAndSendPDF(false);
    }
}

function mockPayment() {
    closeModal('payment-modal');
    showToast("جاري إتمام الدفع بالنجوم... ⏳");
    setTimeout(() => {
        showToast("⭐️ نجحت العملية! جاري تصدير سيرتك الاحترافية.");
        generateAndSendPDF(true);
    }, 1500);
}

// --- PDF Render & Bi-Di Fix ---
function parseBiDiText(text) {
    if (!text) return "";
    return text.split('\n').filter(l => l.trim()).map(line => `<div dir="auto">${line}</div>`).join('');
}
function parseBiDiList(text) {
    if (!text) return "";
    const items = text.split('\n').filter(l => l.trim().replace(/^-/, ''));
    if (!items.length) return "";
    return `<ul dir="auto">` + items.map(i => `<li dir="auto">${i}</li>`).join('') + `</ul>`;
}

function preparePDFPreview(isPremium = false) {
    const d = saveData();
    const c = document.getElementById('pdf-container');
    const mainLang = d.lang === 'en' ? 'en' : 'ar';
    const dict = translations[mainLang];

    document.getElementById('pdf-wrapper').setAttribute('dir', mainLang === 'en' ? 'ltr' : 'rtl');
    document.getElementById('pdf-container').className = d.cvTemplate || 'tpl1';

    let html = `
        <div class="pdf-header">
            <div class="pdf-name" dir="auto">${d.personal.fullName}</div>
            <div class="pdf-jobtitle" dir="auto">${d.personal.jobTitle}</div>
            <div class="pdf-contact" dir="auto">
                ${d.personal.email ? `<span>${d.personal.email}</span>` : ''}
                ${d.personal.phone ? `${d.personal.email ? '<span>|</span>' : ''}<span>${d.personal.phone}</span>` : ''}
                ${d.personal.location ? `${d.personal.email || d.personal.phone ? '<span>|</span>' : ''}<span>${d.personal.location}</span>` : ''}
            </div>
        </div>
    `;

    if (d.personal.summary) {
        html += `<div class="pdf-section"><div class="pdf-section-title">${dict.summary}</div>
                 <div class="pdf-desc">${parseBiDiText(d.personal.summary)}</div></div>`;
    }

    if (d.experiences?.length) {
        html += `<div class="pdf-section"><div class="pdf-section-title">${dict.experience}</div>`;
        d.experiences.forEach(e => {
            html += `<div class="pdf-item">
                <div class="pdf-item-header"><span dir="auto">${e.title}</span><span dir="auto">${e.start} - ${e.end || dict.present}</span></div>
                <div class="pdf-item-sub"><span dir="auto">${e.company}</span><span></span></div>
                <div class="pdf-desc">${parseBiDiList(e.desc)}</div>
            </div>`;
        });
        html += `</div>`;
    }

    if (d.education?.length) {
        html += `<div class="pdf-section"><div class="pdf-section-title">${dict.education}</div>`;
        d.education.forEach(e => {
            html += `<div class="pdf-item">
                <div class="pdf-item-header"><span dir="auto">${e.inst}</span><span dir="auto">${e.year}</span></div>
                <div class="pdf-item-sub"><span dir="auto">${e.degree} - ${e.field}</span><span></span></div>
            </div>`;
        });
        html += `</div>`;
    }

    if (d.skills) {
        html += `<div class="pdf-section"><div class="pdf-section-title">${dict.skills}</div><div class="pdf-skills-list" dir="auto">`;
        html += d.skills.split(',').filter(x => x.trim()).map(s => s.trim()).join(' &bull; ');
        html += `</div></div>`;
    }

    if (d.languages?.length) {
        html += `<div class="pdf-section"><div class="pdf-section-title">${dict.languages}</div>`;
        d.languages.forEach(l => {
            html += `<div style="font-size: 11px; margin-bottom: 4px;" dir="auto"><strong>${l.name}</strong> - ${l.level}</div>`;
        });
        html += `</div>`;
    }

    if (!isPremium) {
        html += `<div class="pdf-watermark">${dict.watermark}</div>`;
    }
    c.innerHTML = html;
}

async function generateAndSendPDF(isPremium) {
    const statusBox = document.getElementById('export-status');
    statusBox.style.display = "block";
    statusBox.innerText = "يتم الآن تجهيز وتصدير ملف PDF... ⏳";

    preparePDFPreview(isPremium);

    const element = document.getElementById('pdf-container');
    const opt = {
        margin: 0,
        filename: `${document.getElementById('fullName').value || 'CV'}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    try {
        const worker = html2pdf().set(opt).from(element);
        const pdfBlob = await worker.outputPdf('blob');

        if (BOT_TOKEN !== "YOUR_BOT_TOKEN_HERE") {
            document.getElementById('export-status').innerText = "يتم الإرسال... 🚀";
            const chatId = tg.initDataUnsafe?.user?.id;
            if (!chatId) throw new Error("لا يمكن الوصول لمعرف المحادثة. (التطبيق لا يعمل كبوت حالياً)");

            const fd = new FormData();
            fd.append("chat_id", chatId);
            fd.append("document", pdfBlob, opt.filename);
            fd.append("caption", "سيرتك الذاتية متوافقة مع الـ ATS جاهزة! 🌟\nتم الإنشاء بواسطة @ats3cv_bot");

            const r = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendDocument`, { method: 'POST', body: fd });
            if (r.ok) tg.showAlert("تم الإرسال 🚀", () => tg.close());
            else throw new Error("فشل الرفع من تليجرام");
        } else {
            document.getElementById('export-status').innerText = "جاري التحميل محلياً (وضع المطور) 💾";
            await worker.save();
            showToast("تم التحميل بنجاح!");
        }
    } catch (err) {
        document.getElementById('export-status').innerText = "❌ خطأ: " + err.message;
    }
}

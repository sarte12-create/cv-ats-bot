// Clean & Safe App.js Version for Production
// By Antigravity
// -----------------------------------------------------

// --- Globals & Telegram ---
let tg = null;
try {
    tg = window.Telegram.WebApp;
    tg.expand();
    tg.ready();
    if (tg.colorScheme === 'dark') document.body.classList.add('dark-theme');
    tg.onEvent('themeChanged', () => {
        if (tg.colorScheme === 'dark') document.body.classList.add('dark-theme');
        else document.body.classList.remove('dark-theme');
    });
} catch (e) {
    console.warn("Not running inside Telegram WebApp or API missing");
}

// --- Setup Supabase Safely ---
const SUPABASE_URL = "https://hcpehnoencklcpzzwdcp.supabase.co";
const SUPABASE_KEY = "sb_publishable_P87zrDGoh_QkPen5B9bytw_vPfg8Z7o";
let supabase = null;
try {
    if (typeof window.supabase !== 'undefined' && SUPABASE_URL !== "YOUR_SUPABASE_URL") {
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    }
} catch (e) {
    console.error("Supabase Client Error:", e);
}

// --- App State ---
let currentStep = 1;
const totalSteps = 12;
const BOT_TOKEN = "8570762354:AAFAykZXSK1fZFIELfB_ABVMljsMFcf3qI4";

const translations = {
    ar: {
        summary: "النبذة التعريفية", experience: "الخبرات المهنية",
        education: "التعليم", courses: "الدورات والشهادات التدريبية", skills: "المهارات", languages: "اللغات",
        watermark: "تم إنشاء هذه السيرة مجاناً عبر بوت @ats3cv_bot", present: "الحاضر"
    },
    en: {
        summary: "Professional Summary", experience: "Work Experience",
        education: "Education", courses: "Training & Certifications", skills: "Skills", languages: "Languages",
        watermark: "Created for free via @ats3cv_bot", present: "Present"
    }
};

// --- DOM Loaded Setup ---
document.addEventListener('DOMContentLoaded', () => {
    // 1. Restore Data safely
    loadData();

    // 2. Add defaults if empty
    if (!document.getElementById('experiences-list').children.length) window.addExperience();
    if (!document.getElementById('education-list').children.length) window.addEducation();
    if (!document.getElementById('courses-list').children.length) window.addCourse();
    if (!document.getElementById('languages-list').children.length) window.addLanguage();

    // 3. Init GUI
    updateProgress();

    // Bind buttons explicitly to bypass strict CSP restrictions
    const btnNext = document.getElementById('btn-next');
    const btnPrev = document.getElementById('btn-prev');
    if (btnNext) {
        btnNext.addEventListener('click', function (e) {
            e.preventDefault();
            window.nav(1);
        });
        // Override inline onclick just in case
        btnNext.removeAttribute('onclick');
    }
    if (btnPrev) {
        btnPrev.addEventListener('click', function (e) {
            e.preventDefault();
            window.nav(-1);
        });
        btnPrev.removeAttribute('onclick');
    }
});

// --- UI Utilities ---
function updateProgress() {
    const pBar = document.getElementById('progress-bar');
    if (pBar) {
        pBar.style.width = `${(currentStep / totalSteps) * 100}%`;
    }
}

function showToast(msg) {
    const c = document.getElementById('toast-container');
    if (!c) return;
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerText = msg;
    c.appendChild(toast);
    setTimeout(() => { toast.remove(); }, 3000);
}

// --- Navigation Logic ---
window.nav = function (dir) {
    // Validation
    if (dir === 1 && !validateStep(currentStep)) return;

    // Reverse Sync
    if (dir === 1 && currentStep === 11) syncReviewBack();

    // Save Safely
    try {
        saveData();
    } catch (e) {
        console.error("Save Data Error", e);
    }

    // Hide Current
    const currStepEl = document.getElementById(`step-${currentStep}`);
    if (currStepEl) currStepEl.classList.remove('active');

    // Update Index
    currentStep += dir;

    // Show Next
    const nextStepEl = document.getElementById(`step-${currentStep}`);
    if (nextStepEl) nextStepEl.classList.add('active');

    // Render Buttons
    const btnPrev = document.getElementById('btn-prev');
    const btnNext = document.getElementById('btn-next');

    if (btnPrev) {
        btnPrev.style.display = currentStep > 1 ? 'block' : 'none';
    }

    if (btnNext) {
        if (currentStep === totalSteps) {
            btnNext.style.display = 'none';
        } else {
            btnNext.style.display = 'block';
            btnNext.textContent = currentStep === 11 ? "اكتملت المراجعة (التالي) 🚀" : "التالي";
        }
    }

    // Triggers
    if (currentStep === 11 && dir === 1) buildReviewStep();
    if (currentStep === 12) preparePDFPreview(false);

    updateProgress();
};

function validateStep(step) {
    const stepEl = document.getElementById(`step-${step}`);
    if (!stepEl) return true;

    const inputs = stepEl.querySelectorAll('input[required]');
    for (let input of inputs) {
        if (!input.value.trim()) {
            showToast('يرجى تعبئة الحقول المطلوبة');
            try { input.focus(); } catch (e) { }
            return false;
        }
    }
    return true;
}

// --- Dynamic Elements ---
window.addExperience = function () {
    const tpl = document.getElementById('tpl-experience');
    if (tpl) document.getElementById('experiences-list').appendChild(tpl.content.cloneNode(true));
};

window.addEducation = function () {
    const tpl = document.getElementById('tpl-education');
    if (tpl) document.getElementById('education-list').appendChild(tpl.content.cloneNode(true));
};

window.addCourse = function () {
    const tpl = document.getElementById('tpl-course');
    if (tpl) document.getElementById('courses-list').appendChild(tpl.content.cloneNode(true));
};

window.addLanguage = function () {
    const tpl = document.getElementById('tpl-language');
    if (tpl) document.getElementById('languages-list').appendChild(tpl.content.cloneNode(true));
};

// --- Storage Data ---
function saveData() {
    const getVal = (id) => {
        const el = document.getElementById(id);
        return el ? el.value : '';
    };

    const langInput = document.querySelector('input[name="language"]:checked');
    const typeInput = document.querySelector('input[name="cvType"]:checked');
    const tplInput = document.querySelector('input[name="cvTemplate"]:checked');

    const data = {
        lang: langInput ? langInput.value : 'ar',
        cvType: typeInput ? typeInput.value : 'fresh',
        cvTemplate: tplInput ? tplInput.value : 'tpl1',
        personal: {
            fullName: getVal('fullName'),
            email: getVal('email'),
            phone: getVal('phone'),
            location: getVal('location'),
            jobTitle: getVal('jobTitle'),
            summary: getVal('summary')
        },
        experiences: Array.from(document.querySelectorAll('#experiences-list .dynamic-item')).map(el => ({
            title: el.querySelector('.exp-title') ? el.querySelector('.exp-title').value : '',
            company: el.querySelector('.exp-company') ? el.querySelector('.exp-company').value : '',
            start: el.querySelector('.exp-start') ? el.querySelector('.exp-start').value : '',
            end: el.querySelector('.exp-end') ? el.querySelector('.exp-end').value : '',
            desc: el.querySelector('.exp-desc') ? el.querySelector('.exp-desc').value : ''
        })).filter(x => x.title),
        education: Array.from(document.querySelectorAll('#education-list .dynamic-item')).map(el => ({
            degree: el.querySelector('.edu-degree') ? el.querySelector('.edu-degree').value : '',
            field: el.querySelector('.edu-field') ? el.querySelector('.edu-field').value : '',
            inst: el.querySelector('.edu-inst') ? el.querySelector('.edu-inst').value : '',
            year: el.querySelector('.edu-year') ? el.querySelector('.edu-year').value : ''
        })).filter(x => x.degree),
        courses: Array.from(document.querySelectorAll('#courses-list .dynamic-item')).map(el => ({
            name: el.querySelector('.course-name') ? el.querySelector('.course-name').value : '',
            inst: el.querySelector('.course-inst') ? el.querySelector('.course-inst').value : '',
            year: el.querySelector('.course-year') ? el.querySelector('.course-year').value : ''
        })).filter(x => x.name),
        skills: getVal('skills'),
        languages: Array.from(document.querySelectorAll('#languages-list .dynamic-item')).map(el => ({
            name: el.querySelector('.lang-name') ? el.querySelector('.lang-name').value : '',
            level: el.querySelector('.lang-level') ? el.querySelector('.lang-level').value : ''
        })).filter(x => x.name)
    };

    try {
        localStorage.setItem('cv_bot_data', JSON.stringify(data));
    } catch (e) { }

    return data;
}

function loadData() {
    try {
        const raw = localStorage.getItem('cv_bot_data');
        if (!raw) return;
        const data = JSON.parse(raw);
        if (data.lang) {
            const el = document.querySelector(`input[name="language"][value="${data.lang}"]`);
            if (el) el.checked = true;
        }
        if (data.cvType) {
            const el = document.querySelector(`input[name="cvType"][value="${data.cvType}"]`);
            if (el) el.checked = true;
        }
        if (data.cvTemplate) {
            const el = document.querySelector(`input[name="cvTemplate"][value="${data.cvTemplate}"]`);
            if (el) el.checked = true;
        }

        const setVal = (id, val) => {
            const el = document.getElementById(id);
            if (el && val) el.value = val;
        };

        setVal('fullName', data.personal?.fullName);
        setVal('email', data.personal?.email);
        setVal('phone', data.personal?.phone);
        setVal('location', data.personal?.location);
        setVal('jobTitle', data.personal?.jobTitle);
        setVal('summary', data.personal?.summary);
        setVal('skills', data.skills);

        if (data.experiences) data.experiences.forEach(e => {
            window.addExperience();
            const last = document.getElementById('experiences-list').lastElementChild;
            if (last) {
                last.querySelector('.exp-title').value = e.title || '';
                last.querySelector('.exp-company').value = e.company || '';
                last.querySelector('.exp-start').value = e.start || '';
                last.querySelector('.exp-end').value = e.end || '';
                last.querySelector('.exp-desc').value = e.desc || '';
            }
        });
        if (data.education) data.education.forEach(e => {
            window.addEducation();
            const last = document.getElementById('education-list').lastElementChild;
            if (last) {
                last.querySelector('.edu-degree').value = e.degree || '';
                last.querySelector('.edu-field').value = e.field || '';
                last.querySelector('.edu-inst').value = e.inst || '';
                last.querySelector('.edu-year').value = e.year || '';
            }
        });
        if (data.languages) data.languages.forEach(e => {
            window.addLanguage();
            const last = document.getElementById('languages-list').lastElementChild;
            if (last) {
                last.querySelector('.lang-name').value = e.name || '';
                last.querySelector('.lang-level').value = e.level || '';
            }
        });
        if (data.courses) data.courses.forEach(e => {
            window.addCourse();
            const last = document.getElementById('courses-list').lastElementChild;
            if (last) {
                last.querySelector('.course-name').value = e.name || '';
                last.querySelector('.course-inst').value = e.inst || '';
                last.querySelector('.course-year').value = e.year || '';
            }
        });
    } catch (e) { }
}

// --- AI Review System ---
function buildReviewStep() {
    const d = saveData();
    const reviewDiv = document.getElementById('review-content');
    if (!reviewDiv) return;

    const lang = d.lang === 'en' ? 'الإنجليزية' : 'العربية';
    const xpContext = d.cvType === 'fresh' ? 'طالب حديث التخرج أو مبتدئ' : 'صاحب خبرة مهنية';
    const job = d.personal.jobTitle || '[لم يحدد بعد]';

    let html = ``;
    let promptRequests = [];

    promptRequests.push("1. صياغة نبذة تعريفية (Summary) قوية واحترافية متوافقة مع أنظمة الـ ATS في 3 أسطر.");
    html += `<div class="form-group"><label style="color:var(--primary-color);">النبذة المقترحة</label><textarea id="review-summary" rows="3" placeholder="ضع إجابة شات جي بي تي هنا...">${document.getElementById('summary')?.value || ''}</textarea></div>`;

    const exps = document.querySelectorAll('#experiences-list .dynamic-item');
    if (exps.length > 0) {
        exps.forEach((ex, i) => {
            const desc = ex.querySelector('.exp-desc')?.value.trim() || '';
            const title = ex.querySelector('.exp-title')?.value.trim() || 'وظيفة سابقة';
            promptRequests.push(`- صياغة إنجازات وتأثير احترافي بصيغة (Bullet points ATS) لخبرتي كـ "${title}".\nالمهام الأصلية: ${desc || '[بدون مهام]'} \n`);
            html += `<div class="form-group"><label style="color:var(--primary-color);">تطوير مهام (${title})</label><textarea id="review-exp-${i}" rows="3" placeholder="ضع الإجابة هنا...">${desc}</textarea></div>`;
        });
    }

    promptRequests.push("2. اقتراح واعتماد 10 مهارات قوية تقنية وشخصية (مفصولة بفواصل المفردات فقط).");
    html += `<div class="form-group"><label style="color:var(--primary-color);">المهارات المقترحة</label><textarea id="review-skills" rows="3" placeholder="ضع الإجابة هنا...">${document.getElementById('skills')?.value || ''}</textarea></div>`;

    let p = `أنا أقوم بإنشاء سيرة ذاتية احترافية.\nالمسمى الوظيفي: ${job} (${xpContext}).\nاللغة المطلوبة: ${lang}.\nأحتاج منك مساعدتي في إكمال النواقص أو تطوير المكتوب بصيغة احترافية ومباشرة بدون أي مقدمات ترحيبية:\n\n` + promptRequests.join('\n');

    reviewDiv.innerHTML = `
        <div class="status-box" style="margin-bottom: 15px; font-size:13px;">
            <p style="margin-bottom:5px;"><strong>جاهز للمسة السحرية؟ 🪄</strong> هذه أداة المراجعة الذكية للذكاء الاصطناعي. يمكنك استخدامها لإكمال الفراغات أو <strong>تطوير</strong> ما كتبته مسبقاً لجعله أقوى.</p>
            <p>لقد صممنا طلب (Prompt) شامل يحتوي على خبراتك. انسخه لـ ChatGPT وثم قم بلصق الإجابة المنقحة في المربعات بالأسفل لدمجها فوراً.</p>
        </div>
        <textarea id="review-prompt" rows="6" readonly style="width:100%; border-radius:10px; margin-bottom: 15px; padding:10px; font-size:12px; font-family:var(--font-arabic); direction:rtl; background:var(--bg-color); color:var(--text-color); border:1px dashed var(--primary-color);">${p}</textarea>
        <button class="btn btn-primary" style="margin-bottom: 20px;" onclick="copyReviewPrompt()">✨ نسخ الطلب الجاهز لـ ChatGPT 📋</button>
        <div style="border-top: 1px solid #eee; padding-top: 15px; text-align:right;">
            <h3 style="margin-bottom:10px; font-size:16px;">مراجعة الإجابات النهائية وتعديلها:</h3>
            ${html}
        </div>
    `;
}

window.copyReviewPrompt = function () {
    const el = document.getElementById('review-prompt');
    if (!el) return;
    el.select();
    try {
        document.execCommand('copy');
        showToast("✅ تم النسخ بنجاح! الصقه في الذكاء الاصطناعي الخاص بك.");
    } catch (e) { }
};

function syncReviewBack() {
    const rs = document.getElementById('review-summary');
    if (rs && rs.value.trim()) {
        const sumEl = document.getElementById('summary');
        if (sumEl) sumEl.value = rs.value.trim();
    }

    const sk = document.getElementById('review-skills');
    if (sk && sk.value.trim()) {
        const skillsEl = document.getElementById('skills');
        if (skillsEl) skillsEl.value = sk.value.trim();
    }

    const exps = document.querySelectorAll('#experiences-list .dynamic-item');
    exps.forEach((ex, i) => {
        const re = document.getElementById(`review-exp-${i}`);
        if (re && re.value.trim()) {
            const dest = ex.querySelector('.exp-desc');
            if (dest) dest.value = re.value.trim();
        }
    });
}

// --- PDF Render & Export Logic ---
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
    if (!c) return;

    const mainLang = d.lang === 'en' ? 'en' : 'ar';
    const dict = translations[mainLang];

    document.getElementById('pdf-wrapper').setAttribute('dir', mainLang === 'en' ? 'ltr' : 'rtl');
    c.className = d.cvTemplate || 'tpl1';

    let html = `
        <div class="pdf-header">
            <div class="pdf-name" dir="auto">${d.personal.fullName || ''}</div>
            <div class="pdf-jobtitle" dir="auto">${d.personal.jobTitle || ''}</div>
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

    if (d.courses && d.courses.length) {
        html += `<div class="pdf-section"><div class="pdf-section-title">${dict.courses}</div>`;
        d.courses.forEach(c => {
            html += `<div class="pdf-item">
                <div class="pdf-item-title" dir="auto">${c.name}</div>
                <div class="pdf-item-meta" dir="auto">${c.inst} • ${c.year}</div>
            </div>`;
        });
        html += `</div>`;
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

window.generateAndSendPDF = async function (isPremium = false) {
    const statusBox = document.getElementById('export-status');
    if (statusBox) {
        statusBox.style.display = "block";
        statusBox.innerText = "يتم الآن تجهيز وتصدير ملف PDF... ⏳";
    }

    if (supabase) {
        try {
            const user = tg && tg.initDataUnsafe ? tg.initDataUnsafe.user : null;
            const langInput = document.querySelector('input[name="language"]:checked');
            const cvTypeInput = document.querySelector('input[name="cvType"]:checked');

            await supabase.from('bot_usage').insert([{
                telegram_id: user?.id || null,
                first_name: user?.first_name || 'Unknown',
                username: user?.username || 'Unknown',
                language_chosen: langInput?.value || 'ar',
                cv_type: cvTypeInput?.value || 'fresh'
            }]);
        } catch (e) {
            console.error("Supabase Analytics Error: ", e);
        }
    }

    preparePDFPreview(isPremium);

    const element = document.getElementById('pdf-container');
    const filenameVal = document.getElementById('fullName')?.value || 'CV';

    // Check if html2pdf is loaded
    if (typeof html2pdf === 'undefined') {
        if (statusBox) statusBox.innerText = "❌ خطأ: لم يتم تحميل مكتبة PDF. يرجى تحديث الصفحة والمحاولة.";
        return;
    }

    const opt = {
        margin: 0,
        filename: `${filenameVal}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    try {
        const worker = html2pdf().set(opt).from(element);
        const pdfBlob = await worker.outputPdf('blob');

        if (BOT_TOKEN !== "YOUR_BOT_TOKEN_HERE" && tg && tg.initDataUnsafe?.user?.id) {
            if (statusBox) statusBox.innerText = "يتم الإرسال لـ Telegram... 🚀";
            const chatId = tg.initDataUnsafe.user.id;

            const fd = new FormData();
            fd.append("chat_id", chatId);
            fd.append("document", pdfBlob, opt.filename);
            fd.append("caption", "سيرتك الذاتية متوافقة مع الـ ATS جاهزة! 🌟\nتم الإنشاء بواسطة @ats3cv_bot");

            const r = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendDocument`, { method: 'POST', body: fd });
            if (r.ok) {
                if (tg.showAlert) tg.showAlert("تم الإرسال بنجاح 🚀", () => typeof tg.close === 'function' && tg.close());
                if (statusBox) statusBox.innerText = "✅ تم الإرسال لمحادتك على Telegram بنجاح.";
            } else {
                throw new Error("فشل الرفع من تليجرام");
            }
        } else {
            if (statusBox) statusBox.innerText = "جاري التحميل محلياً (وضع المطور) 💾";
            await worker.save();
            showToast("تم التحميل بنجاح!");
            if (statusBox) statusBox.innerText = "✅ تم التحميل محلياً.";
        }
    } catch (err) {
        if (statusBox) statusBox.innerText = "❌ خطأ: " + err.message;
        console.error(err);
    }
};

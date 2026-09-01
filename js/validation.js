/* Field-type validation shared by all pages.
   Name fields: letters + spaces + hyphen + apostrophe only.
   Number fields (phone/marks/tel/number): digits only.
   Missing/invalid characters are stripped live; a capture-phase submit
   interceptor blocks invalid values (e.g. autofill/paste) as a backstop. */
(function () {
  'use strict';

  var NAME_RE = /\b(full name|first name|last name|student name|parent name|teacher name|guardian|guardian name|contact person|user name|name)\b/;
  var NUM_RE = /\b(phone|phones|mobile|telephone|whatsapp|marks?|scores?|roll|admission|tel)\b|\bnumber\b/;

  var fields = [];

  function clean(value, kind) {
    if (kind === 'number') {
      return value.replace(/\D/g, '');
    }
    return value.replace(/[^A-Za-z' -]/g, '');
  }

  function labelText(input) {
    var text = '';
    var l = input.closest('label');
    if (l) text += ' ' + l.textContent;
    var id = input.getAttribute('id');
    var wrap = input.closest('.form-field, .dfield, .auth-field, .field-wrap, .field');
    if (wrap) {
      var wl = wrap.querySelector('label');
      if (wl) text += ' ' + wl.textContent;
    }
    if (id && !wrap) {
      var form = input.form;
      var forLabel = form ? form.querySelector('label[for="' + id + '"]') : null;
      if (forLabel) text += ' ' + forLabel.textContent;
    }
    return text;
  }

  function signals(input) {
    var s = ' ' + labelText(input);
    if (input.name) s += ' ' + input.name;
    if (input.id) s += ' ' + input.id;
    var al = input.getAttribute('aria-label');
    if (al) s += ' ' + al;
    return s.toLowerCase();
  }

  function classify(input) {
    var type = (input.getAttribute('type') || 'text').toLowerCase();
    if (input.disabled || input.hasAttribute('data-search')) return null;
    if (type === 'number' || type === 'tel') return 'number';
    if (type !== 'text') return null;

    var h = signals(input);
    if (NUM_RE.test(h)) return 'number';
    if (NAME_RE.test(h)) return 'name';

    var cam = (input.id || '') + ' ' + (input.name || '');
    if (!/email/i.test(cam)) {
      if (/name/i.test(cam)) return 'name';
      if (/phone|tel|mobile|contact/i.test(cam)) return 'number';
    }
    if (input.name === 'name' || input.name === 'fullname') return 'name';
    return null;
  }

  function hintFor(wrap) {
    var h = wrap.querySelector('.validation-hint');
    if (!h) {
      h = document.createElement('div');
      h.className = 'validation-hint';
      h.style.cssText = 'display:flex;align-items:flex-start;gap:6px;margin-top:6px;font-size:.8rem;font-weight:600;color:var(--red);';
      wrap.appendChild(h);
    }
    return h;
  }

  function clearInvalid(input) {
    var wrap = input.closest('.form-field, .dfield, .auth-field, .field-wrap, .field');
    if (wrap && wrap.classList.contains('invalid')) {
      wrap.classList.remove('invalid');
      var h = wrap.querySelector('.validation-hint');
      if (h) h.remove();
    }
  }

  function flagInvalid(f) {
    var wrap = f.input.closest('.form-field, .dfield, .auth-field, .field-wrap, .field');
    var msg = f.kind === 'number' ? 'Numbers only — no letters or symbols.' : 'Letters only — no numbers or symbols.';
    if (wrap) {
      wrap.classList.add('invalid');
      var m = wrap.querySelector('[data-msg]');
      if (m) m.textContent = msg;
      var err = wrap.querySelector('.field-error');
      if (err) {
        var m2 = err.querySelector('[data-msg]');
        if (m2) m2.textContent = msg;
      } else {
        hintFor(wrap).textContent = msg;
      }
    } else {
      var st = f.input.form && f.input.form.querySelector('#formStatus, .form-status');
      if (st) {
        st.style.display = 'block';
        st.style.color = 'var(--red)';
        st.textContent = msg;
      } else if (f.input.parentNode) {
        hintFor(f.input.parentNode).textContent = msg;
      }
    }
  }

  function onInput() {
    var cur = this.value;
    var nxt = clean(cur, this.__vkind);
    if (nxt !== cur) this.value = nxt;
    clearInvalid(this);
  }

  function onFormSubmit(e) {
    var form = e.target && e.target.tagName === 'FORM' ? e.target : null;
    if (!form) return;
    var bad = null;
    for (var i = 0; i < fields.length; i++) {
      var f = fields[i];
      if (bad || !form.contains(f.input)) continue;
      if (clean(f.input.value, f.kind) !== f.input.value) bad = f;
    }
    if (!bad) return;
    e.preventDefault();
    e.stopPropagation();
    flagInvalid(bad);
    if (bad.input.focus) { try { bad.input.focus(); } catch (err) {} }
  }

  function init() {
    document.querySelectorAll('form').forEach(function (form) {
      form.querySelectorAll('input[type="text"], input[type="tel"], input[type="number"], input:not([type])').forEach(function (input) {
        var kind = classify(input);
        if (!kind) return;
        var v = input.value;
        var c = clean(v, kind);
        if (c !== v) input.value = c;
        input.__vkind = kind;
        input.addEventListener('input', onInput);
        fields.push({ input: input, kind: kind });
      });
    });
    document.addEventListener('submit', onFormSubmit, true);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
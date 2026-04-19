/**
 * voice.js — Speech-to-Text (STT) + Text-to-Speech (TTS)
 * STT bug fix: previous words no longer get erased when speaking new words.
 * The key fix: use a single `committedText` variable that only grows,
 * and only show interim results as a preview on top of it.
 */

const Voice = (() => {
  const SR    = window.SpeechRecognition || window.webkitSpeechRecognition || null;
  const synth = window.speechSynthesis || null;

  let recognition  = null;
  let activeBtn    = null;
  let isSpeaking   = false;
  let isListening  = false;

  // ─── Attach mic button to a textarea/input ────────────────────────────────
  function attachMic(inputId, btnId) {
    const btn   = document.getElementById(btnId);
    const input = document.getElementById(inputId);
    if (!btn || !input) {
      console.warn(`[Voice] attachMic: #${inputId} or #${btnId} not found`);
      return;
    }

    if (!SR) {
      btn.title         = 'Voice input not supported — use Chrome or Edge';
      btn.style.opacity = '0.4';
      btn.style.cursor  = 'not-allowed';
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        _toast('Voice input requires Chrome or Edge.', 'error');
      });
      return;
    }

    btn.title = 'Click to speak';

    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (isListening && activeBtn === btn) {
        _stopRecognition();
      } else {
        if (isListening) _stopRecognition();
        _startRecognition(input, btn);
      }
    });
  }

  function _startRecognition(input, btn) {
    try { recognition = new SR(); }
    catch (e) { _toast('Could not start voice recognition.', 'error'); return; }

    recognition.lang            = 'en-US';
    recognition.interimResults  = true;
    recognition.maxAlternatives = 1;
    recognition.continuous      = true;

    activeBtn   = btn;
    isListening = true;
    btn.classList.add('mic-active');
    btn.title = 'Listening… click to stop';

    // ── THE FIX ──────────────────────────────────────────────────────────────
    // committedText = everything already in the box + everything finalized so far
    // We NEVER touch this variable from interim results — only from final results.
    // Interim results are shown as a temporary preview appended to committedText.
    let committedText = input.value;

    recognition.onresult = (e) => {
      let interimTranscript = '';

      for (let i = e.resultIndex; i < e.results.length; i++) {
        const transcript = e.results[i][0].transcript;

        if (e.results[i].isFinal) {
          // Finalized word/phrase — add a space and commit it permanently
          committedText += transcript + ' ';
          interimTranscript = ''; // clear interim since this phrase is done
        } else {
          // Still speaking — accumulate interim preview
          interimTranscript += transcript;
        }
      }

      // Show committed + current interim preview in the textarea
      input.value = committedText + interimTranscript;
      input.dispatchEvent(new Event('input', { bubbles: true }));
    };

    recognition.onerror = (e) => {
      const map = {
        'not-allowed':         'Microphone access denied. Click the 🔒 icon in the address bar → Allow microphone.',
        'no-speech':           'No speech detected. Please speak clearly and try again.',
        'network':             'Network error during voice recognition.',
        'audio-capture':       'No microphone found.',
        'service-not-allowed': 'Voice recognition blocked. Use localhost or HTTPS.',
        'aborted':             null,
      };
      const msg = map[e.error];
      if (msg) _toast(msg, 'error');
      _stopRecognition();
    };

    recognition.onend = () => {
      // Auto-restart if user hasn't manually stopped (browser stops after silence)
      if (isListening && activeBtn === btn) {
        try { recognition.start(); }
        catch (_) { _stopRecognition(); }
      }
    };

    try { recognition.start(); }
    catch (err) {
      _toast('Could not start microphone: ' + err.message, 'error');
      _stopRecognition();
    }
  }

  function _stopRecognition() {
    isListening = false;
    if (recognition) {
      try { recognition.stop(); }  catch (_) {}
      try { recognition.abort(); } catch (_) {}
      recognition = null;
    }
    if (activeBtn) {
      activeBtn.classList.remove('mic-active');
      activeBtn.title = 'Click to speak';
    }
    activeBtn = null;
  }

  // ─── Text-to-Speech ────────────────────────────────────────────────────────
  function speak(text, speakBtnId) {
    if (!synth) { _toast('Text-to-speech not supported in this browser.', 'error'); return; }
    if (!text?.trim()) return;

    if (isSpeaking) { _stopSpeaking(speakBtnId); return; }

    synth.cancel();

    const clean = text
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"').replace(/\s+/g, ' ').trim();

    const chunks = _splitChunks(clean, 200);
    let idx = 0;

    isSpeaking = true;
    _setSpeakBtn(speakBtnId, true);

    function next() {
      if (idx >= chunks.length || !isSpeaking) { _stopSpeaking(speakBtnId); return; }
      const u = new SpeechSynthesisUtterance(chunks[idx++]);
      u.rate = 0.92; u.pitch = 1; u.volume = 1; u.lang = 'en-US';
      u.onend  = next;
      u.onerror = (e) => { if (e.error !== 'interrupted') console.warn('[TTS]', e.error); _stopSpeaking(speakBtnId); };
      synth.speak(u);
    }
    next();
  }

  function _stopSpeaking(id) {
    isSpeaking = false;
    synth?.cancel();
    _setSpeakBtn(id, false);
  }

  function _setSpeakBtn(id, on) {
    const btn = document.getElementById(id);
    if (!btn) return;
    btn.classList.toggle('speaking', on);
    btn.title = on ? 'Click to stop' : 'Read aloud';
  }

  function _splitChunks(text, max) {
    const sents = text.match(/[^.!?\n]+[.!?\n]*/g) || [text];
    const out = []; let cur = '';
    for (const s of sents) {
      if ((cur + s).length > max) { if (cur.trim()) out.push(cur.trim()); cur = s; }
      else cur += s;
    }
    if (cur.trim()) out.push(cur.trim());
    return out.length ? out : [text];
  }

  function _toast(msg, type) {
    if (typeof UI !== 'undefined') UI.toast(msg, type);
    else console.warn('[Voice]', msg);
  }

  return { attachMic, speak, stop: () => { _stopRecognition(); _stopSpeaking(); }, isSupported: !!SR };
})();

(() => {
  'use strict';
  const SUPABASE_URL = 'https://qyuczfpgydgqywgthgrz.supabase.co';
  const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_2NLEuDREplLS9DgUXeA8Tw_f8MJOhCq';
  if (!window.supabase) return;
  const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
  let currentUser = null;
  let isSignUp = false;
  const $ = id => document.getElementById(id);
  const button = $('loginBtn'), modal = $('loginModal'), close = $('loginClose');
  const form = $('loginForm'), email = $('loginEmail'), password = $('loginPassword');
  const submit = $('authSubmitBtn'), message = $('authMessage');
  const title = $('loginModalTitle'), sub = $('loginModalSub'), toggle = $('toggleAuthMode'), toggleText = $('toggleText');
  const avatar = $('loginAvatar'), buttonText = $('loginBtnText'), forgot = $('loginForgot');
  if (!button || !modal || !form) return;
  const showMessage = (text, type = 'error') => { message.textContent = text; message.className = `login-message ${type}`; };
  const hideMessage = () => { message.textContent = ''; message.className = 'login-message'; };
  const setMode = signUp => {
    isSignUp = signUp;
    title.textContent = signUp ? 'Create account' : 'Sign in';
    sub.textContent = signUp ? 'Join the FEDPromptly community' : 'Enter your credentials to continue';
    submit.textContent = signUp ? 'Sign up' : 'Sign in';
    toggle.textContent = signUp ? 'Sign in' : 'Sign up';
    toggleText.textContent = signUp ? 'Already have an account?' : 'New here?';
    hideMessage();
  };
  const updateButton = user => {
    currentUser = user || null;
    if (currentUser) {
      const name = currentUser.email ? currentUser.email.split('@')[0] : 'User';
      buttonText.textContent = name;
      avatar.textContent = name.charAt(0).toUpperCase();
      button.classList.add('logged-in');
      button.title = 'Click to log out';
    } else {
      buttonText.textContent = 'Login';
      avatar.innerHTML = '<img src="assets/mark.svg" alt="">';
      button.classList.remove('logged-in');
      button.title = 'Click to log in';
    }
  };
  const open = () => { modal.classList.add('active'); document.body.style.overflow = 'hidden'; hideMessage(); setTimeout(() => email.focus(), 60); };
  const closeModal = () => { modal.classList.remove('active'); document.body.style.overflow = ''; hideMessage(); };
  button.addEventListener('click', () => { if (currentUser) { if (window.confirm('Log out of FEDPromptly?')) client.auth.signOut(); } else open(); });
  close.addEventListener('click', closeModal);
  modal.addEventListener('click', event => { if (event.target === modal) closeModal(); });
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && modal.classList.contains('active')) closeModal(); });
  toggle.addEventListener('click', () => { setMode(!isSignUp); form.reset(); });
  forgot.addEventListener('click', async () => {
    const value = email.value.trim();
    if (!value) { showMessage('Enter your email address first.'); email.focus(); return; }
    try { const { error } = await client.auth.resetPasswordForEmail(value, { redirectTo: window.location.href }); if (error) throw error; showMessage('Password reset email sent. Check your inbox.', 'info'); }
    catch (error) { showMessage(error.message || 'Unable to send the reset email.'); }
  });
  form.addEventListener('submit', async event => {
    event.preventDefault();
    const value = email.value.trim(), secret = password.value;
    if (!value || !secret) { showMessage('Please fill in all fields.'); return; }
    submit.disabled = true; submit.textContent = isSignUp ? 'Creating…' : 'Signing in…'; hideMessage();
    try {
      let result;
      if (isSignUp) result = await client.auth.signUp({ email: value, password: secret, options: { emailRedirectTo: window.location.href } });
      else result = await client.auth.signInWithPassword({ email: value, password: secret });
      if (result.error) throw result.error;
      if (isSignUp && !result.data.session) showMessage('Check your email to confirm your account.', 'info');
      else { updateButton(result.data.user); showMessage(isSignUp ? 'Account created.' : `Welcome back, ${value.split('@')[0]}!`, 'success'); setTimeout(closeModal, 850); }
    } catch (error) {
      let text = error.message || 'Authentication failed.';
      if (text.includes('Invalid login credentials')) text = 'Invalid email or password.';
      if (text.includes('Email not confirmed')) text = 'Please verify your email address first.';
      if (text.includes('User already registered')) text = 'This email is already registered. Please sign in.';
      showMessage(text);
    } finally { submit.disabled = false; submit.textContent = isSignUp ? 'Sign up' : 'Sign in'; }
  });
  client.auth.onAuthStateChange((event, session) => { if (event === 'SIGNED_OUT') updateButton(null); else if (session) updateButton(session.user); });
  client.auth.getSession().then(({ data }) => updateButton(data.session?.user || null)).catch(() => updateButton(null));
  updateButton(null);
})();

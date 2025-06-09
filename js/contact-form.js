import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

// Supabase connection
const supabase = createClient(
  'https://efvxihgndvaevspelpsa.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVmdnhpaGduZHZhZXZzcGVscHNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkzOTQ0NTksImV4cCI6MjA2NDk3MDQ1OX0.Nwzeta4FOJGRC0J0xam8AwY6MUbnj7QxDV_MqwsaX2c'
);

const form = document.getElementById('contactForm');
const responseEl = document.getElementById('formResponse');

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const name = document.getElementById('contactName').value.trim();
  const email = document.getElementById('contactEmail').value.trim();
  const message = document.getElementById('contactMessage').value.trim();

  if (!name || !email || !message) {
    responseEl.textContent = 'Please fill in all fields.';
    return;
  }

  const { error } = await supabase.from('contact_messages').insert([
    { name, email, message }
  ]);

  if (error) {
    console.error('Error submitting form:', error);
    responseEl.textContent = 'Failed to send message. Please try again.';
  } else {
    responseEl.textContent = 'Thank you for contacting us!';
    form.reset();
  }
});

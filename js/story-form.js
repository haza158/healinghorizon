import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

// Supabase connection
const supabase = createClient(
  'https://efvxihgndvaevspelpsa.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVmdnhpaGduZHZhZXZzcGVscHNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkzOTQ0NTksImV4cCI6MjA2NDk3MDQ1OX0.Nwzeta4FOJGRC0J0xam8AwY6MUbnj7QxDV_MqwsaX2c'
);

const form = document.getElementById('storyForm');
const responseEl = document.getElementById('storyFormResponse');

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const name = document.getElementById('storyName').value.trim();
  const story = document.getElementById('storyContent').value.trim();
  const consent = document.getElementById('consentCheckbox').checked;

  if (!name || !story) {
    responseEl.textContent = 'Please complete all fields and provide consent.';
    return;
  }

  const { error } = await supabase.from('shared_stories').insert([
    { name, story, consent_to_share: consent }
  ]);

  if (error) {
    console.error('Error submitting story:', error);
    responseEl.textContent = 'Failed to submit your story. Please try again.';
  } else {
    responseEl.textContent = 'Thank you for sharing your story!';
    form.reset();
  }
});

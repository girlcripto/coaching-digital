document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('.lead-form');

  if (!form) {
    return;
  }

  const statusMessage = document.getElementById('form-status');

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());

    if (statusMessage) {
      statusMessage.textContent = 'Enviando seu cadastro...';
      statusMessage.className = 'status-message';
    }

    try {
      const response = await fetch('/api/lead', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Erro ao enviar');
      }

      if (statusMessage) {
        statusMessage.textContent = result.message;
        statusMessage.className = 'status-message success';
      }

      form.reset();
    } catch (error) {
      if (statusMessage) {
        statusMessage.textContent = error.message || 'Erro inesperado';
        statusMessage.className = 'status-message error';
      }
    }
  });
});

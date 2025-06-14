window.onload = () => {
  fetch('/user')
    .then(res => {
      if (!res.ok) throw new Error();
      return res.json();
    })
    .then(data => {
      document.getElementById('not-auth').classList.add('hidden');
      document.getElementById('auth').classList.remove('hidden');
      document.getElementById('welcome').textContent = `Bienvenue, ${data.user.username} !`;
    })
    .catch(() => {
      document.getElementById('not-auth').classList.remove('hidden');
      document.getElementById('auth').classList.add('hidden');
    });
};

function deploy() {
  const repoUrl = document.getElementById('repo').value;
  fetch('/deploy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ repoUrl })
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        document.getElementById('result').innerHTML = `✅ Déployé : <a href="${data.url}" target="_blank">${data.url}</a>`;
      } else {
        document.getElementById('result').textContent = data.error;
      }
    });
}

function logout() {
  window.location.href = '/logout';
}

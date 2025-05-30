document.getElementById("registerForm").onsubmit = async function(e) {
    e.preventDefault();
    const username = document.getElementById("register-username").value.trim();
    const email = document.getElementById("register-email").value.trim();
    const password = document.getElementById("register-password").value;
    const errorDiv = document.getElementById("register-error");
    const successDiv = document.getElementById("register-success");
    errorDiv.style.display = "none";
    successDiv.style.display = "none";
  
    if (!username || !email || !password) {
      errorDiv.innerText = "Completează toate câmpurile!";
      errorDiv.style.display = "block";
      return;
    }
  
    try {
      const res = await fetch("/user/register", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({ username, email, password })
      });
  
      const data = await res.json();
  
      if (data.success) {
        successDiv.innerText = "Cont creat cu succes! Poți să te autentifici acum.";
        successDiv.style.display = "block";
        errorDiv.style.display = "none";
        document.getElementById("registerForm").reset();
        setTimeout(() => window.location.href = "login.html", 1400);
      } else {
        errorDiv.innerText = data.error || "Eroare la înregistrare!";
        errorDiv.style.display = "block";
      }
    } catch (err) {
      errorDiv.innerText = "Eroare server!";
      errorDiv.style.display = "block";
    }
  }
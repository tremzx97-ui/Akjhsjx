async function login() {
  const username = document.getElementById("username").value;
  const key = document.getElementById("key").value;
  const hwid = document.getElementById("hwid").value;

  const res = await fetch("/login", {
    method: "POST",
    headers: { "Content-Type":"application/json" },
    body: JSON.stringify({ username, key, hwid })
  });

  const data = await res.json();
  document.getElementById("msg").innerText = data.message;
}

async function adminLogin() {
  const username = document.getElementById("adminUser").value;
  const password = document.getElementById("adminPass").value;

  const res = await fetch("/admin/login", {
    method: "POST",
    headers: { "Content-Type":"application/json" },
    body: JSON.stringify({ username, password })
  });

  const data = await res.json();
  document.getElementById("adminMsg").innerText = data.message;
  if(data.success) alert("Bem-vindo Admin!");
}
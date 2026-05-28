const url = "https://script.google.com/macros/s/AKfycbwAAnH2xmD2wpZye7AjXhu_mt8Bx5ZkBHrohpfXbCZU6dMns-notQ0LcaJTodyUHXQ/exec";

async function testGas() {
  const payload = {
    to: "andres2004tenorio98@gmail.com",
    subject: "Prueba desde Node",
    type: "WELCOME",
    data: {
      first_name: "Andres",
      full_name: "Andres",
      mensaje: "Test"
    }
  };

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: JSON.stringify(payload)
    });
    const text = await res.text();
    console.log("Status:", res.status);
    console.log("Body:", text);
  } catch (e) {
    console.error("Fetch error:", e);
  }
}

testGas();

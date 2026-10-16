const sendBrevoEmail = async ({ toEmail, toName, subject, htmlContent }) => {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL;
  const senderName = process.env.BREVO_SENDER_NAME || "Arogya Dental";

  if (!apiKey || !senderEmail) {
    return;
  }

  const payload = {
    sender: {
      name: senderName,
      email: senderEmail
    },
    to: [
      {
        email: toEmail,
        name: toName
      }
    ],
    subject,
    htmlContent
  };

  try {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": apiKey
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      console.error("Brevo email send failed with status", response.status);
    }
  } catch (error) {
    console.error("Brevo email send failed:", error.message);
  }
};

module.exports = {
  sendBrevoEmail
};

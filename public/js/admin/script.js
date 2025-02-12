document.getElementById("generateOtpBtn").addEventListener("click", () => {
    const email = document.getElementById("emailInput").value;
    const messageBox = document.getElementById("message");

    if (!email) {
        toastr["error"]("The Email Field can't be empty", "Email Required")
        return;
    }

    fetch("/check-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            messageBox.textContent = "OTP sent successfully!";
            messageBox.style.color = "green";
        } else {
            messageBox.textContent = "Email not found!";
            messageBox.style.color = "red";
        }
        messageBox.style.display = "block";
    })
    .catch(error => {
        console.error("Error:", error);
        messageBox.textContent = "Something went wrong.";
        messageBox.style.color = "red";
        messageBox.style.display = "block";
    });
});
function validateForm() {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; 
    const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;

    
    const emailError = document.getElementById("email-error");
    const passwordError = document.getElementById("password-error");

   
    emailError.textContent = "";
    passwordError.textContent = "";

    let valid = true;

   
    if (!emailPattern.test(email)) {
        emailError.textContent = "Invalid Email ";
        valid = false;
    }

  
    if (!passwordPattern.test(password)) {
        passwordError.textContent = "Invalid Password";
        valid = false;
    }

    return valid;
}

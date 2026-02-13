

async function validateForm(event) {
    event.preventDefault(); 

    
    const name = document.querySelector('input[name="name"]').value.trim();
    const phone = document.querySelector('input[name="phone"]').value.trim();
    const email = document.querySelector('input[name="email"]').value.trim();
    const password = document.querySelector('input[name="password"]').value;
    const confirmPassword = document.querySelector('input[name="confirm_password"]').value;

    
    const nameError = document.getElementById('name-error');
    const phoneError = document.getElementById('phone-error');
    const emailError = document.getElementById('email-error');
    const passwordError = document.getElementById('password-error');
    const confirmPasswordError = document.getElementById('confirm-password-error');

   
    const namePattern = /^[a-zA-Z\s]+$/;
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phonePattern = /^[0-9]{10}$/;
    // const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@#!$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])[A-Za-z\d@#!$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]{8,}$/;


   
    nameError.style.display = 'none';
    phoneError.style.display = 'none';
    emailError.style.display = 'none';
    passwordError.style.display = 'none';
    confirmPasswordError.style.display = 'none';

    let isValid = true;

    
    if (name === "") {
        nameError.textContent = "Name is required.";
        nameError.style.display = 'block';
        isValid = false;
    } else if (!namePattern.test(name)) {
        nameError.textContent = "Name should contain only letters and spaces.";
        nameError.style.display = 'block';
        isValid = false;
    }

    if (phone === "") {
        phoneError.textContent = "Phone number is required.";
        phoneError.style.display = 'block';
        isValid = false;
    } else if (!phonePattern.test(phone)) {
        phoneError.textContent = "Phone number must be exactly 10 digits.";
        phoneError.style.display = 'block';
        isValid = false;
    }

    if (email === "") {
        emailError.textContent = "Email is required.";
        emailError.style.display = 'block';
        isValid = false;
    } else if (!emailPattern.test(email)) {
        emailError.textContent = "Please enter a valid email address.";
        emailError.style.display = 'block';
        isValid = false;
    }

    if (password === "") {
        passwordError.textContent = "Password is required.";
        passwordError.style.display = 'block';
        isValid = false;
    
    } else if (!passwordPattern.test(password)) {
        passwordError.textContent = "Password must include minimum 8 characters, uppercase, lowercase and special characters.";
        passwordError.style.display = 'block';
        isValid = false;
    }

    if (confirmPassword === "") {
        confirmPasswordError.textContent = "Please confirm your password.";
        confirmPasswordError.style.display = 'block';
        isValid = false;
    } else if (password !== confirmPassword) {
        confirmPasswordError.textContent = "Passwords do not match.";
        confirmPasswordError.style.display = 'block';
        isValid = false;
    }

   
    if (!isValid) return;

    try {
       
        
        const response = await axios.post('/register', {
            name,
            phone,
            email,
            password,
            confirm_password: confirmPassword,
        });

        if (response.status === 200) {
            Swal.fire({
                icon: 'success',
                title: 'Registration Successful',
                text: 'Redirecting to OTP page...',
                timer: 3000,
                timerProgressBar: true,
                showConfirmButton: false,
            }).then((res) => {
                
                    window.location.href = "/registerOTP"; 
                
            });
        
        }
    } catch (error) {
        if (error.response && error.response.status === 400) {
            alert(error.response.data); 
        } else {
            console.error(error);
            alert("An unexpected error occurred.");
        }
    }




}


document.addEventListener('DOMContentLoaded', () => {
    const container = document.querySelector(".container");
    const signUpBtn = document.querySelector("#sign-up-btn");
    const signInBtn = document.querySelector("#sign-in-btn");
    const signUpForm = document.querySelector(".sign-up-form");
    const signInForm = document.querySelector(".sign-in-form");

    // Animaciones de cambio de formulario
    signUpBtn.addEventListener("click", () => {
        container.classList.add("sign-up-mode");
    });

    signInBtn.addEventListener("click", () => {
        container.classList.remove("sign-up-mode");
    });

    // Función de validación de email
    function isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    // Registro
    signUpForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        
        const username = signUpForm.querySelector('input[type="text"]').value.trim();
        const email = signUpForm.querySelector('input[type="email"]').value.trim();
        const password = signUpForm.querySelector('input[type="password"]').value.trim();

        if (!username || !email || !password) {
            await Swal.fire({
                icon: 'warning',
                title: 'Campos incompletos',
                text: 'Por favor, completa todos los campos.'
            });
            return;
        }

        if (!isValidEmail(email)) {
            await Swal.fire({
                icon: 'error',
                title: 'Email inválido',
                text: 'Por favor, ingresa un correo electrónico válido.'
            });
            return;
        }

        try {
            const users = JSON.parse(localStorage.getItem("users")) || [];
            
            if (users.some(user => user.email === email)) {
                await Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Este correo electrónico ya está registrado.'
                });
                return;
            }

            users.push({ username, email, password });
            localStorage.setItem("users", JSON.stringify(users));
            
            await Swal.fire({
                icon: 'success',
                title: '¡Registro exitoso!',
                text: 'Ahora puedes iniciar sesión.'
            });
            
            container.classList.remove("sign-up-mode");
            signUpForm.reset();
        } catch (error) {
            console.error(error);
            await Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Hubo un problema al registrar el usuario.'
            });
        }
    });

    // Inicio de sesión
    signInForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        
        const email = signInForm.querySelector('input[type="email"]').value.trim();
        const password = signInForm.querySelector('input[type="password"]').value.trim();

        if (!email || !password) {
            await Swal.fire({
                icon: 'warning',
                title: 'Campos incompletos',
                text: 'Por favor, completa todos los campos.'
            });
            return;
        }

        try {
            const users = JSON.parse(localStorage.getItem("users")) || [];
            const user = users.find(user => user.email === email && user.password === password);

            if (!user) {
                await Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Correo electrónico o contraseña incorrectos.'
                });
                return;
            }

            localStorage.setItem("currentUser", JSON.stringify(user));
            await Swal.fire({
                icon: 'success',
                title: '¡Bienvenido!',
                text: 'Inicio de sesión exitoso.'
            });
            window.location.href = "gestor.html";
        } catch (error) {
            console.error(error);
            await Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Hubo un problema al iniciar sesión.'
            });
        }
    });
});

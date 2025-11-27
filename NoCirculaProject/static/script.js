// Variable global para almacenar los datos del nuevo usuario temporalmente
let newUserData = {};
let verificationCode = '';

document.addEventListener('DOMContentLoaded', () => {
    // ------------------------------------------------------------------
    // Variables de Modales y Formularios (index.html)
    // ------------------------------------------------------------------
    const updatesModal = document.getElementById("updatesModal");
    const openUpdatesBtn = document.getElementById("openUpdatesModal");
    const closeUpdatesBtn = document.getElementById("closeUpdatesModal");
    
    const registerModal = document.getElementById("registerModal");
    const openRegisterBtn = document.getElementById("openRegisterModal");
    const closeRegisterBtn = document.getElementById("closeRegisterBtn");
    const registerForm = document.getElementById("registerForm");
    const registroExito = document.getElementById("registroExito");
    
    // Variables para Verificación
    const verificationModal = document.getElementById("verificationModal");
    const verificationCodeInput = document.getElementById("verificationCode");
    const verifyButton = document.getElementById("verifyButton");
    const verificationError = document.getElementById("verificationError");
    const resendCodeButton = document.getElementById("resendCodeButton");
    
    // NUEVA VARIABLE: Elemento donde se mostrará el código (Restablecido)
    const displayCode = document.getElementById("displayCode");
    
    // Variables para las listas de Marca/Modelo
    const marcaSelect = document.getElementById("reg_marca");
    const modeloSelect = document.getElementById("reg_modelo");

    // ------------------------------------------------------------------
    // DATOS DE MARCAS Y MODELOS
    // ------------------------------------------------------------------
    const marcasYModelos = {
        "": ["Selecciona una marca primero"],
        "Nissan": ["Sentra", "Versa", "Altima", "Kicks", "March"],
        "Chevrolet": ["Aveo", "Onix", "Spark", "Malibu", "Trax"],
        "Volkswagen": ["Jetta", "Vento", "Gol", "Tiguan", "Passat"],
        "Ford": ["Focus", "Fiesta", "Escape", "Fusion", "Mustang"],
        "Toyota": ["Corolla", "Camry", "RAV4", "Yaris"],
        "Honda": ["Civic", "CR-V", "HR-V", "Accord"],
        "Mazda": ["Mazda 3", "Mazda CX-5", "Mazda 6"],
        "Kia": ["Rio", "Forte", "Seltos"],
        "Hyundai": ["Grand i10", "Elantra", "Tucson"]
    };

    // ------------------------------------------------------------------
    // Lógica de Selectores Encadenados (Marca y Modelo) - Solo en index.html
    // ------------------------------------------------------------------
    if (marcaSelect && modeloSelect) {
        function cargarMarcas() {
            for (const marca in marcasYModelos) {
                if (marca !== "") {
                    const option = document.createElement('option');
                    option.value = marca;
                    option.textContent = marca;
                    marcaSelect.appendChild(option);
                }
            }
        }
        cargarMarcas();

        marcaSelect.addEventListener('change', () => {
            const marcaSeleccionada = marcaSelect.value;
            
            modeloSelect.innerHTML = '<option value="">Selecciona un modelo</option>';
            modeloSelect.disabled = true;

            if (marcaSeleccionada && marcasYModelos[marcaSeleccionada]) {
                const modelos = marcasYModelos[marcaSeleccionada];
                modelos.forEach(modelo => {
                    const option = document.createElement('option');
                    option.value = modelo;
                    option.textContent = modelo;
                    modeloSelect.appendChild(option);
                });
                modeloSelect.disabled = false;
            } else {
                modeloSelect.innerHTML = '<option value="">Selecciona una marca primero</option>';
            }
        });
    }

    // ------------------------------------------------------------------
    // Inicialización de Usuarios y Modales
    // ------------------------------------------------------------------
    
    // Asegura que siempre exista la lista de usuarios con el admin por defecto
    if (!localStorage.getItem('usuarios')) {
        const usuariosIniciales = [
            { 
                usuario: "admin", contrasena: "admin123", nombre: "Administrador", apellido: "Global", 
                placa: "ABC-123", marca: "Chevrolet", modelo: "Trax", curp: "CURP-ADMIN", 
                email: "admin@ejemplo.com", celular: "55-1234-5678" 
            }
        ];
        localStorage.setItem('usuarios', JSON.stringify(usuariosIniciales));
    }
    
    // Configuración inicial de modales
    if (updatesModal) updatesModal.style.display = "none";
    if (registerModal) registerModal.style.display = "none";
    if (verificationModal) verificationModal.style.display = "none";

    // Manejo de clicks para abrir/cerrar modales
    if(openRegisterBtn) openRegisterBtn.onclick = function() {
        registerModal.style.display = "flex"; 
        registroExito.style.display = 'none'; 
        registerForm.reset(); 
        registerForm.querySelectorAll('input, button, select').forEach(el => el.disabled = false); 
        if (modeloSelect) modeloSelect.disabled = true;
    }

    if(closeRegisterBtn) closeRegisterBtn.onclick = function() { registerModal.style.display = "none"; }
    if(closeUpdatesBtn) closeUpdatesBtn.onclick = function() { updatesModal.style.display = "none"; }
    if(openUpdatesBtn) openUpdatesBtn.onclick = function() { updatesModal.style.display = "flex"; }

    window.onclick = function(event) {
        if (event.target == registerModal) { registerModal.style.display = "none"; }
        if (event.target == updatesModal) { updatesModal.style.display = "none"; }
    }

    // ------------------------------------------------------------------
    // Lógica de Registro (ENVÍO DEL FORMULARIO)
    // ------------------------------------------------------------------
    if(registerForm) {
        registerForm.addEventListener('submit', (e) => {
            e.preventDefault();

            // Validación del límite de 6 caracteres (aunque el HTML ya lo hace, es buena práctica validarlo en JS)
            const placaInput = document.getElementById('reg_placa').value;
            if (placaInput.length > 6) {
                registroExito.textContent = "❌ Error: La placa no debe exceder los 6 caracteres.";
                registroExito.style.color = '#ff4d4d'; 
                registroExito.style.display = 'block';
                return;
            }


            newUserData = { // Almacena datos temporalmente
                nombre: document.getElementById('reg_nombre').value,
                apellido: document.getElementById('reg_apellido').value,
                placa: placaInput, // Usamos la placa validada
                marca: marcaSelect.value, 
                modelo: modeloSelect.value, 
                curp: document.getElementById('reg_curp').value,
                email: document.getElementById('reg_email').value,
                celular: document.getElementById('reg_celular').value,
                usuario: document.getElementById('reg_usuario').value,
                contrasena: document.getElementById('reg_contrasena').value, 
            };

            const usuariosGuardados = JSON.parse(localStorage.getItem('usuarios')) || [];
            const usuarioExistente = usuariosGuardados.find(u => u.usuario === newUserData.usuario);

            if (usuarioExistente) {
                registroExito.textContent = "❌ Error: El nombre de usuario ya existe. Intente con otro.";
                registroExito.style.color = '#ff4d4d'; 
                registroExito.style.display = 'block';
                return;
            }

            // 1. Oculta el modal de registro
            registerModal.style.display = "none";
            
            // 2. Inicia el proceso de verificación
            startVerificationProcess();
        });
    }

    // ------------------------------------------------------------------
    // Lógica de Verificación Simulada
    // ------------------------------------------------------------------
    
    function generateVerificationCode() {
        // Genera un código de 6 dígitos
        return Math.floor(100000 + Math.random() * 900000).toString();
    }

    function startVerificationProcess() {
        verificationCode = generateVerificationCode();
        
        // CAMBIO CLAVE: Muestra el código en la interfaz
        if(displayCode) displayCode.textContent = `Código de Prueba: ${verificationCode}`;
        
        // Opcional: También lo dejamos en consola (por si acaso)
        console.log(`[VERIFICACIÓN]: Código de Prueba Generado: ${verificationCode}`); 
        
        // Muestra el modal de verificación
        verificationError.style.display = 'none';
        verificationCodeInput.value = '';
        verificationModal.style.display = 'flex';
        
        // Simula envío de código (resetea el botón de reenviar)
        resendCodeButton.disabled = true;
        resendCodeButton.textContent = `Reenviar en (30s)`;
        let countdown = 30;
        
        const timer = setInterval(() => {
            countdown--;
            resendCodeButton.textContent = `Reenviar en (${countdown}s)`;
            if (countdown <= 0) {
                clearInterval(timer);
                resendCodeButton.disabled = false;
                resendCodeButton.textContent = 'Reenviar Código';
            }
        }, 1000);
        
        resendCodeButton.onclick = () => {
            clearInterval(timer); // Detiene el temporizador actual
            startVerificationProcess(); // Reinicia el proceso
        };
    }

    if(verifyButton) {
        verifyButton.onclick = function() {
            const code = verificationCodeInput.value.trim(); // Se añade trim() para seguridad
            
            if (code === verificationCode) {
                // Código Correcto: Completa el registro
                completeRegistration();
            } else {
                // Código Incorrecto
                verificationError.textContent = "❌ Código incorrecto. Intente de nuevo.";
                verificationError.style.display = 'block';
            }
        };
    }

    function completeRegistration() {
        const usuariosGuardados = JSON.parse(localStorage.getItem('usuarios')) || [];
        usuariosGuardados.push(newUserData);
        localStorage.setItem('usuarios', JSON.stringify(usuariosGuardados));
        
        // Oculta modal de verificación
        verificationModal.style.display = 'none';
        
        // Muestra el mensaje de éxito en el modal de registro original
        registerModal.style.display = 'flex';
        registroExito.textContent = "✅ ¡Registro completado y verificado con éxito! Ya puedes iniciar sesión.";
        registroExito.style.color = '#1abc9c'; 
        registroExito.style.display = 'block';
        
        // Deshabilita el formulario de registro y lo cierra después de un tiempo
        registerForm.querySelectorAll('input, button, select').forEach(el => el.disabled = true);

        setTimeout(() => {
            registerModal.style.display = "none";
            registerForm.reset();
            // Restablecer el estado del formulario después de cerrar el modal
            registerForm.querySelectorAll('input, button, select').forEach(el => el.disabled = false); 
            if (modeloSelect) modeloSelect.disabled = true;
        }, 4000);
    }

}); // Fin de DOMContentLoaded

// ------------------------------------------------------------------
// Lógica de LOGIN (se mantiene igual)
// ------------------------------------------------------------------
function validarLogin(event) {
    event.preventDefault(); 
    
    const PAGINA_DESTINO = "dashboard.html"; 

    const usuarioInput = document.getElementById('usuario').value;
    const contrasenaInput = document.getElementById('contrasena').value;
    const mensajeError = document.getElementById('mensajeError');

    mensajeError.style.display = 'none';

    const usuarios = JSON.parse(localStorage.getItem('usuarios')) || [];
    const usuarioValidado = usuarios.find(u => 
        u.usuario === usuarioInput && u.contrasena === contrasenaInput
    );

    if (usuarioValidado) {
        sessionStorage.setItem('loggedInUser', JSON.stringify(usuarioValidado)); 
        window.location.href = PAGINA_DESTINO;
        return true; 
    } else {
        mensajeError.textContent = "Usuario o Contraseña incorrectos. Inténtelo de nuevo.";
        mensajeError.style.display = 'block'; 
        return false;
    }
}

// ------------------------------------------------------------------
// Lógica del Dashboard (asume que existe dashboard.html)
// ------------------------------------------------------------------
function loadDashboard() {
    // Esta función solo se usa si estás en dashboard.html
    const userDataString = sessionStorage.getItem('loggedInUser');
    if (!userDataString) {
        window.location.href = "index.html"; 
        return;
    }

    const userData = JSON.parse(userDataString);
    
    // Carga de datos en la tarjeta principal
    document.getElementById('userGreeting').textContent = `¡Bienvenido/a, ${userData.nombre}!`;
    document.getElementById('carMarca').textContent = userData.marca || 'N/A';
    document.getElementById('carModelo').textContent = userData.modelo || 'N/A';
    document.getElementById('userPlaca').textContent = userData.placa || 'N/A';
    document.getElementById('hncPlacaFinal').textContent = userData.placa || 'N/A';
    
    // Carga de datos en el Sidebar
    document.getElementById('sidebarUserName').textContent = `${userData.nombre} ${userData.apellido || ''}`;
    document.getElementById('sidebarUserPlaca').textContent = `Placa: ${userData.placa || 'N/A'}`;
    document.getElementById('sidebarFullName').textContent = `${userData.nombre} ${userData.apellido || ''}`;
    document.getElementById('sidebarCurp').textContent = userData.curp || 'N/A';
    document.getElementById('sidebarMarca').textContent = userData.marca || 'N/A';
    document.getElementById('sidebarModelo').textContent = userData.modelo || 'N/A';
    
    // Carga Email y Celular (NUEVOS)
    document.getElementById('sidebarEmail').textContent = userData.email && userData.email !== "" ? userData.email : 'No registrado';
    document.getElementById('sidebarPhone').textContent = userData.celular && userData.celular !== "" ? userData.celular : 'No registrado';

    // Ilustración
    const carIllustration = document.getElementById('carIllustration');
    const marca = userData.marca ? userData.marca.toLowerCase() : '';

    if (marca.includes('nissan')) {
        carIllustration.innerHTML = '<i class="fas fa-car-side" style="color:#007bff;"></i>'; 
    } else if (marca.includes('chevrolet')) {
        carIllustration.innerHTML = '<i class="fas fa-car-side" style="color:#e74c3c;"></i>'; 
    } else if (marca.includes('vw') || marca.includes('volkswagen')) {
        carIllustration.innerHTML = '<i class="fas fa-car-side" style="color:#2ecc71;"></i>'; 
    } else {
        carIllustration.innerHTML = '<i class="fas fa-car-side" style="color:#95a5a6;"></i>'; 
    }
    
    // Fecha y HNC
    const today = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('currentDate').textContent = today.toLocaleDateString('es-ES', options);

    checkHoyNoCircula(userData.placa, today);
}

/**
 * Verifica si la placa tiene restricción de circulación según el día de la semana.
 * @param {string} placa - El número de placa del vehículo.
 * @param {Date} date - La fecha actual para obtener el día de la semana.
 */
function checkHoyNoCircula(placa, date) {
    // INICIO DE CORRECCIÓN: Lógica HNC
    const lastChar = placa.slice(-1); // Obtener el último caracter (puede ser número o letra)
    const lastDigit = parseInt(lastChar); // Intentar convertir a número. Si es letra, será NaN.
    const dayOfWeek = date.getDay(); // 0 = Domingo, 1 = Lunes, ..., 6 = Sábado
    const hncVerdict = document.getElementById('hncVerdict');

    let noCirculan = [];

    // REGLAS HNC: (El orden de los dígitos ha sido ajustado para que el 0 restrinja el Lunes)
    // Lunes = 1: Restricción para dígitos 0 y 9
    if (dayOfWeek === 1) { noCirculan = [0, 9]; } 
    // Martes = 2: Restricción para dígitos 7 y 8
    else if (dayOfWeek === 2) { noCirculan = [7, 8]; } 
    // Miércoles = 3: Restricción para dígitos 3 y 4 <-- ¡CORREGIDO!
    else if (dayOfWeek === 3) { noCirculan = [3, 4]; } 
    // Jueves = 4: Restricción para dígitos 5 y 6   <-- ¡CORREGIDO!
    else if (dayOfWeek === 4) { noCirculan = [5, 6]; } 
    // Viernes = 5: Restricción para dígitos 1 y 2
    else if (dayOfWeek === 5) { noCirculan = [1, 2]; } 
    // Sábado (6) y Domingo (0): noCirculan es [] (vacío)

    // Condición de NO CIRCULAR: Debe ser día hábil (1-5) Y el último carácter debe ser un dígito
    // Y ese dígito debe estar en la lista de restricción para hoy.
    if (dayOfWeek >= 1 && dayOfWeek <= 5 && !isNaN(lastDigit) && noCirculan.includes(lastDigit)) {
        hncVerdict.innerHTML = `<span style="color: #c0392b; font-weight: bold; font-size: 1.5em;">❌ ¡HOY NO CIRCULA!</span>`;
        hncVerdict.style.backgroundColor = '#f4c7c7';
    } else {
        // Si no cumple las condiciones de NO CIRCULAR, entonces SÍ CIRCULA (incluye fines de semana).
        hncVerdict.innerHTML = `<span style="color: #27ae60; font-weight: bold; font-size: 1.5em;">✅ ¡HOY SÍ CIRCULA!</span>`;
        hncVerdict.style.backgroundColor = '#c7f4c7';
    }
    // FIN DE CORRECCIÓN
}

// Lógica de sidebar y logout para dashboard.html
document.addEventListener('DOMContentLoaded', () => {
    // Estas variables solo se usan si estás en dashboard.html, por eso están dentro de esta función
    const menuButton = document.getElementById('menuIconBtn');
    const sidebar = document.getElementById('sidebar');
    const closeSidebarBtn = document.getElementById('closeSidebarBtn');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    const logoutButton = document.getElementById('sidebarLogoutBtn');

    if (menuButton) {
        menuButton.addEventListener('click', () => {
            sidebar.classList.add('open');
            sidebarOverlay.classList.add('visible');
        });

        closeSidebarBtn.addEventListener('click', () => {
            sidebar.classList.remove('open');
            sidebarOverlay.classList.remove('visible');
        });

        sidebarOverlay.addEventListener('click', () => {
            sidebar.classList.remove('open');
            sidebarOverlay.classList.remove('visible');
        });
    }

    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            sessionStorage.removeItem('loggedInUser');
            window.location.href = 'index.html'; 
        });
    }

    // Si estás en el dashboard, carga los datos
    if (document.body.classList.contains('dashboard-body')) {
        loadDashboard();
    }
});
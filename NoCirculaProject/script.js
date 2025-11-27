// Variable global para almacenar los datos del nuevo usuario temporalmente
let newUserData = {};
let verificationCode = '';

// ======================================================
// 🔥 FUNCIÓN PARA CARGAR USUARIOS DESDE AWS
// ======================================================
async function cargarUsuariosDesdeAPI() {
    try {
        const response = await fetch("https://r9h2peddkg.execute-api.us-east-2.amazonaws.com/main");

        if (!response.ok) {
            throw new Error("Error en el API");
        }

        const data = await response.json();
        console.log("Usuarios desde API:", data);

        // Guardarlos en localStorage para uso local
        localStorage.setItem("usuarios", JSON.stringify(data));

    } catch (error) {
        console.error("❌ Error cargando usuarios desde Lambda:", error);
        console.warn("Usando usuarios locales de emergencia.");
    }
}

// ======================================================
// DOMContentLoaded
// ======================================================
document.addEventListener('DOMContentLoaded', () => {
    // Cargar API
    cargarUsuariosDesdeAPI();

    // ------------------------------------------------------------------
    // Referencias DOM Globales
    // ------------------------------------------------------------------
    const updatesModal = document.getElementById("updatesModal");
    const openUpdatesBtn = document.getElementById("openUpdatesModal");
    const closeUpdatesBtn = document.getElementById("closeUpdatesModal");
    
    const registerModal = document.getElementById("registerModal");
    const openRegisterBtn = document.getElementById("openRegisterModal");
    const closeRegisterBtn = document.getElementById("closeRegisterModal");
    const registerForm = document.getElementById("registerForm");
    const registroExito = document.getElementById("registroExito");
    
    // Verificación
    const verificationModal = document.getElementById("verificationModal");
    const verificationCodeInput = document.getElementById("verificationCode");
    const verifyButton = document.getElementById("verifyButton");
    const verificationError = document.getElementById("verificationError");
    const resendCodeButton = document.getElementById("resendCodeButton");
    const displayCode = document.getElementById("displayCode");
    
    // Selectores
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
    // Configurar Selectores
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
            }
        });
    }

    // ------------------------------------------------------------------
    // Inicialización de Usuarios (Fallback)
    // ------------------------------------------------------------------
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

    // ------------------------------------------------------------------
    // Configuración de Modales Básicos (Registro / Updates)
    // ------------------------------------------------------------------
    if (updatesModal) updatesModal.style.display = "none";
    if (registerModal) registerModal.style.display = "none";
    if (verificationModal) verificationModal.style.display = "none";

    if(openRegisterBtn) openRegisterBtn.onclick = function() {
        registerModal.style.display = "flex"; 
        registroExito.style.display = 'none'; 
        registerForm.reset(); 
        registerForm.querySelectorAll('input, button, select').forEach(el => el.disabled = false); 
        if (modeloSelect) modeloSelect.disabled = true;
    };

    if(closeRegisterBtn) closeRegisterBtn.onclick = () => registerModal.style.display = "none";
    if(closeUpdatesBtn) closeUpdatesBtn.onclick = () => updatesModal.style.display = "none";
    if(openUpdatesBtn) openUpdatesBtn.onclick = () => updatesModal.style.display = "flex";

    window.onclick = function(event) {
        if (event.target == registerModal) registerModal.style.display = "none";
        if (event.target == updatesModal) updatesModal.style.display = "none";
        // Manejo de cierre de modales nuevos también se hace aquí o más abajo
    };

    // ------------------------------------------------------------------
    // Registro (Formulario)
    // ------------------------------------------------------------------
    if(registerForm) {
        registerForm.addEventListener('submit', (e) => {
            e.preventDefault();

            newUserData = { 
                nombre: document.getElementById('reg_nombre').value,
                apellido: document.getElementById('reg_apellido').value,
                placa: document.getElementById('reg_placa').value,
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
                registroExito.textContent = "❌ Error: El nombre de usuario ya existe.";
                registroExito.style.color = '#ff4d4d'; 
                registroExito.style.display = 'block';
                return;
            }

            registerModal.style.display = "none";
            startVerificationProcess();
        });
    }

    // ------------------------------------------------------------------
    // Verificación
    // ------------------------------------------------------------------
    function generateVerificationCode() {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }

    function startVerificationProcess() {
        verificationCode = generateVerificationCode();

        if(displayCode) displayCode.textContent = `Código de Prueba: ${verificationCode}`;
        console.log("Código generado:", verificationCode);

        if(verificationError) verificationError.style.display = 'none';
        if(verificationCodeInput) verificationCodeInput.value = '';
        if(verificationModal) verificationModal.style.display = 'flex';

        if(resendCodeButton) {
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
                clearInterval(timer);
                startVerificationProcess();
            };
        }
    }

    if(verifyButton) {
        verifyButton.onclick = () => {
            const code = verificationCodeInput.value.trim();
            if (code === verificationCode) {
                completeRegistration();
            } else {
                verificationError.textContent = "❌ Código incorrecto.";
                verificationError.style.display = 'block';
            }
        };
    }

    function completeRegistration() {
        const usuariosGuardados = JSON.parse(localStorage.getItem('usuarios')) || [];
        usuariosGuardados.push(newUserData);
        localStorage.setItem('usuarios', JSON.stringify(usuariosGuardados));

        verificationModal.style.display = 'none';
        registerModal.style.display = 'flex';
        registroExito.textContent = "✅ ¡Registro verificado con éxito!";
        registroExito.style.color = '#1abc9c'; 
        registroExito.style.display = 'block';

        registerForm.querySelectorAll('input, button, select').forEach(el => el.disabled = true);

        setTimeout(() => {
            registerModal.style.display = "none";
            registerForm.reset();
            registerForm.querySelectorAll('input, button, select').forEach(el => el.disabled = false); 
            if (modeloSelect) modeloSelect.disabled = true;
        }, 3000);
    }

    // ------------------------------------------------------------------
    // LOGICA DASHBOARD (Sidebar, Logout, y Nuevos Modales)
    // ------------------------------------------------------------------
    
    // Sidebar
    const menuButton = document.getElementById('openSidebarBtn');
    const sidebar = document.getElementById('sidebar');
    const closeSidebarBtn = document.getElementById('closeSidebarBtn');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    const logoutButton = document.getElementById('logoutButton');

    if (menuButton) {
        menuButton.addEventListener('click', () => {
            sidebar.classList.add('open');
            sidebarOverlay.classList.add('visible');
        });
    }
    
    const closeMenu = () => {
        if(sidebar) sidebar.classList.remove('open');
        if(sidebarOverlay) sidebarOverlay.classList.remove('visible');
    };

    if (closeSidebarBtn) closeSidebarBtn.addEventListener('click', closeMenu);
    if (sidebarOverlay) sidebarOverlay.addEventListener('click', closeMenu);

    // Inicializar Dashboard si estamos en esa página
    if (document.body.classList.contains('dashboard-body')) {
        loadDashboard();
        initTramitesModals(); // Iniciar listeners de nuevos modales
    }

}); // FIN DOMContentLoaded


// ======================================================
// LOGIN 
// ======================================================
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
        mensajeError.textContent = "Usuario o Contraseña incorrectos.";
        mensajeError.style.display = 'block'; 
        return false;
    }
}

// ======================================================
// CARGA DE DATOS DASHBOARD
// ======================================================
function loadDashboard() {
    const userDataString = sessionStorage.getItem('loggedInUser');
    if (!userDataString) {
        // Si no hay usuario, redirigir al login
        window.location.href = "index.html"; 
        return;
    }

    const userData = JSON.parse(userDataString);

    // Llenar tarjeta principal
    document.getElementById('userGreeting').textContent = `¡Bienvenido/a, ${userData.nombre}!`;
    document.getElementById('carMarca').textContent = userData.marca || 'N/A';
    document.getElementById('carModelo').textContent = userData.modelo || 'N/A';
    document.getElementById('userPlaca').textContent = userData.placa || 'N/A';
    document.getElementById('hncPlacaFinal').textContent = userData.placa || 'N/A';

    // Llenar Sidebar
    document.getElementById('sidebarUserName').textContent = `${userData.nombre} ${userData.apellido || ''}`;
    document.getElementById('sidebarUserPlaca').textContent = `Placa: ${userData.placa || 'N/A'}`;
    document.getElementById('sidebarFullName').textContent = `${userData.nombre} ${userData.apellido || ''}`;
    document.getElementById('sidebarCurp').textContent = userData.curp || 'N/A';
    document.getElementById('sidebarMarca').textContent = userData.marca || 'N/A';
    document.getElementById('sidebarModelo').textContent = userData.modelo || 'N/A';

    document.getElementById('sidebarEmail').textContent =
        userData.email && userData.email !== "" ? userData.email : 'No registrado';
    document.getElementById('sidebarPhone').textContent =
        userData.celular && userData.celular !== "" ? userData.celular : 'No registrado';

    // Fecha Actual
    const today = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('currentDate').textContent = today.toLocaleDateString('es-ES', options);

    // Ejecutar Lógica Hoy No Circula
    checkHoyNoCircula(userData.placa, today);
}

// ======================================================
// 🚦 LÓGICA HOY NO CIRCULA (AGREGADA)
// ======================================================
function checkHoyNoCircula(placa, fecha) {
    const hncVerdict = document.getElementById('hncVerdict');
    
    // Validaciones de seguridad
    if (!placa) {
        hncVerdict.textContent = "Error: Sin placa";
        return;
    }
    
    // Extraer último dígito numérico
    const ultimoDigito = parseInt(placa.trim().slice(-1));
    
    if (isNaN(ultimoDigito)) {
        hncVerdict.innerHTML = "Placa inválida <br><small>(No termina en número)</small>";
        return;
    }

    const diaSemana = fecha.getDay(); // 0 = Domingo, 1 = Lunes...

    let noCircula = false;

    // Reglas CDMX Simplificadas:
    switch (diaSemana) {
        case 1: if (ultimoDigito === 5 || ultimoDigito === 6) noCircula = true; break;
        case 2: if (ultimoDigito === 7 || ultimoDigito === 8) noCircula = true; break;
        case 3: if (ultimoDigito === 3 || ultimoDigito === 4) noCircula = true; break;
        case 4: if (ultimoDigito === 1 || ultimoDigito === 2) noCircula = true; break;
        case 5: if (ultimoDigito === 9 || ultimoDigito === 0) noCircula = true; break;
        case 6: noCircula = false; break; // Sábados (todos circulan para demo)
        case 0: noCircula = false; break; // Domingos
    }

    // Actualizar la UI con colores visuales
    if (noCircula) {
        hncVerdict.innerHTML = `
            <div style="color: #c0392b; font-size: 3rem; margin-bottom: 10px;">
                <i class="fas fa-ban"></i>
            </div>
            <strong style="color: #c0392b; font-size: 1.4rem;">HOY NO CIRCULAS</strong>
            <p style="font-size: 0.9rem; color: #555;">Tu placa termina en <strong>${ultimoDigito}</strong></p>
        `;
    } else {
        hncVerdict.innerHTML = `
            <div style="color: #27ae60; font-size: 3rem; margin-bottom: 10px;">
                <i class="fas fa-car-side"></i>
            </div>
            <strong style="color: #27ae60; font-size: 1.4rem;">PUEDES CIRCULAR</strong>
            <p style="font-size: 0.9rem; color: #555;">¡Buen viaje!</p>
        `;
    }
}

// ======================================================
// 🆔 LÓGICA DE TRÁMITES (LICENCIA Y PASE TURÍSTICO)
// ======================================================
function initTramitesModals() {
    // Referencias
    const btnLicencia = document.querySelector('.licencia-btn'); 
    const btnTuristico = document.querySelector('.turistico-btn');
    
    const modalLicencia = document.getElementById('licenciaModal');
    const modalTuristico = document.getElementById('turisticoModal');
    
    const closeLicencia = document.getElementById('closeLicenciaModal');
    const closeTuristico = document.getElementById('closeTuristicoModal');
    
    const formLicencia = document.getElementById('formLicencia');
    const formTuristico = document.getElementById('formTuristico');

    // 1. Abrir Licencia
    if (btnLicencia) {
        btnLicencia.addEventListener('click', (e) => {
            e.preventDefault();
            modalLicencia.style.display = 'flex';
        });
    }

    // 2. Abrir Pase Turístico (Y auto-rellenar datos)
    if (btnTuristico) {
        btnTuristico.addEventListener('click', (e) => {
            e.preventDefault();
            modalTuristico.style.display = 'flex';
            
            // Auto-rellenar la placa
            const userData = JSON.parse(sessionStorage.getItem('loggedInUser'));
            if (userData && userData.placa) {
                const inputPlaca = document.getElementById('tour_placa');
                if(inputPlaca) inputPlaca.value = userData.placa;
            }
        });
    }

    // Cerrar Modales
    if (closeLicencia) closeLicencia.onclick = () => modalLicencia.style.display = 'none';
    if (closeTuristico) closeTuristico.onclick = () => modalTuristico.style.display = 'none';

    // Cerrar al dar clic fuera
    window.addEventListener('click', (event) => {
        if (event.target == modalLicencia) modalLicencia.style.display = "none";
        if (event.target == modalTuristico) modalTuristico.style.display = "none";
    });

    // Envio Licencia (Simulado)
    if (formLicencia) {
        formLicencia.addEventListener('submit', (e) => {
            e.preventDefault();
            const rfc = document.getElementById('lic_rfc').value;
            alert(`✅ Solicitud recibida.\n\nSe ha procesado el pago para el RFC: ${rfc}.\nTe enviaremos la confirmación a tu correo.`);
            modalLicencia.style.display = 'none';
            formLicencia.reset();
        });
    }

    // Envio Pase Turístico (Simulado)
    if (formTuristico) {
        formTuristico.addEventListener('submit', (e) => {
            e.preventDefault();
            const procedencia = document.getElementById('tour_procedencia').value;
            const fecha = document.getElementById('tour_fecha').value;
            alert(`🚗 ¡Pase Turístico Generado!\n\nVálido para vehículos de ${procedencia}.\nA partir del: ${fecha}.\n\nDescarga el PDF en la siguiente pantalla.`);
            modalTuristico.style.display = 'none';
            formTuristico.reset();
        });
    }
}

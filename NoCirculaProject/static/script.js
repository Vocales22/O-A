// Variable global para almacenar los datos del nuevo usuario temporalmente
let newUserData = {};
let verificationCode = '';

// ======================================================
// 🔥 CARGA DE DATOS + ADAPTADOR DE COMPATIBILIDAD
// ======================================================
async function cargarUsuariosDesdeAPI() {
    try {
        const response = await fetch("/api/usuarios");

        if (!response.ok) {
            throw new Error("Error en el servidor Flask");
        }

        const dataRaw = await response.json();
        console.log("Datos crudos desde AWS:", dataRaw);

        // --------------------------------------------------------
        // 🔧 EL ADAPTADOR: Transformamos los datos de AWS
        // para que funcionen con tu página (agregamos autos y password)
        // --------------------------------------------------------
        const usuariosAdaptados = dataRaw.map(u => {
            // Si el usuario viene de AWS (tiene 'username'), lo adaptamos
            if (u.username) {
                // Generamos una placa aleatoria para probar Hoy No Circula
                const numAleatorio = Math.floor(Math.random() * 10); // 0-9
                const placaFake = `AWS-77${numAleatorio}`; 
                
                return {
                    usuario: u.username,         // AWS dice 'username', nosotros usamos 'usuario'
                    contrasena: "1234",          // Contraseña por defecto para todos
                    nombre: u.username,          // Usamos el username como nombre
                    apellido: "AWS User",
                    email: u.email,
                    celular: "55-0000-0000",
                    // Datos de vehículo inventados para que el Dashboard no falle
                    placa: placaFake,
                    marca: "Toyota",
                    modelo: "Corolla",
                    curp: "AWSUSER12345"
                };
            }
            // Si es un usuario local (que ya tenía el formato correcto), lo dejamos igual
            return u;
        });

        console.log("Usuarios listos para usar:", usuariosAdaptados);

        // Guardarlos en localStorage
        localStorage.setItem("usuarios", JSON.stringify(usuariosAdaptados));

    } catch (error) {
        console.error("❌ Error conectando con Python:", error);
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
    // Configuración de Modales
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
        
        const mLic = document.getElementById('licenciaModal');
        const mTur = document.getElementById('turisticoModal');
        if (event.target == mLic) mLic.style.display = "none";
        if (event.target == mTur) mTur.style.display = "none";
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
    // LOGICA DASHBOARD (Sidebar, Logout)
    // ------------------------------------------------------------------
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

    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            sessionStorage.removeItem('loggedInUser');
            window.location.href = '/'; 
        });
    }

    if (document.body.classList.contains('dashboard-body')) {
        loadDashboard();
        initTramitesModals(); 
    }

}); // FIN DOMContentLoaded


// ======================================================
// LOGIN 
// ======================================================
function validarLogin(event) {
    event.preventDefault(); 
    const PAGINA_DESTINO = "/dashboard"; 
    
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
        window.location.href = "/"; 
        return;
    }

    const userData = JSON.parse(userDataString);

    document.getElementById('userGreeting').textContent = `¡Bienvenido/a, ${userData.nombre}!`;
    document.getElementById('carMarca').textContent = userData.marca || 'N/A';
    document.getElementById('carModelo').textContent = userData.modelo || 'N/A';
    document.getElementById('userPlaca').textContent = userData.placa || 'N/A';
    document.getElementById('hncPlacaFinal').textContent = userData.placa || 'N/A';

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

    const today = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('currentDate').textContent = today.toLocaleDateString('es-ES', options);

    checkHoyNoCircula(userData.placa, today);
}

// ======================================================
// 🚦 LÓGICA HOY NO CIRCULA
// ======================================================
function checkHoyNoCircula(placa, fecha) {
    const hncVerdict = document.getElementById('hncVerdict');
    
    if (!placa) {
        hncVerdict.textContent = "Error: Sin placa";
        return;
    }
    
    const ultimoDigito = parseInt(placa.trim().slice(-1));
    
    if (isNaN(ultimoDigito)) {
        hncVerdict.innerHTML = "Placa inválida <br><small>(No termina en número)</small>";
        return;
    }

    const diaSemana = fecha.getDay(); 

    let noCircula = false;

    switch (diaSemana) {
        case 1: if (ultimoDigito === 5 || ultimoDigito === 6) noCircula = true; break;
        case 2: if (ultimoDigito === 7 || ultimoDigito === 8) noCircula = true; break;
        case 3: if (ultimoDigito === 3 || ultimoDigito === 4) noCircula = true; break;
        case 4: if (ultimoDigito === 1 || ultimoDigito === 2) noCircula = true; break;
        case 5: if (ultimoDigito === 9 || ultimoDigito === 0) noCircula = true; break;
        case 6: noCircula = false; break; 
        case 0: noCircula = false; break; 
    }

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
// TRÁMITES
// ======================================================
function initTramitesModals() {
    const btnLicencia = document.querySelector('.licencia-btn'); 
    const btnTuristico = document.querySelector('.turistico-btn');
    const modalLicencia = document.getElementById('licenciaModal');
    const modalTuristico = document.getElementById('turisticoModal');
    const closeLicencia = document.getElementById('closeLicenciaModal');
    const closeTuristico = document.getElementById('closeTuristicoModal');
    const formLicencia = document.getElementById('formLicencia');
    const formTuristico = document.getElementById('formTuristico');

    if (btnLicencia) {
        btnLicencia.addEventListener('click', (e) => {
            e.preventDefault();
            modalLicencia.style.display = 'flex';
        });
    }

    if (btnTuristico) {
        btnTuristico.addEventListener('click', (e) => {
            e.preventDefault();
            modalTuristico.style.display = 'flex';
            const userData = JSON.parse(sessionStorage.getItem('loggedInUser'));
            if (userData && userData.placa) {
                const inputPlaca = document.getElementById('tour_placa');
                if(inputPlaca) inputPlaca.value = userData.placa;
            }
        });
    }

    if (closeLicencia) closeLicencia.onclick = () => modalLicencia.style.display = 'none';
    if (closeTuristico) closeTuristico.onclick = () => modalTuristico.style.display = 'none';

    window.addEventListener('click', (event) => {
        if (event.target == modalLicencia) modalLicencia.style.display = "none";
        if (event.target == modalTuristico) modalTuristico.style.display = "none";
    });

    if (formLicencia) {
        formLicencia.addEventListener('submit', (e) => {
            e.preventDefault();
            alert(`✅ Solicitud recibida.`);
            modalLicencia.style.display = 'none';
            formLicencia.reset();
        });
    }

    if (formTuristico) {
        formTuristico.addEventListener('submit', (e) => {
            e.preventDefault();
            alert(`🚗 ¡Pase Turístico Generado!`);
            modalTuristico.style.display = 'none';
            formTuristico.reset();
        });
    }
}
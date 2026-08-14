document.addEventListener('DOMContentLoaded', () => {
    // Inicializar iconos de Lucide
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }

    const state = {
        currentStep: 1,
        totalSteps: 5,
        formData: {
            nombre: '', apellido: '', email: '', telefono: '', fechaNacimiento: '', pais: '', ciudad: '',
            direccion: '', codigoPostal: '', profesion: '', empresa: '', experiencia: '', tipoUsuario: 'Independiente',
            categorias: [], notifEmail: true, modoOscuro: false, comentarios: '',
            imagenPerfil: null, documentoCV: null, terminos: false, privacidad: false
        }
    };

    const stepTitles = [
        { title: "Información personal", desc: "Por favor, introduce tus datos básicos de contacto." },
        { title: "Información adicional", desc: "Cuéntanos más sobre tu perfil profesional y ubicación." },
        { title: "Preferencias", desc: "Personaliza tus intereses y opciones de configuración." },
        { title: "Archivos e información", desc: "Adjunta tu imagen de perfil y tu currículum en PDF." },
        { title: "Resumen y confirmación", desc: "Verifica que todos tus datos sean correctos antes de finalizar." }
    ];

    // Elementos del DOM
    const form = document.getElementById('multi-step-form');
    const btnPrev = document.getElementById('btn-prev');
    const btnNext = document.getElementById('btn-next');
    const btnSubmit = document.getElementById('btn-submit');
    const progressFill = document.getElementById('progress-fill');
    const progressPercentage = document.getElementById('progress-percentage');
    const stepMainTitle = document.getElementById('step-main-title');
    const stepMainDesc = document.getElementById('step-main-desc');
    const successScreen = document.getElementById('success-screen');
    

    // Cargar datos guardados en localStorage si existen
    loadFromLocalStorage();

    // Event Listeners principales
    btnNext.addEventListener('click', () => {
        if (validateStep(state.currentStep)) {
            saveStepData(state.currentStep);
            if (state.currentStep < state.totalSteps) {
                state.currentStep++;
                updateView();
            }
        }
    });

    btnPrev.addEventListener('click', () => {
        if (state.currentStep > 1) {
            saveStepData(state.currentStep);
            state.currentStep--;
            updateView();
        }
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (validateStep(state.currentStep)) {
            saveStepData(state.currentStep);
            if (!state.formData.terminos || !state.formData.privacidad) {
                showError('terminos', 'Debes aceptar los términos y condiciones.');
                showError('privacidad', 'Debes aceptar la política de privacidad.');
                return;
            }

            // Mostrar estado de carga
            setLoading(true);
            
            try {
                // Simular petición asíncrona simulada con API preparada
                await submitForm(state.formData);
                
                // Mostrar pantalla de éxito
                form.classList.add('hidden');
                document.querySelector('.form-header').classList.add('hidden');
                document.querySelector('.form-navigation').classList.add('hidden');
                successScreen.classList.remove('hidden');
                
                // Generar ticket ficticio único
                document.getElementById('ticket-id').textContent = `REG-${Math.floor(100000 + Math.random() * 900000)}-2026`;
                
                // Limpiar localStorage tras éxito
                localStorage.removeItem('multiStepFormData');
            } catch (error) {
                console.error("Error al enviar el formulario:", error);
            } finally {
                setLoading(false);
            }
        }
    });

    // Botones de Edición desde el Resumen
    document.querySelectorAll('.btn-edit-step').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const targetStep = parseInt(e.currentTarget.getAttribute('data-target'));
            saveStepData(state.currentStep);
            state.currentStep = targetStep;
            updateView();
        });
    });

    // Botón reiniciar
    document.getElementById('btn-restart').addEventListener('click', () => {
        localStorage.removeItem('multiStepFormData');
        window.location.reload();
    });

    // Gestión de Archivos y Drag & Drop
    setupFileHandlers('imagen', 'input-imagen', 'dropzone-imagen', 'dropzone-content-img', 'preview-container-img', 'img-preview', 'img-name', 'img-size', 'remove-img');
    setupFileHandlers('documento', 'input-doc', 'dropzone-doc', 'dropzone-content-doc', 'preview-container-doc', null, 'doc-name', 'doc-size', 'remove-doc');

    function setupFileHandlers(type, inputId, dropzoneId, contentId, previewId, imgPreviewId, nameId, sizeId, removeId) {
        const input = document.getElementById(inputId);
        const dropzone = document.getElementById(dropzoneId);
        const content = document.getElementById(contentId);
        const preview = document.getElementById(previewId);
        const nameSpan = document.getElementById(nameId);
        const sizeSpan = document.getElementById(sizeId);
        const removeBtn = document.getElementById(removeId);

        dropzone.addEventListener('dragover', (e) => { e.preventDefault(); dropzone.classList.add('dragover'); });
        dropzone.addEventListener('dragleave', () => { dropzone.classList.remove('dragover'); });
        dropzone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropzone.classList.remove('dragover');
            if (e.dataTransfer.files.length) {
                input.files = e.dataTransfer.files;
                handleFileSelection(type, input.files[0], content, preview, imgPreviewId, nameSpan, sizeSpan);
            }
        });

        input.addEventListener('change', () => {
            if (input.files.length) {
                handleFileSelection(type, input.files[0], content, preview, imgPreviewId, nameSpan, sizeSpan);
            }
        });

        removeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            input.value = '';
            if (type === 'imagen') state.formData.imagenPerfil = null;
            else state.formData.documentoCV = null;
            preview.classList.add('hidden');
            content.classList.remove('hidden');
            clearError(type === 'imagen' ? 'imagenPerfil' : 'documentoCV');
        });
    }

    function handleFileSelection(type, file, content, preview, imgPreviewId, nameSpan, sizeSpan) {
        const maxSize = type === 'imagen' ? 5 * 1024 * 1024 : 10 * 1024 * 1024;
        const errorKey = type === 'imagen' ? 'imagenPerfil' : 'documentoCV';

        if (file.size > maxSize) {
            showError(errorKey, `El archivo supera el tamaño máximo permitido (${type === 'imagen' ? '5MB' : '10MB'}).`);
            return;
        }

        clearError(errorKey);
        nameSpan.textContent = file.name;
        sizeSpan.textContent = `${(file.size / 1024).toFixed(1)} KB`;

        if (type === 'imagen' && imgPreviewId) {
            const reader = new FileReader();
            reader.onload = (e) => {
                document.getElementById(imgPreviewId).src = e.target.result;
                state.formData.imagenPerfil = e.target.result;
            };
            reader.readAsDataURL(file);
        } else {
            state.formData.documentoCV = file.name;
        }

        content.classList.add('hidden');
        preview.classList.remove('hidden');
    }

    function updateView() {
        document.querySelectorAll('.form-step').forEach(step => {
            step.classList.remove('active');
            if (parseInt(step.getAttribute('data-step')) === state.currentStep) {
                step.classList.add('active');
            }
        });

        document.querySelectorAll('.stepper-item').forEach(item => {
            const stepNum = parseInt(item.getAttribute('data-step'));
            item.classList.remove('active', 'completed');
            if (stepNum === state.currentStep) {
                item.classList.add('active');
                item.querySelector('.step-status').textContent = 'Paso actual';
            } else if (stepNum < state.currentStep) {
                item.classList.add('completed');
                item.querySelector('.step-status').textContent = 'Completado';
            } else {
                item.querySelector('.step-status').textContent = 'Pendiente';
            }
        });

        stepMainTitle.textContent = stepTitles[state.currentStep - 1].title;
        stepMainDesc.textContent = stepTitles[state.currentStep - 1].desc;

        const progressPercent = (state.currentStep / state.totalSteps) * 100;
        progressFill.style.width = `${progressPercent}%`;
        progressPercentage.textContent = `${Math.round(progressPercent)}%`;

        btnPrev.style.display = state.currentStep === 1 ? 'none' : 'flex';
        if (state.currentStep === state.totalSteps) {
            btnNext.style.display = 'none';
            btnSubmit.style.display = 'flex';
            populateSummary();
        } else {
            btnNext.style.display = 'flex';
            btnSubmit.style.display = 'none';
        }

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function validateStep(step) {
        let isValid = true;

        if (step === 1) {
            isValid &= validateField('nombre', 'Este campo es obligatorio.');
            isValid &= validateField('apellido', 'Este campo es obligatorio.');
            isValid &= validateEmail('email');
            isValid &= validatePhone('telefono');
            isValid &= validateField('fechaNacimiento', 'Selecciona tu fecha de nacimiento.');
            isValid &= validateField('pais', 'Selecciona un país.');
            isValid &= validateField('ciudad', 'Introduce tu ciudad.');
        } else if (step === 2) {
            isValid &= validateField('direccion', 'Introduce tu dirección.');
            isValid &= validateField('codigoPostal', 'Introduce tu código postal.');
            isValid &= validateField('profesion', 'Introduce tu profesión.');
            isValid &= validateField('experiencia', 'Selecciona tu nivel de experiencia.');
        } else if (step === 3) {
            const checkedCategories = document.querySelectorAll('input[name="categorias"]:checked');
            if (checkedCategories.length === 0) {
                showError('categorias', 'Selecciona al menos una preferencia.');
                isValid = false;
            } else {
                clearError('categorias');
            }
        } else if (step === 4) {
            if (!state.formData.imagenPerfil && !document.getElementById('input-imagen').files.length) {
                showError('imagenPerfil', 'Sube una imagen de perfil válida.');
                isValid = false;
            } else {
                clearError('imagenPerfil');
            }
            if (!state.formData.documentoCV && !document.getElementById('input-doc').files.length) {
                showError('documentoCV', 'Sube tu currículum en formato PDF.');
                isValid = false;
            } else {
                clearError('documentoCV');
            }
        } else if (step === 5) {
            const terminos = document.getElementById('terminos').checked;
            const privacidad = document.getElementById('privacidad').checked;
            if (!terminos) {
                showError('terminos', 'Debes aceptar los términos y condiciones.');
                isValid = false;
            } else clearError('terminos');

            if (!privacidad) {
                showError('privacidad', 'Debes aceptar la política de privacidad.');
                isValid = false;
            } else clearError('privacidad');
        }

        return Boolean(isValid);
    }

    function validateField(id, message) {
        const field = document.getElementById(id);
        if (!field || !field.value.trim()) {
            showError(id, message);
            return false;
        }
        clearError(id);
        return true;
    }

    function validateEmail(id) {
        const field = document.getElementById(id);
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!field.value.trim() || !regex.test(field.value)) {
            showError(id, 'Introduce un correo electrónico válido.');
            return false;
        }
        clearError(id);
        return true;
    }

    function validatePhone(id) {
        const field = document.getElementById(id);
        const cleanPhone = field.value.replace(/\s+/g, '');
        const regex = /^\+?[0-9]{9,15}$/;
        if (!regex.test(cleanPhone)) {
            showError(id, 'El teléfono debe contener entre 9 y 15 dígitos.');
            return false;
        }
        clearError(id);
        return true;
    }

    function showError(id, message) {
        const errorEl = document.getElementById(`error-${id}`);
        const groupEl = errorEl ? errorEl.closest('.input-group') : null;
        if (errorEl) errorEl.textContent = message;
        if (groupEl) groupEl.classList.add('error');
    }

    function clearError(id) {
        const errorEl = document.getElementById(`error-${id}`);
        const groupEl = errorEl ? errorEl.closest('.input-group') : null;
        if (errorEl) errorEl.textContent = '';
        if (groupEl) groupEl.classList.remove('error');
    }

    function saveStepData(step) {
        const currentStepEl = document.querySelector(`.form-step[data-step="${step}"]`);
        if (!currentStepEl) return;

        const inputs = currentStepEl.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            if (input.type === 'checkbox') {
                if (input.name === 'categorias') {
                    const checked = Array.from(currentStepEl.querySelectorAll('input[name="categorias"]:checked')).map(cb => cb.value);
                    state.formData.categorias = checked;
                } else {
                    state.formData[input.name] = input.checked;
                }
            } else if (input.type === 'radio') {
                if (input.checked) {
                    state.formData[input.name] = input.value;
                }
            } else if (input.type !== 'file' && input.name) {
                state.formData[input.name] = input.value;
            }
        });

        localStorage.setItem('multiStepFormData', JSON.stringify(state.formData));
    }

    function populateSummary() {
        const resPersonal = document.getElementById('resumen-personal');
        resPersonal.innerHTML = `
            <div class="summary-item"><span class="summary-label">Nombre completo</span><span class="summary-value">${escapeHTML(state.formData.nombre)} ${escapeHTML(state.formData.apellido)}</span></div>
            <div class="summary-item"><span class="summary-label">Correo electrónico</span><span class="summary-value">${escapeHTML(state.formData.email)}</span></div>
            <div class="summary-item"><span class="summary-label">Teléfono</span><span class="summary-value">${escapeHTML(state.formData.telefono)}</span></div>
            <div class="summary-item"><span class="summary-label">Ubicación</span><span class="summary-value">${escapeHTML(state.formData.ciudad)}, ${escapeHTML(state.formData.pais)}</span></div>
        `;

        const resAdicional = document.getElementById('resumen-adicional');
        resAdicional.innerHTML = `
            <div class="summary-item"><span class="summary-label">Profesión</span><span class="summary-value">${escapeHTML(state.formData.profesion)}</span></div>
            <div class="summary-item"><span class="summary-label">Experiencia</span><span class="summary-value">${escapeHTML(state.formData.experiencia)}</span></div>
            <div class="summary-item"><span class="summary-label">Tipo de usuario</span><span class="summary-value">${escapeHTML(state.formData.tipoUsuario)}</span></div>
            <div class="summary-item"><span class="summary-label">Dirección</span><span class="summary-value">${escapeHTML(state.formData.direccion)} (CP: ${escapeHTML(state.formData.codigoPostal)})</span></div>
        `;

        const resPreferencias = document.getElementById('resumen-preferencias');
        resPreferencias.innerHTML = `
            <div class="summary-item"><span class="summary-label">Categorías</span><span class="summary-value">${state.formData.categorias.join(', ') || 'Ninguna'}</span></div>
            <div class="summary-item"><span class="summary-label">Notificaciones</span><span class="summary-value">${state.formData.notifEmail ? 'Activadas' : 'Desactivadas'}</span></div>
        `;

        const resArchivos = document.getElementById('resumen-archivos');
        resArchivos.innerHTML = `
            <div class="summary-item"><span class="summary-label">Imagen de perfil</span><span class="summary-value">${state.formData.imagenPerfil ? 'Cargada correctamente' : 'No adjuntada'}</span></div>
            <div class="summary-item"><span class="summary-label">Documento CV</span><span class="summary-value">${escapeHTML(state.formData.documentoCV || 'No adjuntado')}</span></div>
        `;
    }

    function escapeHTML(str) {
        if (!str) return '';
        return str.replace(/[&<>'"]/g, 
            tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
        );
    }

    function loadFromLocalStorage() {
        const saved = localStorage.getItem('multiStepFormData');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                state.formData = { ...state.formData, ...parsed };
                
                Object.keys(state.formData).forEach(key => {
                    const el = document.getElementById(key) || document.querySelector(`[name="${key}"]`);
                    if (el) {
                        if (el.type === 'checkbox') {
                            el.checked = state.formData[key];
                        } else if (el.type === 'radio') {
                            const radio = document.querySelector(`input[name="${key}"][value="${state.formData[key]}"]`);
                            if (radio) radio.checked = true;
                        } else if (el.tagName === 'INPUT' || el.tagName === 'SELECT' || el.tagName === 'TEXTAREA') {
                            el.value = state.formData[key];
                        }
                    }
                });

                if (state.formData.categorias && Array.isArray(state.formData.categorias)) {
                    state.formData.categorias.forEach(cat => {
                        const cb = document.querySelector(`input[name="categorias"][value="${cat}"]`);
                        if (cb) cb.checked = true;
                    });
                }
            } catch (e) {
                console.error("Error al recuperar datos del localStorage:", e);
            }
        }
    }

    function setLoading(isLoading) {
        const spinner = btnSubmit.querySelector('.spinner');
        const btnText = btnSubmit.querySelector('.btn-text');
        if (isLoading) {
            btnSubmit.disabled = true;
            btnText.textContent = 'Procesando...';
            spinner.classList.remove('hidden');
        } else {
            btnSubmit.disabled = false;
            btnText.textContent = 'Finalizar Registro';
            spinner.classList.add('hidden');
        }
    }
});

/**
 * Funciones globales para controlar la apertura y cierre de pop-ups (modales)
 */
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal && typeof modal.showModal === 'function') {
        modal.showModal();
    } else {
        console.error("No se encontró el modal o el navegador no soporta <dialog>:", modalId);
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal && typeof modal.close === 'function') {
        modal.close();
    }
}

/**
 * Función preparada para conectar posteriormente con un backend real (API REST).
 * @param {Object} data - Objeto completo con los datos del formulario.
 * @returns {Promise}
 */
async function submitForm(data) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            console.log("Datos enviados al servidor con éxito:", data);
            resolve({ success: true, requestId: "REG-849203-2026" });
        }, 1500);
    });
}
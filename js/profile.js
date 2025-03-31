document.addEventListener('DOMContentLoaded', () => {
    // Variables globales
    let data = {};
    const elements = {
        currentDateEl: document.getElementById('current-date'),
        userNameEl: document.getElementById('user-name'),
        profilePhoto: document.getElementById('profile-photo'),
        profileName: document.getElementById('profile-name'),
        profilePhotoInput: document.getElementById('profile-photo-input'),
        themeSelect: document.getElementById('theme-select'),
        saveProfileBtn: document.getElementById('save-profile'),
        cancelProfileBtn: document.getElementById('cancel-profile'),
        categoryModal: document.getElementById('category-modal'),
        addCategoryBtn: document.getElementById('add-category-btn'),
        closeCategoryModal: document.getElementById('close-category-modal'),
        cancelCategory: document.getElementById('cancel-category'),
        saveCategory: document.getElementById('save-category'),
        categoryNameInput: document.getElementById('category-name'),
        categoryIconInput: document.getElementById('category-icon'),
        categoryList: document.getElementById('category-list'),
        toastContainer: document.getElementById('toast-container'),
        triggerPhotoUpload: document.getElementById('trigger-photo-upload'),
        fileNameDisplay: document.getElementById('file-name'),
        themeColors: document.querySelectorAll('.theme-color'),
        iconButtons: document.querySelectorAll('#category-modal i')
    };

    // Funciones de almacenamiento
    function loadFromLocalStorage() {
        try {
            const username = localStorage.getItem('username') || 'Usuario';
            const photo = localStorage.getItem('photo') || 'https://via.placeholder.com/120';
            const baseTheme = localStorage.getItem('baseTheme') || 'light';
            const primaryColor = localStorage.getItem('primaryColor') || 'default';
            const categories = JSON.parse(localStorage.getItem('categories')) || [
                { id: 'all', name: 'Todos', icon: 'fa-list' },
                { id: 'work', name: 'Trabajo', icon: 'fa-briefcase' },
                { id: 'study', name: 'Estudios', icon: 'fa-graduation-cap' },
                { id: 'home', name: 'Hogar', icon: 'fa-home' },
                { id: 'personal', name: 'Personal', icon: 'fa-heart' }
            ];
            return { username, photo, baseTheme, primaryColor, categories, tasks: [] };
        } catch (error) {
            console.error('Error loading from localStorage:', error);
            return {
                username: 'Usuario',
                photo: 'https://via.placeholder.com/120',
                baseTheme: 'light',
                primaryColor: 'default',
                categories: [],
                tasks: []
            };
        }
    }

    function saveToLocalStorage(data) {
        try {
            localStorage.setItem('username', data.username);
            localStorage.setItem('photo', data.photo);
            localStorage.setItem('baseTheme', data.baseTheme);
            localStorage.setItem('primaryColor', data.primaryColor);
            localStorage.setItem('categories', JSON.stringify(data.categories));
        } catch (error) {
            console.error('Error saving to localStorage:', error);
            showToast('Error al guardar datos', 'error');
        }
    }

    // Funciones de UI
    function setCurrentDate() {
        const date = new Date();
        elements.currentDateEl.textContent = date.toLocaleDateString('es-ES', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    function showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.classList.add('toast', `toast-${type}`);
        toast.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'times-circle'} toast-icon"></i>
            <div class="toast-message">${message}</div>
        `;
        elements.toastContainer.appendChild(toast);
        setTimeout(() => toast.classList.add('show'), 10);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    function updateUI() {
        document.body.setAttribute('data-base-theme', data.baseTheme);
        document.body.setAttribute('data-primary-color', data.primaryColor);
        elements.userNameEl.textContent = data.username;
        elements.profilePhoto.src = data.photo;
        elements.profileName.value = data.username;
        elements.themeSelect.value = data.baseTheme;
        elements.themeColors.forEach(color => {
            color.classList.toggle('active', color.dataset.color === data.primaryColor);
        });
        renderCategoryList();
    }

    // Funciones de categorías
    function renderCategoryList() {
        elements.categoryList.innerHTML = data.categories
            .filter(cat => cat.id !== 'all')
            .map(cat => `
                <div class="category-item" data-id="${cat.id}">
                    <span class="category-name"><i class="fas ${cat.icon}"></i> ${cat.name}</span>
                    <button class="category-delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `).join('');
    }

    function showCategoryModal() {
        elements.categoryModal.classList.add('show');
    }

    function hideCategoryModal() {
        elements.categoryModal.classList.remove('show');
        elements.categoryNameInput.value = '';
        elements.categoryIconInput.value = '';
    }

    function saveNewCategory() {
        const name = elements.categoryNameInput.value.trim();
        const icon = elements.categoryIconInput.value.trim();
        if (!name || !icon) {
            showToast('Por favor, complete todos los campos', 'error');
            return;
        }
        const newCategory = {
            id: name.toLowerCase().replace(/\s+/g, '-'),
            name,
            icon
        };
        data.categories.push(newCategory);
        saveToLocalStorage(data);
        renderCategoryList();
        hideCategoryModal();
        showToast('Categoría creada exitosamente', 'success');
    }

    // Funciones de perfil
    function updateProfilePhoto(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = e => {
                elements.profilePhoto.src = e.target.result;
                data.photo = e.target.result;
                resolve();
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    async function saveProfile() {
        try {
            const newUsername = elements.profileName.value.trim();
            const newBaseTheme = elements.themeSelect.value;

            if (!newUsername) {
                showToast('El nombre no puede estar vacío', 'error');
                return;
            }

            data.username = newUsername;
            data.baseTheme = newBaseTheme;

            if (elements.profilePhotoInput.files?.[0]) {
                const file = elements.profilePhotoInput.files[0];
                if (file.size > 5 * 1024 * 1024) {
                    showToast('La imagen debe ser menor a 5MB', 'error');
                    return;
                }
                await updateProfilePhoto(file);
            }

            saveToLocalStorage(data);
            updateUI();
            showToast('Perfil actualizado exitosamente', 'success');
        } catch (error) {
            console.error('Error saving profile:', error);
            showToast('Error al guardar el perfil', 'error');
        }
    }

    function resetProfile() {
        elements.profileName.value = data.username;
        elements.profilePhoto.src = data.photo;
        elements.themeSelect.value = data.baseTheme;
        updateUI();
        showToast('Cambios descartados', 'success');
    }

    async function handlePhotoUpload() {
        if (elements.profilePhotoInput.files?.[0]) {
            const file = elements.profilePhotoInput.files[0];
            elements.fileNameDisplay.textContent = file.name;
            if (file.size <= 5 * 1024 * 1024) {
                await updateProfilePhoto(file);
                saveToLocalStorage(data);
            } else {
                showToast('La imagen debe ser menor a 5MB', 'error');
            }
        }
    }

    function handleThemeColorChange(color) {
        const newColor = color.dataset.color;
        elements.themeColors.forEach(c => c.classList.remove('active'));
        color.classList.add('active');
        data.primaryColor = newColor;
        document.body.setAttribute('data-primary-color', newColor);
        saveToLocalStorage(data);
        showToast('Color primario actualizado', 'success');
    }

    function handleThemeChange() {
        const newBaseTheme = elements.themeSelect.value;
        data.baseTheme = newBaseTheme;
        document.body.setAttribute('data-base-theme', newBaseTheme);
        saveToLocalStorage(data);
        showToast('Tema base actualizado', 'success');
    }

    // Configurar event listeners
    function setupEventListeners() {
        elements.addCategoryBtn.addEventListener('click', showCategoryModal);
        elements.closeCategoryModal.addEventListener('click', hideCategoryModal);
        elements.cancelCategory.addEventListener('click', hideCategoryModal);
        elements.saveCategory.addEventListener('click', saveNewCategory);
        elements.saveProfileBtn.addEventListener('click', saveProfile);
        elements.cancelProfileBtn.addEventListener('click', resetProfile);
        elements.triggerPhotoUpload.addEventListener('click', () => elements.profilePhotoInput.click());
        elements.profilePhotoInput.addEventListener('change', handlePhotoUpload);
        elements.themeSelect.addEventListener('change', handleThemeChange);
        
        elements.themeColors.forEach(color => {
            color.addEventListener('click', () => handleThemeColorChange(color));
        });

        elements.iconButtons.forEach(icon => {
            icon.addEventListener('click', () => {
                const iconClass = icon.className.split(' ').filter(c => c.startsWith('fa-'))[0];
                elements.categoryIconInput.value = iconClass;
            });
        });

        elements.categoryList.addEventListener('click', (e) => {
            const deleteBtn = e.target.closest('.category-delete');
            if (deleteBtn) {
                const categoryId = deleteBtn.parentElement.dataset.id;
                data.categories = data.categories.filter(c => c.id !== categoryId);
                saveToLocalStorage(data);
                renderCategoryList();
                showToast('Categoría eliminada', 'success');
            }
        });
    }

    // Inicializar
    function init() {
        data = loadFromLocalStorage();
        setCurrentDate();
        updateUI();
        setupEventListeners();
    }

    init();
});

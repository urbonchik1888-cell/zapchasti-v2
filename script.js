class PartsCatalog {
    constructor() {
        this.parts = this.loadParts();
        this.currentCategory = 'all';
        this.currentAppliance = null;
        this.searchQuery = '';
        this.currentUser = null;
        this.editingPartId = null;
        this.currentImageIndex = 0;
        this.currentImages = [];
        this.init();
    }

    init() {
        this.checkAuth();
        this.setupEventListeners();
        this.renderParts();
    }

    setupEventListeners() {
        // Модальное окно добавления запчасти
        const modal = document.getElementById('addPartModal');
        const addBtn = document.getElementById('addPartBtn');
        const closeBtn = document.querySelector('.close');
        const form = document.getElementById('addPartForm');

        addBtn.addEventListener('click', () => this.openModal());
        closeBtn.addEventListener('click', () => this.closeModal());
        window.addEventListener('click', (e) => {
            if (e.target === modal) this.closeModal();
        });

        // Форма добавления
        form.addEventListener('submit', (e) => this.handleSubmit(e));

        // Категории
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                if (e.target.closest('.category-dropdown')) return;
                this.filterByCategory(e);
            });
        });

        // Dropdown меню
        this.setupDropdown();

        // Поиск
        const searchInput = document.getElementById('searchInput');
        const searchBtn = document.getElementById('searchBtn');
        
        searchInput.addEventListener('input', (e) => this.handleSearch(e));
        searchInput.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') this.handleSearch(e);
        });
        searchBtn.addEventListener('click', () => this.handleSearch());

        // Предпросмотр изображений
        document.getElementById('partImages').addEventListener('change', (e) => this.previewImages(e));

        // Кнопка камеры
        document.getElementById('cameraBtn').addEventListener('click', () => this.openCamera());

        // Переключение типа контакта
        document.querySelectorAll('input[name="contactType"]').forEach(radio => {
            radio.addEventListener('change', (e) => this.handleContactTypeChange(e));
        });

        // Авторизация
        this.setupAuthListeners();
    }

    setupAuthListeners() {
        // Модальное окно авторизации
        const authModal = document.getElementById('authModal');
        const authCloseBtn = authModal.querySelector('.close');
        
        authCloseBtn.addEventListener('click', () => this.closeAuthModal());
        window.addEventListener('click', (e) => {
            if (e.target === authModal) this.closeAuthModal();
        });

        // Кнопки авторизации
        document.getElementById('loginBtn').addEventListener('click', () => this.openAuthModal('login'));
        document.getElementById('registerBtn').addEventListener('click', () => this.openAuthModal('register'));
        document.getElementById('logoutBtn').addEventListener('click', () => this.logout());
        document.getElementById('profileBtn').addEventListener('click', () => this.openProfileModal());

        // Переключение форм
        document.getElementById('showRegister').addEventListener('click', (e) => {
            e.preventDefault();
            this.showRegisterForm();
        });
        document.getElementById('showLogin').addEventListener('click', (e) => {
            e.preventDefault();
            this.showLoginForm();
        });

        // Формы входа и регистрации
        document.getElementById('loginFormElement').addEventListener('submit', (e) => this.handleLogin(e));
        document.getElementById('registerFormElement').addEventListener('submit', (e) => this.handleRegister(e));

        // Личный кабинет
        this.setupProfileModal();
    }

    setupProfileModal() {
        const profileModal = document.getElementById('profileModal');
        const profileCloseBtn = profileModal.querySelector('.close');
        
        profileCloseBtn.addEventListener('click', () => this.closeProfileModal());
        window.addEventListener('click', (e) => {
            if (e.target === profileModal) this.closeProfileModal();
        });

        // Переключение вкладок
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchTab(e));
        });

        // Форма изменения пароля
        document.getElementById('changePasswordForm').addEventListener('submit', (e) => this.handleChangePassword(e));

        // Кнопка редактирования профиля
        document.getElementById('editProfileBtn').addEventListener('click', () => this.openEditProfileModal());

        // Модальное окно редактирования профиля
        this.setupEditProfileModal();
    }

    setupEditProfileModal() {
        const editModal = document.getElementById('editProfileModal');
        const closeBtn = editModal.querySelector('.close');
        
        closeBtn.addEventListener('click', () => this.closeEditProfileModal());
        window.addEventListener('click', (e) => {
            if (e.target === editModal) this.closeEditProfileModal();
        });

        document.getElementById('editProfileForm').addEventListener('submit', (e) => this.handleEditProfile(e));
    }

    openEditProfileModal() {
        document.getElementById('editProfileModal').style.display = 'block';
        document.body.style.overflow = 'hidden';
        
        // Заполняем форму текущими данными
        document.getElementById('editName').value = this.currentUser.name;
        document.getElementById('editEmail').value = this.currentUser.email;
        document.getElementById('editPhone').value = this.currentUser.phone || '';
    }

    closeEditProfileModal() {
        document.getElementById('editProfileModal').style.display = 'none';
        document.body.style.overflow = 'auto';
        document.getElementById('editProfileForm').reset();
    }

    handleEditProfile(e) {
        e.preventDefault();
        
        const newName = document.getElementById('editName').value.trim();
        const newEmail = document.getElementById('editEmail').value.trim();
        const newPhone = document.getElementById('editPhone').value.trim();
        
        if (!newName) {
            alert('Имя не может быть пустым');
            return;
        }
        
        if (!newEmail) {
            alert('Email не может быть пустым');
            return;
        }
        
        // Проверка формата email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(newEmail)) {
            alert('Введите корректный email');
            return;
        }
        
        // Проверяем, не занят ли email другим пользователем
        const users = this.loadUsers();
        const existingUser = users.find(u => u.email === newEmail && u.id !== this.currentUser.id);
        if (existingUser) {
            alert('Этот email уже используется другим пользователем');
            return;
        }
        
        // Обновляем данные пользователя
        const userIndex = users.findIndex(u => u.id === this.currentUser.id);
        
        if (userIndex !== -1) {
            users[userIndex].name = newName;
            users[userIndex].email = newEmail;
            users[userIndex].phone = newPhone;
            
            // Обновляем роль если email изменился на admin@parts.com
            if (newEmail === 'admin@parts.com') {
                users[userIndex].role = 'admin';
            }
            
            this.saveUsers(users);
            
            // Обновляем текущего пользователя
            this.currentUser.name = newName;
            this.currentUser.email = newEmail;
            this.currentUser.phone = newPhone;
            if (newEmail === 'admin@parts.com') {
                this.currentUser.role = 'admin';
            }
            localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
            
            // Обновляем имя в объявлении
            this.updateUserNameInParts(this.currentUser.id, newName);
            
            // Обновляем UI
            this.updateAuthUI();
            this.loadProfileInfo();
            
            alert('Профиль успешно обновлен!');
            this.closeEditProfileModal();
        }
    }

    updateUserNameInParts(userId, newName) {
        this.parts.forEach(part => {
            if (part.userId === userId) {
                part.userName = newName;
            }
        });
        this.saveParts();
        this.renderParts();
    }

    openProfileModal() {
        document.getElementById('profileModal').style.display = 'block';
        document.body.style.overflow = 'hidden';
        this.loadProfileInfo();
        this.loadUserParts();
    }

    closeProfileModal() {
        document.getElementById('profileModal').style.display = 'none';
        document.body.style.overflow = 'auto';
        document.getElementById('changePasswordForm').reset();
    }

    switchTab(e) {
        const tabName = e.target.dataset.tab;
        
        // Переключаем кнопки
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        e.target.classList.add('active');
        
        // Переключаем содержимое
        document.querySelectorAll('.tab-pane').forEach(pane => {
            pane.classList.remove('active');
        });
        document.getElementById(tabName + 'Tab').classList.add('active');
    }

    loadProfileInfo() {
        if (!this.currentUser) return;
        
        document.getElementById('profileName').textContent = this.currentUser.name;
        document.getElementById('profileEmail').textContent = this.currentUser.email;
        document.getElementById('profilePhone').textContent = this.currentUser.phone || 'Не указан';
        document.getElementById('profileRole').textContent = this.currentUser.role === 'admin' ? 'Администратор' : 'Пользователь';
        
        const createdDate = new Date(this.currentUser.createdAt).toLocaleDateString('ru-RU');
        document.getElementById('profileDate').textContent = createdDate;
    }

    loadUserParts() {
        if (!this.currentUser) return;
        
        const userParts = this.parts.filter(part => part.userId === this.currentUser.id);
        const container = document.getElementById('userPartsList');
        
        if (userParts.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #666;">У вас пока нет объявлений</p>';
            return;
        }
        
        container.innerHTML = userParts.map(part => `
            <div class="user-part-card">
                <div class="user-part-info">
                    <h4>${this.escapeHtml(part.name)}</h4>
                    ${this.currentUser.role === 'admin' && part.quantity > 1 ? `<div class="price" style="color: #28a745;">Количество: ${part.quantity} шт.</div>` : ''}
                    <div class="price">${part.price.toLocaleString()} бел. руб.</div>
                    <div class="meta">
                        Категория: ${this.getCategoryName(part.category)} | 
                        ${part.appliance ? this.getApplianceName(part.appliance) : 'Тип не указан'}
                    </div>
                    <div class="meta">Добавлено: ${new Date(part.date).toLocaleDateString('ru-RU')}</div>
                </div>
                <div class="user-part-actions">
                    <button class="edit-btn" onclick="catalog.editPart(${part.id})">Редактировать</button>
                    <button class="delete-btn" onclick="catalog.deletePart(${part.id})">Удалить</button>
                </div>
            </div>
        `).join('');
    }

    getCategoryName(category) {
        const names = {
            'new': 'Новые',
            'used': 'БУ',
            'equipment': 'БУ техника'
        };
        return names[category] || category;
    }

    getApplianceName(appliance) {
        const names = {
            'refrigerator': 'Холодильники',
            'dishwasher': 'Посудомоечные машины',
            'airconditioner': 'Кондиционеры',
            'oven': 'Духовые шкафы',
            'washingmachine': 'Стиральные машины',
            'cooktop': 'Варочные панели',
            'coffeemachine': 'Кофемашины',
            'tv': 'Телевизоры',
            'other': 'Прочее'
        };
        return names[appliance] || appliance;
    }

    handleChangePassword(e) {
        e.preventDefault();
        
        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        
        if (newPassword !== confirmPassword) {
            alert('Новые пароли не совпадают');
            return;
        }
        
        if (currentPassword !== this.currentUser.password) {
            alert('Текущий пароль неверный');
            return;
        }
        
        // Обновляем пароль
        const users = this.loadUsers();
        const userIndex = users.findIndex(u => u.id === this.currentUser.id);
        users[userIndex].password = newPassword;
        this.saveUsers(users);
        
        this.currentUser.password = newPassword;
        localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
        
        alert('Пароль успешно изменен!');
        document.getElementById('changePasswordForm').reset();
    }

    editPart(id) {
        const part = this.parts.find(p => p.id === id);
        if (!part) {
            alert('Объявление не найдено');
            return;
        }
        
        if (this.currentUser.role !== 'admin' && part.userId !== this.currentUser.id) {
            alert('Вы можете редактировать только свои объявления');
            return;
        }
        
        // Заполняем форму данными
        document.getElementById('partName').value = part.name;
        document.getElementById('partCategory').value = part.category;
        document.getElementById('partAppliance').value = part.appliance || '';
        document.getElementById('partPrice').value = part.price;
        document.getElementById('partQuantity').value = part.quantity || 1;
        document.getElementById('partPhone').value = part.phone || '';
        document.getElementById('partEmail').value = part.email || '';
        document.getElementById('partTelegram').value = part.telegram || '';
        document.getElementById('partDescription').value = part.description || '';
        
        // Устанавливаем правильный тип контакта
        if (part.phone) {
            document.querySelector('input[name="contactType"][value="phone"]').checked = true;
            this.handleContactTypeChange({ target: { value: 'phone' } });
        } else if (part.email) {
            document.querySelector('input[name="contactType"][value="email"]').checked = true;
            this.handleContactTypeChange({ target: { value: 'email' } });
        } else if (part.telegram) {
            document.querySelector('input[name="contactType"][value="telegram"]').checked = true;
            this.handleContactTypeChange({ target: { value: 'telegram' } });
        }
        
        // Сохраняем ID редактируемого объявления
        this.editingPartId = id;
        
        // Открываем модальное окно
        this.openModal();
    }

    setupDropdown() {
        const dropdownToggle = document.querySelector('.dropdown-toggle');
        const dropdownMenu = document.getElementById('applianceDropdown');
        const dropdownItems = document.querySelectorAll('.dropdown-item');

        // Переключение dropdown
        dropdownToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = dropdownMenu.classList.contains('show');
            
            // Закрываем все dropdown
            document.querySelectorAll('.dropdown-menu').forEach(menu => {
                menu.classList.remove('show');
            });
            document.querySelectorAll('.dropdown-toggle').forEach(toggle => {
                toggle.classList.remove('active');
            });
            
            if (!isOpen) {
                dropdownMenu.classList.add('show');
                dropdownToggle.classList.add('active');
            }
        });

        // Обработка кликов по элементам dropdown
        dropdownItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const appliance = e.target.dataset.appliance;
                this.filterByAppliance(appliance, e.target.textContent);
                
                // Закрываем dropdown
                dropdownMenu.classList.remove('show');
                dropdownToggle.classList.remove('active');
            });
        });

        // Закрытие dropdown при клике вне
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.category-dropdown')) {
                dropdownMenu.classList.remove('show');
                dropdownToggle.classList.remove('active');
            }
        });
    }

    filterByAppliance(appliance, applianceName) {
        this.currentAppliance = appliance;
        this.currentCategory = 'all';
        
        // Обновляем активную кнопку
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        const dropdownToggle = document.querySelector('.dropdown-toggle');
        dropdownToggle.classList.add('active');
        dropdownToggle.innerHTML = `${applianceName} <span class="dropdown-arrow">▼</span>`;
        
        // Если выбрано "Все запчасти", сбрасываем фильтр техники
        if (appliance === 'all') {
            this.currentAppliance = null;
        }
        
        this.renderParts();
    }

    openCamera() {
        // Проверяем поддержку getUserMedia
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            alert('Камера не поддерживается вашим браузером');
            return;
        }

        // Создаем модальное окно для камеры
        const cameraModal = document.createElement('div');
        cameraModal.id = 'cameraModal';
        cameraModal.className = 'modal';
        cameraModal.style.display = 'block';
        
        cameraModal.innerHTML = `
            <div class="modal-content" style="max-width: 600px; width: 95%;">
                <span class="close">&times;</span>
                <h2>📷 Сделать фото</h2>
                <div style="text-align: center;">
                    <video id="cameraVideo" style="width: 100%; max-width: 500px; height: auto; border-radius: 8px; background: #000;"></video>
                    <div style="margin-top: 15px;">
                        <button id="captureBtn" class="submit-btn" style="margin-right: 10px;">📸 Сделать фото</button>
                        <button id="cancelCameraBtn" class="auth-btn">Отмена</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(cameraModal);
        document.body.style.overflow = 'hidden';
        
        let stream = null;
        const video = document.getElementById('cameraVideo');
        const captureBtn = document.getElementById('captureBtn');
        const cancelBtn = document.getElementById('cancelCameraBtn');
        const closeBtn = cameraModal.querySelector('.close');
        
        // Запускаем камеру
        navigator.mediaDevices.getUserMedia({ 
            video: { 
                facingMode: 'environment', // Предпочтительно задняя камера
                width: { ideal: 1280 },
                height: { ideal: 720 }
            } 
        })
        .then(s => {
            stream = s;
            video.srcObject = stream;
            video.play();
        })
        .catch(err => {
            console.error('Ошибка доступа к камере:', err);
            alert('Не удалось получить доступ к камере. Проверьте разрешения в настройках браузера.');
            this.closeCameraModal(cameraModal, stream);
        });
        
        // Обработка кнопок
        captureBtn.addEventListener('click', () => {
            this.capturePhoto(video, stream);
            this.closeCameraModal(cameraModal, stream);
        });
        
        cancelBtn.addEventListener('click', () => {
            this.closeCameraModal(cameraModal, stream);
        });
        
        closeBtn.addEventListener('click', () => {
            this.closeCameraModal(cameraModal, stream);
        });
        
        // Закрытие при клике вне модального окна
        window.addEventListener('click', (e) => {
            if (e.target === cameraModal) {
                this.closeCameraModal(cameraModal, stream);
            }
        });
    }

    closeCameraModal(modal, stream) {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
        modal.remove();
        document.body.style.overflow = 'auto';
    }

    capturePhoto(video, stream) {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        context.drawImage(video, 0, 0);
        
        // Конвертируем в Blob и создаем файл
        canvas.toBlob((blob) => {
            const file = new File([blob], `camera_${Date.now()}.jpg`, { type: 'image/jpeg' });
            
            // Создаем DataTransfer для добавления файла в input
            const dataTransfer = new DataTransfer();
            const existingFiles = Array.from(document.getElementById('partImages').files);
            
            // Добавляем существующие файлы
            existingFiles.forEach(existingFile => {
                dataTransfer.items.add(existingFile);
            });
            
            // Добавляем новое фото
            dataTransfer.items.add(file);
            
            document.getElementById('partImages').files = dataTransfer.files;
            
            // Обновляем предпросмотр
            this.previewImages({ target: { files: dataTransfer.files } });
            
            alert('Фото успешно добавлено!');
        }, 'image/jpeg', 0.9);
    }

    handleContactTypeChange(e) {
        const contactType = e.target.value;
        const phoneInput = document.getElementById('partPhone');
        const emailInput = document.getElementById('partEmail');
        const telegramInput = document.getElementById('partTelegram');

        // Скрываем все поля
        phoneInput.style.display = 'none';
        emailInput.style.display = 'none';
        telegramInput.style.display = 'none';

        // Показываем выбранное поле и убираем required с остальных
        phoneInput.required = false;
        emailInput.required = false;
        telegramInput.required = false;

        switch(contactType) {
            case 'phone':
                phoneInput.style.display = 'block';
                phoneInput.required = true;
                break;
            case 'email':
                emailInput.style.display = 'block';
                emailInput.required = true;
                break;
            case 'telegram':
                telegramInput.style.display = 'block';
                telegramInput.required = true;
                break;
        }
    }

    // Методы авторизации
    checkAuth() {
        // Проверяем новую систему авторизации (currentSession)
        const session = localStorage.getItem('currentSession');
        if (session) {
            try {
                const sessionData = JSON.parse(session);
                // Конвертируем сессию в формат currentUser для совместимости
                this.currentUser = {
                    id: sessionData.userId,
                    username: sessionData.username,
                    name: sessionData.username,
                    email: sessionData.username + '@example.com', // временный email
                    role: sessionData.isAdmin ? 'admin' : 'user',
                    isAdmin: sessionData.isAdmin,
                    createdAt: sessionData.loginTime
                };
                this.updateAuthUI();
                return;
            } catch (e) {
                console.error('Error parsing session:', e);
            }
        }
        
        // Проверяем старую систему авторизации (currentUser)
        const user = localStorage.getItem('currentUser');
        if (user) {
            try {
                this.currentUser = JSON.parse(user);
                this.updateAuthUI();
            } catch (e) {
                console.error('Error parsing user:', e);
                this.currentUser = null;
            }
        } else {
            this.currentUser = null;
            this.updateAuthUI();
        }
    }

    openAuthModal(type) {
        document.getElementById('authModal').style.display = 'block';
        document.body.style.overflow = 'hidden';
        
        if (type === 'register') {
            this.showRegisterForm();
        } else {
            this.showLoginForm();
        }
    }

    closeAuthModal() {
        document.getElementById('authModal').style.display = 'none';
        document.body.style.overflow = 'auto';
        this.resetAuthForms();
    }

    showLoginForm() {
        document.getElementById('loginForm').style.display = 'block';
        document.getElementById('registerForm').style.display = 'none';
    }

    showRegisterForm() {
        document.getElementById('loginForm').style.display = 'none';
        document.getElementById('registerForm').style.display = 'block';
    }

    resetAuthForms() {
        document.getElementById('loginFormElement').reset();
        document.getElementById('registerFormElement').reset();
    }

    handleLogin(e) {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;

        const users = this.loadUsers();
        const user = users.find(u => u.email === email && u.password === password);

        if (user) {
            this.currentUser = user;
            localStorage.setItem('currentUser', JSON.stringify(user));
            this.updateAuthUI();
            this.closeAuthModal();
            this.renderParts();
        } else {
            alert('Неверный email или пароль');
        }
    }

    handleRegister(e) {
        e.preventDefault();
        const name = document.getElementById('registerName').value;
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;
        const phone = document.getElementById('registerPhone').value;

        const users = this.loadUsers();
        
        if (users.find(u => u.email === email)) {
            alert('Пользователь с таким email уже существует');
            return;
        }

        const newUser = {
            id: Date.now(),
            name,
            email,
            password,
            phone,
            role: email === 'admin@parts.com' ? 'admin' : 'user',
            createdAt: new Date().toISOString()
        };

        users.push(newUser);
        this.saveUsers(users);

        this.currentUser = newUser;
        localStorage.setItem('currentUser', JSON.stringify(newUser));
        this.updateAuthUI();
        this.closeAuthModal();
        this.renderParts();
    }

    logout() {
        this.currentUser = null;
        // Очищаем обе системы авторизации
        localStorage.removeItem('currentUser');
        localStorage.removeItem('currentSession');
        this.updateAuthUI();
        this.renderParts();
    }

    updateAuthUI() {
        const loginBtn = document.getElementById('loginBtn');
        const registerBtn = document.getElementById('registerBtn');
        const addBtn = document.getElementById('addPartBtn');
        const userInfo = document.getElementById('userInfo');
        const userName = document.getElementById('userName');

        if (this.currentUser) {
            loginBtn.style.display = 'none';
            registerBtn.style.display = 'none';
            addBtn.style.display = 'inline-block';
            userInfo.style.display = 'flex';
            userName.textContent = this.currentUser.name;
            
            if (this.currentUser.role === 'admin') {
                userName.textContent = `${this.currentUser.name} (Админ)`;
            }
        } else {
            loginBtn.style.display = 'inline-block';
            registerBtn.style.display = 'inline-block';
            addBtn.style.display = 'none';
            userInfo.style.display = 'none';
        }
    }

    loadUsers() {
        const saved = localStorage.getItem('partsCatalogUsers');
        if (saved) {
            return JSON.parse(saved);
        }
        
        // Создаем админа по умолчанию
        return [
            {
                id: 1,
                name: 'Администратор',
                email: 'admin@parts.com',
                password: 'admin123',
                phone: '+7 (999) 999-99-99',
                role: 'admin',
                createdAt: new Date().toISOString()
            }
        ];
    }

    saveUsers(users) {
        localStorage.setItem('partsCatalogUsers', JSON.stringify(users));
    }

    openModal() {
        if (!this.currentUser) {
            alert('Для добавления запчасти необходимо авторизоваться');
            this.openAuthModal('login');
            return;
        }
        
        // Показываем поле количества только для администратора
        const quantityGroup = document.getElementById('quantityGroup');
        if (this.currentUser.role === 'admin') {
            quantityGroup.style.display = 'block';
        } else {
            quantityGroup.style.display = 'none';
        }
        
        document.getElementById('addPartModal').style.display = 'block';
        document.body.style.overflow = 'hidden';
    }

    closeModal() {
        document.getElementById('addPartModal').style.display = 'none';
        document.body.style.overflow = 'auto';
        document.getElementById('addPartForm').reset();
        document.getElementById('imagePreview').innerHTML = '';
        this.editingPartId = null;
    }

    async handleSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const imageFiles = document.getElementById('partImages').files;
        
        const part = {
            id: this.editingPartId || Date.now(),
            name: formData.get('partName') || document.getElementById('partName').value,
            category: document.getElementById('partCategory').value,
            appliance: document.getElementById('partAppliance').value,
            price: parseInt(document.getElementById('partPrice').value),
            quantity: this.currentUser.role === 'admin' ? parseInt(document.getElementById('partQuantity').value) : 1,
            phone: document.getElementById('partPhone').value,
            email: document.getElementById('partEmail').value,
            telegram: document.getElementById('partTelegram').value,
            description: document.getElementById('partDescription').value,
            images: [],
            userId: this.currentUser.id,
            userName: this.currentUser.name,
            date: new Date().toISOString()
        };

        // Обработка изображений
        if (imageFiles.length > 0) {
            part.images = await this.processImages(imageFiles);
        }

        if (this.editingPartId) {
            // Редактирование существующего объявления
            const index = this.parts.findIndex(p => p.id === this.editingPartId);
            if (index !== -1) {
                this.parts[index] = part;
            }
            this.editingPartId = null;
        } else {
            // Добавление нового объявления
            this.addPart(part);
        }
        
        this.saveParts();
        this.renderParts();
        this.closeModal();
    }

    async processImages(files) {
        const images = [];
        for (let file of files) {
            if (file.type.startsWith('image/')) {
                const base64 = await this.fileToBase64(file);
                images.push(base64);
            }
        }
        return images;
    }

    fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    addPart(part) {
        this.parts.unshift(part);
        this.saveParts();
        this.renderParts();
    }

    deletePart(id, showMessage = true) {
        const part = this.parts.find(p => p.id === id);
        
        if (!this.currentUser) {
            alert('Для удаления запчасти необходимо авторизоваться');
            return;
        }

        // Проверяем права: админ может удалять все, пользователь - только свои
        if (this.currentUser.role !== 'admin' && part.userId !== this.currentUser.id) {
            alert('Вы можете удалять только свои запчасти');
            return;
        }

        if (!showMessage || confirm('Вы уверены, что хотите удалить эту запчасть?')) {
            this.parts = this.parts.filter(part => part.id !== id);
            this.saveParts();
            this.renderParts();
            
            // Если личный кабинет открыт, обновляем список объявлений
            if (document.getElementById('profileModal').style.display === 'block') {
                this.loadUserParts();
            }
        }
    }

    handleSearch(e) {
        this.searchQuery = document.getElementById('searchInput').value.toLowerCase().trim();
        this.renderParts();
    }

    filterByCategory(e) {
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        e.target.classList.add('active');
        this.currentCategory = e.target.dataset.category;
        this.currentAppliance = null;
        
        // Возвращаем исходный текст кнопки "Все запчасти"
        const dropdownToggle = document.querySelector('.dropdown-toggle');
        dropdownToggle.innerHTML = 'Все запчасти <span class="dropdown-arrow">▼</span>';
        
        this.renderParts();
    }

    getFilteredParts() {
        let filtered = this.parts;

        // Фильтрация по категории
        if (this.currentCategory !== 'all') {
            filtered = filtered.filter(part => part.category === this.currentCategory);
        }

        // Фильтрация по типу техники
        if (this.currentAppliance) {
            filtered = filtered.filter(part => part.appliance === this.currentAppliance);
        }

        // Фильтрация по поиску
        if (this.searchQuery) {
            filtered = filtered.filter(part => {
                const searchText = `${part.name} ${part.description} ${part.phone}`.toLowerCase();
                return searchText.includes(this.searchQuery);
            });
        }

        return filtered;
    }

    renderParts() {
        const grid = document.getElementById('partsGrid');
        const filteredParts = this.getFilteredParts();

        if (filteredParts.length === 0) {
            grid.innerHTML = `
                <div class="empty-state">
                    <h3>Запчасти не найдены</h3>
                    <p>В этой категории пока нет запчастей. Добавьте первую!</p>
                </div>
            `;
            return;
        }

        grid.innerHTML = filteredParts.map(part => this.createPartCard(part)).join('');
    }

    createPartCard(part) {
        const categoryLabels = {
            'new': 'Новые',
            'used': 'БУ',
            'equipment': 'БУ техника'
        };

        const imageContent = part.images.length > 0 
            ? `<img src="${part.images[0]}" alt="${part.name}" onclick="catalog.openImageModal(${part.id}, 0)" style="cursor: pointer;">`
            : '<div class="no-image">Нет фото</div>';

        // Определяем контактную информацию
        let contactInfo = '';
        if (part.phone) {
            contactInfo = `<a href="tel:${part.phone}" class="part-phone">${part.phone}</a>`;
        } else if (part.email) {
            contactInfo = `<a href="mailto:${part.email}" class="part-phone">${part.email}</a>`;
        } else if (part.telegram) {
            contactInfo = `<a href="https://t.me/${part.telegram.replace('@', '')}" target="_blank" class="part-phone">${part.telegram}</a>`;
        }

        // Показываем количество только для администратора
        let quantityInfo = '';
        if (this.currentUser && this.currentUser.role === 'admin' && part.quantity > 1) {
            quantityInfo = `<div style="font-size: 14px; color: #28a745; font-weight: bold; margin-bottom: 5px;">
                Количество: ${part.quantity} шт.
            </div>`;
        }

        // Определяем, может ли текущий пользователь удалить эту запчасть
        const canDelete = this.currentUser && (
            this.currentUser.role === 'admin' || 
            part.userId === this.currentUser.id
        );

        const deleteButton = canDelete 
            ? `<button onclick="catalog.deletePart(${part.id})" class="delete-btn" style="margin-top: 10px; background: #dc3545; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-size: 12px;">
                Удалить
            </button>`
            : '';

        return `
            <div class="part-card" data-id="${part.id}">
                <div class="part-images">
                    ${imageContent}
                </div>
                <div class="part-info">
                    <div class="part-name">${this.escapeHtml(part.name)}</div>
                    <div class="part-category category-${part.category}">
                        ${categoryLabels[part.category]}
                    </div>
                    ${quantityInfo}
                    <div class="part-price">${part.price.toLocaleString()} бел. руб.</div>
                    ${contactInfo}
                    ${part.description ? `<div class="part-description">${this.escapeHtml(part.description)}</div>` : ''}
                    <div style="font-size: 12px; color: #999; margin-top: 5px;">
                        Добавил: ${this.escapeHtml(part.userName || 'Неизвестно')}
                    </div>
                    ${deleteButton}
                </div>
            </div>
        `;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    previewImages(e) {
        const files = e.target.files;
        const preview = document.getElementById('imagePreview');
        preview.innerHTML = '';

        Array.from(files).forEach((file, index) => {
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const img = document.createElement('img');
                    img.src = e.target.result;
                    img.onclick = () => this.openImageModalFromPreview(files, index);
                    img.style.cursor = 'pointer';
                    preview.appendChild(img);
                };
                reader.readAsDataURL(file);
            }
        });
    }

    openImageModal(partId, imageIndex) {
        const part = this.parts.find(p => p.id === partId);
        if (!part || part.images.length === 0) return;

        this.currentImages = part.images;
        this.currentImageIndex = imageIndex;
        this.createImageModal();
    }

    openImageModalFromPreview(files, imageIndex) {
        this.currentImages = [];
        this.currentImageIndex = imageIndex;

        // Конвертируем файлы в base64
        const promises = Array.from(files).map(file => {
            return new Promise((resolve) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result);
                reader.readAsDataURL(file);
            });
        });

        Promise.all(promises).then(images => {
            this.currentImages = images;
            this.createImageModal();
        });
    }

    createImageModal() {
        // Создаем модальное окно если его нет
        let modal = document.getElementById('imageModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'imageModal';
            modal.className = 'image-modal';
            modal.innerHTML = `
                <div class="image-modal-content">
                    <button class="image-modal-close">&times;</button>
                    <button class="image-modal-nav prev">‹</button>
                    <button class="image-modal-nav next">›</button>
                    <img id="modalImage" src="" alt="">
                    <div class="image-modal-counter"></div>
                </div>
            `;
            document.body.appendChild(modal);

            // Обработчики событий
            modal.querySelector('.image-modal-close').addEventListener('click', () => this.closeImageModal());
            modal.querySelector('.image-modal-nav.prev').addEventListener('click', () => this.navigateImages(-1));
            modal.querySelector('.image-modal-nav.next').addEventListener('click', () => this.navigateImages(1));
            modal.addEventListener('click', (e) => {
                if (e.target === modal) this.closeImageModal();
            });

            // Клавиатура
            document.addEventListener('keydown', (e) => {
                if (modal.classList.contains('show')) {
                    if (e.key === 'ArrowLeft') this.navigateImages(-1);
                    if (e.key === 'ArrowRight') this.navigateImages(1);
                    if (e.key === 'Escape') this.closeImageModal();
                }
            });
        }

        this.updateModalImage();
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }

    updateModalImage() {
        const modal = document.getElementById('imageModal');
        const img = document.getElementById('modalImage');
        const counter = modal.querySelector('.image-modal-counter');
        const prevBtn = modal.querySelector('.image-modal-nav.prev');
        const nextBtn = modal.querySelector('.image-modal-nav.next');

        img.src = this.currentImages[this.currentImageIndex];
        counter.textContent = `${this.currentImageIndex + 1} / ${this.currentImages.length}`;

        // Скрываем/показываем кнопки навигации
        prevBtn.style.display = this.currentImages.length > 1 ? 'block' : 'none';
        nextBtn.style.display = this.currentImages.length > 1 ? 'block' : 'none';
    }

    navigateImages(direction) {
        this.currentImageIndex += direction;
        
        if (this.currentImageIndex < 0) {
            this.currentImageIndex = this.currentImages.length - 1;
        } else if (this.currentImageIndex >= this.currentImages.length) {
            this.currentImageIndex = 0;
        }
        
        this.updateModalImage();
    }

    closeImageModal() {
        const modal = document.getElementById('imageModal');
        if (modal) {
            modal.classList.remove('show');
            document.body.style.overflow = 'auto';
        }
    }

    saveParts() {
        localStorage.setItem('partsCatalog', JSON.stringify(this.parts));
        // Также сохраняем на GitHub
        this.savePartsToGitHub();
        
        // Показываем уведомление о сохранении
        const token = localStorage.getItem('githubToken');
        if (token) {
            console.log('💾 Сохранение на GitHub...');
            // Можно добавить визуальное уведомление
            const notification = document.createElement('div');
            notification.textContent = '💾 Сохранение на GitHub...';
            notification.style.cssText = 'position: fixed; top: 10px; right: 10px; background: #4CAF50; color: white; padding: 10px; border-radius: 5px; z-index: 9999;';
            document.body.appendChild(notification);
            setTimeout(() => notification.remove(), 3000);
        } else {
            console.log('⚠️ Нет GitHub токена, данные сохранены только локально');
        }
    }

    async savePartsToGitHub() {
        try {
            const token = localStorage.getItem('githubToken');
            if (!token) {
                console.log('No GitHub token, skipping GitHub save');
                return;
            }

            console.log('Starting GitHub save process...');
            
            // Получаем текущие данные с GitHub
            const GH_REPO = 'urbonchik1888-cell/zapchasti-v2';
            const GH_FILE = 'data.json';
            const GH_CONTENTS_URL = `https://api.github.com/repos/${GH_REPO}/contents/${GH_FILE}`;
            
            console.log('Fetching current file from GitHub...');
            
            // Получаем текущий файл и sha
            const getRes = await fetch(GH_CONTENTS_URL, { 
                headers: { 
                    'Authorization': 'token ' + token, 
                    'Accept': 'application/vnd.github.v3+json' 
                } 
            });
            
            console.log('GitHub API response status:', getRes.status);
            
            let sha = null;
            let current = { newParts: [], usedParts: [], appliances: [], users: [] };
            
            if (getRes.ok) {
                const fileData = await getRes.json();
                sha = fileData.sha;
                console.log('Got file SHA:', sha);
                
                // Загружаем текущее содержимое
                try {
                    const rawResponse = await fetch(`https://raw.githubusercontent.com/${GH_REPO}/main/${GH_FILE}?t=${Date.now()}`);
                    if (rawResponse.ok) {
                        current = await rawResponse.json();
                        console.log('Loaded current data:', Object.keys(current));
                    }
                } catch (e) {
                    console.log('Failed to load current data, using defaults:', e);
                }
            } else {
                console.log('Failed to get file info:', await getRes.text());
            }
            
            // Обновляем данные запчастями
            console.log('Updating parts data...');
            current.newParts = this.parts.filter(p => p.category === 'new');
            current.usedParts = this.parts.filter(p => p.category === 'used');
            current.appliances = this.parts.filter(p => p.category === 'equipment');
            
            console.log('Parts counts:', {
                new: current.newParts.length,
                used: current.usedParts.length,
                equipment: current.appliances.length
            });
            
            // Сохраняем пользователей
            const users = JSON.parse(localStorage.getItem('users') || '[]');
            current.users = users;
            console.log('Users count:', users.length);
            
            // Сохраняем на GitHub
            console.log('Preparing to save to GitHub...');
            const jsonString = JSON.stringify(current, null, 2);
            console.log('JSON size:', jsonString.length);
            
            const content = btoa(unescape(encodeURIComponent(jsonString)));
            const body = { 
                message: 'Update parts catalog - ' + new Date().toISOString(), 
                content, 
                ...(sha && { sha }) 
            };
            
            console.log('Sending PUT request to GitHub...');
            
            const putRes = await fetch(GH_CONTENTS_URL, { 
                method: 'PUT', 
                headers: { 
                    'Authorization': 'token ' + token, 
                    'Accept': 'application/vnd.github.v3+json', 
                    'Content-Type': 'application/json' 
                }, 
                body: JSON.stringify(body) 
            });
            
            console.log('GitHub PUT response status:', putRes.status);
            
            if (putRes.ok) {
                const responseData = await putRes.json();
                console.log('Parts saved to GitHub successfully:', responseData.commit.sha);
                alert('Данные успешно сохранены на GitHub!');
            } else {
                const errorText = await putRes.text();
                console.error('Failed to save parts to GitHub:', errorText);
                alert('Ошибка сохранения на GitHub: ' + errorText);
            }
        } catch (error) {
            console.error('Error saving parts to GitHub:', error);
            alert('Ошибка сохранения: ' + error.message);
        }
    }

    loadParts() {
        // Сначала проверяем localStorage
        const saved = localStorage.getItem('partsCatalog');
        if (saved) {
            try {
                const parts = JSON.parse(saved);
                // Если есть токен GitHub, пробуем загрузить свежие данные
                const token = localStorage.getItem('githubToken');
                if (token) {
                    this.loadPartsFromGitHub().then(githubParts => {
                        if (githubParts && githubParts.length > 0) {
                            this.parts = githubParts;
                            this.renderParts();
                        }
                    }).catch(err => console.log('Failed to load from GitHub, using local data'));
                }
                return parts;
            } catch (e) {
                console.error('Error parsing local parts:', e);
            }
        }
        
        // Если нет локальных данных, пробуем загрузить с GitHub
        const token = localStorage.getItem('githubToken');
        if (token) {
            this.loadPartsFromGitHub().then(githubParts => {
                if (githubParts && githubParts.length > 0) {
                    this.parts = githubParts;
                    this.renderParts();
                }
            }).catch(err => console.log('Failed to load from GitHub, using defaults'));
        }
        
        // Добавляем несколько примеров для демонстрации
        return [
            {
                id: 1,
                name: 'Свечи зажигания NGK BKR6E',
                category: 'new',
                price: 25,
                quantity: 50,
                phone: '+375 (29) 123-45-67',
                description: 'Комплект 4 шт. Оригинальные свечи зажигания',
                images: [],
                userId: 1,
                userName: 'Администратор',
                date: new Date().toISOString()
            },
            {
                id: 2,
                name: 'Двигатель Toyota 1ZZ-FE',
                category: 'used',
                price: 85000,
                quantity: 1,
                phone: '+375 (33) 987-65-43',
                description: 'Б/у двигатель, пробег 80 тыс. км. В отличном состоянии.',
                images: [],
                userId: 1,
                userName: 'Администратор',
                date: new Date().toISOString()
            },
            {
                id: 3,
                name: 'Станок токарный 16К20',
                category: 'equipment',
                price: 250000,
                quantity: 1,
                phone: '+375 (44) 456-78-90',
                description: 'Б/у токарный станок в рабочем состоянии.',
                images: [],
                userId: 1,
                userName: 'Администратор',
                date: new Date().toISOString()
            }
        ];
    }

    async loadPartsFromGitHub() {
        try {
            const response = await fetch('https://raw.githubusercontent.com/urbonchik1888-cell/zapchasti-v2/main/data.json?t=' + Date.now());
            if (response.ok) {
                const data = await response.json();
                
                // Конвертируем данные из формата GitHub в формат parts
                const allParts = [];
                
                if (data.newParts && Array.isArray(data.newParts)) {
                    allParts.push(...data.newParts.map(p => ({...p, category: 'new'})));
                }
                
                if (data.usedParts && Array.isArray(data.usedParts)) {
                    allParts.push(...data.usedParts.map(p => ({...p, category: 'used'})));
                }
                
                if (data.appliances && Array.isArray(data.appliances)) {
                    allParts.push(...data.appliances.map(p => ({...p, category: 'equipment'})));
                }
                
                // Сохраняем в localStorage
                localStorage.setItem('partsCatalog', JSON.stringify(allParts));
                
                console.log('Loaded', allParts.length, 'parts from GitHub');
                return allParts;
            }
        } catch (error) {
            console.error('Error loading parts from GitHub:', error);
        }
        return null;
    }
}

// Глобальная функция синхронизации для вызова из HTML
window.syncData = async function() {
    try {
        const syncBtn = document.getElementById('syncBtn');
        if (syncBtn) {
            syncBtn.disabled = true;
            syncBtn.textContent = '⏳ Синхронизация...';
        }
        
        // Получаем токен GitHub если нужно
        let token = localStorage.getItem('githubToken');
        if (!token) {
            const newToken = prompt('Для синхронизации нужен GitHub токен (repo). Вставьте сюда:');
            if (newToken) {
                localStorage.setItem('githubToken', newToken);
                token = newToken;
            } else {
                return;
            }
        }
        
        // СОХРАНЯЕМ ВСЕ СЕССИИ В ПЕРЕМЕННЫЕ
        const currentSession = localStorage.getItem('currentSession');
        const currentUser = localStorage.getItem('currentUser');
        const users = localStorage.getItem('users');
        const partsCatalogUsers = localStorage.getItem('partsCatalogUsers');
        
        console.log('Before sync - Session:', currentSession);
        console.log('Before sync - User:', currentUser);
        
        // Загружаем свежие данные с GitHub
        if (typeof catalog !== 'undefined') {
            const freshParts = await catalog.loadPartsFromGitHub();
            if (freshParts) {
                catalog.parts = freshParts;
                catalog.renderParts();
            }
        }
        
        // НЕМЕДЛЕННО восстанавливаем ВСЕ сессии
        if (currentSession) localStorage.setItem('currentSession', currentSession);
        if (currentUser) localStorage.setItem('currentUser', currentUser);
        if (users) localStorage.setItem('users', users);
        if (partsCatalogUsers) localStorage.setItem('partsCatalogUsers', partsCatalogUsers);
        if (token) localStorage.setItem('githubToken', token);
        
        // Проверяем что сессии восстановлены
        console.log('After sync - Session:', localStorage.getItem('currentSession'));
        console.log('After sync - User:', localStorage.getItem('currentUser'));
        
        alert('Данные успешно синхронизированы с GitHub!');
        
        // Принудительно проверяем авторизацию и обновляем интерфейс
        if (typeof catalog !== 'undefined') {
            catalog.checkAuth();
            catalog.updateAuthUI();
        }
    } catch (error) {
        console.error('Ошибка синхронизации:', error);
        alert('Произошла ошибка при синхронизации данных');
    } finally {
        const syncBtn = document.getElementById('syncBtn');
        if (syncBtn) {
            syncBtn.disabled = false;
            syncBtn.textContent = '🔄';
        }
    }
};

// Инициализация каталога
const catalog = new PartsCatalog();

// Глобальная функция для тестирования сохранения на GitHub
window.testGitHubSave = async function() {
    if (!catalog.currentUser) {
        alert('Сначала войдите в систему');
        return;
    }
    
    const token = localStorage.getItem('githubToken');
    if (!token) {
        alert('Сначала настройте GitHub токен через синхронизацию');
        return;
    }
    
    console.log('Testing GitHub save...');
    console.log('Token exists:', !!token);
    console.log('Current user:', catalog.currentUser);
    console.log('Parts count:', catalog.parts.length);
    
    try {
        await catalog.savePartsToGitHub();
        console.log('GitHub save test completed');
        alert('Проверьте консоль для деталей сохранения');
    } catch (error) {
        console.error('GitHub save error:', error);
        alert('Ошибка сохранения: ' + error.message);
    }
};

// Диагностическая функция
window.diagnoseGitHub = function() {
    console.log('=== GitHub Diagnosis ===');
    console.log('Token:', localStorage.getItem('githubToken') ? 'EXISTS' : 'MISSING');
    console.log('Current user:', catalog.currentUser);
    console.log('Parts count:', catalog.parts.length);
    console.log('Sample part:', catalog.parts[0]);
    
    // Тестовый запрос к GitHub
    const token = localStorage.getItem('githubToken');
    if (token) {
        fetch('https://api.github.com/repos/urbonchik1888-cell/zapchasti-v2/contents/data.json', {
            headers: {
                'Authorization': 'token ' + token,
                'Accept': 'application/vnd.github.v3+json'
            }
        })
        .then(res => {
            console.log('GitHub API status:', res.status);
            return res.text();
        })
        .then(text => {
            console.log('GitHub response preview:', text.substring(0, 200));
        })
        .catch(err => {
            console.error('GitHub API error:', err);
        });
    }
};

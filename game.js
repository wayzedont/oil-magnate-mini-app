class Game {
    constructor() {
        this.state = {
            money: CONFIG.initial.money,
            clickPower: CONFIG.initial.clickPower,
            clickSkillLevel: CONFIG.initial.clickSkillLevel,
            lands: [],
            availableOil: 0,
            generationHistory: [],
            companies: [],
            analyzedLands: [],
            rigSlots: CONFIG.initial.rigSlots || 2,
            purchasedSlots: 0,
            companyContracts: {},
            lastOnlineTime: Date.now(),
            offlineProgress: 0,
            ownCompany: null,
            events: [],
            priceMultiplier: 1.0,
            priceMultiplierEndTime: 0
        };

        this.selectedLandId = null;
        this.bonusActive = false;
        this.bonusTimeout = null;
        this.telegramUser = null;
        this.telegramWebApp = null;
        this.init();
    }

    init() {
        this.initTelegram();
        this.loadGame();
        this.initCompanies();
        this.generateLands();
        this.setupEventListeners();
        this.startGameLoop();
        // Запустить бонусный кружок через некоторое время после загрузки
        setTimeout(() => this.scheduleBonusCircle(), 5000);

        // Проверить оффлайн прогресс
        this.checkOfflineProgress();

        // Запустить систему событий
        this.scheduleEvent();

        // Запустить счетчик времени игры
        this.startPlayTimeCounter();

        this.updateUI();
    }

    initTelegram() {
        if (window.Telegram && window.Telegram.WebApp) {
            const tg = window.Telegram.WebApp;
            tg.ready();
            tg.expand();

            this.telegramWebApp = tg;
            this.telegramUser = tg.initDataUnsafe.user;

            const theme = tg.themeParams;
            this.applyTheme(theme);

            // Listen for theme changes
            tg.onEvent('themeChanged', () => {
                this.applyTheme(tg.themeParams);
            });
        }
    }

    setupEventListeners() {
        document.getElementById('workButton').addEventListener('click', (e) => this.handleClick(e));
        document.getElementById('bonusCircle').addEventListener('click', (e) => this.handleBonusClick(e));
        
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.addEventListener('click', () => this.switchTab(tab.dataset.tab));
        });

        document.getElementById('generateLands').addEventListener('click', () => this.generateLands());
        document.getElementById('profileButton').addEventListener('click', () => this.openProfileModal());
        document.getElementById('buySlotButton').addEventListener('click', () => this.buyRigSlot());
        
        document.getElementById('upgradeClickSkill').addEventListener('click', () => this.upgradeClickPower());
        document.getElementById('resetProgressButton').addEventListener('click', () => this.resetProgress());

        // Events
        document.getElementById('closeEventModal').addEventListener('click', () => this.closeEventModal());

        // Own Company
        const createCompanyBtn = document.getElementById('createOwnCompany');
        if (createCompanyBtn) {
            createCompanyBtn.addEventListener('click', () => this.createOwnCompany());
        }
        const autoBuyCheckbox = document.getElementById('autoBuyEnabled');
        if (autoBuyCheckbox) {
            autoBuyCheckbox.addEventListener('change', (e) => {
                if (this.state.ownCompany) {
                    this.state.ownCompany.autoBuyEnabled = e.target.checked;
                    this.saveGame();
                }
            });
        }
        const setBuybackBtn = document.getElementById('setBuybackMoney');
        if (setBuybackBtn) {
            setBuybackBtn.addEventListener('click', () => this.setBuybackMoney());
        }
        
        document.getElementById('closeLandModal').addEventListener('click', () => this.closeLandModal());
        document.getElementById('closeProfileModal').addEventListener('click', () => this.closeProfileModal());
        document.getElementById('buyLandButton').addEventListener('click', () => this.buyLand());
        document.getElementById('analyzeLandButton').addEventListener('click', () => this.analyzeLand());
        
        document.getElementById('landModal').addEventListener('click', (e) => {
            if (e.target.id === 'landModal') {
                this.closeLandModal();
            }
        });
        
        document.getElementById('profileModal').addEventListener('click', (e) => {
            if (e.target.id === 'profileModal') {
                this.closeProfileModal();
            }
        });
    }

    handleClick(e) {
        let money = this.state.clickPower;
        if (this.bonusActive) {
            money *= CONFIG.bonusCircle.multiplier;
        }

        this.state.money += money;

        this.showFloatingNumber(money, e.clientX, e.clientY);

        const button = e.currentTarget;
        button.style.animation = 'none';
        setTimeout(() => {
            button.style.animation = '';
        }, 10);

        this.updateUI();

        // Check achievements immediately after click
        setTimeout(() => this.checkAchievements(), 100);
    }

    handleBonusClick(e) {
        e.stopPropagation();
        
        this.bonusActive = true;
        const bonusCircle = document.getElementById('bonusCircle');
        bonusCircle.style.display = 'none';
        
        if (this.bonusTimeout) {
            clearTimeout(this.bonusTimeout);
        }
        
        // Показать уведомление о бонусе
        const floatingDiv = document.getElementById('floatingNumbers');
        const notification = document.createElement('div');
        notification.className = 'floating-bonus';
        notification.textContent = '✨ x2 БОНУС АКТИВИРОВАН! ✨';
        notification.style.left = '50%';
        notification.style.top = '30%';
        notification.style.transform = 'translateX(-50%)';
        
        floatingDiv.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 2000);
        
        this.bonusTimeout = setTimeout(() => {
            this.bonusActive = false;
            this.scheduleBonusCircle();
        }, CONFIG.bonusCircle.duration);
    }

    scheduleBonusCircle() {
        const delay = Math.random() * (CONFIG.bonusCircle.maxInterval - CONFIG.bonusCircle.minInterval) + CONFIG.bonusCircle.minInterval;
        
        setTimeout(() => {
            this.showBonusCircle();
        }, delay);
    }

    showBonusCircle() {
        const bonusCircle = document.getElementById('bonusCircle');
        const workScreen = document.querySelector('.work-screen');
        
        if (!workScreen || document.querySelector('.nav-tab.active[data-tab="work"]') === null) {
            // Если не на вкладке работа, перепланировать
            this.scheduleBonusCircle();
            return;
        }
        
        const maxX = 300;
        const maxY = 400;
        
        const randomX = Math.random() * maxX + 20;
        const randomY = Math.random() * maxY + 100;
        
        bonusCircle.style.left = randomX + 'px';
        bonusCircle.style.top = randomY + 'px';
        bonusCircle.style.display = 'flex';
        
        // Автоматически скрыть через 5 секунд, если не кликнули
        setTimeout(() => {
            if (bonusCircle.style.display !== 'none') {
                bonusCircle.style.display = 'none';
                this.scheduleBonusCircle();
            }
        }, CONFIG.bonusCircle.duration);
    }

    showFloatingNumber(amount, x, y) {
        const floatingDiv = document.getElementById('floatingNumbers');
        const number = document.createElement('div');
        number.className = 'floating-number';
        number.textContent = `+${this.formatNumber(amount)}₽`;
        number.style.left = x + 'px';
        number.style.top = y + 'px';
        
        floatingDiv.appendChild(number);
        
        setTimeout(() => {
            number.remove();
        }, CONFIG.ui.floatingNumberDuration);
    }

    switchTab(tabName) {
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabName);
        });
        
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.toggle('active', content.dataset.tab === tabName);
        });
        
        if (tabName === 'sell') {
            this.renderCompanies();
        } else if (tabName === 'myLands') {
            // Даём время на загрузку DOM элементов
            setTimeout(() => this.renderMyLands(), 0);
        } else if (tabName === 'lands') {
            this.renderLands();
            this.updateGenerationButton();
        } else if (tabName === 'company') {
            this.renderCompanyTab();
        }
    }

    openProfileModal() {
        this.updateProfileUI();
        document.getElementById('profileModal').classList.add('active');
    }

    closeProfileModal() {
        document.getElementById('profileModal').classList.remove('active');
    }

    generateLands() {
        if (!this.canGenerateLands()) {
            return;
        }

        const timestamp = Date.now();
        this.state.generationHistory.push(timestamp);
        
        // Keep only owned lands
        const ownedLands = this.state.lands.filter(land => land.owned);
        
        // Найти максимальный ID среди всех земель
        let maxId = 0;
        if (this.state.lands.length > 0) {
            maxId = Math.max(...this.state.lands.map(land => land.id));
        }
        
        // Сбросить список участков - оставить только купленные
        this.state.lands = [...ownedLands];
        
        // Очистить список анализов при генерации новых участков
        this.state.analyzedLands = [];
        
        // Generate new lands with unique IDs
        for (let i = 0; i < CONFIG.lands.totalCount; i++) {
            maxId++;
            const land = this.generateRandomLand(maxId);
            this.state.lands.push(land);
        }
        
        this.renderLands();
        this.updateGenerationButton();
        this.saveGame();
    }

    canGenerateLands() {
        const now = Date.now();
        const cooldownTime = CONFIG.generation.cooldownTime;
        
        // Ensure generationHistory exists
        if (!this.state.generationHistory) {
            this.state.generationHistory = [];
        }
        
        // Clean up old generation timestamps
        this.state.generationHistory = this.state.generationHistory.filter(
            timestamp => now - timestamp < cooldownTime
        );
        
        return this.state.generationHistory.length < CONFIG.generation.maxAttempts;
    }

    updateGenerationButton() {
        const button = document.getElementById('generateLands');
        const limitSpan = document.getElementById('generationLimit');
        
        if (!button || !limitSpan) return;
        
        const now = Date.now();
        const cooldownTime = CONFIG.generation.cooldownTime;
        
        // Ensure generationHistory exists
        if (!this.state.generationHistory) {
            this.state.generationHistory = [];
        }
        
        this.state.generationHistory = this.state.generationHistory.filter(
            timestamp => now - timestamp < cooldownTime
        );
        
        const remainingAttempts = CONFIG.generation.maxAttempts - this.state.generationHistory.length;
        
        if (remainingAttempts > 0) {
            button.disabled = false;
            limitSpan.textContent = `(${remainingAttempts}/${CONFIG.generation.maxAttempts})`;
            limitSpan.style.color = 'var(--bg-dark)';
        } else {
            button.disabled = true;
            const oldestTimestamp = Math.min(...this.state.generationHistory);
            const timeLeft = Math.ceil((cooldownTime - (now - oldestTimestamp)) / 1000 / 60);
            limitSpan.textContent = `Ждите ${timeLeft} мин`;
            limitSpan.style.color = 'rgba(0,0,0,0.6)';
        }
    }

    generateRandomLand(id) {
        const price = Math.floor(
            Math.random() * (CONFIG.lands.priceRange.max - CONFIG.lands.priceRange.min) + 
            CONFIG.lands.priceRange.min
        );
        
        let priceCategory;
        if (price < 10000) {
            priceCategory = 'cheap';
        } else if (price < 30000) {
            priceCategory = 'medium';
        } else {
            priceCategory = 'expensive';
        }
        
        const probabilities = CONFIG.lands.probabilityMatrix[priceCategory];
        const qualityRoll = Math.random();
        let quality;
        
        if (qualityRoll < probabilities.empty) {
            quality = 'empty';
        } else if (qualityRoll < probabilities.empty + probabilities.poor) {
            quality = 'poor';
        } else if (qualityRoll < probabilities.empty + probabilities.poor + probabilities.medium) {
            quality = 'medium';
        } else {
            quality = 'rich';
        }
        
        const multiplier = CONFIG.lands.oilValueMultipliers[quality];
        const baseReserve = Math.random() * (CONFIG.lands.oilReserveRange.max - CONFIG.lands.oilReserveRange.min) + 
                           CONFIG.lands.oilReserveRange.min;
        const oilReserve = Math.floor(baseReserve * multiplier);
        
        return {
            id,
            price,
            oilReserve,
            currentOil: oilReserve,
            quality,
            owned: false,
            rigs: []
        };
    }

    renderMyLands() {
        const grid = document.getElementById('myLandsGrid');
        const noLandsMessage = document.getElementById('noLandsMessage');
        const usedSlotsElement = document.getElementById('usedSlots');
        const totalSlotsElement = document.getElementById('totalSlots');
        const slotCostElement = document.getElementById('slotCost');
        const buySlotButton = document.getElementById('buySlotButton');

        grid.innerHTML = '';

        const ownedLands = this.state.lands.filter(land => land.owned);
        // Все купленные участки занимают слоты, независимо от наличия вышек
        const occupiedSlots = ownedLands.length;

        // Обновляем информацию о слотах
        if (usedSlotsElement) usedSlotsElement.textContent = occupiedSlots;
        if (totalSlotsElement) totalSlotsElement.textContent = this.state.rigSlots;

        // Обновляем кнопку покупки слота
        const slotCost = Math.floor(CONFIG.rigSlots.baseCost * Math.pow(CONFIG.rigSlots.costMultiplier, this.state.purchasedSlots));
        if (slotCostElement) slotCostElement.textContent = `${this.formatNumber(slotCost)}₽`;
        if (buySlotButton) buySlotButton.disabled = this.state.money < slotCost;

        if (ownedLands.length === 0) {
            noLandsMessage.style.display = 'block';
            grid.style.display = 'none';
        } else {
            noLandsMessage.style.display = 'none';
            grid.style.display = 'grid';

            ownedLands.forEach(land => {
                const card = this.createLandCard(land, true); // true = в списке "Мои скважины"
                grid.appendChild(card);
            });
        }
    }

    renderLands() {
        const grid = document.getElementById('landsGrid');
        grid.innerHTML = '';
        
        // Показывать только неприобретенные участки
        const availableLands = this.state.lands.filter(land => !land.owned);
        
        if (availableLands.length === 0) {
            grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-gray);">Нет доступных участков. Сгенерируйте новые!</div>';
            return;
        }
        
        availableLands.forEach(land => {
            const card = this.createLandCard(land);
            grid.appendChild(card);
        });
    }

    createLandCard(land, isMyLands = false) {
        const card = document.createElement('div');
        card.className = 'land-card';
        
        if (land.owned) {
            card.classList.add('owned');
            if (land.currentOil <= 0) {
                card.classList.add('depleted');
            }
        }
        
        let statusIcon = '🏜️';
        if (land.owned && land.rigs && land.rigs.length > 0) {
            statusIcon = CONFIG.rigs.types.find(r => r.id === land.rigs[0].type).icon;
        } else if (land.owned) {
            statusIcon = '✅';
        }
        
        const qualityHint = this.getQualityHint(land);
        
        // Кнопка удаления для истощенных скважин
        const deleteButton = (isMyLands && land.owned && land.currentOil <= 0) ? 
            `<button class="btn-delete-rig" onclick="event.stopPropagation(); game.deleteDepletedLand(${land.id})">
                🗑️ Удалить (${this.formatNumber(Math.floor(land.price * 0.1))}₽)
            </button>` : '';
        
        card.innerHTML = `
            <div class="land-card-header">
                <span class="land-number">#${land.id}</span>
                <span class="land-status">${statusIcon}</span>
            </div>
            <div class="land-price">${this.formatNumber(land.price)}₽</div>
            ${qualityHint ? `<div class="land-quality ${this.getQualityClass(land)}">${qualityHint}</div>` : ''}
            ${land.owned && land.rigs && land.rigs.length > 0 ? this.createRigInfo(land) : ''}
            ${deleteButton}
        `;
        
        card.addEventListener('click', () => this.openLandModal(land.id));
        
        return card;
    }

    getQualityHint(land) {
        if (!this.state.analyzedLands.includes(land.id)) {
            return '';
        }
        
        if (land.quality === 'empty') return '❌ Почти пусто';
        if (land.quality === 'poor') return '⚠️ Мало нефти';
        if (land.quality === 'medium') return '✅ Нормально';
        if (land.quality === 'rich') return '💎 Много нефти';
        
        return '';
    }

    getQualityClass(land) {
        if (land.quality === 'rich' || land.quality === 'medium') {
            return 'good';
        } else {
            return 'bad';
        }
    }

    createRigInfo(land) {
        const rigs = land.rigs.map(rig => CONFIG.rigs.types.find(rt => rt.id === rig.type));
        const progress = ((land.oilReserve - land.currentOil) / land.oilReserve) * 100;

        const rigInfo = rigs.map((rig, index) => `
            <div>${rig.icon} ${rig.name} ${land.rigs.length > 1 ? `(${index + 1})` : ''}</div>
            <div>Скорость: ${rig.extractionRate} б./сек</div>
        `).join('');

        return `
            <div class="land-rig-info">
                ${rigInfo}
                <div>Всего вышек: ${land.rigs.length}</div>
                <div>Осталось: ${this.formatNumber(land.currentOil)} б.</div>
                <div class="land-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${progress}%"></div>
                    </div>
                </div>
            </div>
        `;
    }

    openLandModal(landId) {
        this.selectedLandId = landId;
        const land = this.state.lands.find(l => l.id === landId);
        
        document.getElementById('landId').textContent = landId;
        document.getElementById('landPrice').textContent = this.formatNumber(land.price) + '₽';
        
        const qualityRow = document.getElementById('landQualityRow');
        const qualityHint = this.getQualityHint(land);
        
        if (qualityHint) {
            qualityRow.style.display = 'flex';
            document.getElementById('landQuality').textContent = qualityHint;
            qualityRow.className = 'detail-row quality ' + this.getQualityClass(land);
        } else {
            qualityRow.style.display = 'none';
        }
        
        if (land.owned) {
            document.getElementById('landOilReserve').textContent = this.formatNumber(land.currentOil) + ' баррелей';
        } else {
            document.getElementById('landOilReserve').textContent = '???';
        }
        
        const buyButton = document.getElementById('buyLandButton');
        const analyzeButton = document.getElementById('analyzeLandButton');
        const rigsSection = document.getElementById('rigsSection');
        
        // Remove any existing slot warning
        const existingWarning = document.querySelector('.slot-warning');
        if (existingWarning) {
            existingWarning.remove();
        }

        if (!land.owned) {
            buyButton.style.display = 'block';
            buyButton.disabled = this.state.money < land.price;
            rigsSection.style.display = 'none';

            // Показываем информацию о том, что участок занимает слот
            const ownedLands = this.state.lands.filter(l => l.owned);
            const slotWarning = document.createElement('div');
            slotWarning.className = 'slot-warning';
            slotWarning.innerHTML = `<small style="color: var(--text-gray);">⚠️ Участок займет 1 слот (${ownedLands.length}/${this.state.rigSlots} занято)</small>`;
            buyButton.parentNode.insertBefore(slotWarning, buyButton.nextSibling);

            const analyzeCost = Math.floor(land.price * CONFIG.landAnalysis.costPercentage);
            const isAnalyzed = this.state.analyzedLands.includes(land.id);

            if (isAnalyzed) {
                analyzeButton.style.display = 'none';
            } else {
                analyzeButton.style.display = 'block';
                document.getElementById('analyzeCost').textContent = this.formatNumber(analyzeCost);
                analyzeButton.disabled = this.state.money < analyzeCost;
            }
        } else {
            buyButton.style.display = 'none';
            analyzeButton.style.display = 'none';
            rigsSection.style.display = 'block';
            this.renderRigs(land);
        }
        
        document.getElementById('landModal').classList.add('active');
    }

    analyzeLand() {
        const land = this.state.lands.find(l => l.id === this.selectedLandId);
        const analyzeCost = Math.floor(land.price * CONFIG.landAnalysis.costPercentage);
        
        if (this.state.money >= analyzeCost) {
            this.state.money -= analyzeCost;
            this.state.analyzedLands.push(land.id);
            
            this.updateUI();
            this.renderLands();
            this.openLandModal(land.id);
            this.saveGame();
        }
    }

    closeLandModal() {
        document.getElementById('landModal').classList.remove('active');
        this.selectedLandId = null;
    }

    buyLand() {
        const land = this.state.lands.find(l => l.id === this.selectedLandId);

        if (this.state.money >= land.price) {
            // Проверяем: есть ли свободные слоты для установки вышки (все купленные участки занимают слоты)
            const ownedLands = this.state.lands.filter(l => l.owned);
            if (ownedLands.length >= this.state.rigSlots) {
                alert(`Нельзя купить участок! У вас ${this.state.rigSlots} слотов для вышек, все заняты. Купите дополнительный слот, чтобы освободить место.`);
                return;
            }

            this.state.money -= land.price;
            land.owned = true;

            const card = document.querySelector(`.land-card:nth-child(${land.id})`);
            if (card) {
                card.classList.add('success-flash');
                setTimeout(() => card.classList.remove('success-flash'), 500);
            }

            this.updateUI();
            this.renderLands();
            this.openLandModal(land.id);
            this.saveGame();

            // Check achievements after buying land
            setTimeout(() => this.checkAchievements(), 100);
        }
    }

    renderRigs(land) {
        const rigsList = document.getElementById('rigsList');
        const rigStatus = document.getElementById('rigStatus');

        if (land.rigs && land.rigs.length > 0) {
            rigsList.style.display = 'flex';
            const existingRigsHtml = land.rigs.map((rig, index) => {
                const rigConfig = CONFIG.rigs.types.find(r => r.id === rig.type);
                return `
                    <div class="existing-rig">
                        <h4>${rigConfig.icon} ${rigConfig.name} ${land.rigs.length > 1 ? `(${index + 1})` : ''} работает</h4>
                        <p>Скорость: ${rigConfig.extractionRate} б./сек</p>
                        <button class="btn-remove-rig" onclick="game.removeRig(${land.id}, ${index})">Убрать вышку</button>
                    </div>
                `;
            }).join('');

            rigStatus.innerHTML = `
                <div class="existing-rigs">
                    <h4>Установленные вышки:</h4>
                    ${existingRigsHtml}
                    <p>Осталось нефти: ${this.formatNumber(land.currentOil)} баррелей</p>
                    <p>Добыто: ${this.formatNumber(land.oilReserve - land.currentOil)} баррелей</p>
                    <p>Общая скорость: ${land.rigs.reduce((sum, rig) => sum + CONFIG.rigs.types.find(r => r.id === rig.type).extractionRate, 0)} б./сек</p>
                </div>
            `;

            rigsList.innerHTML = '';
            if (land.rigs.length < CONFIG.rigs.maxPerLand) {
                CONFIG.rigs.types.forEach(rig => {
                    const option = this.createRigOption(rig, land);
                    rigsList.appendChild(option);
                });
            } else {
                rigsList.innerHTML = '<p style="color: var(--text-gray); text-align: center; width: 100%;">Максимум вышек на участке</p>';
            }
        } else {
            rigsList.style.display = 'flex';
            rigStatus.innerHTML = '<p style="color: var(--text-gray);">Выберите вышку для установки</p>';

            rigsList.innerHTML = '';
            CONFIG.rigs.types.forEach(rig => {
                const option = this.createRigOption(rig, land);
                rigsList.appendChild(option);
            });
        }
    }

    createRigOption(rig, land) {
        const div = document.createElement('div');
        div.className = 'rig-option';
        
        const canAfford = this.state.money >= rig.price;
        
        div.innerHTML = `
            <div class="rig-header">
                <span class="rig-name">${rig.icon} ${rig.name}</span>
                <span class="rig-price">${this.formatNumber(rig.price)}₽</span>
            </div>
            <div class="rig-stats">
                <div>⚡ Скорость: ${rig.extractionRate} б./сек</div>
                <div>📉 Потери: ${rig.lossPercentage}%</div>
            </div>
        `;
        
        if (!canAfford) {
            div.style.opacity = '0.5';
            div.style.cursor = 'not-allowed';
        } else {
            div.addEventListener('click', () => this.installRig(land.id, rig.id));
        }
        
        return div;
    }

    installRig(landId, rigId) {
        const land = this.state.lands.find(l => l.id === landId);
        const rig = CONFIG.rigs.types.find(r => r.id === rigId);

        // Проверяем количество свободных слотов (все скважины с установленными вышками)
        const activeLands = this.state.lands.filter(l => l.owned && l.rigs && l.rigs.length > 0);

        // Если это первая вышка и слоты заняты, проверяем
        if (land.rigs.length === 0 && activeLands.length >= this.state.rigSlots) {
            alert(`Все слоты заняты! У вас ${this.state.rigSlots} слотов для вышек. Купите дополнительный слот или удалите истощённую скважину, чтобы освободить место.`);
            return;
        }

        if (this.state.money >= rig.price && land.rigs.length < CONFIG.rigs.maxPerLand) {
            this.state.money -= rig.price;
            land.rigs.push({
                type: rigId,
                installedAt: Date.now()
            });

            this.updateUI();
            this.openLandModal(landId);
            this.saveGame();
        }
    }

    removeRig(landId, rigIndex) {
        const land = this.state.lands.find(l => l.id === landId);

        if (land && land.rigs && land.rigs[rigIndex]) {
            const rigConfig = CONFIG.rigs.types.find(r => r.id === land.rigs[rigIndex].type);
            const refund = Math.floor(rigConfig.price * 0.5); // Возврат 50% стоимости

            this.state.money += refund;
            land.rigs.splice(rigIndex, 1);

            this.updateUI();
            this.openLandModal(landId);
            this.saveGame();

            this.showFloatingNumber(refund, window.innerWidth / 2, window.innerHeight / 2);
        }
    }
    
    buyRigSlot() {
        const cost = Math.floor(CONFIG.rigSlots.baseCost * Math.pow(CONFIG.rigSlots.costMultiplier, this.state.purchasedSlots));
        
        if (this.state.money >= cost) {
            this.state.money -= cost;
            this.state.rigSlots++;
            this.state.purchasedSlots++;
            
            this.updateUI();
            this.renderMyLands();
            this.saveGame();
        }
    }
    
    deleteDepletedLand(landId) {
        const land = this.state.lands.find(l => l.id === landId);

        if (!land || !land.owned || land.currentOil > 0) {
            return;
        }

        const deleteCost = Math.floor(land.price * 0.1);

        if (this.state.money < deleteCost) {
            alert(`Недостаточно денег для удаления. Требуется: ${this.formatNumber(deleteCost)}₽`);
            return;
        }

        if (confirm(`Удалить истощенную скважину за ${this.formatNumber(deleteCost)}₽?`)) {
            this.state.money -= deleteCost;

            // Удаляем участок из списка
            this.state.lands = this.state.lands.filter(l => l.id !== landId);

            this.updateUI();
            this.renderMyLands();
            this.saveGame();
        }
    }

    upgradeContract(companyId) {
        const contract = this.state.companyContracts[companyId];
        const company = CONFIG.companies.list.find(c => c.id === companyId);
        const currentLevel = contract.level;
        const nextLevel = currentLevel + 1;

        if (nextLevel > company.contractLevels.length) {
            alert('Максимальный уровень контракта достигнут!');
            return;
        }

        const upgradeCost = company.contractLevels.find(l => l.level === nextLevel).cost;

        if (this.state.money < upgradeCost) {
            alert(`Недостаточно денег для улучшения контракта. Требуется: ${this.formatNumber(upgradeCost)}₽`);
            return;
        }

        if (confirm(`Улучшить контракт с ${company.name} до уровня ${nextLevel} за ${this.formatNumber(upgradeCost)}₽?`)) {
            this.state.money -= upgradeCost;
            contract.level = nextLevel;

            // Обновляем компанию в state
            const stateCompany = this.state.companies.find(c => c.id === companyId);
            if (stateCompany) {
                stateCompany.contractLevel = nextLevel;
            }

            this.updateUI();
            this.renderCompanies();
            this.saveGame();
        }
    }

    upgradeClickPower() {
        const level = this.state.clickSkillLevel;
        const cost = Math.floor(CONFIG.skills.clickPower.baseCost * Math.pow(CONFIG.skills.clickPower.costMultiplier, level - 1));

        if (this.state.money >= cost) {
            this.state.money -= cost;
            this.state.clickSkillLevel++;

            // Новая формула прогрессии:
            // Уровень 1: 1₽
            // Уровень 2: 3₽ (+2)
            // Уровень 3: 5₽ (+2)
            // Уровень 4: 8₽ (+3)
            // Уровень 5: 11₽ (+3)
            // Уровень 6: 15₽ (+4)
            // Уровень 7: 19₽ (+4)
            // Уровень 8: 24₽ (+5)
            // Далее прирост замедляется

            const newLevel = this.state.clickSkillLevel;
            let power;

            if (newLevel === 1) {
                power = 1;
            } else if (newLevel <= 3) {
                power = 1 + (newLevel - 1) * 2; // 1, 3, 5
            } else if (newLevel <= 5) {
                power = 5 + (newLevel - 3) * 3; // 8, 11
            } else if (newLevel <= 7) {
                power = 11 + (newLevel - 5) * 4; // 15, 19
            } else if (newLevel <= 10) {
                power = 19 + (newLevel - 7) * 5; // 24, 29, 34
            } else {
                // После 10 уровня - еще медленнее
                power = 34 + (newLevel - 10) * 3;
            }

            this.state.clickPower = power;

            this.updateUI();
            this.saveGame();

            // Check achievements after upgrade
            setTimeout(() => this.checkAchievements(), 100);
        }
    }



    updateProfileUI() {
        document.getElementById('profileMoney').textContent = this.formatNumber(Math.floor(this.state.money)) + '₽';
        document.getElementById('profileOil').textContent = this.formatNumber(Math.floor(this.state.availableOil)) + ' б.';

        const workingLands = this.state.lands.filter(l => l.owned && l.rigs && l.rigs.length > 0).length;
        document.getElementById('profileLands').textContent = workingLands;
        document.getElementById('profileClickPower').textContent = this.state.clickPower + '₽';

        // Показать Telegram пользователя если доступно
        const telegramUserCard = document.getElementById('telegramUserCard');
        const telegramUserName = document.getElementById('telegramUserName');
        const telegramUserId = document.getElementById('telegramUserId');
        if (this.telegramUser) {
            telegramUserCard.style.display = 'block';
            telegramUserName.textContent = this.telegramUser.first_name + (this.telegramUser.last_name ? ' ' + this.telegramUser.last_name : '');
            telegramUserId.textContent = 'ID: ' + this.telegramUser.id;
        } else {
            telegramUserCard.style.display = 'none';
        }
    }

    resetProgress() {
       if (confirm('Вы уверены, что хотите сбросить весь прогресс? Это действие нельзя отменить!')) {
            try {
                localStorage.removeItem('oilGame');
                // Also clear any admin data for this user
                if (this.telegramUser) {
                    localStorage.removeItem('admin_player_data_' + this.telegramUser.id);
                } else {
                    localStorage.removeItem('admin_player_data_guest');
                }
                location.reload();
            } catch (e) {
                console.error('Error resetting progress:', e);
                alert('Ошибка при сбросе прогресса. Попробуйте перезагрузить страницу вручную.');
            }
        }
    }

   resetAllPlayers() {
       if (confirm('Вы уверены, что хотите сбросить прогресс ВСЕХ игроков? Это действие нельзя отменить!')) {
           // Clear all player saves from localStorage
           for (let i = localStorage.length - 1; i >= 0; i--) {
               const key = localStorage.key(i);
               if (key && (key.startsWith('oilGame') || key.startsWith('admin_player_data_'))) {
                   localStorage.removeItem(key);
               }
           }
           alert('Прогресс всех игроков сброшен!');
           location.reload();
       }
   }

   resetPlayer(playerId) {
       if (confirm(`Вы уверены, что хотите сбросить прогресс игрока ${playerId}?`)) {
           // For localStorage-based saves, we need to handle it differently
           // Since data is stored as JSON, we'll need to implement proper player reset
           const playerKey = 'admin_player_data_' + playerId;
           localStorage.removeItem(playerKey);

           // Also remove from main game if it's the current player
           const saved = localStorage.getItem('oilGame');
           if (saved) {
               const data = JSON.parse(saved);
               // For guest or current player, clear their save
               if ((playerId === 'guest' && !this.telegramUser) ||
                   (this.telegramUser && this.telegramUser.id.toString() === playerId)) {
                   localStorage.removeItem('oilGame');
                   if (confirm('Это ваш аккаунт. Перезагрузить страницу?')) {
                       location.reload();
                   }
               }
           }

           alert(`Прогресс игрока ${playerId} сброшен!`);
       }
   }

    startGameLoop() {
        setInterval(() => {
            this.updateRigs();
        }, CONFIG.ui.rigUpdateInterval);

        setInterval(() => {
            this.saveGame();
        }, 1000); // Save every second for better reliability

        setInterval(() => {
            this.updateGenerationButton();
        }, 10000);

        setInterval(() => {
            this.updateCompanyPrices();
        }, CONFIG.companies.priceChangeInterval);

        setInterval(() => {
            this.updateCompanyRequirements();
        }, CONFIG.companies.requirementsChangeInterval);

        setInterval(() => {
            this.updatePriceMultiplier();
        }, 1000);

        setInterval(() => {
            this.updateOwnCompany();
        }, 1000);

        // Новые игровые механики для вовлеченности
        setInterval(() => {
            this.showRandomTip();
        }, 5 * 60 * 1000); // Каждые 5 минут

        setInterval(() => {
            this.checkAchievements();
        }, 30000); // Каждые 30 секунд
    }

    startPlayTimeCounter() {
        this.state.totalPlayTime = this.state.totalPlayTime || 0;
        this.playTimeStart = Date.now();
    }

    showRandomTip() {
        const tips = [
            "Чем дороже участок, тем выше шанс найти богатые запасы нефти!",
            "Улучшенная вышка дает больше нефти, но требует больше времени на установку!",
            "Следите за ценами компаний - они постоянно меняются!",
            "Бонусный круг появляется случайно - не упустите его!",
            "Премиум вышки дают максимальную добычу с минимальными потерями!",
            "Собственная компания позволяет производить нефтепродукты для дополнительного дохода!",
            "Регулярно проверяйте вкладку 'Продажа' для лучших цен!",
            "Уровень контракта с компаниями влияет на объем закупок!"
        ];

        const randomTip = "💡 " + tips[Math.floor(Math.random() * tips.length)];
        this.showFloatingNotification(randomTip, 5000);
    }

    checkAchievements() {
        const achievements = [
            { id: 'first_click', condition: () => this.state.clickSkillLevel >= 2, reward: 100, text: '🎉 Первый клик! +100₽' },
            { id: 'first_land', condition: () => this.state.lands.filter(l => l.owned).length >= 1, reward: 500, text: '🏜️ Первый участок! +500₽' },
            { id: 'first_rig', condition: () => this.state.lands.some(l => l.rigs && l.rigs.length > 0), reward: 1000, text: '🏭 Первая вышка! +1000₽' },
            { id: 'first_sale', condition: () => this.state.money >= 10000, reward: 2000, text: '💰 Первая продажа! +2000₽' },
            { id: 'millionaire', condition: () => this.state.money >= 1000000, reward: 10000, text: '💎 Миллионер! +10000₽' },
            { id: 'oil_tycoon', condition: () => this.state.availableOil >= 10000, reward: 5000, text: '🛢️ Нефтяной магнат! +5000₽' }
        ];

        achievements.forEach(achievement => {
            if (achievement.condition() && !this.state.achievements?.includes(achievement.id)) {
                this.state.achievements = this.state.achievements || [];
                this.state.achievements.push(achievement.id);
                this.state.money += achievement.reward;
                this.showFloatingNotification(achievement.text, 8000);
                this.updateUI();
                this.saveGame();
            }
        });
    }

    showFloatingNotification(message, duration = 3000) {
        const notification = document.createElement('div');
        notification.className = 'floating-notification';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: var(--accent-gold);
            color: var(--bg-dark);
            padding: 15px 25px;
            border-radius: 25px;
            font-weight: bold;
            z-index: 10000;
            box-shadow: 0 4px 12px rgba(255, 215, 0, 0.4);
            animation: slideDown 0.5s ease-out;
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideUp 0.5s ease-in forwards';
            setTimeout(() => notification.remove(), 500);
        }, duration);
    }

    updateRigs() {
        let hasChanges = false;

        this.state.lands.forEach(land => {
            if (land.rigs && land.rigs.length > 0 && land.currentOil > 0) {
                let totalExtracted = 0;

                land.rigs.forEach(rig => {
                    const rigConfig = CONFIG.rigs.types.find(r => r.id === rig.type);
                    const extracted = Math.min(rigConfig.extractionRate, land.currentOil);
                    const lost = extracted * (rigConfig.lossPercentage / 100);
                    const effective = extracted - lost;

                    totalExtracted += extracted;
                    this.state.availableOil += effective;
                });

                land.currentOil -= totalExtracted;
                hasChanges = true;

                // Если нефть закончилась
                if (land.currentOil <= 0) {
                    land.currentOil = 0;
                }
            }
        });

        if (hasChanges) {
            this.updateUI();
            // Обновляем отображение слотов если на вкладке "Мои скважины"
            const activeTab = document.querySelector('.nav-tab.active');
            if (activeTab && activeTab.dataset.tab === 'myLands') {
                this.renderMyLands();
            }
        }
    }



    calculateOilExtractionRate() {
        let total = 0;

        this.state.lands.forEach(land => {
            if (land.rigs && land.rigs.length > 0 && land.currentOil > 0) {
                land.rigs.forEach(rig => {
                    const rigConfig = CONFIG.rigs.types.find(r => r.id === rig.type);
                    const extracted = rigConfig.extractionRate;
                    const lost = extracted * (rigConfig.lossPercentage / 100);
                    const effective = extracted - lost;
                    total += effective;
                });
            }
        });

        return total;
    }

    updateUI() {
        document.getElementById('money').textContent = this.formatNumber(Math.floor(this.state.money));
        document.getElementById('availableOil').textContent = this.formatNumber(Math.floor(this.state.availableOil));
        document.getElementById('clickPower').textContent = this.state.clickPower;

        // Правильное отображение добычи нефти в секунду
        const extractionRate = this.calculateOilExtractionRate();
        document.getElementById('oilExtractionRate').textContent = extractionRate.toFixed(2);

        document.getElementById('clickSkillLevel').textContent = this.state.clickSkillLevel;

        // Показываем следующую силу клика вместо текущей
        const nextLevel = this.state.clickSkillLevel + 1;
        let nextPower;
        if (nextLevel === 1) {
            nextPower = 1;
        } else if (nextLevel <= 3) {
            nextPower = 1 + (nextLevel - 1) * 2; // 1, 3, 5
        } else if (nextLevel <= 5) {
            nextPower = 5 + (nextLevel - 3) * 3; // 8, 11
        } else if (nextLevel <= 7) {
            nextPower = 11 + (nextLevel - 5) * 4; // 15, 19
        } else if (nextLevel <= 10) {
            nextPower = 19 + (nextLevel - 7) * 5; // 24, 29, 34
        } else {
            nextPower = 34 + (nextLevel - 10) * 3;
        }
        document.getElementById('clickSkillBonus').textContent = nextPower;

        const clickCost = Math.floor(CONFIG.skills.clickPower.baseCost * Math.pow(CONFIG.skills.clickPower.costMultiplier, this.state.clickSkillLevel - 1));
        document.getElementById('clickSkillCost').textContent = this.formatNumber(clickCost);
        document.getElementById('upgradeClickSkill').disabled = this.state.money < clickCost;

        const sellOilElement = document.getElementById('sellAvailableOil');
        if (sellOilElement) {
            sellOilElement.textContent = `${this.formatNumber(Math.floor(this.state.availableOil))} баррелей`;
        }

        // Обновляем отображение уровня игрока для админ панели
        this.updatePlayerLevel();

        // Показываем уровень игрока в профиле
        this.updateProfileLevel();
    }

    updateProfileLevel() {
        const profileModal = document.getElementById('profileModal');
        if (!profileModal) return;

        // Добавляем отображение уровня в профиль
        let levelElement = document.getElementById('playerLevelDisplay');
        if (!levelElement) {
            const profileStats = document.querySelector('.profile-stats');
            if (profileStats) {
                const levelCard = document.createElement('div');
                levelCard.className = 'stat-card';
                levelCard.innerHTML = `
                    <div class="stat-icon">⭐</div>
                    <div class="stat-info">
                        <p class="stat-label">Уровень</p>
                        <p class="stat-value" id="playerLevelDisplay">${this.state.playerLevel} - ${this.state.playerLevelName}</p>
                    </div>
                `;
                profileStats.appendChild(levelCard);
            }
        } else {
            levelElement.textContent = `${this.state.playerLevel} - ${this.state.playerLevelName}`;
        }
    }

    formatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return Math.floor(num).toString();
    }

    async saveGame() {
        const saveData = {
            state: this.state,
            version: '1.2', // Updated version with Firebase support
            savedAt: Date.now(),
            checksum: this.generateChecksum(this.state) // Add checksum for data integrity
        };

        try {
            // Test if localStorage is available and working
            localStorage.setItem('oilGame_test', 'test');
            localStorage.removeItem('oilGame_test');

            // Local backup
            localStorage.setItem('oilGame', JSON.stringify(saveData));

            // Send to Firebase if available
            if (window.db) {
                try {
                    const playerId = this.telegramUser ? this.telegramUser.id.toString() : 'guest';
                    const playerName = this.telegramUser ?
                        `${this.telegramUser.first_name} ${this.telegramUser.last_name || ''}`.trim() :
                        'Гость';

                    await window.setDoc(window.doc(window.db, 'players', playerId), {
                        playerId: playerId,
                        playerName: playerName,
                        gameData: saveData,
                        lastActive: new Date(),
                        totalPlayTime: this.state.totalPlayTime || 0,
                        level: this.state.playerLevel || 1,
                        levelName: this.state.playerLevelName || 'Новичок'
                    });
                } catch (firebaseError) {
                    console.error('Firebase save failed:', firebaseError);
                }
            }

            // Отправляем данные администратору для статистики
            this.sendDataToAdmin(saveData);
        } catch (e) {
            console.error('Failed to save game:', e);
            // Could implement fallback save mechanism here
            this.showTelegramNotification('Ошибка сохранения! Данные могут быть потеряны.');
        }
    }

    generateChecksum(state) {
        // Simple checksum for data integrity
        const str = JSON.stringify(state);
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return hash.toString();
    }

    sendDataToAdmin(saveData) {
        // Имитируем отправку данных для админ статистики
        // В реальной игре здесь будет отправка на сервер
        try {
            // Сохраняем в специальном ключе для админа
            const adminKey = 'admin_player_data_' + (this.telegramUser ? this.telegramUser.id : 'guest');
            localStorage.setItem(adminKey, JSON.stringify({
                playerId: this.telegramUser ? this.telegramUser.id : 'guest',
                playerName: this.telegramUser ? `${this.telegramUser.first_name} ${this.telegramUser.last_name || ''}`.trim() : 'Гость',
                money: saveData.state.money,
                oil: saveData.state.availableOil,
                lands: saveData.state.lands.filter(l => l.owned).length,
                level: saveData.state.playerLevel || 1,
                levelName: saveData.state.playerLevelName || 'Новичок',
                lastActive: saveData.savedAt,
                totalPlayTime: saveData.state.totalPlayTime || 0
            }));
        } catch (e) {
            console.error('Failed to send admin data:', e);
        }
    }

    checkOfflineProgress() {
        const now = Date.now();
        const offlineTime = now - this.state.lastOnlineTime;

        if (offlineTime > 10000) { // More than 10 seconds offline
            const cappedOfflineTime = Math.min(offlineTime, CONFIG.offlineProgress.maxTime);
            const efficiency = CONFIG.offlineProgress.efficiency;
            const effectiveTime = cappedOfflineTime * efficiency;

            let totalOfflineOil = 0;

            // Calculate offline extraction per land and deduct from reserves
            this.state.lands.forEach(land => {
                if (land.rigs && land.rigs.length > 0 && land.currentOil > 0) {
                    let landExtracted = 0;

                    land.rigs.forEach(rig => {
                        const rigConfig = CONFIG.rigs.types.find(r => r.id === rig.type);
                        const extractedPerSecond = rigConfig.extractionRate;
                        const extracted = Math.min(extractedPerSecond * (effectiveTime / 1000), land.currentOil);
                        const lost = extracted * (rigConfig.lossPercentage / 100);
                        const effective = extracted - lost;

                        landExtracted += extracted;
                        totalOfflineOil += effective;
                    });

                    // Deduct from land reserves
                    land.currentOil -= landExtracted;
                    if (land.currentOil <= 0) {
                        land.currentOil = 0;
                    }
                }
            });

            const offlineOil = Math.floor(totalOfflineOil);

            if (offlineOil > 0) {
                this.state.availableOil += offlineOil;
                this.state.offlineProgress = offlineOil;

                this.showOfflineModal(offlineOil, Math.floor(cappedOfflineTime / 1000 / 60));
            }
        }

        this.state.lastOnlineTime = now;
    }

    showOfflineModal(oilGained, minutesOffline) {
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.id = 'offlineModal';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 400px;">
                <button class="modal-close" id="closeOfflineModal">×</button>
                <h2>Добро пожаловать обратно!</h2>
                <div style="text-align: center; padding: 20px;">
                    <div style="font-size: 48px; margin: 20px 0;">🛢️</div>
                    <p>Пока вас не было ${minutesOffline} минут, ваши вышки добыли:</p>
                    <p style="font-size: 24px; color: var(--accent-gold); font-weight: bold;">+${this.formatNumber(oilGained)} баррелей нефти</p>
                    <button class="btn-buy" id="closeOfflineBtn" style="margin-top: 20px;">Отлично!</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        // Add event listeners to close the modal
        const closeOfflineModalBtn = document.getElementById('closeOfflineModal');
        if (closeOfflineModalBtn) {
            closeOfflineModalBtn.addEventListener('click', () => modal.remove());
        }
        const closeOfflineBtn = document.getElementById('closeOfflineBtn');
        if (closeOfflineBtn) {
            closeOfflineBtn.addEventListener('click', () => modal.remove());
        }
    }

    scheduleEvent() {
        if (!CONFIG.events.enabled) return;

        // Не показывать событие сразу при запуске, только через время игры
        // Запланировать первое событие через случайный интервал
        setTimeout(() => {
            this.triggerRandomEvent();
            this.scheduleEvent(); // Запланировать следующее
        }, CONFIG.events.interval + Math.random() * CONFIG.events.interval * 0.5);
    }

    triggerRandomEvent() {
        const eventConfig = CONFIG.events.types[Math.floor(Math.random() * CONFIG.events.types.length)];
        this.showEventModal(eventConfig);
    }

    showEventModal(eventConfig) {
        const modal = document.getElementById('eventModal');
        if (!modal) return;

        document.getElementById('eventTitle').textContent = eventConfig.title;
        document.getElementById('eventDescription').textContent = eventConfig.description;

        const choicesContainer = document.getElementById('eventChoices');
        choicesContainer.innerHTML = '';

        if (eventConfig.choices.length > 0) {
            eventConfig.choices.forEach((choice, index) => {
                const button = document.createElement('button');
                button.className = 'btn-buy';
                button.textContent = choice.text;
                button.onclick = () => this.resolveEvent(eventConfig, choice.effect, index);
                choicesContainer.appendChild(button);
            });
        } else {
            // Auto-resolve events without choices
            setTimeout(() => this.resolveEvent(eventConfig, eventConfig.effect), 3000);
        }

        modal.classList.add('active');
    }

    resolveEvent(eventConfig, effect, choiceIndex = null) {
        this.closeEventModal();

        // Apply effects
        if (effect.money) {
            this.state.money += effect.money;
        }
        if (effect.oil) {
            this.state.availableOil += effect.oil;
        }
        if (effect.priceMultiplier) {
            this.state.priceMultiplier = effect.priceMultiplier;
            this.state.priceMultiplierEndTime = Date.now() + (effect.duration || 0);
        }
        if (effect.freeRig) {
            // Add free rig to first available land
            const availableLand = this.state.lands.find(l => l.owned && l.rigs.length < CONFIG.rigs.maxPerLand);
            if (availableLand) {
                availableLand.rigs.push({
                    type: effect.freeRig,
                    installedAt: Date.now()
                });
            }
        }

        this.updateUI();
        this.saveGame();
    }

    closeEventModal() {
        const modal = document.getElementById('eventModal');
        if (modal) {
            modal.classList.remove('active');
        }
    }

    updatePriceMultiplier() {
        const now = Date.now();
        if (this.state.priceMultiplierEndTime && now >= this.state.priceMultiplierEndTime) {
            this.state.priceMultiplier = 1.0;
            this.state.priceMultiplierEndTime = 0;
        }
    }

    updateOwnCompany() {
        if (!this.state.ownCompany) return;

        const company = this.state.ownCompany;
        const now = Date.now();

        // Update production
        company.products.forEach(product => {
            if (product.inProduction && now >= product.productionEndTime) {
                product.inProduction = false;
                product.quantity = (product.quantity || 0) + 1;
            }
        });

        this.updateOwnCompanyUI();
    }

    createOwnCompany() {
        if (this.state.ownCompany) {
            alert('У вас уже есть компания!');
            return;
        }

        if (this.state.money < CONFIG.ownCompany.creationCost) {
            alert(`Недостаточно денег! Нужно ${this.formatNumber(CONFIG.ownCompany.creationCost)}₽`);
            return;
        }

        this.state.money -= CONFIG.ownCompany.creationCost;
        this.state.ownCompany = {
            products: CONFIG.ownCompany.products.map(p => ({
                ...p,
                quantity: 0,
                inProduction: false,
                productionEndTime: 0,
                upgradeLevel: 0
            })),
            buybackMoney: 0,
            autoBuyEnabled: false,
            currentBuybackPrice: 7
        };

        document.getElementById('createOwnCompany').style.display = 'none';
        this.switchTab('company');

        this.updateOwnCompanyUI();
        this.updateUI();
        this.saveGame();
    }

    renderCompanyTab() {
        const placeholder = document.getElementById('companyPlaceholder');
        const management = document.getElementById('companyManagement');
        const createBtn = document.getElementById('createOwnCompany');

        if (this.state.ownCompany) {
            placeholder.style.display = 'none';
            management.style.display = 'block';
            createBtn.style.display = 'none';
        } else {
            placeholder.style.display = 'block';
            management.style.display = 'none';
            createBtn.style.display = 'block';
        }
    }

    startProduction(productId) {
        if (!this.state.ownCompany) return;

        const product = this.state.ownCompany.products.find(p => p.id === productId);
        if (!product || product.inProduction) return;

        // Check resources
        if (this.state.availableOil < product.oilRequired || this.state.money < product.moneyRequired) {
            alert('Недостаточно ресурсов!');
            return;
        }

        // Deduct resources
        this.state.availableOil -= product.oilRequired;
        this.state.money -= product.moneyRequired;

        // Start production
        product.inProduction = true;
        product.productionEndTime = Date.now() + product.productionTime;

        this.updateOwnCompanyUI();
        this.updateUI();
        this.saveGame();
    }

    upgradeProduct(productId) {
        if (!this.state.ownCompany) return;

        const product = this.state.ownCompany.products.find(p => p.id === productId);
        if (!product) return;

        // Определяем уровень улучшения (от 0 до 4)
        const currentLevel = product.upgradeLevel || 0;
        if (currentLevel >= 4) {
            alert('Максимальный уровень улучшения достигнут!');
            return;
        }

        // Стоимость улучшения растет экспоненциально
        const upgradeCost = Math.floor(5000 * Math.pow(2, currentLevel));

        if (this.state.money < upgradeCost) {
            alert(`Недостаточно денег! Нужно ${this.formatNumber(upgradeCost)}₽`);
            return;
        }

        // Применяем улучшение
        this.state.money -= upgradeCost;
        product.upgradeLevel = (product.upgradeLevel || 0) + 1;

        // Улучшаем характеристики продукта
        const upgradeMultiplier = 1 + (currentLevel + 1) * 0.15; // +15% за уровень
        product.basePrice = Math.floor(product.basePrice * upgradeMultiplier);
        product.oilRequired = Math.max(1, Math.floor(product.oilRequired * 0.95)); // -5% потребления нефти
        product.productionTime = Math.max(1000, Math.floor(product.productionTime * 0.9)); // -10% времени производства

        this.showFloatingNotification(`🛢️ ${product.name} улучшен до уровня ${product.upgradeLevel + 1}!`, 3000);
        this.updateOwnCompanyUI();
        this.updateUI();
        this.saveGame();
    }

    sellProduct(productId) {
        if (!this.state.ownCompany) return;

        const product = this.state.ownCompany.products.find(p => p.id === productId);
        if (!product || product.quantity <= 0) return;

        // Calculate sell price with market fluctuation
        const basePrice = product.basePrice;
        const fluctuation = 0.8 + Math.random() * 0.4; // 80% to 120%
        const sellPrice = Math.floor(basePrice * fluctuation);

        this.state.money += sellPrice;
        product.quantity--;

        this.showFloatingNumber(sellPrice, window.innerWidth / 2, window.innerHeight / 2);
        this.updateOwnCompanyUI();
        this.updateUI();
        this.saveGame();
    }

    setBuybackMoney() {
        if (!this.state.ownCompany) return;

        const amount = parseInt(document.getElementById('buybackMoneyAmount').value) || 0;

        if (amount > this.state.money) {
            alert('Недостаточно денег!');
            return;
        }

        this.state.money -= amount;
        this.state.ownCompany.buybackMoney += amount;

        document.getElementById('buybackMoneyAmount').value = '';
        this.updateOwnCompanyUI();
        this.updateUI();
        this.saveGame();
    }

    updateOwnCompanyUI() {
        if (!this.state.ownCompany) return;

        const company = this.state.ownCompany;
        const productsList = document.getElementById('productsList');

        // Update products
        productsList.innerHTML = company.products.map(product => `
            <div class="product-card">
                <div class="product-header">
                    <span class="product-name">${product.name}</span>
                    <span class="product-quantity">Кол-во: ${product.quantity}</span>
                </div>
                <div class="product-info">
                    <div>Уровень: ${product.upgradeLevel || 0}/5</div>
                    <div>Требуется: ${product.oilRequired} нефти + ${this.formatNumber(product.moneyRequired)}₽</div>
                    <div>Время производства: ${Math.floor(product.productionTime / 1000)} сек</div>
                    <div>Цена продажи: ~${this.formatNumber(product.basePrice)}₽</div>
                </div>
                <div class="product-actions">
                    <button class="btn-buy" onclick="game.startProduction('${product.id}')" ${product.inProduction ? 'disabled' : ''}>
                        ${product.inProduction ? 'Производится...' : 'Произвести'}
                    </button>
                    <button class="btn-sell" onclick="game.sellProduct('${product.id}')" ${product.quantity <= 0 ? 'disabled' : ''}>
                        Продать
                    </button>
                    <button class="btn-upgrade" onclick="game.upgradeProduct('${product.id}')" style="font-size: 12px;">
                        Улучшить (${this.formatNumber(Math.floor(5000 * Math.pow(2, product.upgradeLevel || 0)))}₽)
                    </button>
                </div>
            </div>
        `).join('');
    }

    updatePlayerLevel() {
        // Система уровней для дополнительной мотивации
        const totalMoney = this.state.money;
        const totalOil = this.state.availableOil;
        const landsOwned = this.state.lands.filter(l => l.owned).length;
        const score = totalMoney + (totalOil * 10) + (landsOwned * 1000);

        let level = 1;
        let levelName = 'Новичок';

        if (score >= 1000000) {
            level = 10;
            levelName = 'Нефтяной магнат';
        } else if (score >= 500000) {
            level = 9;
            levelName = 'Олигарх';
        } else if (score >= 250000) {
            level = 8;
            levelName = 'Миллионер';
        } else if (score >= 100000) {
            level = 7;
            levelName = 'Бизнесмен';
        } else if (score >= 50000) {
            level = 6;
            levelName = 'Предприниматель';
        } else if (score >= 25000) {
            level = 5;
            levelName = 'Инвестор';
        } else if (score >= 10000) {
            level = 4;
            levelName = 'Трейдер';
        } else if (score >= 5000) {
            level = 3;
            levelName = 'Работник';
        } else if (score >= 1000) {
            level = 2;
            levelName = 'Стажер';
        }

        // Сохраняем уровень для админ панели
        this.state.playerLevel = level;
        this.state.playerLevelName = levelName;
    }

    calculateAverageOilPrice() {
        let total = 0;
        let count = 0;
        this.state.companies.forEach(company => {
            total += company.currentPrice;
            count++;
        });
        return count > 0 ? total / count : 10;
    }

    initCompanies() {
        if (!this.state.companies || this.state.companies.length === 0) {
            this.state.companies = CONFIG.companies.list.map(company => {
                const currentDemand = Math.floor((company.maxDemand + company.minDemand) / 2);

                // Фильтруем возможные минимумы, которые не больше текущего спроса
                const validMinBuys = company.possibleMinBuy.filter(minBuy => minBuy <= currentDemand);
                const availableMinBuys = validMinBuys.length > 0 ? validMinBuys : [Math.min(...company.possibleMinBuy)];
                const randomIndex = Math.floor(Math.random() * availableMinBuys.length);

                const selectedMinBuy = availableMinBuys[randomIndex];
                const originalIndex = company.possibleMinBuy.indexOf(selectedMinBuy);

                return {
                    ...company,
                    currentPrice: company.basePrice * company.priceMultipliers[originalIndex],
                    priceChangePercent: 0,
                    currentDemand,
                    currentMinBuy: selectedMinBuy,
                    currentPriceMultiplier: company.priceMultipliers[originalIndex],
                    cooldownUntil: null,
                    contractLevel: this.state.companyContracts[company.id] ? this.state.companyContracts[company.id].level : 1
                };
            });
        } else {
            // Для загруженных компаний проверяем наличие поля cooldownUntil и contractLevel
            this.state.companies.forEach(company => {
                if (company.cooldownUntil === undefined) {
                    company.cooldownUntil = null;
                }
                if (company.contractLevel === undefined) {
                    company.contractLevel = this.state.companyContracts[company.id] ? this.state.companyContracts[company.id].level : 1;
                }
            });
        }

        // Инициализируем контракты, если их нет
        if (!this.state.companyContracts) {
            this.state.companyContracts = {};
        }
        CONFIG.companies.list.forEach(company => {
            if (!this.state.companyContracts[company.id]) {
                this.state.companyContracts[company.id] = { level: 1 };
            }
        });
    }

    updateCompanyPrices() {
        const now = Date.now();

        this.state.companies.forEach(company => {
            const changePercent = (Math.random() - 0.5) * 2 * CONFIG.companies.maxPriceChange;
            const basePrice = company.basePrice * company.currentPriceMultiplier * this.state.priceMultiplier;
            const priceChange = basePrice * changePercent;

            company.currentPrice = Math.max(1, company.currentPrice + priceChange);
            company.priceChangePercent = changePercent;

            // Получаем множитель уровня контракта
            const contractLevel = this.state.companyContracts[company.id] ? this.state.companyContracts[company.id].level : 1;
            const contractMultiplier = company.contractLevels.find(l => l.level === contractLevel).maxDemandMultiplier;

            // Проверяем кулдаун - если кулдаун закончился, восстанавливаем спрос
            if (company.cooldownUntil && now >= company.cooldownUntil) {
                company.cooldownUntil = null;
                company.currentDemand = Math.floor(
                    Math.random() * (company.maxDemand * contractMultiplier - company.minDemand) + company.minDemand
                );
            }

            // Обновляем спрос только если НЕ в кулдауне
            if (!company.cooldownUntil) {
                company.currentDemand = Math.floor(
                    Math.random() * (company.maxDemand * contractMultiplier - company.minDemand) + company.minDemand
                );

                // Проверяем что currentMinBuy не больше currentDemand
                if (company.currentMinBuy > company.currentDemand) {
                    const configCompany = CONFIG.companies.list.find(c => c.id === company.id);
                    // Берём максимальный минимум, который меньше или равен спросу
                    const validMinBuys = configCompany.possibleMinBuy.filter(minBuy => minBuy <= company.currentDemand);
                    if (validMinBuys.length > 0) {
                        company.currentMinBuy = validMinBuys[validMinBuys.length - 1]; // Берём наибольший подходящий
                    } else {
                        company.currentMinBuy = Math.min(...configCompany.possibleMinBuy);
                    }
                }
            }
        });

        this.renderCompanies();
        this.saveGame();
    }

    updateCompanyRequirements() {
        this.state.companies.forEach(company => {
            const configCompany = CONFIG.companies.list.find(c => c.id === company.id);
            
            // Фильтруем только те минимумы, которые не больше текущего спроса
            const validMinBuys = configCompany.possibleMinBuy.filter(minBuy => minBuy <= company.currentDemand);
            
            // Если нет подходящих вариантов, берём наименьший
            const availableMinBuys = validMinBuys.length > 0 ? validMinBuys : [Math.min(...configCompany.possibleMinBuy)];
            const randomIndex = Math.floor(Math.random() * availableMinBuys.length);
            
            company.currentMinBuy = availableMinBuys[randomIndex];
            
            // Обновляем множитель цены только если он соответствует выбранному минимуму
            const originalIndex = configCompany.possibleMinBuy.indexOf(company.currentMinBuy);
            if (originalIndex !== -1) {
                company.currentPriceMultiplier = configCompany.priceMultipliers[originalIndex];
                company.currentPrice = company.basePrice * company.currentPriceMultiplier;
            }
        });
        
        this.renderCompanies();
        this.saveGame();
    }

    renderCompanies() {
        const container = document.getElementById('companiesList');
        if (!container) return;
        
        container.innerHTML = '';
        
        this.state.companies.forEach(company => {
            const card = this.createCompanyCard(company);
            container.appendChild(card);
        });
    }

    createCompanyCard(company) {
        const div = document.createElement('div');
        div.className = 'company-card';

        const priceClass = company.priceChangePercent > 0 ? 'price-up' : company.priceChangePercent < 0 ? 'price-down' : '';
        const priceIcon = company.priceChangePercent > 0 ? '📈' : company.priceChangePercent < 0 ? '📉' : '➡️';

        // Проверяем кулдаун
        const now = Date.now();
        const isOnCooldown = company.cooldownUntil && now < company.cooldownUntil;
        const cooldownRemaining = isOnCooldown ? Math.ceil((company.cooldownUntil - now) / 1000) : 0;

        const availableOil = Math.floor(this.state.availableOil);
        const maxSellAmount = Math.min(availableOil, company.currentDemand);

        // Реальный минимум для продажи - минимум из того что компания требует И того что она может купить
        const effectiveMinBuy = Math.min(company.currentMinBuy, company.currentDemand);

        // Проверяем: достаточно ли у игрока нефти для минимальной продажи
        const hasEnoughOil = availableOil >= effectiveMinBuy;
        // Проверяем: хочет ли компания вообще покупать (спрос > 0 И нет кулдауна)
        const companyCanBuy = company.currentDemand > 0 && !isOnCooldown;
        // Можно продать только если выполнены оба условия
        const canSell = hasEnoughOil && companyCanBuy;

        let statusMessage = '';
        if (isOnCooldown) {
            statusMessage = `Кулдаун ${cooldownRemaining} сек`;
        } else if (!companyCanBuy) {
            statusMessage = 'Не покупает';
        } else if (!hasEnoughOil) {
            statusMessage = 'Мало нефти';
        } else {
            statusMessage = 'Можно продать:';
        }

        // Информация о контракте
        const contractLevel = this.state.companyContracts[company.id] ? this.state.companyContracts[company.id].level : 1;
        const configCompany = CONFIG.companies.list.find(c => c.id === company.id);
        const nextContractLevel = contractLevel < configCompany.contractLevels.length ? contractLevel + 1 : null;
        const nextContractCost = nextContractLevel ? configCompany.contractLevels.find(l => l.level === nextContractLevel).cost : null;
        const nextContractMultiplier = nextContractLevel ? configCompany.contractLevels.find(l => l.level === nextContractLevel).maxDemandMultiplier : null;

        let contractHTML = `
            <div class="contract-info">
                <span>Уровень: ${contractLevel}</span>
                ${nextContractCost ? `<button class="btn-upgrade-contract" onclick="game.upgradeContract('${company.id}')">
                    Улучшить (${this.formatNumber(nextContractCost)}₽)
                    ${nextContractMultiplier ? `<br><small>+${Math.round((nextContractMultiplier - 1) * 100)}% спроса</small>` : ''}
                </button>` : '<span>Макс уровень</span>'}
            </div>
        `;

        div.innerHTML = `
            <div class="company-header">
                <span class="company-icon">${company.icon}</span>
                <span class="company-name">${company.name}</span>
            </div>
            <div class="company-info">
                <div class="company-info-row">
                    <span>Цена за баррель:</span>
                    <span class="${priceClass}">${priceIcon} ${this.formatNumber(Math.floor(company.currentPrice))}₽</span>
                </div>
                <div class="company-info-row">
                    <span>Минимум для продажи:</span>
                    <span style="color: var(--text-light); font-weight: bold">${this.formatNumber(company.currentMinBuy)} б.</span>
                </div>
                <div class="company-info-row">
                    <span>Покупают до:</span>
                    <span>${this.formatNumber(company.currentDemand)} баррелей</span>
                </div>
                <div class="company-info-row">
                    <span>${statusMessage}</span>
                    <span style="color: ${canSell ? 'var(--accent-gold)' : 'var(--danger)'}">${this.formatNumber(maxSellAmount)} баррелей</span>
                </div>
                ${contractHTML}
            </div>
            <div class="company-sell-section">
                <input type="number" class="sell-input" id="sell-${company.id}"
                        placeholder="Количество" min="${effectiveMinBuy}" max="${maxSellAmount}" value="" ${!canSell ? 'disabled' : ''}>
                <button class="btn-sell-max" onclick="game.setSellMax('${company.id}', ${maxSellAmount})" ${!canSell ? 'disabled' : ''}>МАКС</button>
                <button class="btn-sell" onclick="game.sellOil('${company.id}')" ${!canSell ? 'disabled' : ''}>Продать</button>
            </div>
        `;

        return div;
    }

    setSellMax(companyId, amount) {
        document.getElementById(`sell-${companyId}`).value = amount;
    }

    sellOil(companyId) {
        const company = this.state.companies.find(c => c.id === companyId);
        const input = document.getElementById(`sell-${companyId}`);
        const amount = parseInt(input.value) || 0;

        // Реальный минимум для продажи
        const effectiveMinBuy = Math.min(company.currentMinBuy, company.currentDemand);

        // Проверка: введено ли корректное количество
        if (amount <= 0 || isNaN(amount)) {
            alert('Введите корректное количество нефти');
            return;
        }

        // Проверка: минимальное количество для продажи
        if (amount < effectiveMinBuy) {
            alert(`Минимальная продажа для ${company.name}: ${effectiveMinBuy} баррелей`);
            return;
        }

        // Проверка: не превышает ли количество доступную нефть
        if (amount > Math.floor(this.state.availableOil)) {
            alert(`У вас только ${Math.floor(this.state.availableOil)} баррелей нефти`);
            return;
        }

        // Проверка: не превышает ли спрос компании
        if (amount > company.currentDemand) {
            alert(`${company.name} покупает максимум ${company.currentDemand} баррелей`);
            return;
        }

        // Все проверки прошли - продаем
        const totalPrice = Math.floor(amount * company.currentPrice);
        this.state.money += totalPrice;
        this.state.availableOil -= amount;

        // Уменьшаем спрос компании
        company.currentDemand -= amount;

        // Если спрос упал до нуля или ниже - компания уходит в кулдаун на 1 минуту
        if (company.currentDemand <= 0) {
            company.currentDemand = 0;
            company.cooldownUntil = Date.now() + 60000; // 1 минута кулдауна
        }

        this.showFloatingNumber(totalPrice, window.innerWidth / 2, window.innerHeight / 2);

        input.value = '';
        this.updateUI();
        this.renderCompanies();
        this.saveGame();

        // Check achievements after selling oil
        setTimeout(() => this.checkAchievements(), 100);

        // Send game results to Telegram bot
        this.sendGameResultsToBot({
            action: 'sell_oil',
            company: company.name,
            amount: amount,
            totalPrice: totalPrice,
            remainingOil: this.state.availableOil,
            money: this.state.money
        });
    }

    async loadGame() {
        try {
            // Try to load from Firebase first
            if (window.db) {
                try {
                    const playerId = this.telegramUser ? this.telegramUser.id.toString() : 'guest';
                    const docRef = window.doc(window.db, 'players', playerId);
                    const docSnap = await window.getDoc(docRef);

                    if (docSnap.exists()) {
                        const firebaseData = docSnap.data();
                        const data = firebaseData.gameData;

                        // Check data integrity if checksum exists
                        if (data.checksum && data.state) {
                            const calculatedChecksum = this.generateChecksum(data.state);
                            if (calculatedChecksum !== data.checksum) {
                                console.warn('Firebase data checksum mismatch - data may be corrupted');
                                this.showTelegramNotification('Обнаружены проблемы с данными в облаке.');
                            }
                        }

                        if (data.state) {
                            // Deep clone to avoid reference issues
                            this.state = JSON.parse(JSON.stringify(data.state));

                            // Data migration and validation
                            this.migrateSaveData();

                            // Generate lands if none exist (first time)
                            if (!this.state.lands || this.state.lands.length === 0) {
                                this.generateLands();
                            }

                            console.log('Game loaded from Firebase, version:', data.version);
                            return;
                        }
                    }
                } catch (firebaseError) {
                    console.error('Firebase load failed:', firebaseError);
                }
            }

            // Fallback to localStorage
            const saved = localStorage.getItem('oilGame');
            if (saved) {
                const data = JSON.parse(saved);

                // Check data integrity if checksum exists
                if (data.checksum && data.state) {
                    const calculatedChecksum = this.generateChecksum(data.state);
                    if (calculatedChecksum !== data.checksum) {
                        console.warn('Local save data checksum mismatch - data may be corrupted');
                        // Still try to load, but warn the user
                        this.showTelegramNotification('Обнаружены проблемы с локальным сохранением. Данные могут быть повреждены.');
                    }
                }

                if (data.state) {
                    // Deep clone to avoid reference issues
                    this.state = JSON.parse(JSON.stringify(data.state));

                    // Data migration and validation
                    this.migrateSaveData();

                    // Generate lands if none exist (first time)
                    if (!this.state.lands || this.state.lands.length === 0) {
                        this.generateLands();
                    }

                    console.log('Game loaded from localStorage, version:', data.version);
                }
            }
        } catch (e) {
            console.error('Failed to load game:', e);
            // Initialize with default state if loading fails
            this.state = this.getDefaultState();
            this.generateLands();
            this.initCompanies();
            this.showTelegramNotification('Ошибка загрузки сохранения. Игра начата заново.');
        }
    }

    migrateSaveData() {
        // Migration logic for different versions
        const migrations = {
            // Version 1.0 to 1.1 migrations
            '1.0': (state) => {
                // Add checksum support
                if (!state.checksum) {
                    state.checksum = this.generateChecksum(state);
                }
                return state;
            }
        };

        // Apply migrations if needed
        // Note: version tracking would be better implemented with a version field

        // Ensure all required fields exist with defaults
        const defaults = this.getDefaultState();

        // Recursive function to ensure all nested properties exist
        const ensureDefaults = (target, source) => {
            for (const key in source) {
                if (!(key in target)) {
                    target[key] = JSON.parse(JSON.stringify(source[key]));
                } else if (typeof source[key] === 'object' && source[key] !== null && !Array.isArray(source[key])) {
                    ensureDefaults(target[key], source[key]);
                }
            }
        };

        ensureDefaults(this.state, defaults);

        // Specific migrations for known issues
        if (this.state.lands) {
            this.state.lands.forEach(land => {
                // Convert old rig format to rigs array
                if (land.rig && !land.rigs) {
                    land.rigs = [land.rig];
                    delete land.rig;
                } else if (!land.rigs) {
                    land.rigs = [];
                }

                // Ensure rig data integrity
                if (land.rigs) {
                    land.rigs = land.rigs.filter(rig => rig && rig.type); // Remove invalid rigs
                }
            });
        }

        // Update play time tracking
        if (this.playTimeStart) {
            const sessionTime = Date.now() - this.playTimeStart;
            this.state.totalPlayTime = (this.state.totalPlayTime || 0) + sessionTime;
            this.playTimeStart = Date.now();
        }

        // Reinitialize companies if corrupted
        if (!this.state.companies || this.state.companies.length === 0 || !this.state.companies[0].currentMinBuy) {
            this.state.companies = [];
            this.initCompanies();
        }
    }

    getDefaultState() {
        return {
            money: CONFIG.initial.money,
            clickPower: CONFIG.initial.clickPower,
            clickSkillLevel: CONFIG.initial.clickSkillLevel,
            lands: [],
            availableOil: 0,
            generationHistory: [],
            companies: [],
            analyzedLands: [],
            rigSlots: CONFIG.initial.rigSlots || 2,
            purchasedSlots: 0,
            companyContracts: {},
            lastOnlineTime: Date.now(),
            offlineProgress: 0,
            ownCompany: null,
            events: [],
            priceMultiplier: 1.0,
            priceMultiplierEndTime: 0,
            achievements: [],
            totalPlayTime: 0,
            playerLevel: 1,
            playerLevelName: 'Новичок'
        };
    }

    applyTheme(themeParams) {
        if (themeParams) {
            if (themeParams.bg_color) {
                document.documentElement.style.setProperty('--bg-dark', themeParams.bg_color);
            }
            if (themeParams.button_color) {
                document.documentElement.style.setProperty('--accent-gold', themeParams.button_color);
            }
            if (themeParams.text_color) {
                document.documentElement.style.setProperty('--text-light', themeParams.text_color);
            }
            if (themeParams.hint_color) {
                document.documentElement.style.setProperty('--text-gray', themeParams.hint_color);
            }
        }
    }

    sendGameResultsToBot(data) {
        if (this.telegramWebApp && this.telegramUser) {
            try {
                // Send data to bot via Telegram WebApp
                this.telegramWebApp.sendData(JSON.stringify({
                    user_id: this.telegramUser.id,
                    user_name: `${this.telegramUser.first_name} ${this.telegramUser.last_name || ''}`.trim(),
                    timestamp: Date.now(),
                    game_data: data
                }));
            } catch (e) {
                console.error('Failed to send data to bot:', e);
                // Fallback: show user feedback
                this.showTelegramNotification('Не удалось отправить данные боту');
            }
        }
    }

    showTelegramNotification(message) {
        // Use Telegram WebApp's showPopup if available, otherwise fallback to alert
        if (this.telegramWebApp && this.telegramWebApp.showPopup) {
            this.telegramWebApp.showPopup({
                title: 'Уведомление',
                message: message,
                buttons: [{type: 'ok'}]
            });
        } else {
            alert(message);
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.game = new Game();
});

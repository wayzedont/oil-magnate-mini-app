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
            purchasedSlots: 0
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
            rig: null
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
        const activeLands = ownedLands.filter(land => land.rig && land.currentOil > 0);
        
        // Обновляем информацию о слотах
        if (usedSlotsElement) usedSlotsElement.textContent = activeLands.length;
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
        if (land.owned && land.rig) {
            statusIcon = CONFIG.rigs.types.find(r => r.id === land.rig.type).icon;
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
            ${land.owned && land.rig ? this.createRigInfo(land) : ''}
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
        const rig = CONFIG.rigs.types.find(r => r.id === land.rig.type);
        const progress = ((land.oilReserve - land.currentOil) / land.oilReserve) * 100;
        
        return `
            <div class="land-rig-info">
                <div>${rig.name}</div>
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
        
        if (!land.owned) {
            buyButton.style.display = 'block';
            buyButton.disabled = this.state.money < land.price;
            rigsSection.style.display = 'none';
            
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
            // Проверяем: есть ли свободные слоты для установки вышки
            const activeLands = this.state.lands.filter(l => l.owned && l.rig && l.currentOil > 0);
            if (activeLands.length >= this.state.rigSlots) {
                alert(`Недостаточно слотов для вышек! У вас ${this.state.rigSlots} слотов, все заняты активными скважинами. Купите дополнительный слот или удалите истощённую скважину.`);
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
        }
    }

    renderRigs(land) {
        const rigsList = document.getElementById('rigsList');
        const rigStatus = document.getElementById('rigStatus');
        
        if (land.rig) {
            rigsList.style.display = 'none';
            const rigConfig = CONFIG.rigs.types.find(r => r.id === land.rig.type);
            rigStatus.innerHTML = `
                <h4>${rigConfig.icon} ${rigConfig.name} работает</h4>
                <p>Осталось нефти: ${this.formatNumber(land.currentOil)} баррелей</p>
                <p>Добыто: ${this.formatNumber(land.oilReserve - land.currentOil)} баррелей</p>
                <p>Скорость: ${rigConfig.extractionRate} б./сек</p>
            `;
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
        
        // Проверяем количество свободных слотов (только активные скважины с нефтью)
        const activeLands = this.state.lands.filter(l => l.owned && l.rig && l.currentOil > 0);
        
        // Если уже есть вышка на этом участке, не проверяем слоты (это замена)
        if (!land.rig && activeLands.length >= this.state.rigSlots) {
            alert(`Все слоты заняты! У вас ${this.state.rigSlots} слотов. Купите дополнительный слот или удалите истощённую скважину.`);
            return;
        }
        
        if (this.state.money >= rig.price && !land.rig) {
            this.state.money -= rig.price;
            land.rig = {
                type: rigId,
                installedAt: Date.now()
            };
            
            this.updateUI();
            this.openLandModal(landId);
            this.saveGame();
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
        }
    }



    updateProfileUI() {
        document.getElementById('profileMoney').textContent = this.formatNumber(Math.floor(this.state.money)) + '₽';
        document.getElementById('profileOil').textContent = this.formatNumber(Math.floor(this.state.availableOil)) + ' б.';

        const workingLands = this.state.lands.filter(l => l.owned && l.rig).length;
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
            localStorage.removeItem('oilGame');
            location.reload();
        }
    }

    startGameLoop() {
        setInterval(() => {
            this.updateRigs();
        }, CONFIG.ui.rigUpdateInterval);
        
        setInterval(() => {
            this.saveGame();
        }, CONFIG.ui.saveInterval);
        
        setInterval(() => {
            this.updateGenerationButton();
        }, 10000);
        
        setInterval(() => {
            this.updateCompanyPrices();
        }, CONFIG.companies.priceChangeInterval);
        
        setInterval(() => {
            this.updateCompanyRequirements();
        }, CONFIG.companies.requirementsChangeInterval);
    }

    updateRigs() {
        let hasChanges = false;
        
        this.state.lands.forEach(land => {
            if (land.rig && land.currentOil > 0) {
                const rigConfig = CONFIG.rigs.types.find(r => r.id === land.rig.type);
                
                const extracted = Math.min(rigConfig.extractionRate, land.currentOil);
                const lost = extracted * (rigConfig.lossPercentage / 100);
                const effective = extracted - lost;
                
                land.currentOil -= extracted;
                this.state.availableOil += effective;
                
                hasChanges = true;
                
                // Если нефть закончилась, отмечаем что слот освободился
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
            if (land.rig && land.currentOil > 0) {
                const rigConfig = CONFIG.rigs.types.find(r => r.id === land.rig.type);
                const extracted = rigConfig.extractionRate;
                const lost = extracted * (rigConfig.lossPercentage / 100);
                const effective = extracted - lost;
                total += effective;
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
        document.getElementById('clickSkillBonus').textContent = this.state.clickPower;
        
        const clickCost = Math.floor(CONFIG.skills.clickPower.baseCost * Math.pow(CONFIG.skills.clickPower.costMultiplier, this.state.clickSkillLevel - 1));
        document.getElementById('clickSkillCost').textContent = this.formatNumber(clickCost);
        document.getElementById('upgradeClickSkill').disabled = this.state.money < clickCost;
        
        const sellOilElement = document.getElementById('sellAvailableOil');
        if (sellOilElement) {
            sellOilElement.textContent = `${this.formatNumber(Math.floor(this.state.availableOil))} баррелей`;
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

    saveGame() {
        const saveData = {
            state: this.state,
            version: '1.0',
            savedAt: Date.now()
        };
        
        try {
            localStorage.setItem('oilGame', JSON.stringify(saveData));
        } catch (e) {
            console.error('Failed to save game:', e);
        }
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
                    cooldownUntil: null
                };
            });
        } else {
            // Для загруженных компаний проверяем наличие поля cooldownUntil
            this.state.companies.forEach(company => {
                if (company.cooldownUntil === undefined) {
                    company.cooldownUntil = null;
                }
            });
        }
    }

    updateCompanyPrices() {
        const now = Date.now();
        
        this.state.companies.forEach(company => {
            const changePercent = (Math.random() - 0.5) * 2 * CONFIG.companies.maxPriceChange;
            const basePrice = company.basePrice * company.currentPriceMultiplier;
            const priceChange = basePrice * changePercent;
            
            company.currentPrice = Math.max(1, company.currentPrice + priceChange);
            company.priceChangePercent = changePercent;
            
            // Проверяем кулдаун - если кулдаун закончился, восстанавливаем спрос
            if (company.cooldownUntil && now >= company.cooldownUntil) {
                company.cooldownUntil = null;
                company.currentDemand = Math.floor(
                    Math.random() * (company.maxDemand - company.minDemand) + company.minDemand
                );
            }
            
            // Обновляем спрос только если НЕ в кулдауне
            if (!company.cooldownUntil) {
                company.currentDemand = Math.floor(
                    Math.random() * (company.maxDemand - company.minDemand) + company.minDemand
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
            statusMessage = `Кулдаун: ${cooldownRemaining} сек`;
        } else if (!companyCanBuy) {
            statusMessage = 'Компания не покупает';
        } else if (!hasEnoughOil) {
            statusMessage = 'Недостаточно нефти';
        } else {
            statusMessage = 'Можно продать:';
        }
        
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

    loadGame() {
        try {
            const saved = localStorage.getItem('oilGame');
            if (saved) {
                const data = JSON.parse(saved);

                if (data.state) {
                    this.state = data.state;

                    if (!this.state.generationHistory) {
                        this.state.generationHistory = [];
                    }

                    if (!this.state.companies) {
                        this.state.companies = [];
                    }

                    if (!this.state.availableOil) {
                        this.state.availableOil = 0;
                    }

                    if (!this.state.analyzedLands) {
                        this.state.analyzedLands = [];
                    }

                    // Добавляем новые поля для слотов, если их нет
                    if (this.state.rigSlots === undefined) {
                        this.state.rigSlots = CONFIG.initial.rigSlots || 2;
                    }

                    if (this.state.purchasedSlots === undefined) {
                        this.state.purchasedSlots = 0;
                    }

                    // Ensure companies have new fields
                    if (this.state.companies.length > 0 && !this.state.companies[0].currentMinBuy) {
                        this.state.companies = [];
                        this.initCompanies();
                    }

                    if (!this.state.lands || this.state.lands.length === 0) {
                        this.generateLands();
                    }
                }
            }
        } catch (e) {
            console.error('Failed to load game:', e);
        }
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

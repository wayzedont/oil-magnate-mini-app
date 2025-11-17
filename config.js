const CONFIG = {
    initial: {
        money: 0,
        clickPower: 1,
        clickSkillLevel: 1,
        analysisSkillLevel: 0,
        rigSlots: 2
    },
    
    rigSlots: {
        baseCost: 7500, // Увеличено для баланса
        costMultiplier: 2.5
    },

    skills: {
        clickPower: {
            baseCost: 15, // По ТЗ: 15 * (1.25 ^ (level - 1))
            costMultiplier: 1.25,
            baseIncome: 1, // По ТЗ: 1 * (1.20 ^ (level - 1))
            incomeMultiplier: 1.20
        }
    },

    bonusCircle: {
        minInterval: 8000, // Уменьшен для большей частоты
        maxInterval: 45000, // Уменьшен для большей частоты
        duration: 5000,
        multiplier: 2
    },

    landAnalysis: {
        // По ТЗ: от 12% (дешевые) до 5% (дорогие)
        costPercentage: 0.10, // Базовое значение для совместимости
        levels: [
            { level: 1, costPercentage: 0.12, errorMargin: 0.50 }, // ±50%, 12% стоимость
            { level: 2, costPercentage: 0.10, errorMargin: 0.40 }, // ±40%, 10% стоимость
            { level: 3, costPercentage: 0.08, errorMargin: 0.30 }, // ±30%, 8% стоимость
            { level: 4, costPercentage: 0.06, errorMargin: 0.20 }, // ±20%, 6% стоимость
            { level: 5, costPercentage: 0.05, errorMargin: 0.10 }  // ±10%, 5% стоимость
        ]
    },

    lands: {
        totalCount: 15,
        // По ТЗ: Независимая генерация цены и качества
        priceCategories: [
            { name: 'poor', min: 100, max: 2000, weight: 0.40 },      // Плохой
            { name: 'medium', min: 2000, max: 15000, weight: 0.35 },   // Средний
            { name: 'good', min: 15000, max: 50000, weight: 0.20 },    // Хороший
            { name: 'rare', min: 50000, max: 150000, weight: 0.05 }    // Редкий
        ],
        oilCategories: [
            { name: 'poor', min: 100, max: 500, weight: 0.40 },        // Плохой - 40% как в ТЗ
            { name: 'medium', min: 500, max: 4000, weight: 0.35 },     // Средний
            { name: 'good', min: 4000, max: 10000, weight: 0.20 },     // Хороший
            { name: 'rare', min: 10000, max: 30000, weight: 0.05 }     // Редкий
        ],
        // Механика износа (потери нефти)
        dailyLoss: {
            poor: 0.06,    // 6% в сутки для плохих
            medium: 0.05,  // 5% в сутки для средних
            good: 0.04,    // 4% в сутки для хороших
            rare: 0.03     // 3% в сутки для редких
        }
    },

    rigs: {
        types: [
            {
                id: 'basic',
                name: 'Базовая вышка',
                icon: '🏗️',
                price: 1000, // По ТЗ
                extractionRate: 50 / 3600, // 50 барр/час = 50/3600 барр/сек
                lossPercentage: 30 // По ТЗ
            },
            {
                id: 'advanced',
                name: 'Улучшенная вышка',
                icon: '⚙️',
                price: 7500, // По ТЗ
                extractionRate: 150 / 3600, // 150 барр/час
                lossPercentage: 15 // По ТЗ
            },
            {
                id: 'premium',
                name: 'Премиум вышка',
                icon: '🏭',
                price: 25000, // По ТЗ
                extractionRate: 350 / 3600, // 350 барр/час
                lossPercentage: 5 // По ТЗ
            }
        ],
        maxPerLand: 3
    },

    // Динамический рынок нефти (По ТЗ)
    oilMarket: {
        updateInterval: 2 * 60 * 60 * 1000, // Каждые 2 часа по ТЗ
        states: [
            { 
                name: 'low', 
                displayName: 'Низкий 📉', 
                minPrice: 40, 
                maxPrice: 55, 
                probability: 0.45 
            },
            { 
                name: 'medium', 
                displayName: 'Средний 📊', 
                minPrice: 55, 
                maxPrice: 70, 
                probability: 0.35 
            },
            { 
                name: 'high', 
                displayName: 'Высокий 📈', 
                minPrice: 70, 
                maxPrice: 110, 
                probability: 0.15 
            },
            { 
                name: 'peak', 
                displayName: 'Пиковый 🚀', 
                minPrice: 140, 
                maxPrice: 200, 
                probability: 0.05 
            }
        ]
    },

    companies: {
        list: [
            {
                id: 'rosneft',
                name: 'Роснефть',
                icon: '🏢',
                basePrice: 8,
                maxDemand: 800,
                minDemand: 30,
                possibleMinBuy: [1, 30, 80, 300],
                priceMultipliers: [0.85, 1.0, 1.15, 1.4],
                cooldownTime: 180000, // БАГ #29: 3 минуты вместо 1
                contractLevels: [
                    { level: 1, maxDemandMultiplier: 1.0, cost: 5000 },
                    { level: 2, maxDemandMultiplier: 1.5, cost: 15000 },
                    { level: 3, maxDemandMultiplier: 2.0, cost: 35000 },
                    { level: 4, maxDemandMultiplier: 2.5, cost: 80000 },
                    { level: 5, maxDemandMultiplier: 3.0, cost: 150000 }
                ]
            },
            {
                id: 'gazprom',
                name: 'Газпром',
                icon: '🏭',
                basePrice: 9,
                maxDemand: 600,
                minDemand: 50,
                possibleMinBuy: [1, 50, 120, 600],
                priceMultipliers: [0.8, 1.0, 1.2, 1.6],
                cooldownTime: 180000,
                contractLevels: [
                    { level: 1, maxDemandMultiplier: 1.0, cost: 8000 },
                    { level: 2, maxDemandMultiplier: 1.5, cost: 20000 },
                    { level: 3, maxDemandMultiplier: 2.0, cost: 50000 },
                    { level: 4, maxDemandMultiplier: 2.5, cost: 100000 },
                    { level: 5, maxDemandMultiplier: 3.0, cost: 200000 }
                ]
            },
            {
                id: 'lukoil',
                name: 'Лукойл',
                icon: '⛽',
                basePrice: 10,
                maxDemand: 900,
                minDemand: 60,
                possibleMinBuy: [5, 60, 120, 300],
                priceMultipliers: [0.8, 1.0, 1.2, 1.5],
                cooldownTime: 180000,
                contractLevels: [
                    { level: 1, maxDemandMultiplier: 1.0, cost: 7000 },
                    { level: 2, maxDemandMultiplier: 1.5, cost: 18000 },
                    { level: 3, maxDemandMultiplier: 2.0, cost: 40000 },
                    { level: 4, maxDemandMultiplier: 2.5, cost: 90000 },
                    { level: 5, maxDemandMultiplier: 3.0, cost: 170000 }
                ]
            },
            {
                id: 'tatneft',
                name: 'Татнефть',
                icon: '🛢️',
                basePrice: 7,
                maxDemand: 500,
                minDemand: 25,
                possibleMinBuy: [1, 25, 70, 350],
                priceMultipliers: [0.9, 1.0, 1.1, 1.3],
                cooldownTime: 180000,
                contractLevels: [
                    { level: 1, maxDemandMultiplier: 1.0, cost: 4000 },
                    { level: 2, maxDemandMultiplier: 1.5, cost: 12000 },
                    { level: 3, maxDemandMultiplier: 2.0, cost: 30000 },
                    { level: 4, maxDemandMultiplier: 2.5, cost: 70000 },
                    { level: 5, maxDemandMultiplier: 3.0, cost: 130000 }
                ]
            }
        ],
        priceChangeInterval: 60000, // БАГ #30: 1 минута вместо 15 секунд для стабильности
        requirementsChangeInterval: 8 * 60 * 1000,
        maxPriceChange: 0.12,
        defaultCooldownTime: 180000 // 3 минуты по умолчанию
    },

    ui: {
        floatingNumberDuration: 1000,
        saveInterval: 5000,
        rigUpdateInterval: 1000
    },

    generation: {
        maxAttempts: 3,
        cooldownTime: 5 * 60 * 1000 // 5 minutes in milliseconds
    },

    offlineProgress: {
        maxTime: 8 * 60 * 60 * 1000, // 8 hours in milliseconds
        efficiency: 0.8 // 80% efficiency during offline time
    },

    events: {
        enabled: true,
        interval: 30 * 60 * 1000, // 30 minutes
        types: [
            {
                id: 'rig_fire',
                title: 'Пожар на вышке!',
                description: 'Одна из ваших вышек загорелась! Потеряно 500 баррелей нефти.',
                choices: [],
                effect: { oil: -500 }
            },
            {
                id: 'oil_price_spike',
                title: 'Рост цен на нефть!',
                description: 'Цены на нефть выросли на 20% на 10 минут.',
                choices: [],
                effect: { priceMultiplier: 1.2, duration: 10 * 60 * 1000 }
            },
            {
                id: 'equipment_upgrade',
                title: 'Найдена старая техника',
                description: 'Вы нашли старую буровую установку. Что с ней сделать?',
                choices: [
                    { text: 'Восстановить (+1 базовая вышка)', effect: { freeRig: 'basic' } },
                    { text: 'Продать за 2000₽', effect: { money: 2000 } }
                ]
            },
            {
                id: 'market_crash',
                title: 'Обвал рынка',
                description: 'Цены на нефть упали на 30% на 5 минут.',
                choices: [],
                effect: { priceMultiplier: 0.7, duration: 5 * 60 * 1000 }
            },
            {
                id: 'bonus_oil',
                title: 'Неожиданная находка',
                description: 'Вашей команде удалось обнаружить дополнительный запас нефти!',
                choices: [],
                effect: { oil: 1000 }
            }
        ]
    },

    // НПЗ (Эндгейм) - По ТЗ
    ownCompany: {
        creationCost: 25000,
        factories: [
            {
                id: 'mini',
                name: 'Mini НПЗ',
                icon: '🏪',
                price: 50000, // По ТЗ
                productionRate: 20, // баррелей бензина за цикл
                cycleTime: 30 * 60 * 1000, // 30 минут
                inputOilPerBarrel: 1.2 // Сколько сырой нефти требуется на 1 баррель бензина
            },
            {
                id: 'medium',
                name: 'Medium НПЗ',
                icon: '🏭',
                price: 250000, // По ТЗ
                productionRate: 120, // баррелей бензина за цикл
                cycleTime: 60 * 60 * 1000, // 1 час
                inputOilPerBarrel: 1.15
            },
            {
                id: 'mega',
                name: 'Mega НПЗ',
                icon: '🏗️',
                price: 1000000, // По ТЗ
                productionRate: 600, // баррелей бензина за цикл
                cycleTime: 2 * 60 * 60 * 1000, // 2 часа
                inputOilPerBarrel: 1.1
            }
        ],
        // Цена бензина = x1.5-x2.0 от средней цены нефти
        gasolinePriceMultiplier: { min: 1.5, max: 2.0 },
        buyback: {
            minPrice: 6,
            maxPrice: 18,
            baseVolume: 150
        }
    },

    // Система прогрессии и опыта - По ТЗ
    experience: {
        // Формула: XP_для_уровня = 100 * (1.45 ^ (уровень - 1))
        baseXP: 100,
        multiplier: 1.45,
        sources: {
            click: 1,           // XP за клик
            buyLand: 50,        // XP за покупку участка
            oilBarrel: 0.1,     // XP за добычу барреля
            achievement: 100    // XP за достижение
        }
    },

    // Достижения с постоянными бонусами - По ТЗ
    achievements: [
        {
            id: 'first_100_clicks',
            name: 'Первый шаг',
            description: '100 кликов',
            condition: { clicks: 100 },
            reward: { clickPowerBonus: 0.10 } // +10% к силе клика постоянно
        },
        {
            id: 'landowner_10',
            name: 'Землевладелец',
            description: '10 участков куплено',
            condition: { landsBought: 10 },
            reward: { landPriceDiscount: 0.10 } // -10% к цене участков постоянно
        },
        {
            id: 'rig_builder_20',
            name: 'Вышочник',
            description: '20 вышек построено',
            condition: { rigsBuilt: 20 },
            reward: { extractionSpeedBonus: 0.05 } // +5% к скорости добычи постоянно
        },
        {
            id: 'unlucky_3',
            name: 'Невезение',
            description: '3 "Плохих" участка подряд',
            condition: { poorLandsInRow: 3 },
            reward: { freeAnalysis: 1 } // Бесплатный анализ (1 шт.)
        },
        {
            id: 'financier',
            name: 'Финансист',
            description: '$1,000,000 заработано',
            condition: { totalEarned: 1000000 },
            reward: { allIncomeBonus: 1.05 } // ×1.05 ко всем доходам постоянно
        }
    ],

    // Система опыта - По ТЗ
    xpSystem: {
        formula: {
            base: 100,
            multiplier: 1.45
        },
        sources: {
            click: 1,
            buyLand: 10,
            buildRig: 5,
            sellOil: 3,
            achievement: 20
        }
    },

    // Ежедневные бонусы - По ТЗ
    dailyRewards: {
        streak: [
            { day: 1, money: 5000 },
            { day: 2, money: 10000 },
            { day: 3, money: 15000 },
            { day: 4, boost: { type: 'priceMultiplier', value: 2, duration: 10 * 60 * 1000 } }, // x2 цена на 10 мин
            { day: 5, freeLand: { quality: 'medium', minOil: 500, maxOil: 2000 } },
            { day: 6, money: 25000 },
            { day: 7, freeLand: { quality: 'rare', minOil: 3000, maxOil: 6000 } }
        ],
        wheelOfFortune: {
            enabled: true,
            cooldown: 24 * 60 * 60 * 1000, // 1 раз в день
            prizes: [
                { type: 'money', min: 5000, max: 200000, weight: 0.50 },
                { type: 'clickMultiplier', value: 2, duration: 60 * 60 * 1000, weight: 0.25 }, // x2 клик на 1ч
                { type: 'extractionBoost', value: 1.5, duration: 60 * 60 * 1000, weight: 0.25 } // +50% добыча на 1ч
            ]
        }
    }
};

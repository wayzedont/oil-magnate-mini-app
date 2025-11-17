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
            baseCost: 100, // Немного уменьшено для лучшей вовлеченности
            costMultiplier: 1.8, // Уменьшен для более плавного прогресса
            powerMultiplier: 1.5
        }
    },

    bonusCircle: {
        minInterval: 8000, // Уменьшен для большей частоты
        maxInterval: 45000, // Уменьшен для большей частоты
        duration: 5000,
        multiplier: 2
    },

    landAnalysis: {
        costPercentage: 0.5
    },

    lands: {
        totalCount: 15, // Увеличено для большего разнообразия
        priceRange: {
            min: 300,
            max: 75000
        },
        oilReserveRange: {
            min: 50, // Уменьшено для баланса
            max: 15000
        },
        probabilityMatrix: {
            cheap: {
                empty: 0.6,
                poor: 0.25,
                medium: 0.12,
                rich: 0.03
            },
            medium: {
                empty: 0.3,
                poor: 0.25,
                medium: 0.3,
                rich: 0.15
            },
            expensive: {
                empty: 0.15,
                poor: 0.2,
                medium: 0.35,
                rich: 0.3
            }
        },
        oilValueMultipliers: {
            empty: 0.05,
            poor: 0.3,
            medium: 0.8,
            rich: 2.0
        }
    },

    rigs: {
        types: [
            {
                id: 'basic',
                name: 'Базовая вышка',
                icon: '🏗️',
                price: 1500, // Увеличено
                extractionRate: 0.8, // Уменьшено
                lossPercentage: 35
            },
            {
                id: 'advanced',
                name: 'Улучшенная вышка',
                icon: '⚙️',
                price: 8000, // Увеличено
                extractionRate: 2.5, // Уменьшено
                lossPercentage: 20
            },
            {
                id: 'premium',
                name: 'Премиум вышка',
                icon: '🏭',
                price: 35000, // Увеличено
                extractionRate: 7, // Уменьшено
                lossPercentage: 8
            }
        ],
        maxPerLand: 3
    },

    companies: {
        list: [
            {
                id: 'rosneft',
                name: 'Роснефть',
                icon: '🏢',
                basePrice: 8, // Уменьшено для баланса
                maxDemand: 800, // Уменьшено
                minDemand: 30, // Уменьшено
                possibleMinBuy: [1, 30, 80, 300],
                priceMultipliers: [0.85, 1.0, 1.15, 1.4],
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
                basePrice: 9, // Уменьшено
                maxDemand: 600, // Уменьшено
                minDemand: 50, // Уменьшено
                possibleMinBuy: [1, 50, 120, 600],
                priceMultipliers: [0.8, 1.0, 1.2, 1.6],
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
                basePrice: 7, // Уменьшено
                maxDemand: 500, // Уменьшено
                minDemand: 25, // Уменьшено
                possibleMinBuy: [1, 25, 70, 350],
                priceMultipliers: [0.9, 1.0, 1.1, 1.3],
                contractLevels: [
                    { level: 1, maxDemandMultiplier: 1.0, cost: 4000 },
                    { level: 2, maxDemandMultiplier: 1.5, cost: 12000 },
                    { level: 3, maxDemandMultiplier: 2.0, cost: 30000 },
                    { level: 4, maxDemandMultiplier: 2.5, cost: 70000 },
                    { level: 5, maxDemandMultiplier: 3.0, cost: 130000 }
                ]
            }
        ],
        priceChangeInterval: 15000, // Увеличено для баланса
        requirementsChangeInterval: 8 * 60 * 1000, // Увеличено
        maxPriceChange: 0.12 // Уменьшено
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

    ownCompany: {
        creationCost: 25000, // Уменьшено для лучшей доступности
        products: [
            {
                id: 'motor_oil',
                name: 'Моторное масло',
                basePrice: 45, // Немного уменьшено
                oilRequired: 8, // Уменьшено
                moneyRequired: 15, // Уменьшено
                productionTime: 45 * 1000 // 45 seconds - быстрее
            },
            {
                id: 'gasoline',
                name: 'Бензин',
                basePrice: 75, // Немного уменьшено
                oilRequired: 12, // Уменьшено
                moneyRequired: 25, // Уменьшено
                productionTime: 60 * 1000 // 1 minute - быстрее
            },
            {
                id: 'diesel',
                name: 'Дизельное топливо',
                basePrice: 65, // Немного уменьшено
                oilRequired: 10, // Уменьшено
                moneyRequired: 20, // Уменьшено
                productionTime: 50 * 1000 // 50 seconds - быстрее
            }
        ],
        buyback: {
            minPrice: 6, // Немного увеличено для баланса
            maxPrice: 18, // Увеличено
            baseVolume: 150 // Увеличено для большей активности
        }
    }
};

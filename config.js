const CONFIG = {
    initial: {
        money: 0,
        clickPower: 1,
        clickSkillLevel: 1,
        analysisSkillLevel: 0,
        rigSlots: 2
    },
    
    rigSlots: {
        baseCost: 5000,
        costMultiplier: 2.0
    },

    skills: {
        clickPower: {
            baseCost: 100,
            costMultiplier: 1.5,
            powerMultiplier: 1.5
        }
    },

    bonusCircle: {
        minInterval: 10000,
        maxInterval: 60000,
        duration: 5000,
        multiplier: 2
    },

    landAnalysis: {
        costPercentage: 0.5
    },

    lands: {
        totalCount: 12,
        priceRange: {
            min: 500,
            max: 50000
        },
        oilReserveRange: {
            min: 100,
            max: 10000
        },
        probabilityMatrix: {
            cheap: {
                empty: 0.5,
                poor: 0.3,
                medium: 0.15,
                rich: 0.05
            },
            medium: {
                empty: 0.2,
                poor: 0.3,
                medium: 0.35,
                rich: 0.15
            },
            expensive: {
                empty: 0.1,
                poor: 0.2,
                medium: 0.4,
                rich: 0.3
            }
        },
        oilValueMultipliers: {
            empty: 0.1,
            poor: 0.4,
            medium: 1.0,
            rich: 2.5
        }
    },

    rigs: {
        types: [
            {
                id: 'basic',
                name: 'Базовая вышка',
                icon: '🏗️',
                price: 1000,
                extractionRate: 1,
                lossPercentage: 30
            },
            {
                id: 'advanced',
                name: 'Улучшенная вышка',
                icon: '⚙️',
                price: 5000,
                extractionRate: 3,
                lossPercentage: 15
            },
            {
                id: 'premium',
                name: 'Премиум вышка',
                icon: '🏭',
                price: 20000,
                extractionRate: 8,
                lossPercentage: 5
            }
        ]
    },

    companies: {
        list: [
            {
                id: 'rosneft',
                name: 'Роснефть',
                icon: '🏢',
                basePrice: 10,
                maxDemand: 1000,
                minDemand: 50,
                possibleMinBuy: [1, 50, 100, 500],
                priceMultipliers: [0.8, 1.0, 1.2, 1.5]
            },
            {
                id: 'gazprom',
                name: 'Газпром',
                icon: '🏭',
                basePrice: 12,
                maxDemand: 800,
                minDemand: 100,
                possibleMinBuy: [1, 100, 200, 1000],
                priceMultipliers: [0.7, 1.0, 1.3, 1.8]
            },
            {
                id: 'lukoil',
                name: 'Лукойл',
                icon: '⛽',
                basePrice: 11,
                maxDemand: 1200,
                minDemand: 80,
                possibleMinBuy: [5, 80, 150, 400],
                priceMultipliers: [0.75, 1.0, 1.25, 1.6]
            },
            {
                id: 'tatneft',
                name: 'Татнефть',
                icon: '🛢️',
                basePrice: 9,
                maxDemand: 600,
                minDemand: 40,
                possibleMinBuy: [1, 40, 100, 500],
                priceMultipliers: [0.85, 1.0, 1.15, 1.4]
            }
        ],
        priceChangeInterval: 10000,
        requirementsChangeInterval: 5 * 60 * 1000,
        maxPriceChange: 0.15
    },

    ui: {
        floatingNumberDuration: 1000,
        saveInterval: 5000,
        rigUpdateInterval: 1000
    },

    generation: {
        maxAttempts: 3,
        cooldownTime: 5 * 60 * 1000 // 5 minutes in milliseconds
    }
};

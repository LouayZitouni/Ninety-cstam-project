const subscriptionRepo = require('../infrastructure/database/subscriptionRepository');

async function subscribeUser(userId, planId) {
    const plan = await subscriptionRepo.getPlanById(planId);
    if (!plan) {
        throw new Error('Selected plan does not exist.');
    }
    return await subscriptionRepo.createSubscription(userId, plan.id, plan.duration_days);
}

async function getMySubscription(userId) {
    return await subscriptionRepo.getUserSubscription(userId);
}

async function listPlans() {
    return await subscriptionRepo.getAllPlans();
}

module.exports = {
    subscribeUser,
    getMySubscription,
    listPlans
};
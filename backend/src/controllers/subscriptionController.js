const subscriptionService = require('../services/subscriptionService');

async function subscribe(req, res, next) {
    try {
        const userId = req.user.id; // Taken from logged-in user JWT token
        const { planId } = req.body;

        if (!planId) {
            return res.status(400).json({ message: 'planId is required in request body.' });
        }

        const subscription = await subscriptionService.subscribeUser(userId, planId);
        return res.status(201).json({
            message: 'Membership activated!',
            subscription
        });
    } catch (error) {
        next(error);
    }
}

async function getMySubscription(req, res, next) {
    try {
        const userId = req.user.id;
        const subscription = await subscriptionService.getMySubscription(userId);
        return res.status(200).json({
            active: !!subscription,
            subscription: subscription || null
        });
    } catch (error) {
        next(error);
    }
}

async function getPlans(req, res, next) {
    try {
        const plans = await subscriptionService.listPlans();
        return res.status(200).json({ plans });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    subscribe,
    getMySubscription,
    getPlans
};
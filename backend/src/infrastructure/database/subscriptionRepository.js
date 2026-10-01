const pool = require('./postgresPool');

// Get plan details by ID
async function getPlanById(planId) {
    const query = `SELECT * FROM plans WHERE id = $1 AND is_active = TRUE;`;
    const { rows } = await pool.query(query, [planId]);
    return rows[0] || null;
}

// Get all active plans
async function getAllPlans() {
    const query = `SELECT * FROM plans WHERE is_active = TRUE;`;
    const { rows } = await pool.query(query);
    return rows;
}

// Expire outdated subscriptions & create new active subscription
async function createSubscription(userId, planId, durationDays) {
    // Cancel old active plan for this user
    await pool.query(
        `UPDATE user_subscriptions SET status = 'CANCELED' WHERE user_id = $1 AND status = 'ACTIVE';`,
        [userId]
    );

    // Insert new subscription (PostgreSQL calculates expiration date)
    const query = `
        INSERT INTO user_subscriptions (user_id, plan_id, activated_at, expires_at, status)
        VALUES ($1, $2, NOW(), NOW() + (INTERVAL '1 day' * $3), 'ACTIVE')
        RETURNING *;
    `;
    const { rows } = await pool.query(query, [userId, planId, durationDays]);
    return rows[0];
}

// Fetch active subscription for a user
async function getUserSubscription(userId) {
    // Mark overdue plans as EXPIRED first
    await pool.query(
        `UPDATE user_subscriptions SET status = 'EXPIRED' WHERE status = 'ACTIVE' AND expires_at <= NOW();`
    );

    const query = `
        SELECT s.*, p.name AS plan_name, p.discount_percentage
        FROM user_subscriptions s
        JOIN plans p ON s.plan_id = p.id
        WHERE s.user_id = $1 AND s.status = 'ACTIVE'
        LIMIT 1;
    `;
    const { rows } = await pool.query(query, [userId]);
    return rows[0] || null;
}

module.exports = {
    getPlanById,
    getAllPlans,
    createSubscription,
    getUserSubscription
};.
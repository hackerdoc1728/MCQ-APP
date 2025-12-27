// src/routes/contact.js
/* eslint-disable */
import validator from 'validator';
import { pool } from '../infra/db.js';
import { logger } from '../infra/logger.js';
import { generateCsrfToken, validateCsrfToken } from '../middleware/csrf.js';

export function registerContactRoutes(app) {
    app.post(
        '/subscribe',
        generateCsrfToken,
        validateCsrfToken,
        async (req, res) => {
            const email = req.body.email;

            if (!validator.isEmail(email)) {
                logger.warn(`Invalid subscription attempt with email: ${email}`);
                return res.status(400).send('Invalid email address');
            }

            try {
                const connection = await pool.getConnection();
                const query = 'INSERT INTO newsletter_subscribers (email) VALUES (?)';
                await connection.execute(query, [email]);
                connection.release();

                logger.info(`New subscription: ${email}`);
                res.send(
                    'Thank you for subscribing to updates from Bench to Bedside Neuro!'
                );
            } catch (error) {
                logger.error('Failed to save subscription:', error);
                res.status(500).send('Failed to save subscription');
            }
        }
    );

    app.post(
        '/api/contact',
        generateCsrfToken,
        validateCsrfToken,
        async (req, res) => {
            const { name, email, phone, message } = req.body;

            if (!name || !email || !message) {
                return res.status(400).send('All fields are required');
            }

            if (!validator.isEmail(email)) {
                return res.status(400).send('Invalid email address');
            }

            try {
                const connection = await pool.getConnection();
                const query =
                    'INSERT INTO contact_messages (name, email, phone, message) VALUES (?, ?, ?, ?)';
                await connection.execute(query, [name, email, phone, message]);
                connection.release();

                logger.info(`New contact message from: ${name}`);
                res.send('Your message has been sent successfully!');
            } catch (error) {
                logger.error('Failed to save contact message:', error);
                res.status(500).send('Failed to save contact message');
            }
        }
    );
}

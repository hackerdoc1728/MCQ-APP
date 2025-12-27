/* eslint-disable */

export const CACHE_TTL = {
    user: 7 * 24 * 60 * 60,       // 7d
    userState: 7 * 24 * 60 * 60,  // 7d
    answer: 7 * 24 * 60 * 60,     // 7d
};

export const cacheKeys = {
    userBySub: (sub) => `user:google_sub:${sub}`,
    userById: (id) => `user:id:${id}`,

    userState: (userId) => `user_state:${userId}`,

    answer: (userId, mcqId) => `ans:${userId}:${mcqId}`,

    // optional for later:
    // answerSet: (userId, setId) => `ans_set:${userId}:${setId}`,
};

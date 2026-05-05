import { query, collection, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';

// Shorter, punchier adjectives for compact usernames
const adjectives = [
  'Happy', 'Clever', 'Swift', 'Bright', 'Bold', 'Calm', 'Jolly', 'Kind',
  'Lucky', 'Quick', 'Silly', 'Witty', 'Zesty', 'Bouncy', 'Daring', 'Eager',
  'Keen', 'Lively', 'Merry', 'Noble', 'Quirky', 'Radiant', 'Stellar', 'Upbeat',
  'Vivid', 'Cool', 'Epic', 'Sick', 'Rad', 'Ace', 'Phat', 'Prime',
];

// Short animal names for compact usernames
const animals = [
  'Panda', 'Fox', 'Owl', 'Eagle', 'Tiger', 'Bear', 'Wolf', 'Lynx',
  'Otter', 'Raven', 'Swan', 'Shark', 'Dolphin', 'Bee', 'Dragon', 'Phoenix',
  'Penguin', 'Koala', 'Lemur', 'Puma', 'Badger', 'Zebra', 'Cobra', 'Hawk',
  'Elk', 'Emu', 'Seal', 'Crab', 'Newt', 'Vole', 'Mole', 'Lynx',
];

/**
 * Generate a random fun username (short format)
 * @returns {string} Random username like "HappyFox42"
 */
export const generateRandomUsername = () => {
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const animal = animals[Math.floor(Math.random() * animals.length)];
  const number = Math.floor(Math.random() * 99);
  
  return `${adjective}${animal}${number}`.substring(0, 20); // Max 20 chars
};

/**
 * Generate multiple unique usernames (for suggestions)
 * @param {number} count - Number of suggestions to generate
 * @returns {Promise<string[]>} Array of random usernames with availability info
 */
export const generateUsernameOptions = async (count = 5) => {
  const options = new Set();
  const attempts = 0;
  const maxAttempts = count * 10; // Prevent infinite loops
  
  while (options.size < count && attempts < maxAttempts) {
    const username = generateRandomUsername();
    const isAvailable = await checkUsernameAvailability(username);
    if (isAvailable) {
      options.add(username);
    }
  }
  
  return Array.from(options);
};

/**
 * Check if username is available (not taken)
 * @param {string} username - Username to check
 * @returns {Promise<boolean>} True if available, false if taken
 */
export const checkUsernameAvailability = async (username) => {
  try {
    const q = query(
      collection(db, 'users'),
      where('username', '==', username)
    );
    const snapshot = await getDocs(q);
    return snapshot.empty; // True if no matches (available)
  } catch (err) {
    console.error('Error checking username availability:', err);
    return true; // Assume available on error
  }
};

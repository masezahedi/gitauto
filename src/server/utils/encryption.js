const CryptoJS = require('crypto-js');
require('dotenv').config();

class EncryptionService {
  constructor() {
    this.secretKey = process.env.ENCRYPTION_KEY;
    if (!this.secretKey || this.secretKey.length < 32) {
      throw new Error('ENCRYPTION_KEY must be at least 32 characters long');
    }
  }

  /**
   * Encrypt a string (e.g., GitHub access token)
   * @param {string} plainText - Text to encrypt
   * @returns {string} - Encrypted text
   */
  encrypt(plainText) {
    try {
      if (!plainText) {
        throw new Error('Cannot encrypt empty string');
      }
      const encrypted = CryptoJS.AES.encrypt(plainText, this.secretKey).toString();
      return encrypted;
    } catch (error) {
      throw new Error(`Encryption failed: ${error.message}`);
    }
  }

  /**
   * Decrypt a string (e.g., GitHub access token)
   * @param {string} encryptedText - Encrypted text
   * @returns {string} - Decrypted text
   */
  decrypt(encryptedText) {
    try {
      if (!encryptedText) {
        throw new Error('Cannot decrypt empty string');
      }
      const decrypted = CryptoJS.AES.decrypt(encryptedText, this.secretKey).toString(
        CryptoJS.enc.Utf8
      );
      if (!decrypted) {
        throw new Error('Decryption resulted in empty string - likely wrong key');
      }
      return decrypted;
    } catch (error) {
      throw new Error(`Decryption failed: ${error.message}`);
    }
  }
}

module.exports = new EncryptionService();

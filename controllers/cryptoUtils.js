'use strict';

const crypto = require('crypto');

const DEFAULT_ALPHABET = '哈基米';
const PBKDF2_ITERATIONS = 100000;
const KEY_LENGTH = 32;
const SALT_LENGTH = 16;
const IV_LENGTH = 12;
const ALGORITHM = 'aes-256-gcm';
const DIGEST = 'sha256';

const cryptoUtils = {};

cryptoUtils.validateAlphabet = function (alphabet) {
    if (!alphabet || alphabet.length < 2) {
        throw new Error('字典必须至少包含2个字符');
    }
    const unique = new Set(alphabet);
    if (unique.size !== alphabet.length) {
        throw new Error('字典包含重复字符');
    }
    return true;
};

cryptoUtils.deriveKey = function (password, salt) {
    return new Promise((resolve, reject) => {
        crypto.pbkdf2(
            password,
            salt,
            PBKDF2_ITERATIONS,
            KEY_LENGTH,
            DIGEST,
            (err, derivedKey) => {
                if (err) return reject(err);
                resolve(derivedKey);
            }
        );
    });
};

cryptoUtils.encrypt = function (plaintext, password) {
    return new Promise((resolve, reject) => {
        try {
            const salt = crypto.randomBytes(SALT_LENGTH);
            const iv = crypto.randomBytes(IV_LENGTH);

            crypto.pbkdf2(
                password,
                salt,
                PBKDF2_ITERATIONS,
                KEY_LENGTH,
                DIGEST,
                (err, key) => {
                    if (err) return reject(err);

                    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
                    const encrypted = Buffer.concat([
                        cipher.update(plaintext, 'utf8'),
                        cipher.final()
                    ]);
                    const authTag = cipher.getAuthTag();

                    const combined = Buffer.concat([salt, iv, authTag, encrypted]);
                    resolve(combined);
                }
            );
        } catch (e) {
            reject(e);
        }
    });
};

cryptoUtils.decrypt = function (combinedBuffer, password) {
    return new Promise((resolve, reject) => {
        try {
            const salt = combinedBuffer.slice(0, SALT_LENGTH);
            const iv = combinedBuffer.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
            const authTag = combinedBuffer.slice(
                SALT_LENGTH + IV_LENGTH,
                SALT_LENGTH + IV_LENGTH + 16
            );
            const encrypted = combinedBuffer.slice(SALT_LENGTH + IV_LENGTH + 16);

            crypto.pbkdf2(
                password,
                salt,
                PBKDF2_ITERATIONS,
                KEY_LENGTH,
                DIGEST,
                (err, key) => {
                    if (err) return reject(err);

                    try {
                        const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
                        decipher.setAuthTag(authTag);
                        const decrypted = Buffer.concat([
                            decipher.update(encrypted),
                            decipher.final()
                        ]);
                        resolve(decrypted.toString('utf8'));
                    } catch (e) {
                        reject(new Error('解密失败：私钥错误或密文已损坏'));
                    }
                }
            );
        } catch (e) {
            reject(e);
        }
    });
};

cryptoUtils.bufferToBigInt = function (buffer) {
    const hex = buffer.toString('hex');
    return BigInt('0x' + hex);
};

cryptoUtils.bigIntToBuffer = function (bigInt) {
    let hex = bigInt.toString(16);
    if (hex.length % 2 !== 0) {
        hex = '0' + hex;
    }
    return Buffer.from(hex, 'hex');
};

cryptoUtils.encodeBaseN = function (bigInt, alphabet) {
    if (bigInt === 0n) return alphabet[0];
    const base = BigInt(alphabet.length);
    let result = '';
    while (bigInt > 0n) {
        result = alphabet[Number(bigInt % base)] + result;
        bigInt = bigInt / base;
    }
    return result;
};

cryptoUtils.decodeBaseN = function (str, alphabet) {
    const base = BigInt(alphabet.length);
    let bigInt = 0n;
    for (let i = 0; i < str.length; i++) {
        const index = alphabet.indexOf(str[i]);
        if (index === -1) {
            throw new Error('密文包含非法字符，无法解析');
        }
        bigInt = bigInt * base + BigInt(index);
    }
    return bigInt;
};

cryptoUtils.encryptToBaseN = async function (plaintext, password, alphabet) {
    const validatedAlphabet = alphabet || DEFAULT_ALPHABET;
    cryptoUtils.validateAlphabet(validatedAlphabet);

    const encryptedBuffer = await cryptoUtils.encrypt(plaintext, password);
    const bigInt = cryptoUtils.bufferToBigInt(encryptedBuffer);
    const baseNString = cryptoUtils.encodeBaseN(bigInt, validatedAlphabet);

    return {
        ciphertext: baseNString,
        alphabet: validatedAlphabet,
        encrypted: true
    };
};

cryptoUtils.decryptFromBaseN = async function (baseNString, password, alphabet) {
    const validatedAlphabet = alphabet || DEFAULT_ALPHABET;
    cryptoUtils.validateAlphabet(validatedAlphabet);

    const bigInt = cryptoUtils.decodeBaseN(baseNString, validatedAlphabet);
    const encryptedBuffer = cryptoUtils.bigIntToBuffer(bigInt);
    const plaintext = await cryptoUtils.decrypt(encryptedBuffer, password);

    return {
        plaintext: plaintext,
        decrypted: true
    };
};

cryptoUtils.generateRoomKey = function () {
    return crypto.randomBytes(KEY_LENGTH).toString('hex');
};

cryptoUtils.hashRoomKey = function (roomKey, salt) {
    return new Promise((resolve, reject) => {
        const effectiveSalt = salt || crypto.randomBytes(SALT_LENGTH);
        crypto.pbkdf2(
            roomKey,
            effectiveSalt,
            PBKDF2_ITERATIONS,
            KEY_LENGTH,
            DIGEST,
            (err, hash) => {
                if (err) return reject(err);
                resolve({
                    hash: hash.toString('hex'),
                    salt: effectiveSalt.toString('hex')
                });
            }
        );
    });
};

cryptoUtils.verifyRoomKey = function (roomKey, storedHash, storedSalt) {
    return new Promise((resolve, reject) => {
        const salt = Buffer.from(storedSalt, 'hex');
        crypto.pbkdf2(
            roomKey,
            salt,
            PBKDF2_ITERATIONS,
            KEY_LENGTH,
            DIGEST,
            (err, hash) => {
                if (err) return reject(err);
                const hashHex = hash.toString('hex');
                resolve(hashHex === storedHash);
            }
        );
    });
};

cryptoUtils.generateHajimiGarble = function (originalText) {
    const hajimi = '哈基米';
    const length = originalText ? originalText.length : 20;
    let result = '';
    for (let i = 0; i < length; i++) {
        result += hajimi[Math.floor(Math.random() * hajimi.length)];
    }
    return result;
};

module.exports = cryptoUtils;

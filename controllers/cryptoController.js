'use strict';

const cryptoUtils = require('./cryptoUtils');

const cryptoController = {};

cryptoController.encrypt = async function (req, res) {
    try {
        const { plaintext, password, alphabet } = req.body;

        if (!plaintext || !password) {
            return res.status(400).json({
                success: false,
                error: '缺少必要参数：plaintext 和 password'
            });
        }

        const result = await cryptoUtils.encryptToBaseN(
            plaintext,
            password,
            alphabet
        );

        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

cryptoController.decrypt = async function (req, res) {
    try {
        const { ciphertext, password, alphabet } = req.body;

        if (!ciphertext || !password) {
            return res.status(400).json({
                success: false,
                error: '缺少必要参数：ciphertext 和 password'
            });
        }

        const result = await cryptoUtils.decryptFromBaseN(
            ciphertext,
            password,
            alphabet
        );

        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

cryptoController.generateRoomKey = function (req, res) {
    try {
        const roomKey = cryptoUtils.generateRoomKey();
        res.json({
            success: true,
            data: {
                roomKey: roomKey,
                length: roomKey.length
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

cryptoController.hashRoomKey = async function (req, res) {
    try {
        const { roomKey } = req.body;

        if (!roomKey) {
            return res.status(400).json({
                success: false,
                error: '缺少必要参数：roomKey'
            });
        }

        const result = await cryptoUtils.hashRoomKey(roomKey);

        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

cryptoController.verifyRoomKey = async function (req, res) {
    try {
        const { roomKey, storedHash, storedSalt } = req.body;

        if (!roomKey || !storedHash || !storedSalt) {
            return res.status(400).json({
                success: false,
                error: '缺少必要参数：roomKey, storedHash, storedSalt'
            });
        }

        const isValid = await cryptoUtils.verifyRoomKey(
            roomKey,
            storedHash,
            storedSalt
        );

        res.json({
            success: true,
            data: {
                valid: isValid
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

cryptoController.generateHajimi = function (req, res) {
    try {
        const { length } = req.body;
        const garble = cryptoUtils.generateHajimiGarble(
            length ? { length: parseInt(length) } : null
        );

        res.json({
            success: true,
            data: {
                garble: garble
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

module.exports = cryptoController;

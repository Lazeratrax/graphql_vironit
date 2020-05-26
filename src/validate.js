// src/validate.js

require("dotenv").config();
const jwt = require("jsonwebtoken");
const jwksClient = require("jwks-rsa");

const client = jwksClient({
    jwksUri: `https://${process.env.AUTH0_DOMAIN}/.well-known/jwks.json`
});
//на основе заголовка (1), выдает 3 часть токена(сигнатура = публичный ключ)
function getKey(header, callback) {
    client.getSigningKey(header.kid, function(error, key) {
        const signingKey = key.publicKey || key.rsaPublicKey;
        callback(null, signingKey);
    });
}

async function isTokenValid(token) {
    if (token) {
        //разбивка на массив
        const bearerToken = token.split(" ");

        const result = new Promise((resolve, reject) => {
            //verify - проверка валидности токена
            jwt.verify(
                //2 элемент токена - полезная информация (1 - заголовок, 3 - сигнатура)
                bearerToken[1],
                //3 элемент
                getKey,
                //опции - заголовок - 1
                {
                    audience: process.env.API_IDENTIFIER,
                    issuer: `https://${process.env.AUTH0_DOMAIN}/`,
                    algorithms: ["RS256"]
                },
                (error, decoded) => {
                    if (error) {
                        resolve({ error });
                    }
                    if (decoded) {
                        resolve({ decoded });
                    }
                }
            );
        });

        return result;
    }

    return { error: "No token provided" };
}

module.exports = isTokenValid;
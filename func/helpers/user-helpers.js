const fetch = require("node-fetch");

const { API_ENDPOINT } = require("./discord-helpers.js");

async function getUserInfo(token) {
    const result = await fetch(`${API_ENDPOINT}/users/@me`, {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${token}`
        }
    });

    const data = await result.json();

    if (!result.ok) {
        console.log(data);
        throw new Error("Failed to get user information");
    }

    return data;
}
async function getGuildUserInfo(userId, guildId, botToken) {
    const result = await fetch(`${API_ENDPOINT}/guilds/${guildId}/members/${userId}`, {
        method: "GET",
        headers: {
            "Authorization": `Bot ${botToken}`
        }
    });

    if (result.ok) {
        return await result.json();
    } else if (result.status === 404) {
        return null;
    } else {
        throw new Error("Failed to get guild user information");
    }
}

module.exports = { getUserInfo, getGuildUserInfo };
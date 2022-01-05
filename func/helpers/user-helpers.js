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
        console.error("Failed to get user data from access token");
        console.error(data);
        return { fetchError: true };
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
        return { userNotFound: true };
    } else {
        console.error("Failed to get guild user info");
        console.error(await result.json());
        return { fetchError: true };
    }
}

module.exports = { getUserInfo, getGuildUserInfo };
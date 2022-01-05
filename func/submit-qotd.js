const fetch = require("node-fetch");

const { API_ENDPOINT, MAX_EMBED_FIELD_CHARS, MAX_EMBED_FOOTER_CHARS } = require("./helpers/discord-helpers.js");
const { createJwt, decodeJwt } = require("./helpers/jwt-helpers.js");
const { getGuildUserInfo } = require("./helpers/user-helpers.js");

exports.handler = async function (event, context) {
    if (event.httpMethod !== "POST") {
        return {
            statusCode: 405
        };
    }
    const params = new URLSearchParams(event.body);
    const payload = {
        qotd: params.get("qotd") || undefined,
        qotdDesc: params.get("qotdDesc") || undefined,
        token: params.get("token") || undefined
    };
    
    if (payload.qotd !== undefined &&
        payload.qotdDesc !== undefined &&
        payload.token !== undefined) {
        
        const message = {
            embed: {
                title: "New question of the day submitted!",
                timestamp: new Date().toISOString(),
                fields: [
                    {
                        name: "What question would you like to submit?",
                        value: payload.qotd.slice(0, MAX_EMBED_FIELD_CHARS)
                    },
                    {
                        name: "Describe the question:",
                        value: payload.qotdDesc.slice(0, MAX_EMBED_FIELD_CHARS)
                    }
                ]
            }
        }
        const userInfo = decodeJwt(payload.token);
        if(!userInfo) {
            return {
                statusCode: 303,
                headers: {
                    "Location": `/error?msg=${encodeURIComponent("Invalid token, please re-login.")}`
                }
            }
        }
        // Do one last check in case the user left the server and still had a valid jwt
        const guildUser = await getGuildUserInfo(userInfo.id, process.env.GUILD_ID, process.env.DISCORD_BOT_TOKEN);
        if (guildUser.userNotFound) {
            return {
                statusCode: 303,
                headers: {
                    "Location": `/error?msg=${encodeURIComponent(`This account (${userInfo.username}#${userInfo.discriminator}) isn't a member of the server and thus can't be used to submit questions.`)}`
                }
            };
        } else if(guildUser.fetchError) {
            return {
                statusCode: 303,
                headers: {
                    "Location": `/error`
                }
            };
        }

        const result = await fetch(`${API_ENDPOINT}/channels/${encodeURIComponent(process.env.QOTD_SUGGESTION_CHANNEL)}/messages`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bot ${process.env.DISCORD_BOT_TOKEN}`
            },
            body: JSON.stringify(message)
        });

        if (result.ok) {
            return {
                statusCode: 303,
                headers: {
                    "Location": "/success"
                }
            };
        } else {
            console.error("Failed to send form data to discord channel.");
            console.error(await result.json());
            return {
                statusCode: 303,
                headers: {
                    "Location": `/error?msg=${encodeURIComponent("Something went wrong while submitting your quesion. Please try again in a bit. ")}`
                }
            };
        }
    }

    return {
        statusCode: 400
    };
}
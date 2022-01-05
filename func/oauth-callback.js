const fetch = require("node-fetch");

const { getUserInfo, getGuildUserInfo } = require("./helpers/user-helpers.js");
const { createJwt } = require("./helpers/jwt-helpers.js");

exports.handler = async function (event, context) {
    if (event.httpMethod !== "GET") {
        return {
            statusCode: 405
        };
    }

    if (event.queryStringParameters.code !== undefined) {
        const result = await fetch("https://discord.com/api/oauth2/token", {
            method: "POST",
            body: new URLSearchParams({
                client_id: process.env.DISCORD_CLIENT_ID,
                client_secret: process.env.DISCORD_CLIENT_SECRET,
                grant_type: "authorization_code",
                code: event.queryStringParameters.code,
                redirect_uri: new URL(event.path, process.env.URL),
                scope: "identify"
            })
        });

        const data = await result.json();

        if (!result.ok) {
            console.error("Failed to get user access token");
            console.error(data);
            return {
                statusCode: 303,
                headers: {
                    "Location": `/error`
                }
            };
        }
        
        const user = await getUserInfo(data.access_token);
        if(user.fetchError) {
            return {
                statusCode: 303,
                headers: {
                    "Location": `/error`
                }
            };
        }
        const guildUser = await getGuildUserInfo(user.id, process.env.GUILD_ID, process.env.DISCORD_BOT_TOKEN);
        if (guildUser.userNotFound) {
            return {
                statusCode: 303,
                headers: {
                    "Location": `/error?msg=${encodeURIComponent(`This account (${user.username}#${user.discriminator}) isn't a member of the server and thus can't be used to submit questions.`)}`
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

        const userPublic = {
            id: user.id,
            avatar: user.avatar,
            username: user.username,
            discriminator: user.discriminator
        };
        console.log(data.expires_in)
        let url = `/form?token=${encodeURIComponent(createJwt(userPublic, data.expires_in))}`;
        if (event.queryStringParameters.state !== undefined) {
            url += `&state=${encodeURIComponent(event.queryStringParameters.state)}`;
        }

        return {
            statusCode: 303,
            headers: {
                "Location": url
            }
        };
    }

    return {
        statusCode: 400
    };
}
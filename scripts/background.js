let pollingInterval;
const pollInterval = 10000; // 10 seconds

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'startPolling') {
        startPolling();
    } else if (message.action === 'stopPolling') {
        stopPolling();
    } else if (message.action === 'getUsername') {
        try {
            getUsername().then(username => sendResponse({ ign: username }));
        } catch (error) {
            sendResponse({ ign: null });
        }
        return true;
    }
});

function startPolling() {
    if (!pollingInterval) {
        pollingInterval = setInterval(() => {
            pollWebsite();
        }, pollInterval);
        chrome.action.setBadgeText({ text: "on" });
    }
}

function stopPolling() {
    if (pollingInterval) {
        clearInterval(pollingInterval);
        pollingInterval = null;
        chrome.action.setBadgeText({ text: "" });
    }
}

async function getUsername() {
    const currentUsername = await getFromLocalStorage('username');
    if (currentUsername) return currentUsername;

    const url = 'https://www.realmeye.com';

    const data = await fetch(url, {
        method: 'GET',
    }).catch(error => console.error(error));

    const html = await data.text().catch(error => {
        console.log(error);
        return stopPolling();
    });

    const characterElements = extractElementsWithClass(html, 'btn btn-default');

    const username = characterElements.map(element => {
        const href = element.match(/href="([^"]+)"/);
        if (href) return href[1].split('/').pop();
        return null;
    }).filter(element => element != null)?.[0];
    return username;
}

async function pollWebsite() {
    const username = await getFromLocalStorage('username');
    const url = `https://www.realmeye.com/player/${username}`;

    const classes = await getFromLocalStorage('classes');
    const data = await fetch(url, {
        method: 'GET',
    }).catch(error => {
        console.error(error)
        return stopPolling()
    });
    
    const html = await data.text();
    if (!html) return;

    const cookie = await getCookie(url, 'session');
    if (!cookie) return stopPolling();
    
    const session = cookie.value;

    const characterElements = extractElementsWithClass(html, 'character');
    const dataIds = getAttributeFromElements(characterElements, 'data-class');

    dataIds.forEach(id => {
        if (classes.includes(id)) return;

        const formData = {
            class: id,
            session: session,
        };

        const requestOptions = {
            method: "POST",
            body: new URLSearchParams(formData).toString(),
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        };

        fetch("https://www.realmeye.com/dead-character", requestOptions)
        .catch((error) => {
            console.error(error)
            return stopPolling()
        });
    })
}

function extractElementsWithClass(html, className) {
    const regex = new RegExp(`<[^>]+class=["'][^"']*${className}[^"']*["'][^>]*>(.*?)<\\/[^>]+>`, 'gi');
    const matches = html.match(regex);
    return matches || [];
}

function getAttributeFromElements(elements, attributeName) {
    return elements.map(element => {
        const attrRegex = new RegExp(`${attributeName}=["']([^"']+)["']`);
        const match = element.match(attrRegex);
        return match ? match[1] : null;
    }).filter(attr => attr !== null);
}

async function getCookie(url, name) {
	return new Promise((resolve, reject) => {
		chrome.cookies.get({ url: url, name: name }, function (cookie) {
			if (chrome.runtime.lastError) {
				reject(new Error(chrome.runtime.lastError));
			} else {
				resolve(cookie);
			}
		});
	});
}

async function getFromLocalStorage(key) {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get(key, (result) => {
            if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError);
            } else {
                resolve(result[key] || null);
            }
        });
    });
}
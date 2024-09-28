document.getElementById('login').addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'getUsername' }, async (response) => {
        const username = response.ign;
        if (!username) return;
        await saveToLocalStorage('username', username);
        updateUserHTML(username);
    });
});

document.getElementById('start').addEventListener('click', async () => {
    const username = await getFromLocalStorage('username');
    if (!username?.length) return alert('You need to be logged in first!');
    chrome.runtime.sendMessage({ action: 'startPolling' });
});

document.getElementById('stop').addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'stopPolling' });
});

document.getElementById('remove').addEventListener('click', () => {
    removeFromLocalStorage('username');
    updateUserHTML(null);
});

const selectedClasses = new Set();

document.querySelectorAll('.class-item').forEach(item => {
    item.addEventListener('click', () => {
        const classId = item.getAttribute('data-class-id');

        if (selectedClasses.has(classId)) {
            selectedClasses.delete(classId);
            item.classList.remove('selected');
        } else {
            selectedClasses.add(classId);
            item.classList.add('selected');
        }

        const selectedClassesArray = Array.from(selectedClasses);
        saveToLocalStorage('classes', selectedClassesArray);
    });
});

async function updateUserHTML(username) {
    if (username?.length) {
        document.getElementById('username').innerText = username;
        document.getElementById('username').style.display = 'block';
        document.getElementById('login').style.display = "none";
        document.getElementById('remove').style.display = "block";
    } else {
        document.getElementById('username').style.display = 'none';
        document.getElementById('login').style.display = "block";
        document.getElementById('remove').style.display = "none";
    }
}

window.addEventListener('DOMContentLoaded', async () => {

    /* Load Classes */
    const savedClasses = await getFromLocalStorage('classes');
    savedClasses.forEach(classId => {
        const classItem = document.querySelector(`.class-item[data-class-id="${classId}"]`);
        if (classItem) {
            selectedClasses.add(classId);
            classItem.classList.add('selected');
        }
    });

    /* Load Username */
    const username = await getFromLocalStorage('username');
    updateUserHTML(username);
});

async function saveToLocalStorage(key, value) {
    return new Promise((resolve, reject) => {
        chrome.storage.local.set({ [key]: value }, () => {
            if (chrome.runtime.lastError) {
                console.error('Error saving to local storage:', chrome.runtime.lastError);
                reject(chrome.runtime.lastError);
            } else {
                resolve('saved');
            }
        });
    });
}

async function getFromLocalStorage(key) {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get([key], (result) => {
            if (chrome.runtime.lastError) {
                console.error('Error fetching from local storage:', chrome.runtime.lastError);
                reject(chrome.runtime.lastError);
            } else {
                resolve(result[key] || []);
            }
        });
    });
}

async function removeFromLocalStorage(key) {
    return new Promise((resolve, reject) => {
        chrome.storage.local.remove([key], (result) => {
            if (chrome.runtime.lastError) {
                console.error('Error removing from local storage:', chrome.runtime.lastError);
                reject(chrome.runtime.lastError);
            } else {
                resolve(true);
            }
        });
    });
}

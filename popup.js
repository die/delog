document.getElementById('fetchIgn').addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'fetchIgn' }, async (response) => {
        const username = response.ign;
        if (!username) return;
        document.getElementById('ignValue').innerText = username;
        await saveToLocalStorage('username', username);
    });
});

document.getElementById('start').addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'startPolling' });
});

document.getElementById('stop').addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'stopPolling' });
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

window.addEventListener('DOMContentLoaded', async () => {
    const savedClasses = await getFromLocalStorage('classes');
    savedClasses.forEach(classId => {
        const classItem = document.querySelector(`.class-item[data-class-id="${classId}"]`);
        if (classItem) {
            selectedClasses.add(classId);
            classItem.classList.add('selected');
        }
    });
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
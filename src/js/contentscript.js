import secrets from '../secrets.development'
import manualTagSynonyms from './manual-tag-synonyms.js'

console.log('SOJobs ...');

async function getLocal(key) {
    return new Promise(resolve => {
        chrome.storage.local.get(key, function (result) {
            resolve(result);
        })
    })
}

async function setLocal(key, value) {
    return new Promise(resolve => {
        chrome.storage.local.set({[key]: value}, () => {
            resolve(value);
        });
    })
}

async function fetchRemoteTag(tag) {
    // let url = `https://stackoverflow.com/oauth/dialog?client_id=18550&scope=no_expiry&redirect_uri=https://stackoverflow.com/jobs?sort=y`;
    const accessToken = secrets.accessToken || '';
    const key = secrets.key || '';
    let url = `https://api.stackexchange.com/2.2/tags/${encodeURIComponent(tag)}/synonyms?order=desc&sort=creation&site=stackoverflow&access_token=${accessToken}&key=${key}`;
    console.log(tag, url);

    try {
        const synonymsResponse = await fetch(url);
        return  await synonymsResponse.json();
    } catch (err) {
        console.error(err);
        return false;
    }
}

const refreshSynonyms = async (tag) => {
    const result = await getLocal([`tag-${tag}`]);

    if (!result[`tag-${tag}`]) {
        let synonyms = await fetchRemoteTag(tag);
        synonyms = {...manualTagSynonyms, ...synonyms};
        if (synonyms) {
            for (const element of synonyms.items) {
                await setLocal(`tag-${element.from_tag}`, tag);
            }
            await setLocal(`tag-${tag}`, tag);//Self tagging; Should be disabled in-order-to renew
        }
    }
};

const start = async () => {
    const jobResults = document.querySelectorAll('#content .listResults .-job');
    for (let item of jobResults) {
        let data = {
            company: null,
            tags: []
        };
        item.querySelectorAll('h3 > span:first-child').forEach((tag) => {
            data.company = tag.innerText.trim();
        });
        const postTags = item.querySelectorAll('div > .s-tag');
        for (let tag of postTags) {
            tag = tag.innerText.trim();
            await refreshSynonyms(tag);
            const result = await getLocal([`tag-${tag}`]);

            if (result[`tag-${tag}`]) {
                data.tags.push(result[`tag-${tag}`].replace('tag-', ''));
            }
            // else {
            data.tags.push(tag); // Keeping both tags
            // }
            //break;//////////
        }

        let key = `jobid-${item.dataset.jobid}`;
        let value = JSON.stringify(data);
        await setLocal(key, value);
        // break;//////////
    }
};

const processData = async () => {
    const obj = await getLocal(null);
    // const allKeys = Object.keys(obj);
    console.log(1, obj);

    const tagsByCompany = {};
    for (const prop in obj) {
        if (obj.hasOwnProperty(prop)) {
            // console.log(prop, obj);
            try {
                const data = JSON.parse(obj[prop]);
                data.tags.forEach(tag => {
                    if (data.company in tagsByCompany) {
                        if (tag in tagsByCompany[data.company]) {
                            tagsByCompany[data.company][tag]++;
                        } else {
                            tagsByCompany[data.company][tag] = 1;
                        }
                    } else {
                        tagsByCompany[data.company] = {};
                        tagsByCompany[data.company][tag] = 1;
                    }
                });
            } catch (e) {
                //Not a job data
            }
        }
    }
    console.log(2, tagsByCompany);
    processCompanyForTags(tagsByCompany);
};

const processCompanyForTags = (data) => {
    // console.log(data);
    const countByTags = {};

    for (const company in data) {
        if (data.hasOwnProperty(company)) {
            // console.log(company, data[company]);
            for (const tag in data[company]) {
                if (data[company].hasOwnProperty(tag)) {
                    if (countByTags[tag]) {
                        countByTags[tag]++;
                    } else {
                        countByTags[tag] = 1;
                    }
                }
            }
        }
    }
    // console.log(countByTags);
    const output = Object.entries(countByTags).sort(
        (a, b) => b[1] - a[1]
    );
    console.log(3, output);

    const objSorted = {};
    let sortedText = "\n";
    output.forEach(item => {
        objSorted[item[0]] = item[1];
        sortedText+=`${item[0]}\t${item[1]}\n`;
    });
    console.log(4, sortedText);
    console.log(5, objSorted);

    let objCopied = JSON.parse(JSON.stringify(objSorted));

    for (var key in objCopied) {
        if (objCopied.hasOwnProperty(key)) {
            if (objCopied[key] <= 1)
                delete objCopied[key];
        }
    }
    console.log("Cleaned", objCopied);

};

chrome.runtime.onMessage.addListener(async function (request, sender, sendResponse) {
    sendResponse(request);
    if (request.greeting === 'hello') {
        // if (typeof request.pg === 'undefined' || request.pg === '1' || request.pg === '' || request.pg === null) {
        // chrome.storage.local.clear();
        // chrome.storage.sync.clear();
        const obj = await getLocal(null);
        for (const prop in obj) {
            if (obj.hasOwnProperty(prop)) {
                // console.log(prop);
                if (prop.startsWith('jobid-')) {
                    chrome.storage.local.remove(prop, () => {
                        console.log(prop, 'removed');
                    });
                }
            }
        }
        // }
    }
});

(async () => {
    await start();
    await processData();
})();
